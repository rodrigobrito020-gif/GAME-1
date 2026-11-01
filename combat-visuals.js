(() => {
  let state = null,
    at = 0;
  const scenes = new Map(),
    bursts = [];
  let previous = new Map();
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    at = performance.now();
    const next = new Map((state.monsterCasts ?? []).map((c) => [c.id, c]));
    for (const [id, c] of previous)
      if (!next.has(id) && c.remainingMs < 250)
        bursts.push({ ...c, at: performance.now() });
    previous = next;
  });
  function draw(scene, g) {
    g.clear();
    if (!state?.inHunt) return;
    const elapsed = performance.now() - at;
    for (const c of state.monsterCasts ?? []) {
      const progress = Math.max(
          0,
          Math.min(1, 1 - (c.remainingMs - elapsed) / c.durationMs),
        ),
        color =
          c.type === "meteor"
            ? 0xb077ff
            : c.type === "arrow"
              ? 0xf8c871
              : 0xef7958;
      if (c.type === "arrow") {
        const release = c.windupMs / c.durationMs;
        if (progress < release) {
          g.lineStyle(2, color, 0.8);
          g.beginPath();
          g.moveTo(c.x, c.y);
          g.lineTo(c.tx, c.ty);
          g.strokePath();
          g.lineStyle(2, color, 0.9);
          g.strokeCircle(c.tx, c.ty, 25);
        } else {
          const t = (progress - release) / (1 - release),
            x = c.x + (c.tx - c.x) * t,
            y = c.y + (c.ty - c.y) * t,
            angle = Math.atan2(c.ty - c.y, c.tx - c.x);
          g.lineStyle(5, 0x4c2f12, 1);
          g.lineBetween(
            x,
            y,
            x - Math.cos(angle) * 35,
            y - Math.sin(angle) * 35,
          );
          g.lineStyle(2, 0xffe9ac, 1);
          g.lineBetween(
            x,
            y,
            x - Math.cos(angle) * 35,
            y - Math.sin(angle) * 35,
          );
          g.fillStyle(0xffe6a0, 1);
          g.fillTriangle(
            x + Math.cos(angle) * 8,
            y + Math.sin(angle) * 8,
            x - Math.cos(angle + 0.8) * 12,
            y - Math.sin(angle + 0.8) * 12,
            x - Math.cos(angle - 0.8) * 12,
            y - Math.sin(angle - 0.8) * 12,
          );
        }
      } else {
        g.fillStyle(color, 0.1 + 0.08 * progress);
        g.fillCircle(c.tx, c.ty, c.radius);
        g.lineStyle(3, color, 0.8);
        g.strokeCircle(c.tx, c.ty, c.radius);
        g.lineStyle(4, color, 0.9);
        g.beginPath();
        g.arc(
          c.tx,
          c.ty,
          c.radius - 6,
          -Math.PI / 2,
          -Math.PI / 2 + progress * Math.PI * 2,
        );
        g.strokePath();
        if (c.type === "meteor") {
          g.fillStyle(0xf5b8ff, 0.9);
          g.fillCircle(c.tx, c.ty - 145 * (1 - progress), 6 + progress * 9);
        }
      }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const c = bursts[i],
        p = (performance.now() - c.at) / 420;
      if (p >= 1) {
        bursts.splice(i, 1);
        continue;
      }
      g.lineStyle(5, c.type === "meteor" ? 0xc68eff : 0xf8c871, 1 - p);
      g.strokeCircle(c.tx, c.ty, 10 + p * (c.radius || 30));
    }
  }
  window.__royalCombatVisuals = {
    update(a) {
      const scene = a.root.scene;
      if (scenes.has(scene)) return;
      const g = scene.add.graphics().setDepth(900000);
      const cb = () => draw(scene, g);
      scenes.set(scene, g);
      scene.events.on("postupdate", cb);
      scene.events.once("shutdown", () => {
        scene.events.off("postupdate", cb);
        g.destroy();
        scenes.delete(scene);
      });
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    previous.clear();
    bursts.length = 0;
    for (const g of scenes.values()) g.clear();
  });
})();
