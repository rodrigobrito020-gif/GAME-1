// Higher detail display layer; native actors, hitboxes, rig and world positions
// stay authoritative. Textures are rebuilt from the original large pose art.
(() => {
  const art = new Map(),
    actors = new Map(),
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
    if (!String(b.texture?.key).includes("humano-guerreiro")) {
      cleanup(a);
      return;
    }
    const [sheet, row, col] = String(b.frame?.name).split(":"),
      look = b.texture.key.includes("peitoral-treino") ? "training" : "base",
      key = `royal-hd:${look}:${sheet}`,
      im = art.get(`${look}:${sheet}`);
    if (!im) return;
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.addImage(key, im);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < im.width / 128; c++)
          tex.add(`${r}:${c}`, 0, c * 128, r * 128, 128, 128);
      tex.setFilter(0);
    }
    let s = actors.get(a);
    if (!s) {
      s = scene.add.image(0, 0, key, `${row}:${col}`);
      actors.set(a, s);
    }
    s.setTexture(key, `${row}:${col}`)
      .setPosition(a.x + b.x, a.y + b.y)
      .setOrigin(b.originX, b.originY)
      .setScale(b.scaleX / 2, b.scaleY / 2)
      .setAngle(b.angle)
      .setFlipX(b.flipX)
      .setDepth(a.root.depth + 0.015)
      .setVisible(a.root.visible && b.visible && !a.hidden);
    s.setAlpha(a.pose?.alpha ?? 1);
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
        String(a.body.texture?.key).includes("humano-guerreiro")
      )
        draw(a);
    },
    clear() {
      for (const a of actors.keys()) cleanup(a);
    },
  };
  window.addEventListener("royal-skill-scene-reset", () =>
    window.__royalHD.clear(),
  );
})();
