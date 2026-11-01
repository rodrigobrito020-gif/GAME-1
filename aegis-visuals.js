// Body-height protection sprites. Lifetime comes only from authoritative buffs;
// screen size stays readable as the camera zooms out. No gameplay state changes.
(() => {
  const scenes = new Map();
  const states = new Map(),
    texture = "royal-aegis-orbit-shield";
  const artwork = new Image();
  artwork.src = "/assets/fx/royal-warrior/guerreiro-egide-escudo.png";
  let ready = false;
  artwork
    .decode()
    .then(() => {
      ready = true;
    })
    .catch(() => {});
  const remove = (actor) => {
    const state = states.get(actor);
    if (!state) return;
    for (const sprite of state.sprites) sprite.destroy();
    states.delete(actor);
  };
  const clear = () => {
    for (const actor of states.keys()) remove(actor);
    for (const entry of scenes.values()) entry.ownActor = null;
  };
  const project = (actor) => {
    if (
      !actor?.root.active ||
      performance.now() >=
        Math.max(window.__royalCooldownUntil || 0, window.__royalBuffUntil || 0)
    )
      return;
    const scene = actor.root.scene,
      cam = scene.cameras.main,
      rect = scene.game.canvas.getBoundingClientRect();
    let top = actor.body.getBounds().top;
    if (actor.plate.root.visible)
      for (const child of actor.plate.root.list) {
        if (child.visible && child.getBounds) {
          const bounds = child.getBounds();
          if (bounds.width > 0 && bounds.height > 0)
            top = Math.min(top, bounds.top);
        }
      }
    const x =
      rect.left +
      ((cam.x + (actor.x + actor.body.x - cam.worldView.x) * cam.zoom) *
        rect.width) /
        scene.scale.width;
    const y =
      rect.top +
      ((cam.y + (top - cam.worldView.y) * cam.zoom) * rect.height) /
        scene.scale.height -
      16;
    window.dispatchEvent(
      new CustomEvent("royal-skill-anchor", {
        detail: {
          x,
          y,
          visible:
            actor.alive &&
            !actor.hidden &&
            actor.root.visible &&
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom,
        },
      }),
    );
  };
  const track = (actor) => {
    const scene = actor.root.scene;
    let entry = scenes.get(scene);
    if (!entry) {
      entry = { ownActor: null };
      scenes.set(scene, entry);
      const draw = () => {
        for (const active of states.keys())
          if (active.root.scene === scene) drawShields(active);
      };
      const anchor = () => project(entry.ownActor);
      scene.events.on("postupdate", draw);
      scene.game.events.on("postrender", anchor);
      scene.events.once("shutdown", () => {
        scene.events.off("postupdate", draw);
        scene.game.events.off("postrender", anchor);
        for (const active of states.keys())
          if (active.root.scene === scene) remove(active);
        scenes.delete(scene);
      });
    }
    if (actor.id === window.__royalIndicatorEntity) entry.ownActor = actor;
  };
  const drawShields = (actor) => {
    const state = states.get(actor);
    if (!state) return;
    const now = performance.now();
    if (now >= state.until || !actor.alive || !actor.root.active) {
      remove(actor);
      return;
    }
    if (!ready) return;
    const scene = actor.root.scene,
      cam = scene.cameras.main;
    if (!scene.textures.exists(texture))
      scene.textures.addImage(texture, artwork);
    if (!state.sprites.length)
      for (let i = 0; i < 3; i++)
        state.sprites.push(scene.add.image(0, 0, texture).setOrigin(0.5));
    const canvas = scene.game.canvas.getBoundingClientRect();
    const cssScale = canvas.width / scene.scale.width;
    const worldPerPixel = 1 / (cam.zoom * cssScale);
    const size = Math.max(
      38 * worldPerPixel,
      Math.min(52 * worldPerPixel, actor.height * 0.42),
    );
    const radius = Math.max(actor.height * 0.57, size * 1.2);
    const x = actor.x + actor.body.x,
      y = actor.y + actor.body.y - actor.height * 0.46;
    for (let i = 0; i < 3; i++) {
      const angle = (now / 2300) * Math.PI * 2 + (i * Math.PI * 2) / 3;
      const front = Math.sin(angle);
      state.sprites[i]
        .setPosition(x + Math.cos(angle) * radius, y + front * radius * 0.29)
        .setDisplaySize(size, size)
        .setAlpha(front < 0 ? 0.82 : 1)
        .setDepth(actor.root.depth + (front < 0 ? -0.25 : 0.25))
        .setVisible(!actor.hidden && actor.root.visible);
    }
  };
  window.__royalAegisVisuals = {
    apply(actor, durationMs, removed) {
      if (!actor) return;
      if (removed || !actor.alive || durationMs <= 0) {
        remove(actor);
        return;
      }
      const state = states.get(actor);
      if (state) state.until = performance.now() + durationMs;
      else
        states.set(actor, {
          until: performance.now() + durationMs,
          sprites: [],
        });
    },
    update(actor) {
      track(actor);
    },
    clear,
  };
  window.addEventListener("royal-skill-scene-reset", clear);
  setInterval(() => {
    for (const [actor, state] of states)
      if (
        performance.now() >= state.until ||
        !actor.root.active ||
        !actor.alive
      )
        remove(actor);
  }, 150);
})();
