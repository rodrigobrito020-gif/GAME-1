// Shared animation/impact contract. Short body actions, longer independent VFX.
import { LIGHT_AFTERIMAGES } from "./light-afterimages.mjs";
import { LIGHT_AVATAR } from "./light-avatar.mjs";
import { LIGHT_AEGIS } from "./defense-buff.mjs";
import { WALK_STRIDE } from "./warrior-walk-rig.mjs";
export const WARRIOR_SKIN = "humano-guerreiro";
export const WARRIOR_SHEETS = {
  idle: 4,
  walk: 4,
  run1: 4,
  weapon: 6,
  special: 6,
  // Compatibility sheet name understood by the captured compositor; these
  // are dedicated two-handed sword plunge poses, not an axe animation.
  axeheavy: 8,
};
export const WARRIOR_LIGHT_DASH = {
  id: "avanco-de-luz",
  start: 50,
  end: 300,
  range: 300,
  minRange: 160,
  stopDistance: 52,
  hitRange: 75,
};
export const WARRIOR_GROUND_SLAM = {
  id: "impacto-de-luz",
  radius: 150,
  range: 75,
  duration: 950,
  impact: 550,
  jump: { at: [100, 550], height: 32 },
};
export const WARRIOR_ACTIONS = {
  "avatar-da-luz": {
    move: "humano-avatar-luz",
    duration: LIGHT_AVATAR.castMs,
    impact: LIGHT_AVATAR.applyAtMs,
  },
  "egide-de-luz": {
    move: "humano-egide-luz",
    duration: LIGHT_AEGIS.castMs,
    impact: LIGHT_AEGIS.applyAtMs,
  },
  "impacto-de-luz": { move: "humano-impacto-luz", duration: 950, impact: 550 },
  "avanco-de-luz": { move: "humano-avanco-luz", duration: 550, impact: 300 },
  investida: { move: "humano-investida", duration: 600, impact: 250 },
  "golpe-destruidor": { move: "humano-destruidor", duration: 850, impact: 400 },
  "furia-guerreiro": { move: "humano-furia", duration: 600, impact: 250 },
};
export const WARRIOR_BASIC = {
  move: "humano-espada",
  duration: 400,
  impact: 150,
};
export const WARRIOR_RETURN = {
  move: "humano-retorno",
  duration: 400,
  impact: 150,
};
const hold = (sheet, col, steps) =>
  Array.from({ length: steps }, () => [sheet, col]);
export function warriorRig(original) {
  const rig = structuredClone(original);
  if (rig.loops) {
    rig.loops.walk = { ...rig.loops.walk, stride: WALK_STRIDE, fps: 6.67 };
    rig.loops.run = { ...rig.loops.run, stride: 144 };
  }
  const sword = (counts, impact, reach = 8) => ({
    sheet: "weapon",
    frames: counts.flatMap((n, col) => Array(n).fill(col)),
    impacts: [impact],
    motion: { lunge: { windup: 2, reach, lift: -1, tilt: 2 } },
  });
  Object.assign(rig.moves, {
    "humano-egide-luz": {
      frames: [
        ...hold("special", 0, 2),
        ...hold("special", 1, 4),
        ...hold("special", 4, 4),
        ...hold("special", 0, 3),
      ],
      impacts: [LIGHT_AEGIS.applyAtMs],
      motion: { glow: { at: [100, 550], color: "#fff1bf", pulse: false } },
    },
    "humano-impacto-luz": {
      frames: [
        ...hold("axeheavy", 0, 2),
        ...hold("axeheavy", 1, 3),
        ...hold("axeheavy", 2, 3),
        ...hold("axeheavy", 3, 3),
        ...hold("axeheavy", 4, 4),
        ...hold("axeheavy", 5, 4),
      ],
      impacts: [WARRIOR_GROUND_SLAM.impact],
      motion: { jump: structuredClone(WARRIOR_GROUND_SLAM.jump) },
    },
    "humano-ferido": {
      frames: [...hold("special", 2, 1), ...hold("special", 0, 1)],
      impacts: [],
    },
    "humano-espada": {
      ...sword([1, 1, 1, 1, 2, 2], 150),
      hit: "faisca-lamina",
    },
    "humano-retorno": {
      frames: [
        ...hold("weapon", 5, 1),
        ...hold("weapon", 4, 1),
        ...hold("weapon", 3, 1),
        ...hold("weapon", 2, 1),
        ...hold("weapon", 1, 2),
        ...hold("weapon", 5, 2),
      ],
      impacts: [150],
      hit: "faisca-lamina",
      motion: { lunge: { windup: 2, reach: 8, lift: -1, tilt: -2 } },
    },
    "humano-avanco-luz": {
      frames: [
        ...hold("special", 1, 1),
        ...hold("run1", 0, 1),
        ...hold("run1", 1, 1),
        ...hold("run1", 2, 1),
        ...hold("run1", 3, 1),
        ...hold("weapon", 2, 1),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 1),
        ...hold("weapon", 5, 2),
      ],
      impacts: [300],
      // World-space translation is authoritative on the server. Do not add a
      // second, cosmetic dash that would snap the body back after landing.
      motion: {
        trail: {
          at: [50, LIGHT_AFTERIMAGES.emissionUntilMs],
          color: LIGHT_AFTERIMAGES.color,
        },
      },
    },
    "humano-investida": {
      frames: [
        ...hold("special", 1, 1),
        ...hold("run1", 0, 1),
        ...hold("run1", 1, 1),
        ...hold("run1", 2, 1),
        ...hold("weapon", 2, 1),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 2),
        ...hold("weapon", 5, 3),
      ],
      impacts: [250],
      motion: {
        dash: { at: [50, 240] },
        trail: { at: [100, 300], color: "#b8dbf5" },
      },
    },
    "humano-destruidor": {
      frames: [
        ...hold("special", 1, 2),
        ...hold("weapon", 1, 2),
        ...hold("weapon", 2, 4),
        ...hold("weapon", 3, 2),
        ...hold("weapon", 4, 3),
        ...hold("weapon", 5, 4),
      ],
      impacts: [400],
      motion: {
        jump: { at: [100, 400], height: 8 },
        fx: [{ at: 400, id: "poeira-passo" }],
      },
    },
    "humano-furia": {
      frames: [
        ...hold("special", 0, 1),
        ...hold("special", 1, 2),
        ...hold("special", 4, 5),
        ...hold("special", 0, 4),
      ],
      impacts: [250],
      motion: { glow: { at: [100, 450], color: "#ffe0a1", pulse: false } },
    },
  });
  rig.moves["humano-avatar-luz"] = {
    frames: [
      ...hold("special", 0, 1),
      ...hold("special", 1, 2),
      ...hold("special", 4, 6),
      ...hold("special", 0, 3),
    ],
    impacts: [LIGHT_AVATAR.applyAtMs],
  };
  for (const move of [WARRIOR_BASIC.move, WARRIOR_RETURN.move])
    rig.moves[move + "-avatar"] = {
      ...structuredClone(rig.moves[move]),
      hit: "guerreiro-avatar-corte",
    };
  rig.basic.guerreiro = {
    chain: [WARRIOR_BASIC.move, WARRIOR_RETURN.move],
    heavy: WARRIOR_BASIC.move,
  };
  for (const [id, action] of Object.entries(WARRIOR_ACTIONS))
    rig.skills[id] = { ...rig.skills[id], move: action.move };
  return rig;
}
