// Fit the authored linen/leather garments to the existing animation rig.
// Immutable pose references prevent cumulative resampling on repeated builds.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
const art = decodeRgba(
  readFileSync(new URL("source/starter-clothes.png", folder)),
);
const anchors = JSON.parse(
  readFileSync(new URL("armored-reference/anchors.json", folder)),
).poses;
const parts = [];
for (let row = 0; row < 3; row++)
  for (let col = 0; col < 2; col++) {
    let x0 = art.width,
      y0 = art.height,
      x1 = 0,
      y1 = 0;
    for (let y = (row * art.height) / 3; y < ((row + 1) * art.height) / 3; y++)
      for (let x = (col * art.width) / 2; x < ((col + 1) * art.width) / 2; x++)
        if (art.pixels[(y * art.width + x) * 4 + 3] > 220) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    parts.push({ x0, y0, x1, y1 });
  }
for (const [name, cols] of Object.entries(WARRIOR_SHEETS)) {
  const reference = new URL(`armored-reference/${name}.png`, folder);
  if (process.argv.includes("--refresh-reference"))
    copyFileSync(new URL(`${name}.png`, folder), reference);
  const image = decodeRgba(readFileSync(reference)),
    pixels = Buffer.from(image.pixels);
  const at = (col, row, x, y) =>
    ((row * 64 + y) * image.width + col * 64 + x) * 4;
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < cols; col++) {
      const pose = anchors.find(
        (p) =>
          p.sheet === name && p.row === (row === 3 ? 0 : row) && p.col === col,
      );
      if (!pose) continue;
      const face = pose.face,
        cx = (face.x0 + face.x1) / 2,
        neck = face.y1;
      const dead = name === "special" && col === 5;
      // Locate the blue shield crest, preserving its entire rim and painted face.
      const blue = [];
      for (let y = neck + 3; y < 60; y++)
        for (let x = 1; x < 63; x++) {
          const q = at(col, row, x, y),
            [r, g, b, a] = image.pixels.subarray(q, q + 4);
          if (a > 180 && b > r + 25 && b > g + 4 && r < 135) blue.push([x, y]);
        }
      const pending = new Set(blue.map(([x, y]) => y * 64 + x)),
        blobs = [];
      for (const seed of pending) {
        const queue = [seed];
        pending.delete(seed);
        for (let n = 0; n < queue.length; n++)
          for (const j of [
            queue[n] - 1,
            queue[n] + 1,
            queue[n] - 64,
            queue[n] + 64,
          ])
            if (pending.has(j) && Math.abs((j % 64) - (queue[n] % 64)) <= 1) {
              pending.delete(j);
              queue.push(j);
            }
        blobs.push(queue);
      }
      const crest = (blobs.sort((a, b) => b.length - a.length)[0] ?? []).map(
        (p) => [p % 64, Math.floor(p / 64)],
      );
      const shield =
        crest.length >= 3
          ? {
              x0: Math.min(...crest.map((p) => p[0])) - 4,
              x1: Math.max(...crest.map((p) => p[0])) + 4,
              y0: Math.min(...crest.map((p) => p[1])) - 5,
              y1: Math.max(...crest.map((p) => p[1])) + 5,
            }
          : null;
      for (let y = 1; y < 61; y++)
        for (let x = 1; x < 63; x++) {
          const q = at(col, row, x, y),
            [r, g, b, a] = image.pixels.subarray(q, q + 4);
          if (a < 24) continue;
          // Face/hair pixels are never repainted. Weapons are outside the body mask.
          if (row !== 3 && x >= face.x0 - 1 && x <= face.x1 + 1 && y <= neck)
            continue;
          if (
            shield &&
            x >= shield.x0 &&
            x <= shield.x1 &&
            y >= shield.y0 &&
            y <= shield.y1
          )
            continue;
          const u = dead ? y - face.y0 : x - cx;
          const v = dead ? x - face.x1 : y - neck;
          if (v < 0 || Math.abs(u) > (v < 16 ? 13 : 12)) continue;
          if (b > r + 10) continue; // exposed blade steel
          const shirt = v < 17 || (row === 3 && v < 26 && Math.abs(u) > 7);
          const boot = v > 29;
          const lum = (r * 0.3 + g * 0.5 + b * 0.2) / 255;
          const shade = 0.55 + 0.45 * lum;
          const color = shirt
            ? [222, 216, 193]
            : boot
              ? [83, 63, 44]
              : [107, 87, 66];
          for (let k = 0; k < 3; k++)
            pixels[q + k] = Math.round(color[k] * shade);
        }
      // Shirt centre provides the real linen collar/folds rather than plate trim.
      if (row === 3) continue; // cloth cloak already conceals the back
      const box = pose.box,
        part = parts[row === 0 ? 0 : row === 1 ? 1 : 2];
      for (let y = 0; y < box.h; y++)
        for (let x = 0; x < box.w; x++) {
          const px = box.x + x,
            py = box.y + y;
          if (px < 1 || px > 62 || py < 1 || py > 60) continue;
          const q = at(col, row, px, py);
          if (image.pixels[q + 3] < 150) continue;
          if (
            shield &&
            px >= shield.x0 &&
            px <= shield.x1 &&
            py >= shield.y0 &&
            py <= shield.y1
          )
            continue;
          let u = (x + 0.5) / box.w,
            v = (y + 0.5) / box.h;
          if (dead) [u, v] = [v, 1 - u];
          const sx = Math.floor(
            part.x0 + (0.26 + u * 0.48) * (part.x1 - part.x0),
          );
          const sy = Math.floor(
            part.y0 + (0.04 + v * 0.87) * (part.y1 - part.y0),
          );
          const source = (sy * art.width + sx) * 4;
          if (art.pixels[source + 3] < 200) continue;
          // Keep garment colours neutral so exposed skin detection remains reliable.
          for (let k = 0; k < 3; k++) pixels[q + k] = art.pixels[source + k];
        }
    }
  // Match the approved mirrored locomotion exactly, including contact poses.
  if (["idle", "walk", "run1"].includes(name))
    for (let col = 0; col < cols; col++)
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const src = at(col, 2, 63 - x, y),
            dest = at(col, 1, x, y);
          pixels.copy(pixels, dest, src, src + 4);
        }
  writeFileSync(
    new URL(`${name}.png`, folder),
    encodeRgba(image.width, image.height, pixels),
  );
}
console.log("Roupas iniciais de linho e couro aplicadas às seis animações.");
