// A short celebration of authoritative levelUp events. No XP polling, screen
// flash or character animation lock; effects follow the actor's world position.
(() => {
  const active = new Map(),
    scenes = new Map();
  const duration = 2200,
    art = new Map();
  let serial = 0;
  for (const name of ["ring", "helix", "arrow", "spark"]) {
    const im = new Image();
    im.src = `/assets/fx/royal-level-up/${name}.png`;
    im.decode()
      .then(() => art.set(name, im))
      .catch(() => {});
  }
  function pieces(s) {
    if (s.pieces.length || art.size < 4) return;
    const scene = s.scene;
    for (const [name, im] of art) {
      if (name === "ring") continue;
      const key = `royal-level:${s.palette}:${name}`;
      if (!scene.textures.exists(key)) {
        if (!s.hue) scene.textures.addImage(key, im);
        else {
          const tex = scene.textures.createCanvas(key, im.width, im.height),
            ctx = tex.getContext();
          ctx.filter = `hue-rotate(${s.hue}deg)`;
          ctx.drawImage(im, 0, 0);
          tex.refresh();
        }
      }
    }
    s.ringKey = "royal-level-ring:" + ++serial;
    s.ringTex = scene.textures.createCanvas(s.ringKey, 512, 512);
    s.ctx = s.ringTex.getContext();
    s.ringBack = scene.add.image(0, 0, s.ringKey).setCrop(0, 0, 512, 256);
    s.ringFront = scene.add.image(0, 0, s.ringKey).setCrop(0, 256, 512, 256);
    s.beams = [0, 1].map(() =>
      scene.add
        .image(0, 0, `royal-level:${s.palette}:helix`)
        .setOrigin(0.5, 0.94),
    );
    s.arrows = [0, 1, 2].map(() =>
      scene.add.image(0, 0, `royal-level:${s.palette}:arrow`),
    );
    s.stars = Array.from({ length: 8 }, () =>
      scene.add.image(0, 0, `royal-level:${s.palette}:spark`),
    );
    s.pieces = [s.ringBack, s.ringFront, ...s.beams, ...s.arrows, ...s.stars];
    for (const im of s.pieces) im.royalLevelUp = true;
  }
  function remove(actor) {
    const s = active.get(actor);
    if (!s) return;
    for (const object of [s.ground, s.back, s.front, s.title, s.level])
      object.destroy();
    for (const object of s.pieces) object.destroy();
    if (s.ringKey && s.scene.textures.exists(s.ringKey))
      s.scene.textures.remove(s.ringKey);
    active.delete(actor);
  }
  function draw(actor, s) {
    const age = performance.now() - s.at;
    if (!actor.root.active || !actor.alive || actor.dead || age >= duration) {
      remove(actor);
      return;
    }
    const p = age / duration,
      enter = Math.min(1, age / 220),
      fade = Math.min(enter, (duration - age) / 650),
      visible = actor.root.visible && !actor.hidden,
      height = Math.max(85, actor.height),
      depth = actor.root.depth,
      gold = s.gold,
      white = s.white,
      phase = age / 400,
      radius = height * 0.6 * (0.35 + 0.65 * (1 - Math.exp(-age / 150)));
    for (const g of [s.ground, s.back, s.front])
      g.clear().setPosition(actor.x, actor.y).setVisible(visible);
    s.ground.setDepth(depth - 0.05);
    s.back.setDepth(depth + 0.005);
    s.front.setDepth(depth + 0.09);
    pieces(s);
    if (s.ringTex) {
      if (age - s.lastRing > 40) {
        const c = s.ctx;
        c.clearRect(0, 0, 512, 512);
        c.save();
        c.translate(256, 256);
        c.rotate(age * 0.0012);
        c.filter = `hue-rotate(${s.hue}deg)`;
        c.drawImage(art.get("ring"), -256, -256, 512, 512);
        c.restore();
        s.ringTex.refresh();
        s.lastRing = age;
      }
      for (const [im, d] of [
        [s.ringBack, depth - 0.04],
        [s.ringFront, depth + 0.085],
      ])
        im.setPosition(actor.x, actor.y)
          .setDisplaySize(radius * 2.4, radius * 0.85)
          .setDepth(d)
          .setAlpha(fade * 0.95)
          .setVisible(visible);
      for (const [i, im] of s.beams.entries())
        im.setPosition(actor.x + Math.sin(phase + i * Math.PI) * 5, actor.y + 3)
          .setDisplaySize(
            height * (i ? 0.78 : 1.06),
            height * (1.85 + 0.04 * Math.sin(phase)),
          )
          .setFlipX(!!i)
          .setDepth(i ? depth + 0.065 : depth + 0.004)
          .setAlpha(fade * (i ? 0.26 : 0.88))
          .setVisible(visible);
      for (const [i, im] of s.arrows.entries()) {
        const t = (age / 1000 + i * 0.3) % 1,
          size = (35 - i * 5) * (0.88 + 0.12 * enter);
        im.setPosition(actor.x, actor.y - height * (1.18 + t * 0.75))
          .setDisplaySize(size, size * 0.77)
          .setAlpha(Math.sin(t * Math.PI) * fade)
          .setDepth(depth + 0.12)
          .setVisible(visible);
      }
      for (const [i, im] of s.stars.entries()) {
        const t = (age / 1500 + i * 0.137) % 1,
          theta = i * 2.399 + phase * 0.2,
          life = Math.sin(t * Math.PI),
          size = (i % 3 ? 9 : 17) * life;
        im.setPosition(
          actor.x + Math.sin(theta) * radius * (0.5 + t * 0.25),
          actor.y - t * height * 1.8,
        )
          .setDisplaySize(size, size)
          .setAngle(age * 0.035 + i * 45)
          .setAlpha(life * fade)
          .setDepth(i % 2 ? depth + 0.1 : depth + 0.002)
          .setVisible(visible);
      }
    }
    // Arcane seal and branching energy spread along the floor plane.
    s.ground
      .lineStyle(1.2, white, fade * 0.8)
      .strokeEllipse(0, 0, radius * 1.35, radius * 0.43);
    for (let layer = 0; layer < 2; layer++) {
      const turn = phase * 0.16 + layer * Math.PI;
      s.ground.lineStyle(1, gold, fade * 0.8).beginPath();
      for (let k = 0; k <= 3; k++) {
        const a = turn + (k * Math.PI * 2) / 3;
        const x = Math.cos(a) * radius * 0.62,
          y = Math.sin(a) * radius * 0.2;
        k ? s.ground.lineTo(x, y) : s.ground.moveTo(x, y);
      }
      s.ground.strokePath();
    }
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 + phase * 0.12,
        pulse = (age / 800 + i * 0.163) % 1,
        a = Math.sin(pulse * Math.PI) * fade,
        r = radius * (0.7 + pulse * 0.45);
      s.ground.lineStyle(1.1, white, a * 0.7).beginPath();
      for (let n = 0; n < 5; n++) {
        const rr = r * (0.8 + n * 0.12),
          aa = angle + Math.sin(i * 9 + n * 4 + phase) * 0.06,
          x = Math.cos(aa) * rr,
          y = Math.sin(aa) * rr * 0.34;
        n ? s.ground.lineTo(x, y) : s.ground.moveTo(x, y);
      }
      s.ground.strokePath();
    }
    // Volumetric helix: each segment switches depth as it passes the figure.
    for (let strand = 0; strand < 3; strand++)
      for (let n = 0; n < 32; n++) {
        const u = n / 32,
          v = (n + 1) / 32,
          theta = u * Math.PI * 4 - phase * 1.1 + (strand * Math.PI * 2) / 3,
          next = v * Math.PI * 4 - phase * 1.1 + (strand * Math.PI * 2) / 3,
          r = radius * (0.42 - 0.18 * u),
          g = Math.cos(theta) > 0 ? s.front : s.back,
          x = Math.sin(theta) * r,
          y = -u * height * 1.72,
          xx = Math.sin(next) * r,
          yy = -v * height * 1.72,
          a = fade * Math.sin(u * Math.PI) * 0.8;
        g.lineStyle(7, gold, a * 0.1).lineBetween(x, y, xx, yy);
        g.lineStyle(2.6, gold, a * 0.7).lineBetween(x, y, xx, yy);
        g.lineStyle(0.9, white, a).lineBetween(x, y, xx, yy);
      }
    for (let i = 0; i < 36; i++) {
      const t = (p * 1.6 + i * 0.137) % 1,
        x = Math.sin(i * 12.989 + phase * 0.2) * radius * 0.8,
        y = -t * height * 1.8,
        a = Math.sin(t * Math.PI) * fade,
        g = i % 2 ? s.front : s.back;
      g.fillStyle(i % 3 ? gold : white, a).fillCircle(
        x,
        y,
        i % 4 === 0 ? 1.8 : 0.9,
      );
    }
    const labelY = actor.y - height * 2.05 - Math.min(1, age / 1000) * 5,
      labelAlpha =
        Math.min(1, Math.max(0, (age - 180) / 200)) *
        Math.min(1, (duration - age) / 650);
    s.title
      .setPosition(actor.x, labelY)
      .setScale(0.9 + 0.1 * enter)
      .setAlpha(labelAlpha)
      .setDepth(depth + 0.2)
      .setVisible(visible);
    s.level
      .setPosition(actor.x, labelY + 18)
      .setAlpha(labelAlpha)
      .setDepth(depth + 0.2)
      .setVisible(visible);
    s.front.royalLevelUpAge = age;
  }
  function watch(scene) {
    if (scenes.has(scene)) return;
    const callback = () => {
      for (const [a, s] of active) if (s.scene === scene) draw(a, s);
    };
    scenes.set(scene, callback);
    scene.events.on("postupdate", callback);
    scene.events.once("shutdown", () => {
      scene.events.off("postupdate", callback);
      for (const [a, s] of active) if (s.scene === scene) remove(a);
      scenes.delete(scene);
    });
  }
  function theme(actor) {
    const key = String(actor.body?.texture?.key ?? "");
    if (key.includes("orc-berserker"))
      return {
        palette: "berserker",
        hue: 330,
        gold: 0xff5449,
        white: 0xffe3bb,
      };
    if (key.includes("elfa-arqueira"))
      return { palette: "archer", hue: 80, gold: 0x9bff5f, white: 0xf3ffcf };
    if (key.includes("dark-elf-pistoleira"))
      return {
        palette: "gunslinger",
        hue: 235,
        gold: 0xce8aff,
        white: 0xffe4ff,
      };
    return { palette: "warrior", hue: 0, gold: 0xffb62b, white: 0xfff2bd };
  }
  window.__royalLevelUp = {
    ready() {
      return art.size === 4;
    },
    apply(actor, level, sound) {
      if (
        !actor?.root?.active ||
        !actor.alive ||
        !Number.isInteger(level) ||
        level < 2 ||
        level > 300
      )
        return false;
      let s = active.get(actor);
      if (s && performance.now() - s.at >= duration) {
        remove(actor);
        s = null;
      }
      if (s) {
        s.value = Math.max(s.value, level);
        s.level.setText("NÍVEL " + s.value);
        return true;
      }
      const scene = actor.root.scene,
        style = {
          fontFamily: "Georgia, serif",
          fontStyle: "bold",
          fontSize: "18px",
          color: "#fff3cd",
          stroke: "#694118",
          strokeThickness: 4,
          shadow: {
            offsetX: 0,
            offsetY: 1,
            color: "#301d10",
            blur: 4,
            fill: true,
          },
        };
      s = {
        scene,
        at: performance.now(),
        value: level,
        ...theme(actor),
        pieces: [],
        lastRing: -Infinity,
        ground: scene.add.graphics(),
        back: scene.add.graphics(),
        front: scene.add.graphics(),
        title: scene.add.text(0, 0, "LEVEL UP!", style).setOrigin(0.5),
        level: scene.add
          .text(0, 0, "NÍVEL " + level, {
            ...style,
            fontFamily: "Trebuchet MS, sans-serif",
            fontSize: "12px",
            strokeThickness: 3,
          })
          .setOrigin(0.5),
      };
      for (const o of [s.ground, s.back, s.front, s.title, s.level])
        o.royalLevelUp = true;
      active.set(actor, s);
      watch(scene);
      draw(actor, s);
      if (typeof sound === "function") sound();
      return true;
    },
    clear() {
      for (const a of active.keys()) remove(a);
    },
  };
  window.addEventListener("royal-skill-scene-reset", () =>
    window.__royalLevelUp.clear(),
  );
})();
