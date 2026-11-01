import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
test("starter equipment material preserves approved body, attachment points and alpha in every animation; equipped armor cannot repaint weapons", () => {
  const read = (p) =>
    decodeRgba(readFileSync(new URL("../art/warrior/" + p, import.meta.url)));
  for (const [sheet, cols] of Object.entries(WARRIOR_SHEETS)) {
    const before = read(`weapon-reference/${sheet}.png`),
      after = read(`${sheet}.png`),
      mask = read(`weapon-masks/${sheet}.png`),
      armor = read(`training/${sheet}.png`);
    assert.equal(mask.width, cols * 64);
    assert.equal(mask.height, 256);
    let changed = 0;
    for (let i = 0; i < after.pixels.length; i += 4) {
      assert.equal(
        after.pixels[i + 3],
        before.pixels[i + 3],
        `${sheet}: silhouette and transparency`,
      );
      if (!mask.pixels[i + 3])
        assert.deepEqual(
          after.pixels.subarray(i, i + 4),
          before.pixels.subarray(i, i + 4),
          `${sheet}: approved body outside equipment`,
        );
      else {
        assert.deepEqual(
          after.pixels.subarray(i, i + 4),
          armor.pixels.subarray(i, i + 4),
          `${sheet}: same equipment with chest equipped`,
        );
        if (
          !after.pixels
            .subarray(i, i + 3)
            .equals(before.pixels.subarray(i, i + 3))
        )
          changed++;
      }
    }
    assert.equal(
      changed,
      0,
      `${sheet}: equipment is painted in the complete source figure; no body recolouring`,
    );
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < cols; col++) {
        let count = 0;
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++)
            if (
              mask.pixels[((row * 64 + y) * mask.width + col * 64 + x) * 4 + 3]
            )
              count++;
        assert.ok(
          (sheet === "special" && col === 5) || count > 5,
          `${sheet}:${row}:${col}: authored weapon glow mask`,
        );
      }
  }
});
