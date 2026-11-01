export const ARCHER_CLASS = "arqueira",
  ARCHER_SKIN = "elfa-arqueira";
export const ARCHER_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  special: 6,
};
export const ARCHER_SPIRIT = {
  id: "espirito-da-floresta",
  name: "Espírito da Floresta",
  durationMs: 45000,
  cooldownMs: 60000,
  maxCharge: 100,
  damageReduction: 0.15,
  cleaveRadius: 0,
  castMs: 650,
  applyAtMs: 300,
};
export const ARCHER_EYES = {
  id: "olhos-da-floresta",
  name: "Olhos da Floresta",
  durationMs: 300000,
  cooldownMs: 120000,
  manaCost: 10,
  attackPercent: 0.2,
  castMs: 600,
  applyAtMs: 300,
};
export const ARCHER_SKILLS = [
  {
    id: "tiro-perfurante",
    name: "Tiro Perfurante",
    key: "1",
    kind: "damage",
    manaCost: 8,
    cooldownMs: 5000,
    range: 420,
    multiplier: 2,
    description:
      "Dispara uma flecha que atravessa os inimigos alinhados, causando 200% do ataque em cada alvo atingido.",
    icon: "/assets/ui/royal-archer/tiro-perfurante.png",
  },
  {
    id: "chuva-de-flechas",
    name: "Chuva de Flechas",
    key: "2",
    kind: "area",
    manaCost: 15,
    cooldownMs: 8000,
    range: 440,
    radius: 145,
    multiplier: 0.7,
    description:
      "Faz chover flechas na área do alvo, causando três impactos de 70% do ataque ao longo de 1,7 segundo. A área continua mesmo se o primeiro alvo morrer.",
    icon: "/assets/ui/royal-archer/chuva-de-flechas.png",
  },
  {
    id: ARCHER_EYES.id,
    name: ARCHER_EYES.name,
    key: "3",
    kind: "buff",
    manaCost: ARCHER_EYES.manaCost,
    cooldownMs: ARCHER_EYES.cooldownMs,
    durationMs: ARCHER_EYES.durationMs,
    range: 0,
    description:
      "Recebe a visão da floresta: aumenta o próprio ataque em 20% por 5 minutos, sem acumular bônus em reaplicações.",
    icon: "/assets/ui/royal-archer/olhos-da-floresta.png",
  },
  {
    id: ARCHER_SPIRIT.id,
    name: ARCHER_SPIRIT.name,
    key: "4",
    kind: "buff",
    manaCost: 0,
    cooldownMs: ARCHER_SPIRIT.cooldownMs,
    durationMs: ARCHER_SPIRIT.durationMs,
    range: 0,
    description:
      "Ultimate: usa 100 de energia. Por 45 segundos, aumenta o ataque em 35%, acelera os disparos e reduz o dano recebido em 15%. A recarga é de 60 segundos e a energia precisa ser obtida novamente em combate.",
    icon: "/assets/ui/royal-archer/espirito-da-floresta.png",
  },
];
export const isArcher = (c) => c.identity?.classId === ARCHER_CLASS;
const hold = (sheet, col, n) => Array.from({ length: n }, () => [sheet, col]);
export function archerRig(original) {
  const rig = structuredClone(original);
  Object.assign(rig.moves, {
    "elfa-flecha": {
      frames: [
        ...hold("weapon", 1, 2),
        ...hold("weapon", 2, 3),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 2),
        ...hold("weapon", 5, 1),
      ],
      impacts: [250],
    },
    "elfa-perfurante": {
      frames: [
        ...hold("weapon", 1, 2),
        ...hold("weapon", 2, 4),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 2),
        ...hold("weapon", 5, 1),
      ],
      impacts: [300],
    },
    "elfa-chuva": {
      frames: [
        ...hold("weapon", 1, 2),
        ...hold("weapon", 2, 4),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 3),
        ...hold("weapon", 5, 2),
      ],
      impacts: [600],
    },
    "elfa-bencao": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 4, 8),
        ...hold("special", 0, 2),
      ],
      impacts: [300],
    },
    "elfa-espirito": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 4, 9),
        ...hold("special", 0, 2),
      ],
      impacts: [300],
    },
    "elfa-ferida": {
      frames: [...hold("special", 2, 1), ...hold("special", 0, 1)],
      impacts: [],
    },
    "elfa-esquiva": {
      frames: [...hold("run1", 1, 2), ...hold("run1", 3, 2)],
      impacts: [],
      motion: { trail: { at: [0, 220], color: 0xb4ecc0 } },
    },
  });
  rig.basic[ARCHER_CLASS] = { chain: ["elfa-flecha"], heavy: "elfa-flecha" };
  for (const [id, move] of [
    ["tiro-perfurante", "elfa-perfurante"],
    ["chuva-de-flechas", "elfa-chuva"],
    [ARCHER_EYES.id, "elfa-bencao"],
    [ARCHER_SPIRIT.id, "elfa-espirito"],
  ])
    rig.skills[id] = { move };
  return rig;
}
