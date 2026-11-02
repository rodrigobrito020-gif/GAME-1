// Existing captured recordings, played through the native combat bus: its
// volume slider, global mute, unlock gesture, compressor and voice cap apply.
(() => {
  const files = [
    "golpe-leve-1",
    "golpe-leve-2",
    "golpe-pesado-1",
    "corte-poderoso",
    "investida",
    "golpe-destruidor",
    "furia",
    "impacto-corte",
    "impacto-destruidor",
    "disparo-1",
    "disparo-2",
    "disparo-pesado-1",
    "bola-de-fogo",
    "impacto-fogo",
    "impacto-magico-1",
    "impacto-magico-critico",
    "sobrecarga-arcana",
    "disparo-arco-1",
    "disparo-arco-2",
    "disparo-arco-3",
    "esquiva-1",
    "esquiva-2",
  ];
  const path = (name) => `/assets/audio/local-combate/${name}.ogg`,
    timers = new Set();
  let turn = 0,
    initialized = false;
  const stats = { scheduled: 0, played: 0, hits: 0, casts: 0 };
  function setup() {
    const b = window.__royalAudioBridge;
    if (!b) return false;
    if (!initialized) {
      b.defaults();
      b.load(files.map(path));
      initialized = true;
    }
    return true;
  }
  const poll = setInterval(() => {
    if (setup()) clearInterval(poll);
  }, 150);
  function play(name, delay = 0, gain = 1) {
    stats.scheduled++;
    const id = setTimeout(() => {
      timers.delete(id);
      if (!setup() || !window.__royalUltimateState?.inHunt) return;
      window.__royalAudioBridge.play(path(name), {
        gain,
        rate: 0.97 + (turn++ % 5) * 0.015,
        bus: "combat",
      });
      stats.played++;
    }, delay);
    timers.add(id);
  }
  window.__royalCombatAudio = {
    ready() {
      return (
        setup() && files.every((n) => window.__royalAudioBridge.has(path(n)))
      );
    },
    stats,
    events(events, own) {
      for (const m of events.moves ?? []) {
        if (m.entity !== own) continue;
        if (m.move === "dark-elf-tiros") {
          play("disparo-1", 150, 0.9);
          play("disparo-2", 350, 0.9);
        } else if (m.move === "elfa-flecha")
          play(turn % 2 ? "disparo-arco-1" : "disparo-arco-2", 250, 0.95);
        else if (m.move === "humano-espada" || m.move === "humano-retorno")
          play(turn % 2 ? "golpe-leve-1" : "golpe-leve-2", 100, 0.9);
        else if (m.move.endsWith("esquiva")) play("esquiva-1", 0, 0.7);
      }
      for (const cast of events.casts ?? []) {
        if (cast.caster !== own) continue;
        stats.casts++;
        window.dispatchEvent(
          new CustomEvent("royal-combat-cue", {
            detail: { kind: "cast", skillId: cast.skillId },
          }),
        );
        switch (cast.skillId) {
          case "disparo-sombrio":
            play("disparo-pesado-1", 150, 1);
            play("bola-de-fogo", 150, 0.45);
            break;
          case "rajada-do-crepusculo":
            play("disparo-1", 150, 0.8);
            play("disparo-2", 350, 0.8);
            for (const t of [700, 1200, 1700])
              play("impacto-magico-1", t, 0.55);
            break;
          case "tiro-perfurante":
            play("disparo-arco-3", 300, 1);
            break;
          case "chuva-de-flechas":
            play("disparo-arco-2", 350, 0.9);
            for (const t of [600, 1150, 1700]) play("impacto-corte", t, 0.45);
            break;
          case "avanco-de-luz":
            play("investida", 50, 0.9);
            break;
          case "impacto-de-luz":
            play("golpe-destruidor", 100, 0.8);
            play("impacto-destruidor", 550, 0.8);
            break;
          case "eclipse":
          case "espirito-da-floresta":
          case "avatar-da-luz":
            play("sobrecarga-arcana", 0, 0.55);
            play("furia", 300, 0.5);
            break;
          case "egide-de-luz":
          case "olhos-da-floresta":
          case "instinto-noturno":
            play("furia", 100, 0.55);
            break;
        }
      }
    },
    hit(damage) {
      if (damage.dot) return;
      stats.hits++;
      const cls = window.__royalUltimateState?.classId;
      play(
        damage.critical
          ? "impacto-magico-critico"
          : cls === "guerreiro"
            ? "impacto-corte"
            : "impacto-magico-1",
        0,
        damage.critical ? 0.7 : 0.45,
      );
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  });
})();
