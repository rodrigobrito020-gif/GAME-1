// A second view of the authoritative charge, attached to the native own-player
// nameplate so movement, camera zoom, hiding and scene lifetime stay native.
(() => {
  let state = null,
    at = 0;
  const entries = new Map();
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    at = performance.now();
  });
  function dispose(scene) {
    const e = entries.get(scene);
    if (!e) return;
    e.bar.destroy();
    entries.delete(scene);
  }
  window.__royalOverheadUltimate = {
    update(actor) {
      if (actor.id !== 1 || !actor.plate?.root.active) return;
      const plate = actor.plate,
        scene = actor.root.scene;
      let e = entries.get(scene);
      if (e && e.plate !== plate) {
        dispose(scene);
        e = null;
      }
      if (!e) {
        // Reserve seven screen pixels between the name and HP; preserve all
        // native title/name layout and the HP/mana rows themselves.
        const getY = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(plate),
          "textY",
        )?.get;
        if (getY && !plate.royalUltimateSpace) {
          Object.defineProperty(plate, "textY", {
            get() {
              return getY.call(this) - 7;
            },
          });
          plate.royalUltimateSpace = true;
          plate.queueText();
        }
        const bar = scene.add.graphics();
        bar.royalOverheadUltimate = true;
        plate.root.add(bar);
        e = { plate, bar };
        entries.set(scene, e);
        scene.events.once("shutdown", () => dispose(scene));
      }
      const g = e.bar;
      g.clear();
      if (
        !state ||
        !state.alive ||
        !actor.alive ||
        actor.hidden ||
        !plate.bar ||
        actor.maxHp <= 0
      )
        return;
      const active = Math.max(0, state.activeMs - (performance.now() - at));
      const percent = active
        ? active / (state.durationMs || 45000)
        : state.charge / 100;
      const fraction = Math.max(0, Math.min(1, percent));
      const width = plate.barW;
      const color = Number.parseInt(
        (state.classVisuals?.color || "#ffe4a0").replace("#", ""),
        16,
      );
      g.fillStyle(0x100e16, 0.92).fillRect(-width / 2 - 1, -8, width + 2, 5);
      g.lineStyle(1, color, 0.55).strokeRect(
        -width / 2 - 0.5,
        -7.5,
        width + 1,
        4,
      );
      if (fraction > 0)
        g.fillStyle(color, 1).fillRect(-width / 2, -7, width * fraction, 3);
      g.royalCharge = state.charge;
      g.royalActiveMs = active;
      g.royalFraction = fraction;
      g.royalClassId = state.classId;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    for (const e of entries.values()) e.bar.clear();
  });
})();
