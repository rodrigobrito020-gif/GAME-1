// Replaces only the player's damage labels on monsters. The native hit event
// remains authoritative, so criticals, kills and area hits get their own number.
(() => {
  const scenes = new Map();
  let impactArt = null;
  const art = new Image();
  art.src = "/assets/fx/royal-gunslinger/soulshot.png";
  art
    .decode()
    .then(() => (impactArt = art))
    .catch(() => {});
  function destroy(entry) {
    entry.text.destroy();
    entry.flash?.destroy();
  }
  function clear(s) {
    for (const entry of s.entries) destroy(entry);
    s.entries = [];
    s.lanes.clear();
  }
  function sceneState(scene) {
    let s = scenes.get(scene);
    if (s) return s;
    s = { entries: [], lanes: new Map() };
    scenes.set(scene, s);
    const draw = () => {
      const now = performance.now();
      s.entries = s.entries.filter((e) => {
        const age = now - e.at,
          p = age / e.duration;
        if (p >= 1) {
          destroy(e);
          return false;
        }
        const pop = 1 + 0.2 * Math.max(0, 1 - age / 110);
        e.text
          .setPosition(e.x + e.lane * p * 8, e.y - 42 * p)
          .setScale(pop)
          .setAlpha(Math.min(1, (1 - p) / 0.3));
        if (e.flash) {
          const t = age / e.flashDuration;
          if (t >= 1) {
            e.flash.destroy();
            e.flash = null;
          } else {
            const a = e.actor?.root?.active ? e.actor : null;
            e.flash
              .setPosition(a?.x ?? e.fx, a ? a.y - a.height * 0.5 : e.fy)
              .setDisplaySize(
                e.size * (0.65 + 0.35 * t),
                e.size * (0.65 + 0.35 * t),
              )
              .setAngle(e.turn + t * 22)
              .setAlpha(Math.pow(1 - t, 1.2) * 0.95);
          }
        }
        return true;
      });
      for (const id of s.lanes.keys())
        if (!s.entries.some((e) => e.actor.id === id)) s.lanes.delete(id);
    };
    scene.events.on("postupdate", draw);
    scene.events.once("shutdown", () => {
      scene.events.off("postupdate", draw);
      clear(s);
      scenes.delete(scene);
    });
    return s;
  }
  window.__royalHitFeedback = {
    ready() {
      return !!impactArt;
    },
    apply(scene, actor, damage) {
      if (!actor?.root?.scene || !actor.root.active || !(damage.amount > 0))
        return false;
      window.__royalCombatAudio?.hit(damage);
      const s = sceneState(scene),
        dot = damage.dot,
        cls = window.__royalUltimateState?.classId,
        skillImpact =
          !!damage.skillId &&
          ["arqueira", "pistoleira"].includes(cls) &&
          !damage.dot,
        crit = damage.critical,
        lane = (s.lanes.get(actor.id) ?? 0) % 3;
      s.lanes.set(actor.id, lane + 1);
      while (s.entries.length >= 96) destroy(s.entries.shift());
      const amount = damage.amount.toLocaleString("pt-BR"),
        text = scene.add
          .text(
            actor.x,
            actor.y - actor.height - 30,
            crit ? amount + "!" : amount,
            {
              fontFamily: "Trebuchet MS, Arial, sans-serif",
              fontStyle: "bold",
              fontSize: crit ? "24px" : dot ? "16px" : "20px",
              align: "center",
              color: crit ? "#ffe098" : dot ? "#ffb865" : "#fff9e7",
              stroke: "#24152c",
              strokeThickness: 4,
              shadow: {
                offsetX: 1,
                offsetY: 2,
                color: "#130b16",
                blur: 2,
                fill: true,
                stroke: true,
              },
            },
          )
          .setOrigin(0.5, 1)
          .setDepth(1000010);
      text.royalDamage = true;
      text.royalCritical = crit;
      text.royalDot = dot;
      const x = actor.x + [0, -24, 24][lane],
        y = actor.y - actor.height - 30 - lane * 9,
        entry = {
          actor,
          text,
          x,
          y,
          lane: lane === 1 ? -1 : lane === 2 ? 1 : 0,
          at: performance.now(),
          duration: crit ? 1050 : 850,
          fx: actor.x,
          fy: actor.y - actor.height * 0.5,
          size: skillImpact ? (crit ? 114 : 96) : crit ? 104 : 82,
          turn: lane * 47,
          flashDuration: skillImpact ? 260 : crit ? 240 : 190,
        };
      if (!dot && impactArt) {
        if (!scene.textures.exists("royal-soulshot"))
          scene.textures.addImage("royal-soulshot", impactArt);
        entry.flash = scene.add
          .image(entry.fx, entry.fy, "royal-soulshot")
          .setDepth(1000002);
        if (skillImpact)
          entry.flash.setTint(
            cls === "arqueira"
              ? 0xd4ffb8
              : damage.skillId === "disparo-sombrio"
                ? 0xffd1a0
                : 0xe4c8ff,
          );
        entry.flash.royalSkillImpact = skillImpact;
        entry.flash.royalSoulshot = true;
      }
      s.entries.push(entry);
      return true;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    for (const s of scenes.values()) clear(s);
  });
})();
