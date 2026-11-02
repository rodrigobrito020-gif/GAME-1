import { projectilePose, rainPose } from "/archer-vfx.mjs";
import { CHARACTER_ART as ART } from "/character-art.mjs";

// Emerald edges and light cores stay readable over ivory stone and dark terrain.
// Effects remain local: casting never pauses or scales the whole scene.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of ["ring", "aura", "arrow"]) {
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
  function line(g, x, y, tx, ty, alpha = 1, width = 3) {
    for (const [w, color, opacity] of [
      [width + 4, 0x123e2e, 0.82],
      [width + 1.5, 0x19b969, 1],
      [Math.max(1, width * 0.4), 0xe8ffd2, 1],
    ]) {
      g.lineStyle(w, color, alpha * opacity);
      g.lineBetween(x, y, tx, ty);
    }
  }
  function circle(g, x, y, r, alpha = 1, width = 2) {
    for (const [w, color, opacity] of [
      [width + 4, 0x123e2e, 0.8],
      [width + 1.5, 0x19b969, 1],
      [1, 0xe8ffd2, 1],
    ]) {
      g.lineStyle(w, color, alpha * opacity);
      g.strokeCircle(x, y, r);
    }
  }
  function spark(g, x, y, p, size = 20) {
    const alpha = 1 - p;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        r = 3 + p * size;
      line(
        g,
        x + Math.cos(a) * r * 0.5,
        y + Math.sin(a) * r * 0.5,
        x + Math.cos(a) * r,
        y + Math.sin(a) * r,
        alpha,
        2,
      );
    }
    circle(g, x, y, 2 + p * size * 0.6, alpha * 0.8, 1.5);
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
              circle(g, fx.x, fx.y, 3 + 7 * p, p * 0.9);
              line(
                g,
                fx.x,
                fx.y,
                fx.x + Math.cos(angle) * 24 * p,
                fx.y + Math.sin(angle) * 24 * p,
                p * 0.8,
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
            .setDisplaySize(
              empowered ? (fx.fan ? 110 : 88) : 48,
              empowered ? 32 : 18,
            )
            .setAngle(pose.angle)
            .setDepth(1e6)
            .setAlpha(0.95)
            .setVisible(true);
          if (age - fx.releaseMs < 100)
            spark(g, fx.x, fx.y, (age - fx.releaseMs) / 100, 11);
          if (empowered) {
            line(
              g,
              pose.x,
              pose.y,
              pose.x - Math.cos(angle) * (fx.fan ? 105 : 55),
              pose.y - Math.sin(angle) * (fx.fan ? 105 : 55),
              0.85,
              fx.fan ? 4 : 3,
            );
            // A solid arrowhead remains legible even when the translucent art
            // passes over bright marble. It follows the same projectile pose.
            const tipX = pose.x + Math.cos(angle) * 31,
              tipY = pose.y + Math.sin(angle) * 31;
            for (const side of [-1, 1])
              line(
                g,
                tipX,
                tipY,
                tipX - Math.cos(angle + side * 0.65) * 18,
                tipY - Math.sin(angle + side * 0.65) * 18,
                0.95,
                3,
              );
          }
        } else if (fx.kind === "rain") {
          const rain = rainPose(fx, age);
          if (rain.telegraph) {
            g.fillStyle(0x137347, 0.1);
            g.fillCircle(fx.x, fx.y, fx.radius);
            circle(g, fx.x, fx.y, fx.radius, 0.8, 2);
          }
          for (const d of rain.drops) {
            // Feather, wooden shaft and tip stay readable while falling in three
            // volleys, rather than a continuously looping field of light lines.
            line(g, d.x - 3, d.y - 36, d.x, d.y, d.alpha, 3);
            line(g, d.x - 8, d.y - 29, d.x - 2, d.y - 22, d.alpha, 2);
            line(g, d.x + 4, d.y - 29, d.x - 2, d.y - 22, d.alpha, 2);
            g.fillStyle(0x123e2e, d.alpha);
            g.fillTriangle(d.x, d.y + 8, d.x - 6, d.y - 4, d.x + 6, d.y - 4);
            g.fillStyle(0xe8ffd2, d.alpha);
            g.fillTriangle(d.x, d.y + 5, d.x - 3, d.y - 2, d.x + 3, d.y - 2);
          }
          for (const hit of rain.impacts) {
            const p = hit.progress;
            circle(
              g,
              fx.x,
              fx.y,
              fx.radius * (0.7 + 0.3 * p),
              (1 - p) * 0.9,
              3,
            );
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
        .setAlpha(spirit ? 0.8 : 0.65)
        .setDepth(a.root.depth - 0.2)
        .setVisible(true);
    } else entry.ring?.setVisible(false);
    if (spirit && art.has("aura")) {
      const age = spirit.totalMs - spirit.remainingMs + (now - at),
        cam = scene.cameras.main,
        canvas = scene.game.canvas.getBoundingClientRect(),
        css = canvas.width / scene.scale.width,
        size = Math.max(
          ART.worldBodyHeight * 1.35,
          a.height * 1.4,
          90 / (cam.zoom * css),
        ),
        fade = Math.min(1, age / 180, (spirit.remainingMs - (now - at)) / 350),
        body = window.__royalHD?.capture(a) ?? a.body;
      entry.aura ??= scene.add.image(0, 0, "elf-fx:aura").setOrigin(0.5, 0.9);
      entry.aura
        .setPosition(a.x + body.x, a.y + body.y + 4)
        .setDisplaySize(size * 0.85, size)
        .setAlpha((0.67 + 0.08 * Math.sin(age / 270)) * Math.max(0, fade))
        .setDepth(a.root.depth - 0.2)
        .setVisible(!a.hidden && a.root.visible && a.body.visible);
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
    } else entry.aura?.setVisible(false);
    for (const buff of [eyes, spirit])
      if (buff) {
        const age = buff.totalMs - buff.remainingMs + (now - at),
          p = age / 900;
        if (p >= 0 && p < 1) {
          for (const [width, color] of [
            [7, 0x123e2e],
            [4, 0x19b969],
            [1, 0xe8ffd2],
          ]) {
            g.lineStyle(width, color, (1 - p) * 0.85);
            g.strokeEllipse(a.x, a.y - 45, 30 + p * 75, 50 + p * 55);
          }
          for (let i = 0; i < 7; i++) {
            const t = (i * Math.PI * 2) / 7 + p * 2,
              r = 15 + p * 48;
            g.fillStyle(0x15854d, 1 - p);
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
    entry.aura?.setVisible(false);
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
          entry.aura?.destroy();
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
