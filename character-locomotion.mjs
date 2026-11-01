import { CHARACTER_ART as ART } from "./character-art.mjs";

// The native cycle is integrated from world distance, rather than a timer.
// Its four invisible compatibility frames sample the eight complete HD poses.
export function locomotionPose(state, sample) {
  const { sheet, row, col, cycle = 0, action, x, y, now } = sample;
  const walk = sheet === "walk" || sheet === "run1";
  const distance =
    state.x === undefined ? 0 : Math.hypot(x - state.x, y - state.y);
  state.x = x;
  state.y = y;
  const pose = { sheet, row, col: Number(col) * (walk ? 2 : 1) };
  if (action || distance > 150) {
    state.walking = false;
    state.settle = null;
    return pose;
  }
  if (walk && distance > 0.03) {
    state.walking = true;
    state.settle = null;
    state.lastMotion = now;
    state.phase = (((cycle % 1) + 1) % 1) * ART.walkFrames;
    return { sheet, row, col: Math.floor(state.phase) };
  }
  if (state.walking && now - state.lastMotion < 70 && walk)
    return { sheet, row, col: Math.floor(state.phase) };
  if (state.walking && (walk || sheet === "idle")) {
    // Finish at the next support/passing pose before returning to rest. This
    // closes a wide step without a frozen lunge or a double-image crossfade.
    state.settle ??= {
      at: now,
      from: state.phase,
      to: Math.ceil((state.phase - 2) / 4) * 4 + 2,
    };
    const { at, from, to } = state.settle;
    const phase = Math.min(to, from + (now - at) / 38);
    if (now - at < (to - from) * 38 + 35)
      return { sheet: "walk", row, col: Math.floor(phase) % ART.walkFrames };
  }
  state.walking = false;
  state.settle = null;
  return walk ? { sheet: "idle", row, col: 0 } : pose;
}
