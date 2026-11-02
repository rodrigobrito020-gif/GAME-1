import { classVisuals } from "./class-visuals.mjs";
export const GUNSLINGER_CLASS = "pistoleira",
  GUNSLINGER_SKIN = "dark-elf-pistoleira";
export const isGunslinger = (c) => c.identity?.classId === GUNSLINGER_CLASS;
export const isRanged = (c) =>
  ["arqueira", GUNSLINGER_CLASS].includes(c.identity?.classId);
export const GUNSLINGER_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  special: 6,
  axeheavy: 8,
};
// Barrel ends measured in the authored 384px firing frames, relative to the
// common foot anchor and converted to world units (224px body = 112 units).
export const GUNSLINGER_MUZZLES = [
  [
    [-16, -91.5],
    [19, -95],
  ],
  [
    [-36.5, -97],
    [-44, -97],
  ],
  [
    [36, -97],
    [43.5, -97],
  ],
  [
    [20, -109],
    [-20.5, -109],
  ],
];
export const NIGHT_INSTINCT = {
  id: "instinto-noturno",
  name: "Instinto Noturno",
  durationMs: 300000,
  cooldownMs: 120000,
  manaCost: 10,
  critBonus: 0.25,
};
export const ECLIPSE = {
  id: "eclipse",
  name: "Eclipse",
  durationMs: 45000,
  cooldownMs: 60000,
  maxCharge: 100,
  damageReduction: 0.15,
  attackSpeedPercent: 0.75,
  cleaveRadius: 0,
  castMs: 600,
  applyAtMs: 300,
};
const icon = (id) => `/assets/ui/royal-gunslinger/${id}.png`;
export const GUNSLINGER_SKILLS = [
  {
    id: "disparo-sombrio",
    name: "Disparo Sombrio",
    key: "1",
    kind: "damage",
    manaCost: 8,
    cooldownMs: 5000,
    range: 420,
    multiplier: 2.2,
    description:
      "Concentra energia violeta em um disparo que atravessa os inimigos na trajetória, causando 220% do ataque a cada alvo atingido.",
    icon: icon("disparo-sombrio"),
  },
  {
    id: "rajada-do-crepusculo",
    name: "Rajada do Crepúsculo",
    key: "2",
    kind: "area",
    manaCost: 18,
    cooldownMs: 10000,
    range: 420,
    radius: 125,
    multiplier: 0.55,
    description:
      "Alterna as duas pistolas em seis disparos sobre a área do alvo. Cada impacto causa 55% do ataque nos inimigos dentro da área; a sequência continua se o alvo inicial morrer.",
    icon: icon("rajada-do-crepusculo"),
  },
  {
    id: NIGHT_INSTINCT.id,
    name: NIGHT_INSTINCT.name,
    key: "3",
    kind: "buff",
    manaCost: 10,
    cooldownMs: NIGHT_INSTINCT.cooldownMs,
    durationMs: NIGHT_INSTINCT.durationMs,
    range: 0,
    description:
      "Aumenta a chance de acerto crítico em 25 pontos percentuais por 5 minutos (de 5% para 30%). Críticos causam 150% do dano. Reaplicações não acumulam o bônus.",
    icon: icon(NIGHT_INSTINCT.id),
  },
  {
    id: ECLIPSE.id,
    name: ECLIPSE.name,
    key: "4",
    kind: "buff",
    manaCost: 0,
    cooldownMs: ECLIPSE.cooldownMs,
    durationMs: ECLIPSE.durationMs,
    range: 0,
    description:
      "Ultimate: consome 100 de energia. Por 45 segundos, aumenta a velocidade de ataque em 75% e reduz o dano recebido em 15%. Mantém o dano por bala e as duas pistolas alternadas. Recarga de 60 segundos; a energia é obtida novamente em combate.",
    icon: icon(ECLIPSE.id),
  },
];
export const GUNSLINGER_ACTIONS = {
  basic: { move: "dark-elf-tiros", durationMs: 500, releasesMs: [150, 350] },
  piercing: { move: "dark-elf-disparo", durationMs: 550, releasesMs: [150] },
  burst: {
    move: "dark-elf-rajada",
    durationMs: 800,
    releasesMs: [150, 250, 350, 450, 550, 650],
  },
};
const hold = (sheet, col, n) => Array.from({ length: n }, () => [sheet, col]);
export function gunslingerRig(original) {
  const rig = structuredClone(original),
    basic = [
      ...hold("weapon", 1, 1),
      ...hold("weapon", 1, 2),
      ...hold("weapon", 2, 2),
      ...hold("weapon", 3, 2),
      ...hold("weapon", 4, 2),
      ...hold("weapon", 1, 1),
    ];
  Object.assign(rig.moves, {
    "dark-elf-tiros": { frames: basic, impacts: [150, 350] },
    "dark-elf-disparo": {
      frames: [...basic.slice(0, 5), ...hold("weapon", 1, 6)],
      impacts: [150],
    },
    "dark-elf-rajada": {
      frames: [
        ...hold("axeheavy", 1, 1),
        ...hold("axeheavy", 1, 2),
        ...[2, 4, 2, 4, 2, 4].flatMap((c) => hold("axeheavy", c, 2)),
        ...hold("axeheavy", 1, 1),
      ],
      impacts: GUNSLINGER_ACTIONS.burst.releasesMs,
    },
    "dark-elf-instinto": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 4, 8),
        ...hold("special", 0, 2),
      ],
      impacts: [300],
    },
    "dark-elf-eclipse": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 4, 8),
        ...hold("special", 0, 2),
      ],
      impacts: [300],
    },
    "dark-elf-ferida": {
      frames: [
        ["special", 2],
        ["special", 0],
      ],
      impacts: [],
    },
    "dark-elf-esquiva": {
      frames: [...hold("run1", 1, 2), ...hold("run1", 3, 2)],
      impacts: [],
      motion: {
        trail: {
          at: [0, 220],
          color: classVisuals(GUNSLINGER_CLASS).trailColor,
        },
      },
    },
  });
  rig.basic[GUNSLINGER_CLASS] = {
    chain: ["dark-elf-tiros"],
    heavy: "dark-elf-tiros",
  };
  for (const [s, m] of [
    ["disparo-sombrio", "dark-elf-disparo"],
    ["rajada-do-crepusculo", "dark-elf-rajada"],
    [NIGHT_INSTINCT.id, "dark-elf-instinto"],
    [ECLIPSE.id, "dark-elf-eclipse"],
  ])
    rig.skills[s] = { move: m };
  return rig;
}

// Hold aim between volleys, while walking and city idle retain their own poses.
export function gunslingerDisplayPose(
  pose,
  { inCombat = false, action = false } = {},
) {
  return inCombat && !action && pose.sheet === "idle"
    ? { ...pose, sheet: "weapon", col: 1 }
    : pose;
}
