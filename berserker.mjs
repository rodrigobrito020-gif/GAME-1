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
  durationMs: 60000,
  cooldownMs: 180000,
  maxCharge: 100,
  damageReduction: 0.25,
  attackPercent: 0.3,
  attackSpeedPercent: 0.5,
  healthRegenPercentPerSecond: 0.02,
  chaseSpeed: 300,
  cleaveRadius: 110,
  castMs: 600,
  applyAtMs: 300,
});
export const BERSERKER_ADVANCE = Object.freeze({
  id: "corte-selvagem",
  start: 50,
  end: 300,
  range: 300,
  minRange: 160,
  stopDistance: 66,
  hitRange: 90,
});
export const BERSERKER_ACTIONS = Object.freeze({
  "corte-selvagem": { move: "orc-avanco", duration: 550, impact: 300 },
  "ruptura-da-terra": { move: "orc-ruptura", duration: 950, impact: 550 },
  "grito-de-guerra": { move: "orc-grito", duration: 600, impact: 300 },
  "furia-ancestral": { move: "orc-furia", duration: 600, impact: 300 },
});
export const BERSERKER_SKILLS = [
  {
    id: "corte-selvagem",
    name: "Avanço Selvagem",
    key: "1",
    kind: "damage",
    manaCost: 8,
    cooldownMs: 5000,
    range: BERSERKER_ADVANCE.range,
    multiplier: 2.2,
    description:
      "Avança até um inimigo distante e golpeia com o machado na chegada, causando 220% do ataque. Alcance de 160 a 300. Respeita paredes e para antes do alvo.",
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
      "Consome 100 de energia e entra em fúria por 1 minuto: ataque +30%, velocidade de ataque +50%, regeneração de 2% da vida máxima por segundo e corrida para alcançar o alvo. Mantém dano recebido -25% e básicos em área. Recarga de 3 minutos a partir do uso.",
    icon: "/assets/ui/royal-berserker/furia-ancestral.png",
  },
];
export const isBerserker = (c) => c.identity?.classId === BERSERKER_CLASS;
const hold = (sheet, col, n) => Array.from({ length: n }, () => [sheet, col]);
export function berserkerRig(original) {
  const rig = structuredClone(original);
  for (const [dest, source] of [
    ["orc-machado", "humano-espada"],
    ["orc-avanco", "humano-avanco-luz"],
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
  rig.moves["orc-avanco"].motion.trail.color = "#ff5148";
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
