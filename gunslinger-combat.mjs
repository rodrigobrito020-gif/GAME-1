import {
  GUNSLINGER_SKILLS,
  GUNSLINGER_ACTIONS,
  GUNSLINGER_MUZZLES,
  NIGHT_INSTINCT,
  ECLIPSE,
} from "./gunslinger.mjs";
const face = (c, t) => {
  const dx = t.x - c.x,
    dy = t.y - c.y;
  c.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
};
// Spawn on the active hand. The two physical projectiles and damage timings
// are authoritative; VFX follows these same snapshots without extra hits.
function bullet(
  farm,
  client,
  target,
  {
    releaseMs,
    hand = 0,
    amount,
    skillId = "",
    piercing = false,
    area = null,
    index = 0,
  },
) {
  const h = client.hunt,
    now = farm.now(),
    dx = target.x - client.x,
    dy = target.y - client.y,
    len = Math.hypot(dx, dy) || 1;
  const [muzzleX, muzzleY] = GUNSLINGER_MUZZLES[client.facing ?? 0][hand];
  const fx = {
    id: `gun:${now}:${(h.gunSerial = (h.gunSerial ?? 0) + 1)}`,
    kind: "bullet",
    start: now,
    release: now + releaseMs,
    x: client.x + muzzleX,
    y: client.y + muzzleY,
    tx: target.x,
    ty: target.y - 70,
    target: target.id,
    skillId,
    hand,
  };
  if (piercing) {
    fx.target = 0;
    fx.tx = client.x + (dx / len) * 420;
    fx.ty = client.y - 72 + (dy / len) * 420;
  }
  if (area) {
    const a = index * 2.399963,
      r = area.radius * 0.55 * Math.sqrt((index + 0.5) / 6);
    fx.target = 0;
    fx.tx = area.x + Math.cos(a) * r;
    fx.ty = area.y + Math.sin(a) * r - 25;
    fx.ground = true;
  }
  const travel = Math.max(
    110,
    Math.min(330, (Math.hypot(fx.tx - fx.x, fx.ty - fx.y) / 1600) * 1000),
  );
  fx.end = fx.release + travel;
  (h.gunslingerFx ??= []).push(fx);
  h.impacts.push({
    at: fx.end,
    targets: [target.id],
    basic: !skillId,
    amount,
    skillId,
    heal: 0,
    ...(piercing
      ? {
          pierce: {
            x: client.x,
            y: client.y,
            tx: target.x,
            ty: target.y,
            range: 420,
            width: 28,
          },
        }
      : {}),
    ...(area ? { area: { ...area } } : {}),
  });
  return fx;
}
export function gunslingerBasic(farm, client, target, events) {
  const h = client.hunt,
    now = farm.now(),
    atk = farm.character.derived.atk;
  face(client, target);
  h.nextAttack = now + farm.character.derived.attackCooldown * 1000;
  h.actionUntil = now + 500;
  client.combatAnimUntil = h.actionUntil;
  events.moves.push({
    entity: 1,
    move: GUNSLINGER_ACTIONS.basic.move,
    target: target.id,
    dirX: 0,
    dirY: 0,
    durationMs: 500,
  });
  for (const [hand, releaseMs] of GUNSLINGER_ACTIONS.basic.releasesMs.entries())
    bullet(farm, client, target, {
      hand,
      releaseMs,
      amount: hand ? atk - Math.floor(atk / 2) : Math.floor(atk / 2),
    });
  return { events, deltas: [] };
}
export function castGunslinger(farm, client, id, targetId, events, deltas) {
  const h = client.hunt,
    c = farm.character,
    now = farm.now(),
    skill = GUNSLINGER_SKILLS.find((s) => s.id === id);
  if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
  if (!skill) throw Error("local.invalid_skill");
  if (id === ECLIPSE.id && (h.actionUntil > now || h.nextCast > now)) {
    if (farm.avatar.active() || farm.avatar.saved.readyAt > now)
      throw Error("local.cooldown");
    if (farm.avatar.saved.charge < 100) throw Error("local.ultimate_energy");
    h.avatarQueued = true;
    return { events, deltas };
  }
  if ((h.cooldowns[id] ?? 0) > now || h.actionUntil > now || h.nextCast > now)
    throw Error("local.cooldown");
  if (c.progress.mana < skill.manaCost) throw Error("local.no_mana");
  if (id === NIGHT_INSTINCT.id && farm.instinctUntil > now)
    throw Error("local.buff_active");
  let target;
  if (skill.kind !== "buff") {
    target = h.monsters.find((m) => m.id === targetId && m.hp > 0);
    if (
      !target ||
      Math.hypot(target.x - client.x, target.y - client.y) > skill.range
    )
      throw Error("local.invalid_target");
    face(client, target);
  }
  if (id === ECLIPSE.id) {
    farm.avatar.reserve();
    h.avatarQueued = false;
  }
  c.progress.mana -= skill.manaCost;
  h.cooldowns[id] =
    id === ECLIPSE.id ? farm.avatar.saved.readyAt : now + skill.cooldownMs;
  const action =
      id === "disparo-sombrio"
        ? GUNSLINGER_ACTIONS.piercing
        : id === "rajada-do-crepusculo"
          ? GUNSLINGER_ACTIONS.burst
          : null,
    duration = action?.durationMs ?? 600;
  h.actionUntil = h.nextCast = now + duration;
  client.combatAnimUntil = h.actionUntil;
  const origin = { x: Math.round(client.x * 10), y: Math.round(client.y * 10) },
    dest = target
      ? { x: Math.round(target.x * 10), y: Math.round(target.y * 10) }
      : { ...origin };
  events.casts.push({
    caster: 1,
    skillId: id,
    target: target?.id ?? 1,
    origin,
    dest,
    facing: client.facing,
  });
  events.cooldowns.push({
    skillId: id,
    readyInMs: skill.cooldownMs,
    totalMs: skill.cooldownMs,
  });
  if (id === NIGHT_INSTINCT.id)
    h.impacts.push({ at: now + 300, instinctBuff: true });
  else if (id === ECLIPSE.id)
    h.impacts.push({ at: now + 300, avatarBuff: true });
  else if (id === "disparo-sombrio")
    bullet(farm, client, target, {
      releaseMs: 150,
      amount: c.derived.atk * skill.multiplier,
      skillId: id,
      piercing: true,
    });
  else {
    const area = { x: target.x, y: target.y, radius: skill.radius };
    for (const [index, releaseMs] of action.releasesMs.entries())
      bullet(farm, client, target, {
        releaseMs,
        hand: index % 2,
        amount: c.derived.atk * skill.multiplier,
        skillId: id,
        area,
        index,
      });
  }
  return { events, deltas };
}
export function gunslingerFxState(client, now) {
  return (client.hunt?.gunslingerFx ?? [])
    .filter((f) => f.end > now)
    .map((f) => {
      const t = client.hunt.monsters.find((m) => m.id === f.target && m.hp > 0);
      return {
        ...f,
        ...(t ? { tx: t.x, ty: t.y - 70 } : {}),
        remainingMs: f.end - now,
        durationMs: f.end - f.start,
        releaseMs: f.release - f.start,
      };
    });
}
