// Orc presentation inherits the approved warrior's rig, timing and foot anchors.
export const BERSERKER_CLASS = "berserker";
export const BERSERKER_SKIN = "orc-berserker";
export const BERSERKER_SCALE = 1.3;
export const BERSERKER_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  axeheavy: 8,
  special: 6,
};
export const BERSERKER_CRY = Object.freeze({
  id: "grito-de-guerra",
  name: "Grito de Guerra",
  durationMs: 30000,
  cooldownMs: 60000,
  attackSpeedPercent: 0.3,
  castMs: 600,
  applyAtMs: 300,
});
export const BERSERKER_ULTIMATE = Object.freeze({
  id: "furia-ancestral",
  name: "Fúria Ancestral",
  durationMs: 45000,
  cooldownMs: 60000,
  maxCharge: 100,
  damageReduction: 0.25,
  attackSpeedPercent: 0.5,
  cleaveRadius: 110,
  castMs: 600,
  applyAtMs: 300,
});
export const BERSERKER_ACTIONS = Object.freeze({
  "corte-selvagem": { move: "orc-corte", duration: 650, impact: 300 },
  "ruptura-da-terra": { move: "orc-ruptura", duration: 950, impact: 550 },
  "grito-de-guerra": { move: "orc-grito", duration: 600, impact: 300 },
  "furia-ancestral": { move: "orc-furia", duration: 600, impact: 300 },
});
export const BERSERKER_SKILLS = [
  {
    id: "corte-selvagem",
    name: "Corte Selvagem",
    key: "1",
    kind: "damage",
    manaCost: 8,
    cooldownMs: 5000,
    range: 105,
    multiplier: 2.2,
    description:
      "Varre um cone de 140° à frente com o machado. Causa 220% do ataque a cada inimigo atingido, uma única vez.",
    icon: "/assets/ui/royal-berserker/corte-selvagem.png",
  },
  {
    id: "ruptura-da-terra",
    name: "Ruptura da Terra",
    key: "2",
    kind: "area",
    manaCost: 12,
    cooldownMs: 8000,
    range: 80,
    radius: 150,
    multiplier: 2.5,
    description:
      "Ergue o machado com as duas mãos, salta e golpeia o chão. A aterrissagem causa 250% do ataque aos inimigos num raio de 150.",
    icon: "/assets/ui/royal-berserker/ruptura-da-terra.png",
  },
  {
    id: BERSERKER_CRY.id,
    name: BERSERKER_CRY.name,
    key: "3",
    kind: "buff",
    manaCost: 10,
    cooldownMs: BERSERKER_CRY.cooldownMs,
    range: 0,
    durationMs: BERSERKER_CRY.durationMs,
    description:
      "Um rugido aumenta a velocidade de ataque do próprio Orc em 30% por 30s. Recarga de 60s.",
    icon: "/assets/ui/royal-berserker/grito-de-guerra.png",
  },
  {
    id: BERSERKER_ULTIMATE.id,
    name: BERSERKER_ULTIMATE.name,
    key: "4",
    kind: "buff",
    manaCost: 0,
    cooldownMs: BERSERKER_ULTIMATE.cooldownMs,
    range: 0,
    durationMs: BERSERKER_ULTIMATE.durationMs,
    description:
      "Consome 100 de energia. Transforma o Orc por 45s: velocidade de ataque +50%, dano recebido -25% e golpes básicos em área. Intervalo mínimo de 60s.",
    icon: "/assets/ui/royal-berserker/furia-ancestral.png",
  },
];
export const isBerserker = (c) => c.identity?.classId === BERSERKER_CLASS;
const hold = (sheet, col, n) => Array.from({ length: n }, () => [sheet, col]);
export function berserkerRig(original) {
  const rig = structuredClone(original);
  for (const [dest, source] of [
    ["orc-machado", "humano-espada"],
    ["orc-retorno", "humano-retorno"],
    ["orc-ruptura", "humano-impacto-luz"],
    ["orc-grito", "humano-avatar-luz"],
    ["orc-furia", "humano-avatar-luz"],
    ["orc-ferido", "humano-ferido"],
    ["orc-esquiva", "humano-esquiva"],
  ]) {
    rig.moves[dest] = structuredClone(rig.moves[source]);
    delete rig.moves[dest].hit;
  }
  rig.moves["orc-corte"] = {
    frames: [
      ...hold("weapon", 0, 2),
      ...hold("weapon", 1, 2),
      ...hold("weapon", 2, 2),
      ...hold("weapon", 3, 1),
      ...hold("weapon", 4, 3),
      ...hold("weapon", 5, 3),
    ],
    impacts: [300],
    motion: { lunge: { windup: 2, reach: 10, lift: -1, tilt: 2 } },
  };
  for (const move of ["orc-grito", "orc-furia"])
    rig.moves[move].motion = {
      glow: { at: [100, 500], color: "#ff493f", pulse: false },
    };
  rig.basic[BERSERKER_CLASS] = {
    chain: ["orc-machado", "orc-retorno"],
    heavy: "orc-machado",
  };
  for (const [id, a] of Object.entries(BERSERKER_ACTIONS))
    rig.skills[id] = { move: a.move };
  return rig;
}
export function berserkerConeTargets(monsters, cone) {
  return monsters
    .filter((m) => {
      if (!(m.hp > 0)) return false;
      const dx = m.x - cone.x,
        dy = m.y - cone.y,
        d = Math.hypot(dx, dy);
      return (
        d <= cone.range &&
        (!d ||
          (dx * cone.dx + dy * cone.dy) / d >= Math.cos((70 * Math.PI) / 180))
      );
    })
    .map((m) => m.id);
}
