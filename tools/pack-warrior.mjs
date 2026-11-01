// Cut and pack original sprite artwork. No runtime image processing is needed.
// Connected silhouettes keep swords/capes that cross the source grid gutters.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { decodeRgba, encodeRgba } from "../png.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
function load(name, columns) {
  const image = decodeRgba(
    readFileSync(new URL("source/" + name + ".png", folder)),
  );
  const { width: w, height: h, pixels } = image;
  const seen = new Uint8Array(w * h),
    components = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || pixels[start * 4 + 3] < 96) continue;
    const points = [start];
    seen[start] = 1;
    let x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    for (let n = 0; n < points.length; n++) {
      const i = points[n],
        x = i % w,
        y = Math.floor(i / w);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const next of [i - 1, i + 1, i - w, i + w])
        if (
          next >= 0 &&
          next < seen.length &&
          !seen[next] &&
          Math.abs((next % w) - x) <= 1 &&
          pixels[next * 4 + 3] >= 96
        ) {
          seen[next] = 1;
          points.push(next);
        }
    }
    if (points.length > 500) components.push({ points, x0, y0, x1, y1 });
  }
  const grid = Array.from({ length: 4 }, () => Array(columns));
  for (const c of components) {
    const row = Math.min(3, Math.floor((c.y0 + c.y1) / 2 / (h / 4)));
    const col = Math.min(
      columns - 1,
      Math.floor((c.x0 + c.x1) / 2 / (w / columns)),
    );
    grid[row][col] = c;
  }
  return { ...image, grid };
}
const locomotion = load("locomotion", 8),
  sword = load("sword", 6),
  reactions = load("reactions", 6);
function pack(name, source, columns, choose, mirror = () => false) {
  const width = columns * 64,
    height = 256,
    output = Buffer.alloc(width * height * 4);
  const rectangles = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < columns; col++) {
      const c = choose(row, col);
      if (!c) throw Error(`Missing source pose ${name}/${row}/${col}`);
      const mask = new Set();
      // Include anti-aliased edge pixels around each connected silhouette.
      for (const i of c.points)
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) mask.add(i + dy * source.width + dx);
      const sx0 = Math.max(0, c.x0 - 2),
        sx1 = Math.min(source.width - 1, c.x1 + 2);
      const sy0 = Math.max(0, c.y0 - 2),
        sy1 = Math.min(source.height - 1, c.y1 + 2);
      const floor = c.points.filter(
        (i) => Math.floor(i / source.width) >= c.y1 - 10,
      );
      const center =
        name === "special" && col === 5
          ? (sx0 + sx1) / 2
          : floor.reduce((n, i) => n + (i % source.width), 0) / floor.length;
      const scale = Math.min(
        0.23,
        29 / Math.max(center - sx0, sx1 - center),
        56 / (c.y1 - sy0 + 1),
      );
      const flip = mirror(row, col);
      // 4x4 area samples produce alpha-correct antialiasing at the 64px export size.
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          let alpha = 0,
            red = 0,
            green = 0,
            blue = 0;
          for (let yy = 0; yy < 4; yy++)
            for (let xx = 0; xx < 4; xx++) {
              const px = Math.floor(
                center + ((flip ? 63 - x : x) - 32 + (xx + 0.5) / 4) / scale,
              );
              const py = Math.floor(c.y1 + (y - 59 + (yy + 0.5) / 4) / scale);
              if (px < sx0 || px > sx1 || py < sy0 || py > sy1) continue;
              const at = py * source.width + px;
              if (!mask.has(at)) continue;
              const a = source.pixels[at * 4 + 3];
              alpha += a;
              red += source.pixels[at * 4] * a;
              green += source.pixels[at * 4 + 1] * a;
              blue += source.pixels[at * 4 + 2] * a;
            }
          const at = ((row * 64 + y) * width + col * 64 + x) * 4;
          if (alpha) {
            output[at] = Math.round(red / alpha);
            output[at + 1] = Math.round(green / alpha);
            output[at + 2] = Math.round(blue / alpha);
            output[at + 3] = Math.round(alpha / 16);
          }
        }
      rectangles.push({
        row,
        col,
        source: [sx0, sy0, sx1, sy1],
        scale,
        mirrored: flip,
      });
    }
  writeFileSync(
    new URL(name + ".png", folder),
    encodeRgba(width, height, output),
  );
  return rectangles;
}
const sources = {};
sources.idle = pack(
  "idle",
  locomotion,
  4,
  (r, c) => locomotion.grid[r][c],
  (r) => r === 1,
);
sources.walk = pack(
  "walk",
  locomotion,
  4,
  (r, c) => locomotion.grid[r][c + 4],
  (r) => r === 1,
);
// Running currently uses the same authored leg cycle with a faster cadence.
writeFileSync(
  new URL("run1.png", folder),
  readFileSync(new URL("walk.png", folder)),
);
// The very wide extension pose is excluded to keep character scale consistent.
sources.weapon = pack(
  "weapon",
  sword,
  6,
  (r, c) => sword.grid[r][[0, 1, 2, 4, 5, 5][c]],
);
sources.special = pack(
  "special",
  reactions,
  6,
  (r, c) => reactions.grid[c === 4 && (r === 1 || r === 2) ? 0 : r][c],
  (r) => r === 1,
);
writeFileSync(
  new URL("manifest.json", folder),
  JSON.stringify(
    {
      character: "Guerreiro Humano",
      skinId: "humano-guerreiro",
      version: 1,
      frame: [64, 64],
      feet: [32, 60],
      rows: ["south", "west", "east", "north"],
      sheets: { idle: 4, walk: 4, run1: 4, weapon: 6, special: 6 },
      notes: [
        "Corrida reutiliza o ciclo de caminhada.",
        "Grito de guerra vira de frente nas direções laterais.",
        "Aparência inicial fixa; equipamentos ainda não trocam as peças desenhadas.",
      ],
      sources,
    },
    null,
    2,
  ) + "\n",
);
console.log("Guerreiro empacotado em", fileURLToPath(folder));
