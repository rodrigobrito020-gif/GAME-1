import { ARCHER_ACTIONS } from "./archer.mjs";
import { GUNSLINGER_RAIN } from "./gunslinger.mjs";
export const RANGED_ATLAS = Object.freeze({
  cell: 160,
  columns: 4,
  frames: 16,
  durationMs: 500,
});
export function impactFrame(age) {
  if (!Number.isFinite(age) || age < 0 || age >= RANGED_ATLAS.durationMs)
    return null;
  return Math.floor((age / RANGED_ATLAS.durationMs) * RANGED_ATLAS.frames);
}
// Use the very same sample indices and positions as the falling projectiles.
export function rainBursts(classId, fx, age) {
  const gun = classId === "pistoleira",
    hits = gun ? GUNSLINGER_RAIN.impactsMs : ARCHER_ACTIONS.rain.impactsMs,
    result = [];
  for (const [wave, hit] of hits.entries()) {
    if (age < hit || age >= hit + RANGED_ATLAS.durationMs) continue;
    for (const index of [0, 2, 5, 7, 10, 12, 15, 17]) {
      const a = index * 2.399963 + wave * 0.7,
        r = fx.radius * (gun ? 0.92 : 0.93) * Math.sqrt((index + 0.5) / 18);
      result.push({
        id: `${fx.id}:wave:${wave}:point:${index}`,
        x: fx.x + Math.cos(a) * r,
        y: fx.y + Math.sin(a) * r,
        age: age - hit,
        wave,
        index,
      });
    }
  }
  return result;
}
export function fallingPoint(drop, height) {
  const p = Math.max(0, Math.min(1, 1 - (drop.ground - drop.y) / height));
  // Gravity changes the speed of the fall; end point and landing time stay exact.
  return { x: drop.x, y: drop.ground - height * (1 - p * p), p };
}
