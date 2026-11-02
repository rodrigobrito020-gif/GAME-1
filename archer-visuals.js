import { projectilePose, rainPose } from "/archer-vfx.mjs";
import { CHARACTER_ART as ART } from "/character-art.mjs";

// Authored leaf, gold and light textures carry the class identity. Soft local
// shading separates them from marble without drawing outlines over the art.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of ["ring", "aura", "arrow", "impact"]) {
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
    const alpha = Math.max(0, 1 - p);
    // Tiny gold motes fade out rather than forming expanding graphic circles.
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.399963,
        r = 3 + p * size;
      const px = x + Math.cos(angle) * r,
        py = y + Math.sin(angle) * r * 0.7;
      g.fillStyle(0xb39952, alpha * 0.18);
      g.fillCircle(px, py, 3);
      g.fillStyle(i % 2 ? 0xffe7a5 : 0xd9f2b5, alpha * 0.85);
      g.fillEllipse(px, py, 1.5, 3);
    }
  }
  function draw(scene, entry) {
    const now = performance.now(),
      g = entry.g;
    g.clear();
    for (const [name, im] of art)
      if (!scene.textures.exists(`elf-fx:${name}`))
        scene.textures.addImage(`elf-fx:${name}`, im);
    const visibleEffects = new Set();
    function texture(id, name, x, y, w, h, alpha, angle = 0, depth = 1e6) {
      if (!art.has(name)) return;
      visibleEffects.add(id);
      let image = entry.effects.get(id);
      if (!image) {
        image = scene.add.image(0, 0, `elf-fx:${name}`);
        entry.effects.set(id, image);
      }
      image
        .setPosition(x, y)
        .setDisplaySize(w, h)
        .setAlpha(alpha)
        .setAngle(angle)
        .setDepth(depth)
        .setVisible(true);
      return image;
    }
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
            shot = { sprite: null, shade: null };
            entry.projectiles.set(fx.id, shot);
          }
          shot.fx = fx;
          shot.due = now + left;
          const pose = projectilePose(fx, age),
            angle = Math.atan2(fx.ty - fx.y, fx.tx - fx.x);
          if (!pose) {
            if (fx.fan)
              spark(g, fx.x, fx.y, Math.max(0, age / fx.releaseMs), 9);
            continue;
          }
          if (!art.has("arrow")) continue;
          if (!shot.sprite) {
            shot.shade = scene.add
              .image(0, 0, "elf-fx:arrow")
              .setFlipX(true)
              .setTint(0x425c39);
            shot.sprite = scene.add.image(0, 0, "elf-fx:arrow").setFlipX(true);
          }
          const empowered = fx.color !== "normal",
            width = empowered ? (fx.fan ? 102 : 82) : 44,
            height = empowered ? 29 : 17;
          // A restrained offset shadow preserves texture detail on light floors.
          shot.shade
            .setPosition(pose.x + 1, pose.y + 2)
            .setDisplaySize(width, height)
            .setAngle(pose.angle)
            .setDepth(1e6 - 1)
            .setAlpha(empowered ? 0.32 : 0.18);
          shot.sprite
            .setPosition(pose.x, pose.y)
            .setDisplaySize(width, height)
            .setAngle(pose.angle)
            .setDepth(1e6)
            .setAlpha(1)
            .setVisible(true);
          if (age - fx.releaseMs < 110)
            spark(g, fx.x, fx.y, (age - fx.releaseMs) / 110, 11);
          if (empowered) {
            // Short tapered wisps echo the gold/leaf artwork, never solid rays.
            const travelAge = age - fx.releaseMs;
            for (let i = 1; i <= 5; i++) {
              const behind = Math.min(travelAge * 0.65, i * 10),
                px = pose.x - Math.cos(angle) * behind,
                py = pose.y - Math.sin(angle) * behind;
              g.fillStyle(i % 2 ? 0x7ca16a : 0xd6b87d, (1 - i / 6) * 0.14);
              g.fillCircle(px, py, 4 - i * 0.4);
              g.fillStyle(0xf4ecc6, (1 - i / 6) * 0.45);
              g.fillCircle(px, py, 1.5 - i * 0.15);
            }
          }
        } else if (fx.kind === "rain") {
          const rain = rainPose(fx, age),
            groundDepth = (entry.actor?.root.depth ?? 0) - 0.3;
          if (rain.telegraph) {
            const fade = Math.min(
              1,
              Math.max(0, (age - fx.releaseMs) / 180),
              left / 240,
            );
            texture(
              `${fx.id}:ground`,
              "ring",
              fx.x,
              fx.y,
              fx.radius * 2.1,
              fx.radius * 1.4,
              fade * 0.5,
              0,
              groundDepth,
            );
          }
          for (const d of rain.drops) {
            const key = `${fx.id}:drop:${d.wave}:${d.index}`;
            texture(
              key + ":shade",
              "arrow",
              d.x + 1,
              d.y - 22 + 2,
              68,
              19,
              d.alpha * 0.28,
              90,
            )
              ?.setFlipX(true)
              .setTint(0x425c39);
            texture(key, "arrow", d.x, d.y - 22, 68, 19, d.alpha, 90)?.setFlipX(
              true,
            );
          }
          for (const hit of rain.impacts) {
            const p = hit.progress;
            for (let i = 0; i < 8; i++) {
              const angle = i * 2.399963 + hit.wave * 0.7,
                r = fx.radius * Math.sqrt((i + 0.5) / 8) * 0.85,
                x = fx.x + Math.cos(angle) * r,
                y = fx.y + Math.sin(angle) * r;
              texture(
                `${fx.id}:hit:${hit.wave}:${i}`,
                "impact",
                x,
                y - 5,
                28 + p * 24,
                38 + p * 32,
                (1 - p) * (1 - p) * 0.72,
                0,
              );
              spark(g, x, y, p, 12);
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
        shot.shade?.destroy();
        entry.projectiles.delete(id);
      }
    entry.impacts = entry.impacts.filter((hit) => now - hit.at < 280);
    for (const [i, hit] of entry.impacts.entries()) {
      const p = (now - hit.at) / 280;
      texture(
        `shot-hit:${hit.at}:${i}`,
        "impact",
        hit.x,
        hit.y,
        28 + p * 28,
        38 + p * 34,
        (1 - p) * (1 - p) * 0.8,
      );
      spark(g, hit.x, hit.y, p, 18);
    }
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
          p = age / 650;
        if (p >= 0 && p < 1) {
          // One textured flash at the body, fading while control stays responsive.
          const image = texture(
            `buff:${buff.id}`,
            "impact",
            a.x,
            a.y - 45,
            44 + p * 28,
            68 + p * 35,
            (1 - p) * (1 - p) * 0.65,
            0,
          );
          if (image) visibleEffects.add(`buff:${buff.id}`);
          spark(g, a.x, a.y - 45, p, 32);
        }
      }
    for (const [id, image] of entry.effects)
      if (!visibleEffects.has(id)) {
        image.destroy();
        entry.effects.delete(id);
      }
  }
  function clear(entry) {
    entry.g.clear();
    for (const shot of entry.projectiles.values()) {
      shot.sprite?.destroy();
      shot.shade?.destroy();
    }
    for (const image of entry.effects.values()) image.destroy();
    entry.effects.clear();
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
          effects: new Map(),
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
