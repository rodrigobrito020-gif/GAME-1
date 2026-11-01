// The transformation is a temporary effect over the approved character, never
// an inventory/skin replacement. Weapon light follows the actual atlas frame.
(() => {
  const states = new Map(),
    scenes = new Map(),
    artwork = new Map();
  for (const name of ["aura", "ativacao"]) {
    const img = new Image();
    img.src = `/assets/fx/royal-warrior/guerreiro-avatar-${name}.png`;
    img
      .decode()
      .then(() => artwork.set(name, img))
      .catch(() => {});
  }
  function remove(actor) {
    const state = states.get(actor);
    if (!state) return;
    for (const sprite of state.sprites) sprite.destroy();
    states.delete(actor);
  }
  function clear() {
    for (const actor of states.keys()) remove(actor);
  }
  function maskPixels(pixels, w, h) {
    const blue = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4,
          [r, g, b, a] = pixels.subarray(p, p + 4);
        if (a > 80 && b > r + 12 && b > g + 2) blue.push([x, y]);
      }
    // Both the cold steel blade and blue shield crest seed their nearby trim.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4,
          [r, g, b, a] = pixels.subarray(p, p + 4);
        const near = blue.some(
          ([bx, by]) => Math.abs(x - bx) <= 4 && Math.abs(y - by) <= 4,
        );
        const metal =
          b > r + 9 ||
          (b >= r - 5 && g >= r - 10 && r > 145) ||
          (b < 105 && r > 170 && g > 115 && g - b > 45);
        if (!a || !near || !metal) {
          pixels[p + 3] = 0;
          continue;
        }
        pixels[p] = 255;
        pixels[p + 1] = 231;
        pixels[p + 2] = 143;
        pixels[p + 3] = Math.round(a * 0.9);
      }
  }
  window.__royalAvatarMask = maskPixels;
  function weaponTexture(actor) {
    const body = actor.body,
      scene = actor.root.scene,
      frame = body.frame;
    if (!frame?.source?.image) return null;
    const key = `royal-avatar-weapons:${body.texture.key}:${frame.name}`;
    if (scene.textures.exists(key)) return key;
    const w = frame.cutWidth,
      h = frame.cutHeight;
    if (!w || !h || w > 512 || h > 512) return null;
    const tex = scene.textures.createCanvas(key, w, h),
      ctx = tex.getContext();
    ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h),
      pixels = image.data;
    maskPixels(pixels, w, h);
    ctx.putImageData(image, 0, 0);
    tex.refresh();
    return key;
  }
  function draw(actor) {
    const state = states.get(actor),
      now = performance.now();
    if (!state) return;
    if (!actor.root.active || !actor.alive || now >= state.until) {
      remove(actor);
      return;
    }
    const scene = actor.root.scene,
      body = actor.body;
    if (!artwork.has("aura") || !artwork.has("ativacao")) return;
    for (const [name, img] of artwork)
      if (!scene.textures.exists(`royal-avatar-${name}`))
        scene.textures.addImage(`royal-avatar-${name}`, img);
    if (!state.sprites.length) {
      state.sprites.push(
        scene.add.image(0, 0, "royal-avatar-aura").setOrigin(0.5, 0.9),
      );
      state.sprites.push(
        scene.add
          .image(0, 0, body.texture.key, body.frame.name)
          .setBlendMode(1),
      );
      state.sprites.push(
        scene.add.image(0, 0, "royal-avatar-ativacao").setOrigin(0.5, 0.65),
      );
    }
    const [aura, weapons, corona] = state.sprites,
      age = now - state.started;
    const x = actor.x + body.x,
      y = actor.y + body.y,
      cam = scene.cameras.main;
    const canvas = scene.game.canvas.getBoundingClientRect(),
      css = canvas.width / scene.scale.width;
    const size = Math.max(actor.height * 1.4, 90 / (cam.zoom * css));
    const fade = Math.min(1, age / 180, (state.until - now) / 350),
      visible = !actor.hidden && actor.root.visible && body.visible;
    aura
      .setPosition(x, y + 4)
      .setDisplaySize(size * 0.85, size)
      .setDepth(actor.root.depth - 0.2)
      .setTint(0xffd371)
      .setAlpha((0.67 + 0.08 * Math.sin(age / 270)) * fade)
      .setVisible(visible);
    const key = weaponTexture(actor);
    if (key)
      weapons
        .setTexture(key)
        .setPosition(x, y)
        .setOrigin(body.originX, body.originY)
        .setScale(body.scaleX, body.scaleY)
        .setAngle(body.angle)
        .setFlipX(body.flipX)
        .setDepth(actor.root.depth + 0.05)
        .setAlpha((0.8 + 0.15 * Math.sin(age / 180)) * fade)
        .setVisible(visible);
    else weapons.setVisible(false);
    const cast = Math.min(1, age / 650);
    corona
      .setPosition(actor.x, actor.y)
      .setDisplaySize(size * (0.65 + cast * 0.45), size * (0.65 + cast * 0.45))
      .setDepth(actor.root.depth - 0.1)
      .setAlpha((1 - cast) * 0.9)
      .setVisible(visible && cast < 1);
  }
  window.__royalAvatarVisuals = {
    apply(actor, durationMs, removed) {
      if (!actor) return;
      if (removed || durationMs <= 0) {
        remove(actor);
        return;
      }
      const now = performance.now();
      const state = states.get(actor);
      if (state) state.until = now + durationMs;
      else
        states.set(actor, {
          started: now,
          until: now + durationMs,
          sprites: [],
        });
    },
    update(actor) {
      const scene = actor.root.scene;
      if (scenes.has(scene)) return;
      const callback = () => {
        for (const a of states.keys()) if (a.root.scene === scene) draw(a);
      };
      scenes.set(scene, callback);
      scene.events.on("postupdate", callback);
      scene.events.once("shutdown", () => {
        scene.events.off("postupdate", callback);
        scenes.delete(scene);
        for (const a of states.keys()) if (a.root.scene === scene) remove(a);
      });
    },
    clear,
  };
  window.addEventListener("royal-skill-scene-reset", clear);
  setInterval(() => {
    for (const [actor, state] of states)
      if (
        !actor.root.active ||
        !actor.alive ||
        performance.now() >= state.until
      )
        remove(actor);
  }, 150);
})();
