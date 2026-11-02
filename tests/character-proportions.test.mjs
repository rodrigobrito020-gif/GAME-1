import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { characterDisplayScale } from "../character-proportions.mjs";
import { decodeRgba } from "../png.mjs";
const read = (cl, sheet) =>
  decodeRgba(
    readFileSync(new URL(`../art/${cl}/hd/${sheet}.png`, import.meta.url)),
  );
function frame(im, row, col) {
  const result = Buffer.alloc(384 * 384 * 4);
  for (let y = 0; y < 384; y++)
    Buffer.from(
      im.pixels.buffer,
      im.pixels.byteOffset + ((row * 384 + y) * im.width + col * 384) * 4,
      384 * 4,
    ).copy(result, y * 384 * 4);
  return result;
}
test("ranged characters keep identical world scale across native pixel fitting and squash; warrior uses the approved transform", () => {
  for (const cl of ["arqueira", "pistoleira"])
    for (const [x, y] of [
      [2, 2],
      [2.15, 1.85],
      [1.9, 2.1],
      [-2, 2],
    ])
      assert.deepEqual(characterDisplayScale(cl, { scaleX: x, scaleY: y }), {
        x: 0.5,
        y: 0.5,
      });
  assert.deepEqual(
    characterDisplayScale("guerreiro", { scaleX: 2.12, scaleY: 2.04 }),
    { x: 0.53, y: 0.51 },
  );
});
test("idle, recovery and neutral buff frames reuse the same complete model without changing body proportions", () => {
  for (const cl of ["archer", "gunslinger"]) {
    const sheets = Object.fromEntries(
      ["idle", "weapon", "special", "axeheavy"].map((s) => [s, read(cl, s)]),
    );
    for (let row = 0; row < 4; row++) {
      const expected = frame(sheets.idle, row, 0);
      for (const [sheet, cols] of [
        ["idle", [1, 2, 3]],
        ["weapon", [0, 5]],
        ["special", [0, 1, 3]],
        ["axeheavy", [0, 7]],
      ])
        for (const col of cols)
          assert.deepEqual(
            frame(sheets[sheet], row, col),
            expected,
            `${cl}/${row}/${sheet}/${col}: one neutral body`,
          );
    }
  }
});
test("new action atlases retain a single calibration per direction and standing reactions have full boots", () => {
  for (const cl of ["archer", "gunslinger"]) {
    const m = JSON.parse(
      readFileSync(new URL(`../art/${cl}/manifest.json`, import.meta.url)),
    );
    assert.equal(m.bodyModel, cl + "-v36");
    for (const [sheet, poses] of Object.entries(m.sources))
      for (let row = 0; row < 4; row++) {
        const p = poses.filter((p) => p.row === row);
        for (const source of new Set(p.map((p) => p.sourceAtlas))) {
          assert.equal(
            new Set(
              p
                .filter((p) => p.sourceAtlas === source)
                .map((p) => p.sourceScale),
            ).size,
            1,
            `${cl}/${sheet}/${row}/${source}: fixed source calibration`,
          );
        }
      }
    for (const p of m.sources.special.filter((p) => p.col === 0))
      assert.ok(
        p.bounds[3] >= 350 && p.bounds[3] - p.bounds[1] >= 220,
        "neutral standing has complete lower body",
      );
  }
});
