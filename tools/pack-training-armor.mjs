// Pack the original painted cuirass into each existing body pose. The source
// character, face, limbs, sword, shield and authored animation stay intact.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
const art = decodeRgba(
  readFileSync(new URL("source/training-cuirass.png", folder)),
);
const parts = [];
for (let row = 0; row < 2; row++)
  for (let col = 0; col < 2; col++) {
    let x0 = art.width,
      y0 = art.height,
      x1 = 0,
      y1 = 0;
    for (let y = (row * art.height) / 2; y < ((row + 1) * art.height) / 2; y++)
      for (let x = (col * art.width) / 2; x < ((col + 1) * art.width) / 2; x++)
        if (art.pixels[(y * art.width + x) * 4 + 3] > 220) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    parts.push({ x0, y0, x1, y1 });
  }
const skin = (r, g, b) =>
  r > 135 && r - g > 22 && r - g < 110 && g - b > 5 && g - b < 70;
function faceOf(image, col, row) {
  const seen = new Set(),
    blobs = [];
  for (let y = 6; y < 59; y++)
    for (let x = 12; x < 52; x++) {
      const key = y * 64 + x,
        at = ((row * 64 + y) * image.width + col * 64 + x) * 4;
      if (
        seen.has(key) ||
        image.pixels[at + 3] < 200 ||
        !skin(...image.pixels.subarray(at, at + 3))
      )
        continue;
      const queue = [key];
      seen.add(key);
      let x0 = x,
        y0 = y,
        x1 = x,
        y1 = y;
      for (let q = 0; q < queue.length; q++) {
        const p = queue[q],
          px = p % 64,
          py = Math.floor(p / 64);
        x0 = Math.min(x0, px);
        y0 = Math.min(y0, py);
        x1 = Math.max(x1, px);
        y1 = Math.max(y1, py);
        for (const next of [p - 1, p + 1, p - 64, p + 64]) {
          const nx = next % 64,
            ny = Math.floor(next / 64);
          if (
            nx < 12 ||
            nx >= 52 ||
            ny < 6 ||
            ny >= 59 ||
            seen.has(next) ||
            Math.abs(nx - px) > 1
          )
            continue;
          const i = ((row * 64 + ny) * image.width + col * 64 + nx) * 4;
          if (
            image.pixels[i + 3] > 200 &&
            skin(...image.pixels.subarray(i, i + 3))
          ) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      blobs.push({ x0, y0, x1, y1, count: queue.length });
    }
  // Hands may now be bare: prefer skin beneath the brown hair rather than
  // choosing the largest warm-coloured blob (which could be a raised hand).
  const score = (f) => {
    let hair = 0;
    for (let y = Math.max(1, f.y0 - 7); y < f.y0; y++)
      for (let x = Math.max(1, f.x0 - 2); x <= Math.min(62, f.x1 + 2); x++) {
        const i = ((row * 64 + y) * image.width + col * 64 + x) * 4;
        const [r, g, b, a] = image.pixels.subarray(i, i + 4);
        if (a > 180 && r > 40 && r < 170 && g < 115 && r - g > 13 && g > b)
          hair++;
      }
    return f.count + hair * 2 - (f.y0 > 40 ? 15 : 0);
  };
  return blobs.sort((a, b) => score(b) - score(a))[0];
}
const icon = Buffer.alloc(64 * 64 * 4),
  front = parts[0];
for (let y = 3; y < 61; y++)
  for (let x = 5; x < 59; x++) {
    const sx = Math.floor(front.x0 + ((x - 5) / 54) * (front.x1 - front.x0)),
      sy = Math.floor(front.y0 + ((y - 3) / 58) * (front.y1 - front.y0));
    art.pixels.copy(
      icon,
      (y * 64 + x) * 4,
      (sy * art.width + sx) * 4,
      (sy * art.width + sx) * 4 + 4,
    );
  }
writeFileSync(
  new URL("training-cuirass-icon.png", folder),
  encodeRgba(64, 64, icon),
);
mkdirSync(new URL("training/", folder), { recursive: true });
const manifest = {
  item: "peitoral-local",
  look: "humano-guerreiro-peitoral-treino",
  poses: [],
};
for (const [name, cols] of Object.entries(WARRIOR_SHEETS)) {
  const image = decodeRgba(readFileSync(new URL(name + ".png", folder))),
    pixels = Buffer.from(image.pixels);
  const reference = image;
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < cols; col++) {
      const face = faceOf(reference, col, row === 3 ? 0 : row);
      if (!face) continue;
      const dead = name === "special" && col === 5;
      const cx = (face.x0 + face.x1) / 2;
      let box = dead
        ? { x: face.x1 + 1, y: Math.max(1, face.y0 - 1), w: 14, h: 10 }
        : {
            x: Math.round(cx - (row === 0 ? 6 : 5)),
            y: face.y1 + 1,
            w: row === 0 ? 13 : 10,
            h: face.y1 > 30 ? 10 : 12,
          };
      const part = parts[row === 0 ? 0 : row === 1 ? 1 : row === 2 ? 2 : 3];
      let changed = 0;
      for (let y = 0; y < box.h; y++)
        for (let x = 0; x < box.w; x++) {
          const px = box.x + x,
            py = box.y + y;
          if (px < 1 || px > 62 || py < 1 || py > 60) continue;
          const at = ((row * 64 + py) * image.width + col * 64 + px) * 4;
          const [r, g, b, a] = image.pixels.subarray(at, at + 4);
          // Preserve exposed skin, weapon/shield blue, dark glove occlusion and outlines.
          if (a < 200 || skin(r, g, b) || b > r + 10 || Math.min(r, g, b) < 65)
            continue;
          let u = (x + 0.5) / box.w,
            v = (y + 0.5) / box.h;
          if (dead) [u, v] = [v, 1 - u];
          const sx = Math.floor(part.x0 + u * (part.x1 - part.x0)),
            sy = Math.floor(part.y0 + v * (part.y1 - part.y0));
          const q = (sy * art.width + sx) * 4,
            alpha = art.pixels[q + 3] / 255;
          if (alpha < 0.6) continue;
          for (let k = 0; k < 3; k++)
            pixels[at + k] = Math.round(
              art.pixels[q + k] * alpha + pixels[at + k] * (1 - alpha),
            );
          changed++;
        }
      manifest.poses.push({ sheet: name, row, col, face, box, changed });
    }
  writeFileSync(
    new URL("training/" + name + ".png", folder),
    encodeRgba(image.width, image.height, pixels),
  );
}
writeFileSync(
  new URL("training/manifest.json", folder),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Peitoral de treino empacotado sem alterar as folhas originais.");
