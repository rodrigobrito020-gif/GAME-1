import { classVisuals } from "./class-visuals.mjs";
export const EVADE = {
  id: "dash",
  name: "Dash",
  distance: 128,
  durationMs: 240,
  cooldownMs: 2500,
};
// The hunt always moves and attacks automatically; only skill choices vary.
export const combatMode = () => "auto";
export function setCombatMode(account, client, mode) {
  if (mode !== "auto") throw Error("local.invalid_skill");
  account.combatMode = "auto";
}
export function evade(client, { dirX = 0, dirY = 0 }, now, free = () => true) {
  if (client.hunt?.deadAt) throw Error("local.not_hunting");
  if (
    (client.evadeReadyAt ?? 0) > now ||
    client.evade ||
    client.hunt?.dash ||
    client.combatAnimUntil > now
  )
    throw Error("local.cooldown");
  let dx = dirX / 1000,
    dy = dirY / 1000;
  if (!Number.isFinite(dx) || !Number.isFinite(dy))
    throw Error("local.invalid_target");
  if (Math.hypot(dx, dy) < 0.01)
    [dx, dy] = [
      [0, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
    ][client.facing ?? 0];
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const from = { x: client.x, y: client.y },
    to = { ...from };
  for (let d = 4; d <= EVADE.distance; d += 4) {
    const x = from.x + dx * d,
      y = from.y + dy * d;
    if (!free(x, y)) break;
    to.x = x;
    to.y = y;
  }
  if (Math.hypot(to.x - from.x, to.y - from.y) < 8)
    throw Error("local.invalid_target");
  client.evade = { from, to, start: now, end: now + EVADE.durationMs };
  client.evadeReadyAt = now + EVADE.cooldownMs;
  client.target = null;
  client.route = [];
  client.until = 0;
  client.combatAnimUntil = now + EVADE.durationMs;
  if (client.hunt) {
    client.hunt.attackOrder = 0;
    client.hunt.manualTarget = 0;
    client.hunt.actionUntil = Math.max(
      client.hunt.actionUntil,
      client.combatAnimUntil,
    );
  }
  return {
    entity: 1,
    move: classVisuals(client.classId).dashMove,
    dirX: Math.round(dx * 1000),
    dirY: Math.round(dy * 1000),
    durationMs: EVADE.durationMs,
  };
}
export function stepEvade(client, now, free = () => true) {
  const e = client.evade;
  if (!e) return false;
  const t = Math.min(1, Math.max(0, (now - e.start) / (e.end - e.start))),
    x = e.from.x + (e.to.x - e.from.x) * t,
    y = e.from.y + (e.to.y - e.from.y) * t;
  const ox = client.x,
    oy = client.y,
    n = Math.max(1, Math.ceil(Math.hypot(x - ox, y - oy) / 4));
  for (let i = 1; i <= n; i++) {
    const nx = ox + ((x - ox) * i) / n,
      ny = oy + ((y - oy) * i) / n;
    if (!free(nx, ny)) {
      client.evade = null;
      break;
    }
    client.x = nx;
    client.y = ny;
  }
  client.moving = true;
  if (t >= 1) client.evade = null;
  return true;
}
