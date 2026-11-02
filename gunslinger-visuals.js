import { projectilePose } from "/archer-vfx.mjs";
import { CHARACTER_ART as ART } from "/character-art.mjs";
// Painted violet smoke and warm muzzle sparks match the approved class art.
// No geometric outlines, scene flashes or gameplay timing changes.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of ["bullet", "muzzle", "impact", "aura"]) {
    const im = new Image();
    im.src = `/assets/fx/royal-gunslinger/${name}.png`;
    im.decode()
      .then(() => art.set(name, im))
      .catch(() => {});
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    at = performance.now();
  });
  function clear(e) {
    for (const s of e.images.values()) s.destroy();
    e.images.clear();
    e.shots.clear();
    e.hits = [];
  }
  function draw(scene, e) {
    const now = performance.now(),
      seen = new Set(),
      shots = new Set();
    for (const [name, im] of art)
      if (!scene.textures.exists(`gun-fx:${name}`))
        scene.textures.addImage(`gun-fx:${name}`, im);
    function image(id, name, x, y, w, h, alpha, angle = 0, depth = 1e6) {
      if (!art.has(name) || alpha <= 0) return;
      seen.add(id);
      let s = e.images.get(id);
      if (!s) {
        s = scene.add.image(0, 0, `gun-fx:${name}`);
        e.images.set(id, s);
      }
      s.setPosition(x, y)
        .setDisplaySize(w, h)
        .setAlpha(alpha)
        .setAngle(angle)
        .setDepth(depth)
        .setVisible(true);
      return s;
    }
    const active =
      state?.classId === "pistoleira" &&
      state.inHunt &&
      state.alive &&
      e.actor?.root.active;
    if (active)
      for (const fx of state.gunslingerFx ?? []) {
        const left = fx.remainingMs - (now - at),
          age = fx.durationMs - left;
        if (left <= 0) continue;
        shots.add(fx.id);
        e.shots.set(fx.id, { fx, due: now + left });
        const pose = projectilePose(fx, age),
          powered = !!fx.skillId || state.activeMs > 0;
        if (!pose) continue;
        if (age - fx.releaseMs < 95) {
          const p = (age - fx.releaseMs) / 95;
          image(
            fx.id + ":muzzle",
            "muzzle",
            fx.x,
            fx.y,
            34 + p * 12,
            30 + p * 10,
            (1 - p) * 0.9,
            pose.angle,
          );
        }
        image(
          fx.id,
          "bullet",
          pose.x,
          pose.y,
          powered ? 65 : 38,
          powered ? 25 : 15,
          0.98,
          pose.angle,
        );
      }
    for (const [id, shot] of e.shots)
      if (!shots.has(id)) {
        if (active && Math.abs(now - shot.due) < 180)
          e.hits.push({
            id,
            x: shot.fx.tx,
            y: shot.fx.ty,
            at: now,
            powered: !!shot.fx.skillId,
          });
        e.shots.delete(id);
      }
    e.hits = e.hits.filter((h) => active && now - h.at < 280);
    for (const h of e.hits) {
      const p = (now - h.at) / 280,
        sz = (h.powered ? 40 : 23) + p * 20;
      image(
        h.id + ":impact",
        "impact",
        h.x,
        h.y,
        sz,
        sz,
        (1 - p) * (1 - p) * 0.8,
      );
    }
    if (active) {
      const a = e.actor,
        buffs = state.activeBuffs ?? [],
        eclipse = buffs.find((b) => b.id === "eclipse");
      if (eclipse) {
        const age = eclipse.totalMs - eclipse.remainingMs + (now - at),
          body = window.__royalHD?.capture(a) ?? a.body,
          size = Math.max(ART.worldBodyHeight * 1.35, a.height * 1.4),
          fade = Math.max(
            0,
            Math.min(1, age / 200, (eclipse.remainingMs - (now - at)) / 350),
          );
        image(
          "eclipse:aura",
          "aura",
          a.x + body.x,
          a.y + body.y - size * 0.39,
          size * 0.85,
          size,
          (0.6 + 0.05 * Math.sin(age / 300)) * fade,
          0,
          a.root.depth - 0.2,
        );
      }
      for (const b of buffs) {
        const age = b.totalMs - b.remainingMs + (now - at),
          p = age / 650;
        if (p >= 0 && p < 1)
          image(
            "buff:" + b.id,
            "impact",
            a.x,
            a.y - 58,
            50 + p * 25,
            60 + p * 30,
            (1 - p) * (1 - p) * 0.55,
          );
      }
    }
    for (const [id, s] of e.images)
      if (!seen.has(id)) {
        s.destroy();
        e.images.delete(id);
      }
  }
  window.__royalGunslingerVisuals = {
    update(a) {
      const scene = a.root.scene;
      let e = scenes.get(scene);
      if (!e) {
        e = { actor: null, images: new Map(), shots: new Map(), hits: [] };
        scenes.set(scene, e);
        const update = () => draw(scene, e);
        scene.events.on("postupdate", update);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", update);
          clear(e);
          scenes.delete(scene);
        });
      }
      if (a.id === 1) e.actor = a;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    for (const e of scenes.values()) clear(e);
  });
})();
