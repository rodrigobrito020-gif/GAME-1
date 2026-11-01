// Apply authored oak/iron materials only to the held equipment. Body poses,
// face, cloth, feet, alpha and attachment points remain the approved artwork.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
const material = decodeRgba(
  readFileSync(new URL("source/starter-equipment.png", folder)),
);
function groups(points) {
  const pending = new Set(points),
    out = [];
  for (const seed of pending) {
    const q = [seed];
    pending.delete(seed);
    for (let n = 0; n < q.length; n++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = (q[n] % 64) + dx,
            y = Math.floor(q[n] / 64) + dy,
            p = y * 64 + x;
          if (x >= 0 && x < 64 && y >= 0 && y < 64 && pending.has(p)) {
            pending.delete(p);
            q.push(p);
          }
        }
    out.push(q);
  }
  return out;
}
function bounds(points) {
  const xs = points.map((p) => p % 64),
    ys = points.map((p) => Math.floor(p / 64));
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}
function hull(points) {
  const p = [...new Set(points)]
    .map((n) => [n % 64, Math.floor(n / 64)])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const build = (arr) => {
    const q = [];
    for (const v of arr) {
      while (q.length > 1 && cross(q.at(-2), q.at(-1), v) <= 0) q.pop();
      q.push(v);
    }
    return q;
  };
  const a = build(p),
    b = build([...p].reverse());
  a.pop();
  b.pop();
  return [...a, ...b];
}
function inside(poly, x, y) {
  let found = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      found = !found;
  }
  return found;
}
const gold = (r, g, b) => r > 125 && g > 75 && g > r * 0.38 && b < g * 0.65;
const skin = (r, g, b) =>
  r > 135 && r - g > 22 && r - g < 110 && g - b > 5 && g - b < 75;
const manifest = { materials: "starter-equipment.png", poses: [] };
for (const [name, cols] of Object.entries(WARRIOR_SHEETS)) {
  const reference = new URL(`weapon-reference/${name}.png`, folder);
  if (process.argv.includes("--refresh-reference"))
    copyFileSync(new URL(`${name}.png`, folder), reference);
  const image = decodeRgba(readFileSync(reference)),
    pixels = Buffer.from(image.pixels),
    mask = Buffer.alloc(pixels.length);
  const at = (row, col, p) =>
    ((row * 64 + Math.floor(p / 64)) * image.width + col * 64 + (p % 64)) * 4;
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < cols; col++) {
      const blues = [],
        golds = [];
      for (let p = 0; p < 4096; p++) {
        const i = at(row, col, p),
          [r, g, b, a] = image.pixels.subarray(i, i + 4);
        if (a < 100) continue;
        if (b > r + 18 && b > g + 3) blues.push(p);
        if (gold(r, g, b)) golds.push(p);
      }
      const goldGroups = groups(golds),
        blueGroups = groups(blues);
      const candidates = blueGroups.filter((g) => {
        const b = bounds(g);
        return (
          g.length >= 3 &&
          b.x1 - b.x0 < 14 &&
          b.y1 - b.y0 < 18 &&
          g.length / ((b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1)) > 0.2
        );
      });
      const near = (a, b, pad) =>
        a.x0 <= b.x1 + pad &&
        a.x1 >= b.x0 - pad &&
        a.y0 <= b.y1 + pad &&
        a.y1 >= b.y0 - pad;
      const score = (g) =>
        g.length +
        Math.max(
          0,
          ...goldGroups
            .filter((gg) => near(bounds(g), bounds(gg), 5))
            .map((gg) => gg.length),
        );
      const core = candidates.sort((a, b) => score(b) - score(a))[0];
      let rim =
        goldGroups
          .filter((g) => !core || near(bounds(g), bounds(core), 6))
          .sort((a, b) => b.length - a.length)[0] ?? [];
      const rb = rim.length ? bounds(rim) : core ? bounds(core) : null;
      if (rb)
        rim = goldGroups
          .filter(
            (g) =>
              near(bounds(g), rb, 2) &&
              bounds(g).y0 >= rb.y0 - 4 &&
              bounds(g).y1 <= rb.y1 + 3,
          )
          .flat();
      const seeds = [...(core ?? []), ...rim],
        expanded = [];
      for (const p of seeds)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const x = (p % 64) + dx,
              y = Math.floor(p / 64) + dy;
            if (x > 0 && x < 63 && y > 0 && y < 61) expanded.push(y * 64 + x);
          }
      const poly = hull(expanded),
        shield = new Set();
      for (let p = 0; p < 4096; p++) {
        const x = p % 64,
          y = Math.floor(p / 64),
          i = at(row, col, p),
          [r, g, b, a] = image.pixels.subarray(i, i + 4);
        if (
          a >= 24 &&
          inside(poly, x + 0.1, y + 0.1) &&
          (!skin(r, g, b) || gold(r, g, b))
        )
          shield.add(p);
      }
      for (const p of rim)
        if (image.pixels[at(row, col, p) + 3] >= 24) shield.add(p);
      const box = shield.size ? bounds([...shield]) : null;
      // Oak grain follows the long axis of the actual held shield.
      let mx = 0,
        my = 0,
        xx = 0,
        yy = 0,
        xy = 0;
      if (shield.size) {
        for (const p of shield) {
          mx += p % 64;
          my += Math.floor(p / 64);
        }
        mx /= shield.size;
        my /= shield.size;
        for (const p of shield) {
          const x = (p % 64) - mx,
            y = Math.floor(p / 64) - my;
          xx += x * x;
          yy += y * y;
          xy += x * y;
        }
      }
      const angle = 0.5 * Math.atan2(2 * xy, xx - yy),
        ax = Math.cos(angle),
        ay = Math.sin(angle);
      const us = [...shield].map(
          (p) => -((p % 64) - mx) * ay + (Math.floor(p / 64) - my) * ax,
        ),
        vs = [...shield].map(
          (p) => ((p % 64) - mx) * ax + (Math.floor(p / 64) - my) * ay,
        );
      const u0 = Math.min(...us),
        u1 = Math.max(...us),
        v0 = Math.min(...vs),
        v1 = Math.max(...vs);
      for (const p of shield) {
        const i = at(row, col, p),
          [r, g, b] = image.pixels.subarray(i, i + 3),
          x = p % 64,
          y = Math.floor(p / 64);
        const edge = [p - 1, p + 1, p - 64, p + 64].some((n) => !shield.has(n));
        if (edge) {
          const shade = 0.38 + (0.36 * (r + g + b)) / 765;
          pixels[i] = Math.round(155 * shade);
          pixels[i + 1] = Math.round(151 * shade);
          pixels[i + 2] = Math.round(139 * shade);
        } else {
          const u =
              (-(x - mx) * ay + (y - my) * ax - u0) / Math.max(1, u1 - u0),
            v = ((x - mx) * ax + (y - my) * ay - v0) / Math.max(1, v1 - v0);
          const sx = Math.floor(material.width * (0.52 + 0.44 * u)),
            sy = Math.floor(material.height * (0.52 + 0.44 * v)),
            q = (sy * material.width + sx) * 4;
          const shade = 0.92 + 0.08 * (1 - v);
          for (let k = 0; k < 3; k++)
            pixels[i + k] = Math.round(material.pixels[q + k] * shade);
        }
        mask[i] = mask[i + 1] = mask[i + 2] = 255;
        mask[i + 3] = image.pixels[i + 3];
      }
      // Cold steel belongs to the sword. Guard/pommel gold is replaced only near
      // the blade, so the approved belt buckle, face and boots remain untouched.
      const blade = blues.filter(
        (p) => !shield.has(p) && (!core || !core.includes(p)),
      );
      const sword = new Set(blade);
      for (const group of goldGroups)
        if (
          !group.some((p) => shield.has(p)) &&
          group.some((p) =>
            blade.some(
              (b) =>
                Math.hypot(
                  (p % 64) - (b % 64),
                  Math.floor(p / 64) - Math.floor(b / 64),
                ) < 5,
            ),
          )
        )
          for (const p of group) sword.add(p);
      for (const p of [...sword])
        for (const n of [p - 1, p + 1, p - 64, p + 64]) {
          if (
            n < 0 ||
            n >= 4096 ||
            Math.abs((n % 64) - (p % 64)) > 1 ||
            shield.has(n)
          )
            continue;
          const q = at(row, col, n),
            [r, g, b, a] = image.pixels.subarray(q, q + 4);
          if (a > 100 && b >= r - 4 && g >= r - 6 && r > 100) sword.add(n);
        }
      for (const p of sword) {
        const i = at(row, col, p),
          [r, g, b, a] = image.pixels.subarray(i, i + 4);
        if (a < 24 || skin(r, g, b) || shield.has(p)) continue;
        const grey = Math.round(
          gold(r, g, b) ? 55 + (r + g + b) / 30 : 65 + (r + g + b) / 8,
        );
        pixels[i] = grey;
        pixels[i + 1] = grey;
        pixels[i + 2] = Math.max(0, grey - 4);
        mask[i] = mask[i + 1] = mask[i + 2] = 255;
        mask[i + 3] = a;
      }
      manifest.poses.push({
        sheet: name,
        row,
        col,
        shieldPixels: shield.size,
        swordPixels: sword.size,
        box,
      });
    }
  // Opposite contact strides share the same approved upper-body pixels.
  if (["walk", "run1"].includes(name))
    for (let row = 0; row < 4; row++)
      for (let y = 0; y < 29; y++)
        for (let x = 0; x < 64; x++)
          for (const buffer of [pixels, mask]) {
            const a = at(row, 0, y * 64 + x),
              b = at(row, 2, y * 64 + x);
            buffer.copy(buffer, b, a, a + 4);
          }
  // Preserve the exact approved mirror relationship of the locomotion rig.
  if (["idle", "walk", "run1"].includes(name))
    for (let col = 0; col < cols; col++)
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++)
          for (const buffer of [pixels, mask]) {
            const a = at(2, col, y * 64 + 63 - x),
              b = at(1, col, y * 64 + x);
            buffer.copy(buffer, b, a, a + 4);
          }
  writeFileSync(
    new URL(`${name}.png`, folder),
    encodeRgba(image.width, image.height, pixels),
  );
  writeFileSync(
    new URL(`weapon-masks/${name}.png`, folder),
    encodeRgba(image.width, image.height, mask),
  );
}
writeFileSync(
  new URL("weapon-masks/manifest.json", folder),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Madeira e ferro iniciais aplicados somente às armas; máscaras exportadas para o Avatar.",
);
