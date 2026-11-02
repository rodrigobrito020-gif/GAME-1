import { RANGED_ATLAS as ATLAS, impactFrame } from "/ranged-vfx.mjs";
const art = new Map(),
  scenes = new Map();
for (const cls of ["arqueira", "pistoleira"]) {
  const im = new Image();
  im.src = `/assets/fx/royal-ranged/${cls}-impact.png`;
  im.decode()
    .then(() => art.set(cls, im))
    .catch(() => {});
}
function clear(e) {
  for (const item of e.live.values()) item.sprite.destroy();
  e.live.clear();
  e.seen.clear();
}
function update(e, now) {
  for (const [id, item] of e.live) {
    const age = now - item.at,
      frame = impactFrame(age);
    if (frame === null) {
      item.sprite.destroy();
      e.live.delete(id);
      continue;
    }
    const a = item.follow?.root?.active ? item.follow : null;
    if (a) {
      item.x = a.x;
      item.y = a.y + item.offsetY;
    }
    item.sprite
      .setFrame(frame)
      .setPosition(item.x, item.y)
      .setAlpha(Math.min(1, (ATLAS.durationMs - age) / 110) * item.alpha);
    item.sprite.royalImpactAge = age;
  }
  for (const [id, expiry] of e.seen) if (now >= expiry) e.seen.delete(id);
}
function state(scene) {
  if (scenes.has(scene)) return scenes.get(scene);
  const e = { live: new Map(), seen: new Map() };
  scenes.set(scene, e);
  const draw = () => update(e, performance.now());
  scene.events.on("postupdate", draw);
  scene.events.once("shutdown", () => {
    scene.events.off("postupdate", draw);
    clear(e);
    scenes.delete(scene);
  });
  return e;
}
window.__royalRangedFx = {
  ready() {
    return art.size === 2;
  },
  emit(scene, id, cls, x, y, age = 0, options = {}) {
    if (!art.has(cls) || impactFrame(age) === null) return false;
    const e = state(scene),
      now = performance.now();
    if (e.seen.has(id)) return true; // Repeated snapshots never restart a burst.
    const key = `ranged-impact:${cls}`;
    if (!scene.textures.exists(key)) {
      scene.textures
        .addSpriteSheet(key, art.get(cls), {
          frameWidth: ATLAS.cell,
          frameHeight: ATLAS.cell,
        })
        .setFilter(0);
    }
    // Use alpha blending: additive blending exposes pale RGB in transparent texels
    // on this client. Initialize size/frame/alpha before the first rendered frame.
    const sprite = scene.add
      .image(x, y, key, impactFrame(age))
      .setDisplaySize(
        options.size ?? 112,
        (options.size ?? 112) * (options.ground ? 0.58 : 1),
      )
      .setAngle(options.angle ?? 0)
      .setAlpha(options.alpha ?? 0.9)
      .setDepth(options.depth ?? 1000002)
      .setBlendMode(0);
    sprite.royalAnimatedImpact = true;
    sprite.royalSkillImpact = !options.ground;
    sprite.royalClassImpact = cls;
    sprite.royalImpactId = id;
    e.live.set(id, {
      sprite,
      x,
      y,
      at: now - age,
      follow: options.follow,
      offsetY: options.offsetY ?? 0,
      alpha: options.alpha ?? 0.9,
    });
    // Retain tombstones beyond the source effect's entire snapshot lifetime.
    e.seen.set(id, now + 6000);
    update(e, now);
    return true;
  },
  clear() {
    for (const e of scenes.values()) clear(e);
  },
};
window.addEventListener("royal-skill-scene-reset", () =>
  window.__royalRangedFx.clear(),
);
