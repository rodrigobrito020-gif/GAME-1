// Original Human Warrior animation contract. All timings are milliseconds.
import { WALK_STRIDE } from "./warrior-walk-rig.mjs";
export const WARRIOR_SKIN = "humano-guerreiro";
export const WARRIOR_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  special: 6,
};
export const WARRIOR_ACTIONS = {
  "corte-poderoso": { move: "humano-corte", duration: 1400, impact: 700 },
  investida: { move: "humano-investida", duration: 1300, impact: 750 },
  "golpe-destruidor": {
    move: "humano-destruidor",
    duration: 1900,
    impact: 1100,
  },
  "furia-guerreiro": { move: "humano-furia", duration: 1700, impact: 700 },
};
export const WARRIOR_BASIC = {
  move: "humano-espada",
  duration: 500,
  impact: 200,
};
export const WARRIOR_RETURN = {
  move: "humano-retorno",
  duration: 500,
  impact: 200,
};
const hold = (sheet, col, steps) =>
  Array.from({ length: steps }, () => [sheet, col]);
export function warriorRig(original) {
  const rig = structuredClone(original);
  if (rig.loops) {
    rig.loops.walk = { ...rig.loops.walk, stride: WALK_STRIDE, fps: 6.67 };
    rig.loops.run = { ...rig.loops.run, stride: 144 };
  }
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
      ...sword([1, 2, 1, 2, 2, 2]),
      impacts: [200],
      hit: "faisca-lamina",
      motion: {
        lunge: { windup: 4, reach: 12, lift: -1, tilt: 5 },
      },
    },
    "humano-retorno": {
      frames: [
        ...hold("weapon", 5, 1),
        ...hold("weapon", 4, 2),
        ...hold("weapon", 3, 1),
        ...hold("weapon", 2, 2),
        ...hold("weapon", 1, 2),
        ...hold("weapon", 5, 2),
      ],
      impacts: [200],
      hit: "faisca-lamina",
      motion: { lunge: { windup: 3, reach: 11, lift: -1, tilt: -5 } },
    },
    "humano-corte": {
      ...sword([3, 5, 6, 3, 6, 5]),
      impacts: [700],
      motion: {
        lunge: { windup: 6, reach: 17, lift: -2, tilt: 6 },
        glow: { at: [200, 650], color: "#d6eaff", pulse: true },
        shake: { at: 700, force: 0.3, ms: 120 },
      },
    },
    "humano-investida": {
      frames: [
        ...hold("special", 1, 6),
        ...hold("run1", 0, 2),
        ...hold("run1", 1, 2),
        ...hold("run1", 2, 2),
        ...hold("run1", 3, 2),
        ...hold("weapon", 2, 1),
        ...hold("weapon", 3, 3),
        ...hold("weapon", 4, 4),
        ...hold("weapon", 5, 4),
      ],
      impacts: [750],
      motion: {
        dash: { at: [300, 720] },
        trail: { at: [400, 750], color: "#b8dbf5" },
        fx: [{ at: 300, id: "poeira-passo", anchor: "origin" }],
        shake: { at: 750, force: 0.25, ms: 120 },
      },
    },
    "humano-destruidor": {
      frames: [
        ...hold("special", 1, 6),
        ...hold("weapon", 1, 6),
        ...hold("weapon", 2, 10),
        ...hold("weapon", 3, 4),
        ...hold("weapon", 4, 6),
        ...hold("weapon", 5, 6),
      ],
      impacts: [1100],
      motion: {
        jump: { at: [350, 1100], height: 24 },
        glow: { at: [300, 1050], color: "#cbe9ff", pulse: true },
        fx: [{ at: 1100, id: "poeira-passo" }],
        shake: { at: 1100, force: 0.65, ms: 220 },
      },
    },
    "humano-furia": {
      frames: [
        ...hold("special", 0, 4),
        ...hold("special", 1, 6),
        ...hold("special", 4, 18),
        ...hold("special", 0, 6),
      ],
      impacts: [700],
      motion: {
        glow: { at: [300, 1550], color: "#ffe0a1", pulse: true },
        shake: { at: 700, force: 0.25, ms: 150 },
      },
    },
  });
  rig.basic.guerreiro = {
    chain: [WARRIOR_BASIC.move, WARRIOR_RETURN.move],
    heavy: WARRIOR_BASIC.move,
  };
  for (const [id, action] of Object.entries(WARRIOR_ACTIONS))
    rig.skills[id] = { ...rig.skills[id], move: action.move };
  return rig;
}
