import { classVisuals } from "./class-visuals.mjs";
const previous = new WeakMap();
const anchors = new WeakMap();

export function dashTrailPoints(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance < 18 || distance > 180) return [];
  const count = Math.min(5, Math.max(1, Math.floor(distance / 18)));
  return Array.from({ length: count }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / count,
    y: from.y + ((to.y - from.y) * i) / count,
  }));
}

// Native movement can arrive before the short dodge's animation callback.
// Emit from actual displacement and reuse the client's bounded, fading HD
// afterimage pool, independent of the native motion.trail implementation.
export function updateDashTrail(actor, body, elf) {
  const to = { x: actor.x, y: actor.y },
    from = previous.get(actor);
  previous.set(actor, to);
  const theme = classVisuals(elf ? "arqueira" : "guerreiro");
  if (
    !from ||
    actor.act?.move.id !== theme.dashMove ||
    !actor.alive ||
    actor.dead
  ) {
    anchors.delete(actor);
    return;
  }
  const ghosts = (actor.ghosts ??= []);
  const anchor = anchors.get(actor) ?? from,
    points = dashTrailPoints(anchor, to);
  anchors.set(actor, points.length ? to : anchor);
  for (const point of points) {
    if (ghosts.filter((g) => g.royalLight && g.img.visible).length >= 5) break;
    let ghost = ghosts.find((g) => !g.img.visible);
    if (!ghost) {
      ghost = {
        img: actor.root.scene.add.image(
          0,
          0,
          body.texture.key,
          body.frame.name,
        ),
      };
      ghosts.push(ghost);
    }
    ghost.royalLight = true;
    ghost.age = 0;
    ghost.alpha = 0.62 * (actor.pose?.alpha ?? 1);
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
