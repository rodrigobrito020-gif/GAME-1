import {
  ARCHER_SKILLS,
  ARCHER_EYES,
  ARCHER_SPIRIT,
  ARCHER_ACTIONS,
} from "./archer.mjs";
const face = (client, target) => {
  const dx = target.x - client.x,
    dy = target.y - client.y;
  client.facing =
    Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
};
export function arrow(
  farm,
  client,
  target,
  {
    skillId = "",
    multiplier = 1,
    piercing = false,
    release = ARCHER_ACTIONS.basic.releaseMs,
    angleOffset = 0,
    queueImpact = true,
  } = {},
  events,
) {
  const h = client.hunt,
    now = farm.now(),
    travel = Math.max(
      140,
      Math.min(
        650,
        ((piercing
          ? 420
          : Math.hypot(target.x - client.x, target.y - client.y)) /
          650) *
          1000,
      ),
    ),
    id = `arrow:${now}:${(h.arrowSerial = (h.arrowSerial ?? 0) + 1)}`;
  const dx = target.x - client.x,
    dy = target.y - client.y,
    length = Math.hypot(dx, dy) || 1;
  const projectile = {
    id,
    kind: "arrow",
    color: farm.avatar.active() ? "spirit" : piercing ? "piercing" : "normal",
    start: now,
    release: now + release,
    end: now + release + travel,
    x: client.x + (dx / length) * 20,
    y: client.y - 72 + (dy / length) * 10,
    target: target.id,
    tx: target.x,
    ty: target.y - 70,
  };
  if (piercing) {
    const angle = Math.atan2(dy, dx) + angleOffset;
    projectile.target = 0;
    projectile.tx = client.x + Math.cos(angle) * 420;
    projectile.ty = client.y - 72 + Math.sin(angle) * 420;
    projectile.fan = !queueImpact;
  }
  h.archerFx ??= [];
  h.archerFx.push(projectile);
  if (queueImpact)
    h.impacts.push({
      at: projectile.end,
      targets: [target.id],
      basic: !skillId,
      amount: farm.character.derived.atk * multiplier,
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
              width: 32,
            },
          }
        : {}),
    });
  return projectile;
}
export function archerBasic(farm, client, target, events) {
  const h = client.hunt,
    now = farm.now();
  face(client, target);
  h.nextAttack = now + (farm.avatar.active() ? 700 : 1000);
  h.actionUntil = now + ARCHER_ACTIONS.basic.durationMs;
  client.combatAnimUntil = h.actionUntil;
  events.moves.push({
    entity: 1,
    move: "elfa-flecha",
    target: target.id,
    dirX: 0,
    dirY: 0,
    durationMs: ARCHER_ACTIONS.basic.durationMs,
  });
  arrow(farm, client, target, {}, events);
  return { events, deltas: [] };
}
// A short step during the gap between shots, never a cast interruption or an
// endless retreat. Check the entire segment before choosing a direction.
export function archerReposition(client, target, now, free) {
  const h = client.hunt;
  if (
    !h ||
    h.actionUntil > now ||
    h.nextAttack <= now ||
    h.manualTarget ||
    target.hp <= 0
  )
    return null;
  const previous = h.archerRetreat;
  if (
    previous &&
    previous.until > now &&
    Math.hypot(previous.x - client.x, previous.y - client.y) > 12
  )
    return previous;
  if (
    (h.nextArcherRetreat ?? 0) > now ||
    Math.hypot(target.x - client.x, target.y - client.y) >= 105
  )
    return null;
  const away = Math.atan2(client.y - target.y, client.x - target.x);
  for (const turn of [
    0,
    Math.PI / 4,
    -Math.PI / 4,
    Math.PI / 2,
    -Math.PI / 2,
  ]) {
    const dx = Math.cos(away + turn) * 96,
      dy = Math.sin(away + turn) * 96;
    if (
      !Array.from({ length: 12 }, (_, i) =>
        free(client.x + (dx * (i + 1)) / 12, client.y + (dy * (i + 1)) / 12),
      ).every(Boolean)
    )
      continue;
    h.nextArcherRetreat = now + 2500;
    return (h.archerRetreat = {
      x: client.x + dx,
      y: client.y + dy,
      until: now + 450,
    });
  }
  // A blocked corner falls back to shooting; do not repeatedly search every tick.
  h.nextArcherRetreat = now + 600;
  return null;
}
export function castArcher(farm, client, id, targetId, events, deltas) {
  const h = client.hunt,
    c = farm.character,
    now = farm.now(),
    skill = ARCHER_SKILLS.find((s) => s.id === id);
  if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
  if (!skill) throw Error("local.invalid_skill");
  if (id === ARCHER_SPIRIT.id && (h.actionUntil > now || h.nextCast > now)) {
    if (farm.avatar.active() || farm.avatar.saved.readyAt > now)
      throw Error("local.cooldown");
    if (farm.avatar.saved.charge < 100) throw Error("local.ultimate_energy");
    h.avatarQueued = true;
    return { events, deltas };
  }
  if ((h.cooldowns[id] ?? 0) > now || h.actionUntil > now || h.nextCast > now)
    throw Error("local.cooldown");
  if (c.progress.mana < skill.manaCost) throw Error("local.no_mana");
  if (id === ARCHER_EYES.id && farm.eyesUntil > now)
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
  if (id === ARCHER_SPIRIT.id) {
    farm.avatar.reserve();
    h.avatarQueued = false;
  }
  c.progress.mana -= skill.manaCost;
  h.cooldowns[id] =
    id === ARCHER_SPIRIT.id
      ? farm.avatar.saved.readyAt
      : now + skill.cooldownMs;
  const duration =
    id === "tiro-perfurante"
      ? ARCHER_ACTIONS.piercing.durationMs
      : id === "chuva-de-flechas"
        ? ARCHER_ACTIONS.rain.durationMs
        : id === ARCHER_EYES.id
          ? 600
          : 650;
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
  if (id === ARCHER_EYES.id) h.impacts.push({ at: now + 300, eyesBuff: true });
  else if (id === ARCHER_SPIRIT.id)
    h.impacts.push({ at: now + 300, avatarBuff: true });
  else if (id === "tiro-perfurante") {
    const rays = [];
    for (const angleOffset of [-0.28, 0, 0.28]) {
      const fx = arrow(
        farm,
        client,
        target,
        {
          skillId: id,
          multiplier: 2,
          piercing: true,
          release: ARCHER_ACTIONS.piercing.releaseMs,
          angleOffset,
          queueImpact: false,
        },
        events,
      );
      rays.push({
        x: client.x,
        y: client.y,
        tx: fx.tx,
        ty: fx.ty + 72,
        range: 420,
        width: 32,
      });
    }
    h.impacts.push({
      at: h.archerFx.at(-1).end,
      targets: [],
      cone: rays,
      basic: false,
      amount: c.derived.atk * 2,
      skillId: id,
      heal: 0,
    });
  } else {
    h.archerFx ??= [];
    h.archerFx.push({
      id: `rain:${now}`,
      kind: "rain",
      start: now,
      end: now + ARCHER_ACTIONS.rain.endMs,
      release: now + ARCHER_ACTIONS.rain.releaseMs,
      x: target.x,
      y: target.y,
      radius: 145,
    });
    for (const at of ARCHER_ACTIONS.rain.impactsMs)
      h.impacts.push({
        at: now + at,
        area: { x: target.x, y: target.y, radius: 145 },
        targets: [],
        amount: c.derived.atk * 0.7,
        skillId: id,
        heal: 0,
      });
  }
  return { events, deltas };
}
export function piercedTargets(monsters, line) {
  const dx = line.tx - line.x,
    dy = line.ty - line.y,
    length = Math.hypot(dx, dy) || 1,
    ux = dx / length,
    uy = dy / length;
  return monsters
    .filter((m) => {
      const mx = m.x - line.x,
        my = m.y - line.y,
        along = mx * ux + my * uy,
        side = Math.abs(mx * uy - my * ux);
      return (
        m.hp > 0 && along >= 0 && along <= line.range && side <= line.width
      );
    })
    .map((m) => m.id);
}
export function archerFxState(client, now) {
  return (client.hunt?.archerFx ?? [])
    .filter((f) => f.end > now)
    .map((f) => {
      const target = client.hunt.monsters.find(
        (m) => m.id === f.target && m.hp > 0,
      );
      return {
        ...f,
        ...(target ? { tx: target.x, ty: target.y - 70 } : {}),
        remainingMs: f.end - now,
        durationMs: f.end - f.start,
        releaseMs: (f.release ?? f.start) - f.start,
      };
    });
}
