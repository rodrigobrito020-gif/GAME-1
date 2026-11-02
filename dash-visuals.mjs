import { classVisuals } from "./class-visuals.mjs";
const states = new WeakMap();
export function dashTrailPoints(from, to, spacing = 18) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance < spacing || distance > 180) return [];
  const count = Math.min(5, Math.max(1, Math.floor(distance / spacing)));
  return Array.from({ length: count }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / count,
    y: from.y + ((to.y - from.y) * i) / count,
  }));
}
export function clearDashTrail(actor) {
  const s = states.get(actor);
  if (!s) return;
  for (const g of s.ghosts) g.img.destroy();
  states.delete(actor);
  actor.royalDashGhosts = [];
}
// One HD trail pool with its own monotonic clock. Native trail callbacks and
// frozen attack animations cannot restart or extend these afterimages.
export function updateDashTrail(actor, body, classId, now = performance.now()) {
  let s = states.get(actor);
  if (!s) {
    s = { ghosts: [], previous: null, anchor: null, action: null, started: 0 };
    states.set(actor, s);
    actor.royalDashGhosts = s.ghosts;
  }
  for (const g of s.ghosts) {
    if (!g.img.visible) continue;
    const p = (now - g.born) / 175;
    if (p >= 1) g.img.setVisible(false);
    else g.img.setAlpha(g.alpha * Math.pow(1 - p, 1.4));
  }
  const from = s.previous,
    to = { x: actor.x, y: actor.y };
  s.previous = to;
  const theme = classVisuals(
      typeof classId === "boolean"
        ? classId
          ? "arqueira"
          : "guerreiro"
        : classId,
    ),
    act = actor.act;
  if (!actor.alive || actor.dead) {
    for (const g of s.ghosts) g.img.setVisible(false);
    s.anchor = null;
    s.action = null;
    return;
  }
  if (!from || !act || act.move.id !== theme.dashMove) {
    s.anchor = null;
    s.action = null;
    return;
  }
  if (s.action !== act) {
    s.action = act;
    s.started = now;
    s.anchor = from;
  }
  const duration = act.move.durationMs ?? 240;
  if ((act.t ?? 0) >= duration || now - s.started > 280) {
    s.anchor = null;
    return;
  }
  const anchor = s.anchor ?? from,
    points = dashTrailPoints(anchor, to, 26);
  if (Math.hypot(to.x - anchor.x, to.y - anchor.y) > 180) {
    s.anchor = to;
    return;
  }
  if (points.length) s.anchor = to;
  for (const point of points) {
    let ghost = s.ghosts.find((g) => !g.img.visible);
    if (!ghost) {
      if (s.ghosts.length >= 4) break;
      ghost = {
        img: actor.root.scene.add.image(
          0,
          0,
          body.texture.key,
          body.frame.name,
        ),
      };
      s.ghosts.push(ghost);
    }
    ghost.born = now;
    ghost.alpha = 0.36 * (actor.pose?.alpha ?? 1);
    ghost.royalLight = true;
    ghost.img
      .setTexture(body.texture.key, body.frame.name)
      .setPosition(point.x + actor.body.x, point.y + actor.body.y)
      .setOrigin(body.originX, body.originY)
      .setScale(body.scaleX, body.scaleY)
      .setAngle(body.angle)
      .setFlipX(body.flipX)
      .setTint(theme.trailColor)
      .setBlendMode(0)
      .setAlpha(ghost.alpha)
      .setDepth(actor.root.depth - 0.5)
      .setVisible(true);
  }
}
