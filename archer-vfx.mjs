import { ARCHER_ACTIONS } from "./archer.mjs";

export function projectilePose(fx, age) {
  if (age < fx.releaseMs || age >= fx.durationMs) return null;
  const p = (age - fx.releaseMs) / Math.max(1, fx.durationMs - fx.releaseMs);
  return {
    x: fx.x + (fx.tx - fx.x) * p,
    y: fx.y + (fx.ty - fx.y) * p,
    angle: (Math.atan2(fx.ty - fx.y, fx.tx - fx.x) * 180) / Math.PI,
  };
}

// Three discrete waves arrive on the same timeline as authoritative damage.
// Drop locations are deterministic: receiving another state packet must not
// reshuffle the rain or make arrows jump back into the sky.
export function rainPose(fx, age) {
  const drops = [],
    impacts = [];
  for (const [wave, hit] of ARCHER_ACTIONS.rain.impactsMs.entries()) {
    const p = (age - (hit - 260)) / 260;
    if (p >= 0 && p < 1)
      for (let i = 0; i < 18; i++) {
        const a = i * 2.399963 + wave * 0.7,
          r = fx.radius * 0.93 * Math.sqrt((i + 0.5) / 18),
          x = fx.x + Math.cos(a) * r,
          ground = fx.y + Math.sin(a) * r;
        drops.push({
          x,
          y: ground - (1 - p) * 155,
          ground,
          alpha: Math.min(1, p * 5),
          wave,
          index: i,
        });
      }
    if (age >= hit && age < hit + 280)
      impacts.push({ wave, progress: (age - hit) / 280 });
  }
  return {
    drops,
    impacts,
    telegraph: age >= ARCHER_ACTIONS.rain.releaseMs && age < 1900,
  };
}
