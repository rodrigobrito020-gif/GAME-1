import { GUNSLINGER_RAIN } from "./gunslinger.mjs";

// Every wave lands at the authoritative server hit time. Fixed positions keep
// the rain stable across network snapshots; its circle uses world coordinates.
export function gunslingerRainPose(fx, age) {
  const drops = [],
    impacts = [];
  for (const [wave, hit] of GUNSLINGER_RAIN.impactsMs.entries()) {
    const p = (age - (hit - 300)) / 300;
    if (p >= 0 && p < 1)
      for (let i = 0; i < GUNSLINGER_RAIN.dropsPerWave; i++) {
        const a = i * 2.399963 + wave * 0.7,
          r =
            fx.radius *
            0.92 *
            Math.sqrt((i + 0.5) / GUNSLINGER_RAIN.dropsPerWave),
          x = fx.x + Math.cos(a) * r,
          ground = fx.y + Math.sin(a) * r;
        drops.push({
          x,
          y: ground - 170 * (1 - p),
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
    telegraph: age >= fx.releaseMs && age < GUNSLINGER_RAIN.endMs,
  };
}
