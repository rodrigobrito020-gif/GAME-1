import { BERSERKER_SPIN as SPIN } from "./berserker.mjs";
const TAU = Math.PI * 2;
const clamp = (x) => Math.max(0, Math.min(1, x));

// One continuous angular clock for the body, wind and two hatchets. Angles
// are projected into the ground plane, never a rotated flat ellipse image.
export function vortexPose(age, row = 0) {
  if (!Number.isFinite(age) || age < 0 || age >= SPIN.durationMs) return null;
  return {
    sheet: "axeheavy",
    row,
    col: Math.floor((age / SPIN.revolutionMs) * 8) % 8,
  };
}
export function vortexGeometry(age, row = 0) {
  if (!vortexPose(age)) return null;
  const fade = Math.min(clamp(age / 85), clamp((SPIN.durationMs - age) / 180));
  const turn = (age / SPIN.revolutionMs + ([0, 2, 6, 4][row] ?? 0) / 8) * TAU;
  const ribbons = [],
    blades = [],
    motes = [];
  // Tapered helical sheets make an actual funnel volume around the figure.
  // Each strip is split by camera-facing half, leaving the body visible inside.
  for (let band = 0; band < 4; band++) {
    for (let j = 0; j < 72; j++) {
      const point = (k) => {
        const p = k / 72,
          theta = turn + p * TAU * 1.65 + (band * TAU) / 4;
        const radius = 29 + 65 * p + 2 * Math.sin(p * TAU * 2 + age / 180);
        const width =
          (3 + Math.sin(p * Math.PI) * 6) * Math.sin(p * Math.PI) ** 0.45;
        return {
          x: Math.cos(theta) * radius,
          y: -p * 158 + Math.sin(theta) * radius * 0.28,
          width,
          theta,
          p,
        };
      };
      const a = point(j),
        b = point(j + 1),
        p = (a.p + b.p) / 2;
      ribbons.push({
        a,
        b,
        front: Math.sin((a.theta + b.theta) / 2) > 0,
        alpha:
          fade *
          Math.sin(Math.PI * p) *
          (0.3 + 0.15 * Math.sin(band * 1.7 + p * 4) ** 2),
      });
    }
  }
  // Opposite blades leave long tapered slashes at hand height. Their head
  // follows the same angular phase as the upright body, at ten turns per cast.
  for (let hand = 0; hand < 2; hand++)
    for (let j = 0; j < 36; j++) {
      const p = j / 36,
        q = (j + 1) / 36;
      const point = (t) => {
        const theta = turn + hand * Math.PI - t * 2.7;
        return {
          x: Math.cos(theta) * 88,
          y: -72 + Math.sin(theta) * 26,
          theta,
        };
      };
      const a = point(p),
        b = point(q);
      blades.push({
        a,
        b,
        front: Math.sin((a.theta + b.theta) / 2) > 0,
        width: (1 - p) * 7 + 0.4,
        alpha: fade * (1 - p) ** 0.7,
      });
    }
  for (let i = 0; i < 30; i++) {
    const p = (age / 650 + i / 30) % 1,
      theta = turn + p * TAU + i * 2.399963;
    const radius = 35 + 62 * p;
    motes.push({
      x: Math.cos(theta) * radius,
      y: -p * 151 + Math.sin(theta) * radius * 0.28,
      dx: -Math.sin(theta) * 6,
      dy: Math.cos(theta) * 2 - 3,
      alpha: fade * Math.sin(Math.PI * p) * 0.55,
      front: Math.sin(theta) > 0,
      light: i % 5 === 0,
    });
  }
  return { fade, turn, ribbons, blades, motes };
}
export function drawVortex(back, front, age, row = 0) {
  const geometry = vortexGeometry(age, row);
  if (!geometry) return null;
  const { fade, ribbons, blades, motes } = geometry;
  for (const r of ribbons) {
    const g = r.front ? front : back,
      { a, b, alpha } = r;
    const polygon = [
      { x: a.x, y: a.y - a.width },
      { x: b.x, y: b.y - b.width },
      { x: b.x, y: b.y + b.width },
      { x: a.x, y: a.y + a.width },
    ];
    g.fillStyle(0xa91f2b, alpha * 0.75).fillPoints(polygon, true);
    g.lineStyle(3.2, 0xf24240, alpha * 0.9).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(0.9, 0xffb08c, alpha * 0.6).lineBetween(
      a.x,
      a.y - a.width * 0.45,
      b.x,
      b.y - b.width * 0.45,
    );
  }
  for (const blade of blades) {
    const g = blade.front ? front : back,
      { a, b, width, alpha } = blade;
    g.lineStyle(width + 4, 0x9f1926, alpha * 0.26).lineBetween(
      a.x,
      a.y,
      b.x,
      b.y,
    );
    g.lineStyle(width, 0xff493d, alpha * 0.85).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(Math.max(0.6, width * 0.23), 0xffddbd, alpha * 0.8).lineBetween(
      a.x,
      a.y,
      b.x,
      b.y,
    );
  }
  for (const m of motes)
    (m.front ? front : back)
      .lineStyle(m.light ? 1.4 : 1, m.light ? 0xffd6ad : 0xed6550, m.alpha)
      .lineBetween(m.x, m.y, m.x + m.dx, m.y + m.dy);
  // The base stays grounded; dust moves tangentially rather than flashing.
  for (let i = 0; i < 16; i++) {
    const p = (age / 550 + i / 16) % 1,
      theta = geometry.turn * 0.7 + i * 2.399963,
      r = 35 + p * 40;
    back
      .fillStyle(0x846c51, (1 - p) * fade * 0.18)
      .fillEllipse(
        Math.cos(theta) * r,
        Math.sin(theta) * r * 0.3 - 3,
        6 + p * 5,
        2 + p * 2,
      );
  }
  return geometry;
}
