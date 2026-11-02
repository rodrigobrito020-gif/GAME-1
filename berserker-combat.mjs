import { planMeleeAdvance } from "./melee-advance.mjs";
import {
  BERSERKER_ACTIONS,
  BERSERKER_ADVANCE,
  BERSERKER_CRY,
  BERSERKER_SPIN,
  BERSERKER_ULTIMATE,
} from "./berserker.mjs";
function effect(h, kind, client, now, impact, duration, dx = 0, dy = 1) {
  h.berserkerFx ??= [];
  h.berserkerFx.push({
    id: `orc:${now}:${(h.berserkerFxSerial = (h.berserkerFxSerial ?? 0) + 1)}`,
    kind,
    x: client.x,
    y: client.y,
    dx,
    dy,
    facing: client.facing,
    impactMs: impact,
    start: now,
    end: now + duration,
  });
}
export function berserkerFxState(client, now) {
  return (client.hunt?.berserkerFx ?? [])
    .filter((f) => f.end > now)
    .map((f) => ({
      ...f,
      durationMs: f.end - f.start,
      remainingMs: f.end - now,
    }));
}
export function berserkerBasic(farm, client, target, events) {
  const h = client.hunt,
    c = farm.character,
    now = farm.now(),
    factor = c.derived.attackCooldown;
  const duration = Math.round(400 * factor),
    impact = Math.round(150 * factor);
  h.nextAttack = now + Math.round(1000 * factor);
  h.actionUntil = now + duration;
  client.combatAnimUntil = h.actionUntil;
  const dx = target.x - client.x,
    dy = target.y - client.y,
    d = Math.hypot(dx, dy) || 1;
  client.facing =
    Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
  events.moves.push({
    entity: 1,
    move: h.basicChain++ % 2 ? "orc-retorno" : "orc-machado",
    target: target.id,
    dirX: Math.round((dx / d) * 1000),
    dirY: Math.round((dy / d) * 1000),
    durationMs: duration,
  });
  h.impacts.push({
    at: now + impact,
    basic: true,
    targets: [target.id],
    amount: c.derived.atk,
    skillId: "",
    heal: 0,
  });
  effect(h, "swing", client, now, impact, impact + 300, dx / d, dy / d);
  return { events, deltas: [] };
}
export function castBerserker(
  farm,
  client,
  id,
  targetId,
  events,
  deltas,
  { free = () => true } = {},
) {
  const h = client.hunt,
    c = farm.character,
    now = farm.now(),
    skill = farm.skills.find((s) => s.id === id),
    action = BERSERKER_ACTIONS[id];
  if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
  if (!skill || !action) throw Error("local.invalid_skill");
  const ultimate = id === BERSERKER_ULTIMATE.id,
    cry = id === BERSERKER_CRY.id;
  if (ultimate && (h.actionUntil > now || h.nextCast > now)) {
    if (farm.avatar.active() || farm.avatar.saved.readyAt > now)
      throw Error("local.cooldown");
    if (farm.avatar.saved.charge < 100) throw Error("local.ultimate_energy");
    h.avatarQueued = true;
    return { events, deltas };
  }
  if ((h.cooldowns[id] ?? 0) > now || h.nextCast > now || h.actionUntil > now)
    throw Error("local.cooldown");
  if (c.progress.mana < skill.manaCost) throw Error("local.no_mana");
  if (cry && farm.warCryUntil > now) throw Error("local.buff_active");
  let target = null,
    dx = 0,
    dy = 1;
  if (!cry && !ultimate) {
    target = h.monsters.find((m) => m.id === targetId && m.hp > 0);
    if (
      !target ||
      Math.hypot(target.x - client.x, target.y - client.y) > skill.range
    )
      throw Error("local.invalid_target");
    dx = target.x - client.x;
    dy = target.y - client.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    client.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
  }
  const advance =
    id === BERSERKER_ADVANCE.id
      ? planMeleeAdvance(client, target, BERSERKER_ADVANCE, now, free)
      : null;
  if (ultimate) {
    farm.avatar.reserve();
    h.avatarQueued = false;
  }
  c.progress.mana -= skill.manaCost;
  h.cooldowns[id] = now + skill.cooldownMs;
  h.nextCast = h.actionUntil = now + action.duration;
  client.combatAnimUntil = h.actionUntil;
  if (advance) {
    h.dash = advance;
    h.target = target.id;
  }
  const origin = { x: Math.round(client.x * 10), y: Math.round(client.y * 10) };
  events.casts.push({
    caster: client.entityId ?? 1,
    skillId: id,
    target: target?.id ?? client.entityId ?? 1,
    origin,
    dest: advance
      ? { x: Math.round(advance.to.x * 10), y: Math.round(advance.to.y * 10) }
      : { ...origin },
    facing: client.facing,
  });
  events.cooldowns.push({
    skillId: id,
    readyInMs: skill.cooldownMs,
    totalMs: skill.cooldownMs,
  });
  if (ultimate || cry) {
    h.impacts.push({
      at: now + action.impact,
      ...(ultimate ? { avatarBuff: true } : { warCryBuff: true }),
    });
    effect(h, "roar", client, now, action.impact, 950);
  } else if (id === BERSERKER_SPIN.id) {
    h.spin = {
      startsAt: now,
      endsAt: now + BERSERKER_SPIN.durationMs,
      lastAt: now,
      target: target.id,
    };
    h.target = target.id;
    for (let i = 1; i <= BERSERKER_SPIN.pulses; i++)
      h.impacts.push({
        at:
          now + BERSERKER_SPIN.firstPulseMs + (i - 1) * BERSERKER_SPIN.pulseMs,
        spin: true,
        targets: [],
        amount: (c.derived.atk * skill.multiplier) / BERSERKER_SPIN.pulses,
        skillId: id,
        heal: 0,
      });
    effect(h, "spin", client, now, 0, BERSERKER_SPIN.durationMs, dx, dy);
  } else {
    const slash = !!advance;
    h.impacts.push({
      at: now + action.impact,
      targets: [target.id],
      amount: c.derived.atk * skill.multiplier,
      skillId: id,
      heal: 0,
      ...(slash
        ? {
            dash: true,
            hitRange: BERSERKER_ADVANCE.hitRange,
          }
        : { area: { x: client.x, y: client.y, radius: skill.radius } }),
    });
    effect(
      h,
      slash ? "cleave" : "quake",
      client,
      now,
      action.impact,
      action.impact + (slash ? 500 : 750),
      dx,
      dy,
    );
  }
  return { events, deltas };
}

// Time-based, server-side regeneration. Fractional carry keeps the 2% rate
// accurate, full health cannot bank healing, and death/exit cannot revive.
export function tickBerserkerRegeneration(farm, client, events) {
  const h = client.hunt,
    c = farm.character,
    until = farm.avatar.until,
    now = farm.now();
  if (!h || h.deadAt || !(c.progress.hp > 0) || !until || !h.nextFuryRegen)
    return;
  const through = Math.min(now, until);
  if (h.nextFuryRegen > through) return;
  const ticks = Math.floor((through - h.nextFuryRegen) / 1000) + 1;
  h.nextFuryRegen += ticks * 1000;
  const exact =
    ticks * c.derived.maxHp * BERSERKER_ULTIMATE.healthRegenPercentPerSecond +
    (h.furyRegenFraction ?? 0);
  const requested = Math.floor(exact + 1e-9);
  h.furyRegenFraction = Math.max(0, exact - requested);
  const amount = Math.min(requested, c.derived.maxHp - c.progress.hp);
  if (amount > 0) {
    c.progress.hp += amount;
    events.heals.push({
      source: client.entityId ?? 1,
      target: client.entityId ?? 1,
      amount,
    });
  }
}

// Translation is authoritative and sampled along the path, never a cosmetic
// displacement on top of the body. Pulse areas use this actual position.
export function tickBerserkerSpin(farm, client, free, route) {
  const h = client.hunt,
    spin = h?.spin,
    now = farm.now();
  if (!spin) return false;
  if (h.deadAt || farm.character.progress.hp <= 0) {
    h.spin = null;
    h.impacts = h.impacts.filter((p) => !p.spin);
    return false;
  }
  const through = Math.min(now, spin.endsAt);
  const dt = Math.max(0, Math.min(100, through - spin.lastAt));
  spin.lastAt = through;
  let target = h.monsters.find((m) => m.id === spin.target && m.hp > 0);
  if (!target)
    target = h.monsters
      .filter(
        (m) => m.hp > 0 && Math.hypot(m.x - client.x, m.y - client.y) <= 350,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - client.x, a.y - client.y) -
          Math.hypot(b.x - client.x, b.y - client.y),
      )[0];
  let moved = false;
  if (target && dt > 0) {
    spin.target = h.target = target.id;
    const distance = Math.hypot(target.x - client.x, target.y - client.y);
    const way = route(client, target)[0] ?? target;
    const dx = way.x - client.x,
      dy = way.y - client.y,
      length = Math.hypot(dx, dy);
    const amount = Math.min(
      (Math.max(BERSERKER_SPIN.speed, farm.character.derived.moveSpeed) * dt) /
        1000,
      Math.max(0, distance - BERSERKER_SPIN.stopDistance),
      length,
    );
    const steps = Math.ceil(amount / 4),
      from = { x: client.x, y: client.y };
    for (let i = 1; i <= steps; i++) {
      const x = from.x + ((dx / length) * amount * i) / steps,
        y = from.y + ((dy / length) * amount * i) / steps;
      if (!free(x, y)) break;
      moved ||= x !== client.x || y !== client.y;
      client.x = x;
      client.y = y;
    }
    // Keep the starting facing for the atlas' continuous rotation.
  }
  if (now >= spin.endsAt) h.spin = null;
  return moved;
}
