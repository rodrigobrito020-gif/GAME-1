// Original Human Warrior animation contract. All timings are milliseconds.
export const WARRIOR_SKIN = "humano-guerreiro";
export const WARRIOR_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  special: 6,
};
export const WARRIOR_ACTIONS = {
  "corte-poderoso": { move: "humano-corte", duration: 700, impact: 350 },
  investida: { move: "humano-investida", duration: 650, impact: 400 },
  "golpe-destruidor": { move: "humano-destruidor", duration: 900, impact: 600 },
  "furia-guerreiro": { move: "humano-furia", duration: 800, impact: 300 },
};
export const WARRIOR_BASIC = {
  move: "humano-espada",
  duration: 550,
  impact: 200,
};
const hold = (sheet, col, steps) =>
  Array.from({ length: steps }, () => [sheet, col]);
export function warriorRig(original) {
  const rig = structuredClone(original);
  const sword = (counts) => ({
    sheet: "weapon",
    frames: counts.flatMap((n, col) => Array(n).fill(col)),
    impacts: [350],
    motion: { lunge: { windup: 3, reach: 8, lift: -1, tilt: 3 } },
  });
  Object.assign(rig.moves, {
    "humano-ferido": {
      frames: [...hold("special", 2, 3), ...hold("special", 0, 3)],
      impacts: [],
    },
    "humano-espada": {
      ...sword([2, 2, 2, 2, 2, 1]),
      impacts: [200],
      hit: "faisca-lamina",
    },
    "humano-corte": {
      ...sword([3, 4, 2, 2, 2, 1]),
      motion: {
        lunge: { windup: 5, reach: 11, lift: -2, tilt: 5 },
        trail: { at: [250, 470], color: "#ffe8ad" },
        shake: { at: 350, force: 0.3, ms: 100 },
      },
    },
    "humano-investida": {
      frames: [
        ...hold("special", 1, 2),
        ...hold("run1", 0, 1),
        ...hold("run1", 1, 1),
        ...hold("run1", 2, 1),
        ...hold("run1", 3, 1),
        ...hold("weapon", 0, 2),
        ...hold("weapon", 2, 2),
        ...hold("weapon", 3, 1),
        ...hold("weapon", 4, 1),
        ...hold("weapon", 5, 1),
      ],
      impacts: [400],
      motion: {
        dash: { at: [100, 380] },
        trail: { at: [100, 420], color: "#e1efff" },
        fx: [{ at: 100, id: "poeira-passo", anchor: "origin" }],
        shake: { at: 400, force: 0.25, ms: 90 },
      },
    },
    "humano-destruidor": {
      frames: [
        ...hold("special", 1, 3),
        ...hold("weapon", 1, 7),
        ...hold("weapon", 2, 2),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 2),
        ...hold("weapon", 5, 2),
      ],
      impacts: [600],
      motion: {
        jump: { at: [150, 600], height: 22 },
        trail: { at: [450, 650], color: "#ffe4a0" },
        fx: [{ at: 600, id: "poeira-passo" }],
        shake: { at: 600, force: 0.65, ms: 180 },
      },
    },
    "humano-furia": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 1, 2),
        ...hold("special", 4, 10),
        ...hold("special", 0, 2),
      ],
      impacts: [300],
      motion: {
        glow: { at: [100, 750], color: "#ffdb8a", pulse: true },
        shake: { at: 300, force: 0.25, ms: 120 },
      },
    },
  });
  rig.basic.guerreiro = {
    chain: [WARRIOR_BASIC.move],
    heavy: WARRIOR_BASIC.move,
  };
  for (const [id, action] of Object.entries(WARRIOR_ACTIONS))
    rig.skills[id] = { ...rig.skills[id], move: action.move };
  return rig;
}
