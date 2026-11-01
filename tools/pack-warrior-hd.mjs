// Re-sample the original authored poses at 128px, rather than magnifying 64px.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
const dir = new URL("../art/warrior/", import.meta.url),
  read = (p) => decodeRgba(readFileSync(new URL(p, dir)));
for (const look of ["hd", "hd/training"])
  mkdirSync(new URL(look + "/", dir), { recursive: true });
for (const [sheet, cols] of Object.entries(WARRIOR_SHEETS)) {
  const raw = read(`hd-reference/${sheet}.png`),
    base = read(`${sheet}.png`),
    mask = read(`weapon-masks/${sheet}.png`),
    trained = read(`training/${sheet}.png`),
    out = Buffer.from(raw.pixels),
    armor = Buffer.from(raw.pixels),
    hmask = Buffer.alloc(raw.pixels.length);
  for (let y = 0; y < raw.height; y++)
    for (let x = 0; x < raw.width; x++) {
      const i = (y * raw.width + x) * 4,
        q = (Math.floor(y / 2) * base.width + Math.floor(x / 2)) * 4;
      if (!out[i + 3]) continue;
      if (mask.pixels[q + 3]) {
        const lum = (raw.pixels[i] + raw.pixels[i + 1] + raw.pixels[i + 2]) / 3,
          oldLum =
            (base.pixels[q] + base.pixels[q + 1] + base.pixels[q + 2]) / 3;
        const detail = Math.max(0.74, Math.min(1.18, 0.86 + lum / 800));
        for (let c = 0; c < 3; c++)
          out[i + c] = Math.min(255, Math.round(base.pixels[q + c] * detail));
        hmask[i] = hmask[i + 1] = hmask[i + 2] = 255;
        hmask[i + 3] = out[i + 3];
      }
      out.copy(armor, i, i, i + 4);
      if (
        !mask.pixels[q + 3] &&
        !base.pixels
          .subarray(q, q + 3)
          .equals(trained.pixels.subarray(q, q + 3))
      ) {
        for (let c = 0; c < 3; c++) armor[i + c] = trained.pixels[q + c];
      }
    }
  writeFileSync(
    new URL(`hd/${sheet}.png`, dir),
    encodeRgba(raw.width, raw.height, out),
  );
  writeFileSync(
    new URL(`hd/training/${sheet}.png`, dir),
    encodeRgba(raw.width, raw.height, armor),
  );
  writeFileSync(
    new URL(`hd/${sheet}-mask.png`, dir),
    encodeRgba(raw.width, raw.height, hmask),
  );
}
console.log(
  "128px: detalhes reamostrados das artes originais, mesmas poses e escala no mundo.",
);
