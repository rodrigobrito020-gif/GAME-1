// A short celebration of authoritative levelUp events. No XP polling, screen
// flash or character animation lock; effects follow the actor's world position.
(() => {
  const active = new Map(),
    scenes = new Map();
  const duration = 2200;
  function remove(actor) {
    const s = active.get(actor);
    if (!s) return;
    for (const object of [s.ground, s.back, s.front, s.title, s.level])
      object.destroy();
    active.delete(actor);
  }
  function draw(actor, s) {
    const age = performance.now() - s.at;
    if (!actor.root.active || !actor.alive || actor.dead || age >= duration) {
      remove(actor);
      return;
    }
    const p = age / duration,
      enter = Math.min(1, age / 180),
      fade = Math.min(enter, (duration - age) / 550),
      burst = Math.sin(Math.min(1, age / 1100) * Math.PI),
      visible = actor.root.visible && !actor.hidden,
      height = Math.max(70, actor.height),
      depth = actor.root.depth,
      gold = 0xffd077,
      white = 0xfff5da;
    for (const g of [s.ground, s.back, s.front])
      g.clear().setPosition(actor.x, actor.y).setVisible(visible);
    s.ground.setDepth(depth - 0.04);
    s.back.setDepth(depth + 0.005);
    s.front.setDepth(depth + 0.09);
    // Perspective seal opens at the feet, then releases two receding rings.
    const radius = 22 + 22 * Math.min(1, age / 450);
    s.ground
      .lineStyle(8, gold, 0.1 * fade)
      .strokeEllipse(0, 0, radius * 2, radius * 0.65);
    s.ground
      .lineStyle(2, white, 0.85 * fade)
      .strokeEllipse(0, 0, radius * 2, radius * 0.65);
    s.ground
      .lineStyle(1, gold, 0.6 * fade)
      .strokeEllipse(0, 0, radius * 1.65, radius * 0.5);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 + age * 0.00025,
        x = Math.cos(a) * radius,
        y = Math.sin(a) * radius * 0.325;
      s.ground
        .lineStyle(1.5, gold, 0.7 * fade)
        .lineBetween(x * 0.85, y * 0.85, x * 1.1, y * 1.1);
    }
    // Layered narrow beams glow through the figure without obscuring its face.
    for (let i = 0; i < 7; i++) {
      const width = 6 + i * 6;
      s.back
        .fillStyle(i < 2 ? white : gold, (0.055 - i * 0.005) * burst * fade)
        .fillRect(-width / 2, -height - 48 * enter, width, height + 48 * enter);
    }
    const rise = Math.max(0, 1 - age / 1000),
      haloY = -height * 0.42 - age * 0.035;
    s.back
      .lineStyle(2, gold, rise * 0.7)
      .strokeEllipse(0, haloY, 40 + age * 0.035, 12 + age * 0.012);
    // Radiating feather-like strokes, an original nod to classic Ragnarok.
    for (const side of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const spread = enter * (24 + i * 9),
          y = -height * 0.65 - i * 6,
          baseX = side * 8,
          tipX = side * spread,
          tipY = y - 12 - i * 3 + Math.sin(age * 0.005 + i) * 2;
        s.back
          .lineStyle(8, gold, burst * 0.1 * fade)
          .lineBetween(baseX, y + 18, tipX, tipY);
        s.back
          .lineStyle(2.5, white, burst * 0.72 * fade)
          .lineBetween(baseX, y + 18, tipX, tipY);
        s.back
          .lineStyle(1, gold, burst * 0.8 * fade)
          .lineBetween(tipX, tipY, tipX - side * 7, tipY + 13);
      }
    for (let i = 0; i < 28; i++) {
      const t = (p * 1.35 + i * 0.137) % 1,
        x = Math.sin(i * 12.989 + age * 0.0008) * (18 + (i % 4) * 9),
        y = -t * (height + 50),
        a = Math.sin(t * Math.PI) * fade,
        g = i % 2 ? s.front : s.back;
      g.fillStyle(i % 3 ? gold : white, a * 0.85).fillCircle(
        x,
        y,
        i % 4 === 0 ? 1.7 : 1,
      );
      if (i % 4 === 0)
        g.lineStyle(1, white, a * 0.75)
          .lineBetween(x - 3, y, x + 3, y)
          .lineBetween(x, y - 3, x, y + 3);
    }
    const labelY = actor.y - height - 46 - Math.min(1, age / 1000) * 12,
      labelAlpha =
        Math.min(1, Math.max(0, (age - 100) / 180)) *
        Math.min(1, (duration - age) / 600);
    s.title
      .setPosition(actor.x, labelY)
      .setScale(0.9 + 0.1 * enter)
      .setAlpha(labelAlpha)
      .setDepth(depth + 0.2)
      .setVisible(visible);
    s.level
      .setPosition(actor.x, labelY + 21)
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
  window.__royalLevelUp = {
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
          fontSize: "22px",
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
        ground: scene.add.graphics(),
        back: scene.add.graphics(),
        front: scene.add.graphics(),
        title: scene.add.text(0, 0, "LEVEL UP!", style).setOrigin(0.5),
        level: scene.add
          .text(0, 0, "NÍVEL " + level, {
            ...style,
            fontFamily: "Trebuchet MS, sans-serif",
            fontSize: "13px",
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
