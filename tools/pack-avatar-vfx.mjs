import { readFileSync, writeFileSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
const folder = new URL("../art/warrior/", import.meta.url);
const source = decodeRgba(
  readFileSync(new URL("source/avatar-vfx.png", folder)),
);
function part(cell, size, frames = 1) {
  const out = Buffer.alloc(size * size * frames * 4),
    cw = source.width / 2,
    ch = source.height / 2;
  for (let frame = 0; frame < frames; frame++) {
    const t = frames === 1 ? 1 : frame / (frames - 1),
      alpha = frames === 1 ? 1 : Math.sin(Math.PI * t);
    const scale = frames === 1 ? 1 : 0.7 + 0.3 * t;
    for (let y = 4; y < size - 4; y++)
      for (let x = 4; x < size - 4; x++) {
        const u = (x - size / 2) / (size - 8) / scale + 0.5,
          v = (y - size / 2) / (size - 8) / scale + 0.5;
        if (u < 0 || v < 0 || u >= 1 || v >= 1) continue;
        const sx = Math.floor(((cell % 2) + u) * cw),
          sy = Math.floor((Math.floor(cell / 2) + v) * ch);
        const q = (sy * source.width + sx) * 4,
          at = (y * size * frames + frame * size + x) * 4;
        source.pixels.copy(out, at, q, q + 3);
        out[at + 3] = Math.round(source.pixels[q + 3] * alpha);
      }
  }
  return encodeRgba(size * frames, size, out);
}
for (const [name, cell, size, frames] of [
  ["guerreiro-avatar-aura", 0, 128, 1],
  ["guerreiro-avatar-corte", 1, 128, 16],
  ["guerreiro-avatar-ativacao", 2, 128, 1],
  ["avatar-da-luz", 3, 64, 1],
])
  writeFileSync(
    new URL((name === "avatar-da-luz" ? "" : "vfx/") + name + ".png", folder),
    part(cell, size, frames),
  );
console.log("Avatar: aura, coroa de ativação, corte e ícone empacotados.");
