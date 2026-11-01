// Authored forest effects and arrows follow authoritative projectile lifetimes.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of ["ring", "spirit", "arrow", "impact"]) {
    const im = new Image();
    im.src = `/assets/fx/royal-archer/${name}.png`;
    im.decode()
      .then(() => art.set(name, im))
      .catch(() => {});
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    at = performance.now();
  });
  function draw(scene, entry) {
    const now = performance.now(),
      g = entry.g;
    g.clear();
    for (const [name, im] of art)
      if (!scene.textures.exists(`elf-fx:${name}`))
        scene.textures.addImage(`elf-fx:${name}`, im);
    const seen = new Set();
    if (state?.inHunt)
      for (const fx of state.archerFx ?? []) {
        const left = fx.remainingMs - (now - at);
        if (left <= 0) continue;
        seen.add(fx.id);
        if (fx.kind === "arrow") {
          if (!art.has("arrow")) continue;
          const age = fx.durationMs - left;
          if (age < fx.releaseMs) continue;
          const p = Math.max(
              0,
              Math.min(
                1,
                (age - fx.releaseMs) / (fx.durationMs - fx.releaseMs),
              ),
            ),
            x = fx.x + (fx.tx - fx.x) * p,
            y = fx.y + (fx.ty - fx.y) * p;
          let sprite = entry.projectiles.get(fx.id);
          if (!sprite) {
            sprite = scene.add.image(0, 0, "elf-fx:arrow");
            entry.projectiles.set(fx.id, sprite);
          }
          sprite
            .setPosition(x, y)
            .setDisplaySize(
              fx.color === "normal" ? 62 : 95,
              fx.color === "normal" ? 23 : 36,
            )
            .setAngle((Math.atan2(fx.ty - fx.y, fx.tx - fx.x) * 180) / Math.PI)
            .setDepth(1e7)
            .setAlpha(0.95)
            .setVisible(true);
        } else if (fx.kind === "rain") {
          const progress = 1 - left / fx.durationMs;
          g.lineStyle(2, 0x81c67a, 0.4);
          g.strokeCircle(fx.x, fx.y, fx.radius);
          g.fillStyle(0x69b880, 0.05);
          g.fillCircle(fx.x, fx.y, fx.radius);
          for (let i = 0; i < 28; i++) {
            const a = i * 2.39996,
              r = fx.radius * Math.sqrt((i + 0.5) / 28),
              x = fx.x + Math.cos(a) * r,
              y = fx.y + Math.sin(a) * r,
              t = (progress * 4 + i / 28) % 1,
              height = (1 - t) * 120;
            g.lineStyle(2, 0xf5d886, 0.8);
            g.lineBetween(x - 5, y - height - 22, x, y - height);
            g.fillStyle(0xeaffcb, 0.9);
            g.fillTriangle(
              x,
              y - height + 5,
              x - 4,
              y - height - 3,
              x + 3,
              y - height - 5,
            );
            if (t > 0.85) {
              g.lineStyle(2, 0xb6e98c, (1 - t) * 5);
              g.strokeCircle(x, y, 4 + (t - 0.85) * 65);
            }
          }
        }
      }
    for (const [id, s] of entry.projectiles)
      if (!seen.has(id)) {
        s.destroy();
        entry.projectiles.delete(id);
      }
    const a = entry.actor,
      active =
        state?.classId === "arqueira" &&
        state.inHunt &&
        state.alive &&
        a?.root.active;
    const eyes =
        active && state.activeBuffs?.some((b) => b.id === "olhos-da-floresta"),
      spirit =
        active &&
        state.activeBuffs?.some((b) => b.id === "espirito-da-floresta");
    if ((eyes || spirit) && art.has("ring")) {
      if (!entry.ring) entry.ring = scene.add.image(0, 0, "elf-fx:ring");
      entry.ring
        .setPosition(a.x, a.y + 3)
        .setDisplaySize(140, 72)
        .setAngle(Math.sin(now / 1600) * 4)
        .setAlpha(spirit ? 0.8 : 0.55)
        .setDepth(a.root.depth - 0.2)
        .setVisible(true);
    } else entry.ring?.setVisible(false);
    if (spirit && art.has("spirit")) {
      if (!entry.spirit) entry.spirit = scene.add.image(0, 0, "elf-fx:spirit");
      entry.spirit
        .setPosition(a.x, a.y - 66)
        .setDisplaySize(150, 170)
        .setAlpha(0.47 + 0.04 * Math.sin(now / 500))
        .setDepth(a.root.depth - 0.1)
        .setVisible(true);
    } else entry.spirit?.setVisible(false);
  }
  window.__royalArcherVisuals = {
    update(a) {
      const scene = a.root.scene;
      let entry = scenes.get(scene);
      if (!entry) {
        entry = {
          g: scene.add.graphics().setDepth(1e7),
          projectiles: new Map(),
          actor: null,
        };
        scenes.set(scene, entry);
        const callback = () => draw(scene, entry);
        scene.events.on("postupdate", callback);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", callback);
          entry.g.destroy();
          for (const s of entry.projectiles.values()) s.destroy();
          entry.ring?.destroy();
          entry.spirit?.destroy();
          scenes.delete(scene);
        });
      }
      if (a.id === 1) entry.actor = a;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    for (const e of scenes.values()) {
      e.g.clear();
      for (const s of e.projectiles.values()) s.destroy();
      e.projectiles.clear();
      e.ring?.setVisible(false);
      e.spirit?.setVisible(false);
    }
  });
})();
