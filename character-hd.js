import { CHARACTER_ART as ART } from "/character-art.mjs";
import { locomotionPose } from "/character-locomotion.mjs";
// Higher detail display layer; native actors, hitboxes, rig and world positions
// stay authoritative. Textures are rebuilt from the original large pose art.
(() => {
  const art = new Map(),
    actors = new Map(),
    locomotion = new WeakMap(),
    scenes = new Map();
  for (const look of ["base", "training"])
    for (const sheet of [
      "idle",
      "walk",
      "run1",
      "weapon",
      "special",
      "axeheavy",
    ]) {
      const image = new Image();
      image.src = `/assets/fx/royal-warrior/hd/${look}/${sheet}.png`;
      image
        .decode()
        .then(() => art.set(`${look}:${sheet}`, image))
        .catch(() => {});
    }
  for (const sheet of ["idle", "walk", "run1", "weapon", "special"]) {
    const image = new Image();
    image.src = `/assets/fx/royal-archer/hd/base/${sheet}.png`;
    image
      .decode()
      .then(() => art.set(`archer:${sheet}`, image))
      .catch(() => {});
  }
  function cleanup(a) {
    const s = actors.get(a);
    if (s) {
      s.destroy();
      actors.delete(a);
    }
  }
  function draw(a) {
    const b = a.body,
      scene = a.root.scene;
    if (!a.root.active) {
      cleanup(a);
      return;
    }
    const elf = String(b.texture?.key).includes("elfa-arqueira");
    if (!elf && !String(b.texture?.key).includes("humano-guerreiro")) {
      cleanup(a);
      return;
    }
    const [nativeSheet, nativeRow, nativeCol] = String(b.frame?.name).split(
      ":",
    );
    if (!locomotion.has(a)) locomotion.set(a, {});
    const pose = locomotionPose(locomotion.get(a), {
      sheet: nativeSheet,
      row: Number(nativeRow),
      col: Number(nativeCol),
      cycle: a.cycle,
      action: !!(a.act || a.seat || a.dead),
      x: a.x,
      y: a.y,
      now: scene.time.now,
    });
    const { sheet, row, col } = pose,
      look = elf
        ? "archer"
        : b.texture.key.includes("peitoral-treino")
          ? "training"
          : "base",
      key = `royal-hd:${look}:${sheet}`,
      im = art.get(`${look}:${sheet}`);
    if (!im) return;
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.addImage(key, im);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < im.width / ART.frame; c++)
          tex.add(
            `${r}:${c}`,
            0,
            c * ART.frame,
            r * ART.frame,
            ART.frame,
            ART.frame,
          );
      tex.setFilter(0);
    }
    let s = actors.get(a);
    if (!s) {
      s = scene.add.image(0, 0, key, `${row}:${col}`);
      actors.set(a, s);
    }
    s.setTexture(key, `${row}:${col}`)
      .setPosition(a.x + b.x, a.y + b.y)
      .setOrigin(ART.feet[0] / ART.frame, ART.feet[1] / ART.frame)
      .setScale(
        b.scaleX / ART.nativeSampleStep,
        b.scaleY / ART.nativeSampleStep,
      )
      .setAngle(b.angle)
      .setFlipX(b.flipX)
      .setDepth(a.root.depth + 0.015)
      .setVisible(a.root.visible && b.visible && !a.hidden);
    s.setAlpha(a.pose?.alpha ?? 1);
    s.royalPose = pose;
    b.setAlpha(0);
  }
  window.__royalHD = {
    update(a) {
      const scene = a.root.scene;
      if (!scenes.has(scene)) {
        const callback = () => {
          for (const actor of actors.keys())
            if (actor.root.scene === scene) draw(actor);
        };
        scenes.set(scene, callback);
        scene.events.on("postupdate", callback);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", callback);
          scenes.delete(scene);
          for (const actor of actors.keys())
            if (actor.root.scene === scene) cleanup(actor);
        });
      }
      if (
        !actors.has(a) &&
        /humano-guerreiro|elfa-arqueira/.test(String(a.body.texture?.key))
      )
        draw(a);
    },
    capture(a) {
      const s = actors.get(a);
      if (!s) return null;
      return {
        x: a.body.x,
        y: a.body.y,
        texture: s.texture,
        frame: s.frame,
        scaleX: s.scaleX,
        scaleY: s.scaleY,
        originX: s.originX,
        originY: s.originY,
        angle: s.angle,
        flipX: s.flipX,
        pose: s.royalPose,
      };
    },
    clear() {
      for (const a of actors.keys()) cleanup(a);
    },
  };
  window.addEventListener("royal-skill-scene-reset", () =>
    window.__royalHD.clear(),
  );
})();
