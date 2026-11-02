import { GUNSLINGER_RAIN } from "./gunslinger.mjs";

// Presentation only: damage and projectile arrival times stay on the server.
export function gunShotPresentation(fx, age) {
  const after = age - fx.releaseMs;
  if (after < 0 || after >= 420) return null;
  const angle = Math.atan2(fx.ty - fx.y, fx.tx - fx.x),
    power = fx.skillId === "disparo-sombrio";
  const kick =
    after < 18 ? after / 18 : Math.max(0, 1 - (after - 18) / 112) ** 2;
  return {
    after,
    angle,
    flash: Math.max(0, 1 - after / 150),
    kick,
    recoilAngle:
      -(Math.abs(Math.cos(angle)) > 0.25
        ? Math.cos(angle)
        : fx.hand
          ? -0.45
          : 0.45) *
      kick *
      (power ? 1.9 : 1.3),
    casing:
      after >= 12 && after < 360
        ? {
            x:
              fx.x -
              Math.cos(angle) * 10 +
              (fx.hand ? 1 : -1) * (10 + after * 0.025),
            y: fx.y - 12 - after * 0.095 + after * after * 0.0005,
            angle: (fx.hand ? -1 : 1) * (after * 0.55 + 20),
            alpha: Math.min(1, (360 - after) / 100),
          }
        : null,
  };
}

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
