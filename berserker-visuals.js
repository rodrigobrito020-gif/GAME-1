// Orc effects use independently animated crimson flipbooks. Body and collision
// remain on the approved warrior rig; the ultimate uses attached-energy.js.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0,
    serial = 0;
  for (const name of ["cleave", "quake"]) {
    const im = new Image();
    im.src = `/assets/fx/royal-berserker/${name}.png`;
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
    e.hits.clear();
    e.g.clear();
  }
  function draw(scene, e) {
    const now = performance.now(),
      seen = new Set();
    e.g.clear();
    for (const [name, im] of art)
      if (!scene.textures.exists("orc-fx:" + name))
        scene.textures
          .addSpriteSheet("orc-fx:" + name, im, {
            frameWidth: 160,
            frameHeight: 160,
          })
          .setFilter(0);
    function burst(
      id,
      name,
      x,
      y,
      age,
      duration,
      size,
      angle,
      depth,
      alpha = 1,
      ground = false,
    ) {
      if (age < 0 || age >= duration || !art.has(name)) return;
      const frame = Math.min(15, Math.floor((age / duration) * 16));
      seen.add(id);
      let s = e.images.get(id);
      if (!s) {
        s = scene.add.image(x, y, "orc-fx:" + name, frame);
        e.images.set(id, s);
      }
      s.setFrame(frame)
        .setPosition(x, y)
        .setDisplaySize(size, size * (ground ? 0.65 : 1))
        .setAngle(angle)
        .setDepth(depth)
        .setAlpha(Math.min(1, (duration - age) / 120) * alpha)
        .setBlendMode(0);
      s.royalBerserkerFx = true;
      s.royalAnimatedImpact = true;
      s.royalClassImpact = "berserker";
      s.royalImpactId = id;
      s.royalImpactAge = age;
      s.royalSkillImpact = id.startsWith("orc-hit:");
    }
    const active =
      state?.inHunt &&
      state.alive &&
      state.classId === "berserker" &&
      e.actor?.root.active;
    if (active) {
      const a = e.actor;
      for (const fx of state.berserkerFx ?? []) {
        const left = fx.remainingMs - (now - at),
          age = fx.durationMs - left;
        if (left <= 0) continue;
        const after = age - fx.impactMs,
          angle = (Math.atan2(fx.dy, fx.dx) * 180) / Math.PI;
        if (fx.kind === "quake") {
          burst(
            fx.id,
            "quake",
            fx.x,
            fx.y,
            after,
            750,
            330,
            0,
            a.root.depth - 0.2,
            1,
            true,
          );
          // Cast anticipation: ember motes rise into the raised axe, then stop
          // at the exact authoritative landing rather than a screen flash.
          if (after < 0 && age > 100)
            for (let i = 0; i < 10; i++) {
              const p = (age / 550 + i / 10) % 1,
                x = fx.x + Math.cos(i * 2.4) * (27 - 18 * p),
                y = fx.y - 25 - p * 110;
              e.g
                .fillStyle(
                  i % 3 ? 0xff4038 : 0xffd7a4,
                  Math.sin(p * Math.PI) * 0.7,
                )
                .fillEllipse(x, y, 2, 5);
            }
        } else if (fx.kind === "cleave" || fx.kind === "swing") {
          const size = fx.kind === "swing" ? 145 : 240,
            duration = fx.kind === "swing" ? 300 : 500;
          burst(
            fx.id,
            "cleave",
            a.x + fx.dx * 25,
            a.y - 70 + fx.dy * 18,
            after,
            duration,
            size,
            angle,
            1000001,
            fx.kind === "swing" ? 0.8 : 1,
          );
        } else if (fx.kind === "roar" && after >= 0) {
          const p = after / 650;
          if (p < 1)
            for (let i = 0; i < 20; i++) {
              const theta = i * 2.399963 + p * 1.7,
                r = 8 + p * 42,
                x = a.x + Math.cos(theta) * r,
                y = a.y - 20 - i * 4 - p * 34;
              e.g
                .lineStyle(1.5, i % 4 ? 0xff5148 : 0xffe0b6, (1 - p) * 0.8)
                .lineBetween(x, y, x - Math.cos(theta) * 6, y + 8);
            }
        }
      }
    }
    for (const [id, hit] of e.hits) {
      const age = now - hit.at;
      if (!active || age >= 450) {
        e.hits.delete(id);
        continue;
      }
      const target = hit.actor.root.active ? hit.actor : null;
      if (target) {
        hit.x = target.x;
        hit.y = target.y - target.height * 0.5;
      }
      burst(
        id,
        "cleave",
        hit.x,
        hit.y,
        age,
        450,
        hit.crit ? 125 : 94,
        hit.turn,
        1000002,
        0.95,
      );
    }
    for (const [id, s] of e.images)
      if (!seen.has(id)) {
        s.destroy();
        e.images.delete(id);
      }
  }
  function entry(scene) {
    if (scenes.has(scene)) return scenes.get(scene);
    const e = {
      actor: null,
      images: new Map(),
      hits: new Map(),
      g: scene.add.graphics().setDepth(1000001),
    };
    scenes.set(scene, e);
    const callback = () => draw(scene, e);
    scene.events.on("postupdate", callback);
    scene.events.once("shutdown", () => {
      scene.events.off("postupdate", callback);
      clear(e);
      e.g.destroy();
      scenes.delete(scene);
    });
    return e;
  }
  window.__royalBerserkerVisuals = {
    ready() {
      return art.size === 2;
    },
    update(a) {
      if (a.id === 1) entry(a.root.scene).actor = a;
    },
    hit(scene, actor, damage) {
      if (art.size < 2) return false;
      const e = entry(scene),
        id = "orc-hit:" + ++serial;
      e.hits.set(id, {
        actor,
        x: actor.x,
        y: actor.y - actor.height * 0.5,
        at: performance.now(),
        crit: damage.critical,
        turn: serial % 2 ? 18 : -18,
      });
      // A real hit begins at its first animation frame in this render pass.
      draw(scene, e);
      return true;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    for (const e of scenes.values()) clear(e);
  });
})();
