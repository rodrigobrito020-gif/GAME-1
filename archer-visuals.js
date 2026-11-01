import { projectilePose, rainPose } from "/archer-vfx.mjs";

// Small, independent effects: casting never pauses or scales the whole scene.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of ["ring", "spirit", "arrow"]) {
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
  function spark(g, x, y, p, size = 20) {
    const alpha = 1 - p;
    g.lineStyle(2, 0xffedbb, alpha);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        r = 3 + p * size;
      g.lineBetween(
        x + Math.cos(a) * r * 0.5,
        y + Math.sin(a) * r * 0.5,
        x + Math.cos(a) * r,
        y + Math.sin(a) * r,
      );
    }
    g.lineStyle(1.5, 0xa6eabb, alpha * 0.7);
    g.strokeCircle(x, y, 2 + p * size * 0.6);
  }
  function draw(scene, entry) {
    const now = performance.now(),
      g = entry.g;
    g.clear();
    for (const [name, im] of art)
      if (!scene.textures.exists(`elf-fx:${name}`))
        scene.textures.addImage(`elf-fx:${name}`, im);
    const seen = new Set();
    if (state?.inHunt && state.classId === "arqueira")
      for (const fx of state.archerFx ?? []) {
        const left = fx.remainingMs - (now - at),
          age = fx.durationMs - left;
        if (left <= 0) continue;
        if (fx.kind === "arrow") {
          seen.add(fx.id);
          let shot = entry.projectiles.get(fx.id);
          if (!shot) {
            shot = { sprite: null };
            entry.projectiles.set(fx.id, shot);
          }
          shot.fx = fx;
          shot.due = now + left;
          const pose = projectilePose(fx, age),
            angle = Math.atan2(fx.ty - fx.y, fx.tx - fx.x);
          if (!pose) {
            if (fx.color === "piercing") {
              const p = Math.max(0, age / fx.releaseMs);
              g.lineStyle(1.5, 0xffe8ac, p * 0.8);
              g.strokeCircle(fx.x, fx.y, 3 + 5 * p);
              g.lineStyle(2, 0xb6f3b0, p * 0.6);
              g.lineBetween(
                fx.x,
                fx.y,
                fx.x + Math.cos(angle) * 24 * p,
                fx.y + Math.sin(angle) * 24 * p,
              );
            }
            continue;
          }
          if (!art.has("arrow")) continue;
          if (!shot.sprite)
            shot.sprite = scene.add.image(0, 0, "elf-fx:arrow").setFlipX(true);
          const empowered = fx.color !== "normal";
          // The authored arrow points LEFT. Flip its artwork before rotating it
          // along the target vector; otherwise every projectile flies backward.
          shot.sprite
            .setPosition(pose.x, pose.y)
            .setDisplaySize(empowered ? 76 : 42, empowered ? 28 : 16)
            .setAngle(pose.angle)
            .setDepth(1e6)
            .setAlpha(0.95)
            .setVisible(true);
          if (age - fx.releaseMs < 100)
            spark(g, fx.x, fx.y, (age - fx.releaseMs) / 100, 11);
          if (empowered) {
            g.lineStyle(3, 0xc4f2a0, 0.42);
            g.lineBetween(
              pose.x,
              pose.y,
              pose.x - Math.cos(angle) * 38,
              pose.y - Math.sin(angle) * 38,
            );
          }
        } else if (fx.kind === "rain") {
          const rain = rainPose(fx, age);
          if (rain.telegraph) {
            g.lineStyle(1.5, 0xc7df9a, 0.5);
            g.strokeCircle(fx.x, fx.y, fx.radius);
            g.fillStyle(0x8bd69c, 0.035);
            g.fillCircle(fx.x, fx.y, fx.radius);
          }
          for (const d of rain.drops) {
            // Feather, wooden shaft and tip stay readable while falling in three
            // volleys, rather than a continuously looping field of light lines.
            g.lineStyle(3, 0x5c4930, d.alpha * 0.8);
            g.lineBetween(d.x - 2, d.y - 23, d.x, d.y);
            g.lineStyle(1.3, 0xffe9bb, d.alpha);
            g.lineBetween(d.x - 2, d.y - 23, d.x, d.y);
            g.lineStyle(1.5, 0xd4f2bb, d.alpha);
            g.lineBetween(d.x - 5, d.y - 20, d.x - 1, d.y - 16);
            g.lineBetween(d.x + 2, d.y - 21, d.x - 1, d.y - 16);
            g.fillStyle(0xe9edce, d.alpha);
            g.fillTriangle(d.x, d.y + 4, d.x - 3, d.y - 3, d.x + 3, d.y - 3);
          }
          for (const hit of rain.impacts) {
            const p = hit.progress;
            g.lineStyle(2, 0xccefa5, (1 - p) * 0.55);
            g.strokeCircle(fx.x, fx.y, fx.radius * (0.7 + 0.3 * p));
            for (let i = 0; i < 10; i++) {
              const a = i * 2.399963 + hit.wave * 0.7,
                r = fx.radius * Math.sqrt((i + 0.5) / 10) * 0.85;
              spark(g, fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r, p, 13);
            }
          }
        }
      }
    for (const [id, shot] of entry.projectiles)
      if (!seen.has(id)) {
        if (
          state?.inHunt &&
          state.classId === "arqueira" &&
          Math.abs(now - shot.due) < 160
        )
          entry.impacts.push({ x: shot.fx.tx, y: shot.fx.ty, at: now });
        shot.sprite?.destroy();
        entry.projectiles.delete(id);
      }
    entry.impacts = entry.impacts.filter((hit) => now - hit.at < 220);
    for (const hit of entry.impacts)
      spark(g, hit.x, hit.y, (now - hit.at) / 220, 22);
    const a = entry.actor,
      active =
        state?.classId === "arqueira" &&
        state.inHunt &&
        state.alive &&
        a?.root.active;
    const buffs = active ? (state.activeBuffs ?? []) : [],
      eyes = buffs.find((b) => b.id === "olhos-da-floresta"),
      spirit = buffs.find((b) => b.id === "espirito-da-floresta");
    if ((eyes || spirit) && art.has("ring")) {
      entry.ring ??= scene.add.image(0, 0, "elf-fx:ring");
      entry.ring
        .setPosition(a.x, a.y + 3)
        .setDisplaySize(126, 62)
        .setAngle(Math.sin(now / 1600) * 3)
        .setAlpha(spirit ? 0.65 : 0.42)
        .setDepth(a.root.depth - 0.2)
        .setVisible(true);
    } else entry.ring?.setVisible(false);
    if (spirit && art.has("spirit")) {
      const age = spirit.totalMs - spirit.remainingMs + (now - at),
        cast = Math.max(0, 1 - age / 900);
      entry.spirit ??= scene.add.image(0, 0, "elf-fx:spirit");
      entry.spirit
        .setPosition(a.x, a.y - 92 - cast * 12)
        .setDisplaySize(126, 146)
        .setAlpha(0.18 + cast * 0.4)
        .setDepth(a.root.depth - 0.1)
        .setVisible(true);
      for (let i = 0; i < 5; i++) {
        const t = now / 850 + (i * Math.PI * 2) / 5;
        g.fillStyle(0xcdf3a1, 0.45);
        g.fillEllipse(
          a.x + Math.cos(t) * 39,
          a.y - 48 + Math.sin(t) * 24,
          3,
          6,
        );
      }
    } else entry.spirit?.setVisible(false);
    for (const buff of [eyes, spirit])
      if (buff) {
        const age = buff.totalMs - buff.remainingMs + (now - at),
          p = age / 650;
        if (p >= 0 && p < 1) {
          g.lineStyle(2, spirit ? 0xffe0a0 : 0xb2eeae, (1 - p) * 0.8);
          g.strokeEllipse(a.x, a.y - 45, 30 + p * 75, 50 + p * 55);
          for (let i = 0; i < 7; i++) {
            const t = (i * Math.PI * 2) / 7 + p * 2,
              r = 15 + p * 48;
            g.fillStyle(spirit ? 0xffe6ad : 0xb2eaa5, 1 - p);
            g.fillEllipse(
              a.x + Math.cos(t) * r,
              a.y - 45 + Math.sin(t) * r * 0.65,
              3,
              7,
            );
          }
        }
      }
  }
  function clear(entry) {
    entry.g.clear();
    for (const shot of entry.projectiles.values()) shot.sprite?.destroy();
    entry.projectiles.clear();
    entry.impacts = [];
    entry.ring?.setVisible(false);
    entry.spirit?.setVisible(false);
  }
  window.__royalArcherVisuals = {
    update(a) {
      const scene = a.root.scene;
      let entry = scenes.get(scene);
      if (!entry) {
        entry = {
          g: scene.add.graphics().setDepth(1e6),
          projectiles: new Map(),
          impacts: [],
          actor: null,
        };
        scenes.set(scene, entry);
        const callback = () => draw(scene, entry);
        scene.events.on("postupdate", callback);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", callback);
          clear(entry);
          entry.g.destroy();
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
    for (const e of scenes.values()) clear(e);
  });
})();
