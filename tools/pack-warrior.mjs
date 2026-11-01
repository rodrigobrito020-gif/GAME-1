// Cut and pack original sprite artwork. No runtime image processing is needed.
// Connected silhouettes keep swords/capes that cross the source grid gutters.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { decodeRgba, encodeRgba } from "../png.mjs";
import {
  renderWarriorWalkFrame,
  warriorWalkPose,
  WALK_STRIDE,
  WALK_PARTS,
} from "../warrior-walk-rig.mjs";
import { isolateParts } from "./sprite-cutout.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
const factor = process.argv.includes("--hd") ? 2 : 1,
  cell = 64 * factor;
const outputFolder = factor === 2 ? new URL("hd-reference/", folder) : folder;
mkdirSync(outputFolder, { recursive: true });
function load(name, columns, rows = 4) {
  const image = decodeRgba(
    readFileSync(new URL("source/novice/" + name + ".png", folder)),
  );
  const { width: w, height: h, pixels } = image;
  const seen = new Uint8Array(w * h),
    components = [];
  // Soft matte can connect separate rows after an art edit. Segment opaque
  // cores first, then assign detached blade/strap highlights to the nearest body.
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || pixels[start * 4 + 3] < 245) continue;
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
          pixels[next * 4 + 3] >= 245
        ) {
          seen[next] = 1;
          points.push(next);
        }
    }
    if (points.length >= 2) components.push({ points, x0, y0, x1, y1 });
  }
  // An exported matte can join the feet of one pose to the next row's hair.
  // Split only oversized connected components; normal swords retain gutters.
  for (let n = components.length - 1; n >= 0; n--) {
    const c = components[n];
    if (c.y1 - c.y0 < (h / rows) * 1.4) continue;
    components.splice(n, 1);
    const chunks = new Map();
    for (const point of c.points) {
      const row = Math.floor(Math.floor(point / w) / (h / rows));
      if (!chunks.has(row)) chunks.set(row, []);
      chunks.get(row).push(point);
    }
    for (const points of chunks.values()) {
      if (points.length < 2) continue;
      let x0 = w,
        y0 = h,
        x1 = 0,
        y1 = 0;
      for (const i of points) {
        const x = i % w,
          y = Math.floor(i / w);
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      components.push({ points, x0, y0, x1, y1 });
    }
  }
  const grid = Array.from({ length: rows }, () => Array(columns));
  for (const c of components) {
    const row = Math.min(rows - 1, Math.floor((c.y0 + c.y1) / 2 / (h / rows)));
    const col = Math.min(
      columns - 1,
      Math.floor((c.x0 + c.x1) / 2 / (w / columns)),
    );
    if (c.points.length > (grid[row][col]?.points.length ?? 0))
      grid[row][col] = c;
  }
  const bodies = grid.flat().filter(Boolean),
    own = new Int16Array(w * h).fill(-1),
    dist = new Uint16Array(w * h).fill(65535),
    queue = new Int32Array(w * h);
  let tail = 0;
  bodies.forEach((body, label) =>
    body.points.forEach((i) => {
      own[i] = label;
      dist[i] = 0;
      queue[tail++] = i;
    }),
  );
  for (let head = 0; head < tail; head++) {
    const i = queue[head],
      x = i % w;
    for (const next of [i - 1, i + 1, i - w, i + w])
      if (
        next >= 0 &&
        next < own.length &&
        own[next] < 0 &&
        Math.abs((next % w) - x) <= 1
      ) {
        own[next] = own[i];
        dist[next] = dist[i] + 1;
        queue[tail++] = next;
      }
  }
  const bodySet = new Set(bodies);
  for (const c of components) {
    if (bodySet.has(c)) continue;
    let nearest = -1,
      distance = 65535;
    for (const i of c.points)
      if (dist[i] < distance) {
        distance = dist[i];
        nearest = own[i];
      }
    if (nearest < 0 || distance > (c.points.length > 200 ? 30 : 12)) continue;
    const body = bodies[nearest];
    body.points.push(...c.points);
    body.x0 = Math.min(body.x0, c.x0);
    body.x1 = Math.max(body.x1, c.x1);
    body.y0 = Math.min(body.y0, c.y0);
    body.y1 = Math.max(body.y1, c.y1);
  }
  return { ...image, grid };
}
const slam = load("ground-slam", 6, 3);
const sword = load("sword-v2", 6, 3),
  reactions = load("reactions", 6);
function pack(name, source, columns, choose, mirror = () => false, anchor) {
  const width = columns * cell,
    height = cell * 4,
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
      const fixed = anchor?.(row, col);
      const center =
        fixed?.center ??
        (name === "special" && col === 5
          ? (sx0 + sx1) / 2
          : floor.reduce((n, i) => n + (i % source.width), 0) / floor.length);
      const scale =
        fixed?.scale ??
        Math.min(
          0.23,
          29 / Math.max(center - sx0, sx1 - center),
          56 / (c.y1 - sy0 + 1),
        );
      const flip = mirror(row, col);
      // Point sampling preserves the small face and ink outlines at native 64px.
      for (let y = 0; y < cell; y++)
        for (let x = 0; x < cell; x++) {
          let alpha = 0,
            red = 0,
            green = 0,
            blue = 0;
          {
            const px = Math.floor(
              center +
                (((flip ? cell - 1 - x : x) + 0.5) / factor - 32) / scale,
            );
            const py = Math.floor(
              (fixed?.floor ?? c.y1) + ((y + 0.5) / factor - 59) / scale,
            );
            if (px < sx0 || px > sx1 || py < sy0 || py > sy1) continue;
            const at = py * source.width + px;
            if (!mask.has(at)) continue;
            const a = source.pixels[at * 4 + 3];
            alpha += a;
            red += source.pixels[at * 4] * a;
            green += source.pixels[at * 4 + 1] * a;
            blue += source.pixels[at * 4 + 2] * a;
          }
          const at = ((row * cell + y) * width + col * cell + x) * 4;
          if (alpha) {
            output[at] = Math.round(red / alpha);
            output[at + 1] = Math.round(green / alpha);
            output[at + 2] = Math.round(blue / alpha);
            output[at + 3] = Math.round(alpha);
          }
        }
      rectangles.push({
        row,
        col,
        source: [sx0, sy0, sx1, sy1],
        scale,
        mirrored: flip,
        ...(fixed ? { anchor: fixed } : {}),
      });
    }
  writeFileSync(
    new URL(name + ".png", outputFolder),
    encodeRgba(width, height, output),
  );
  return rectangles;
}
const sources = {},
  parts = isolateParts(
    decodeRgba(readFileSync(new URL("source/novice/walk-parts.png", folder))),
    WALK_PARTS.flatMap((p) => [p.body.rect, ...p.thighs, ...p.shins]),
  );
for (const name of ["idle", "walk"]) {
  const pixels = Buffer.alloc(cell * 4 * cell * 4 * 4);
  sources[name] = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const frame = renderWarriorWalkFrame(
        parts,
        row,
        col,
        name === "idle",
        factor,
      );
      for (let y = 0; y < cell; y++)
        frame.copy(
          pixels,
          ((row * cell + y) * cell * 4 + col * cell) * 4,
          y * cell * 4,
          (y + 1) * cell * 4,
        );
      sources[name].push(warriorWalkPose(row, col, name === "idle", factor));
    }
  writeFileSync(
    new URL(name + ".png", outputFolder),
    encodeRgba(cell * 4, cell * 4, pixels),
  );
}
// Running currently uses the same authored leg cycle with a faster cadence.
writeFileSync(
  new URL("run1.png", outputFolder),
  readFileSync(new URL("walk.png", outputFolder)),
);
const hips = [
  [136, 394, 650, 904, 1152, 1390],
  [130, 394, 654, 893, 1150, 1407],
  [157, 408, 650, 899, 1150, 1402],
];
const rowOf = (r) => (r === 0 ? 0 : r === 3 ? 2 : 1);
// Constant scale and pelvis X, shared ground plane. Never re-center on a sword or toe.
sources.weapon = pack(
  "weapon",
  sword,
  6,
  (r, c) => sword.grid[rowOf(r)][c],
  (r) => r === 1,
  (r, c) => ({
    center: hips[rowOf(r)][c],
    floor: sword.grid[rowOf(r)][c].y1,
    scale: 0.17,
  }),
);
// The renderer recognizes axeheavy (8 frames); use it for our sword slam.
// Six authored poses plus repeated recovery frames keep the native schema.
sources.axeheavy = pack(
  "axeheavy",
  slam,
  8,
  (r, c) => slam.grid[rowOf(r)][Math.min(c, 5)],
  (r) => r === 1,
  (r, c) => ({
    center: ((Math.min(c, 5) + 0.5) * slam.width) / 6,
    floor: slam.grid[rowOf(r)][Math.min(c, 5)].y1,
    scale: 0.17,
  }),
);
sources.special = pack(
  "special",
  reactions,
  6,
  (r, c) => reactions.grid[c === 4 && (r === 1 || r === 2) ? 0 : r][c],
  (r) => r === 1,
);
writeFileSync(
  new URL("manifest.json", outputFolder),
  JSON.stringify(
    {
      character: "Guerreiro Humano",
      skinId: "humano-guerreiro",
      version: 8,
      frame: [cell, cell],
      resolutionFactor: factor,
      feet: [32 * factor, 60 * factor],
      rows: ["south", "west", "east", "north"],
      sheets: { idle: 4, walk: 4, run1: 4, weapon: 6, special: 6, axeheavy: 8 },
      walkStride: WALK_STRIDE,
      rig: "warrior-walk-rig.mjs",
      equipmentLooks: { "peitoral-local": "training" },
      starterSources: "source/novice/",
      notes: [
        "Corrida reutiliza o ciclo de caminhada.",
        "Grito de guerra vira de frente nas direções laterais.",
        "Escudo no braço esquerdo; espada na mão direita.",
        "Roupas iniciais desenhadas em todas as poses; sem pintura por máscaras e sem capa. Peitoral aparece somente equipado.",
      ],
      sources,
    },
    null,
    2,
  ) + "\n",
);
console.log("Guerreiro empacotado em", fileURLToPath(folder));
