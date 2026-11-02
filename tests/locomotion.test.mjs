import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { locomotionPose } from "../character-locomotion.mjs";
import { CHARACTER_ART as ART } from "../character-art.mjs";
import { warriorRig } from "../warrior.mjs";
import { decodeRgba } from "../png.mjs";
const base = { sheet: "walk", row: 2, col: 0, cycle: 0, x: 0, y: 0, now: 0 };
test("visible walking follows native distance phase through all eight poses and retains the step across direction changes", () => {
  const state = {};
  locomotionPose(state, base);
  const frames = [];
  for (let i = 0; i < 16; i++) {
    const p = locomotionPose(state, {
      ...base,
      x: i + 1,
      cycle: i / 8,
      now: 16 + i * 16,
      row: i < 8 ? 2 : 1,
    });
    frames.push(p.col);
    assert.equal(p.row, i < 8 ? 2 : 1);
  }
  assert.deepEqual(frames, [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
  const rig = warriorRig({
    loops: { walk: {}, run: {} },
    moves: {},
    basic: {},
    skills: {},
  });
  assert.equal(rig.loops.walk.stride, ART.walkStride);
  assert.equal(rig.loops.run.stride, ART.walkStride);
});
test("blocked or stopped movement settles once then rests, without cycling legs in place or carrying motion across a teleport", () => {
  const state = {};
  locomotionPose(state, base);
  locomotionPose(state, { ...base, x: 10, cycle: 0.1, now: 16 });
  const stop = [];
  for (let now = 32; now <= 400; now += 16)
    stop.push(locomotionPose(state, { ...base, x: 10, cycle: 0.1, now }));
  assert.ok(
    stop.some((p) => p.sheet === "walk" && p.col === 2),
    "finish at a passing/support pose",
  );
  assert.equal(stop.at(-1).sheet, "idle");
  assert.equal(
    locomotionPose(state, { ...base, x: 10, now: 2000 }).sheet,
    "idle",
  );
  locomotionPose(state, { ...base, x: 11, cycle: 0.6, now: 2016 });
  assert.equal(
    locomotionPose(state, { ...base, sheet: "idle", x: 900, now: 2032 }).sheet,
    "idle",
  );
});
test("skill actions and dash references retain their authored frame, with no walking or stop-pose override", () => {
  const state = {};
  locomotionPose(state, base);
  locomotionPose(state, { ...base, x: 5, now: 16 });
  assert.deepEqual(
    locomotionPose(state, {
      ...base,
      sheet: "axeheavy",
      col: 3,
      action: true,
      x: 5,
      now: 32,
    }),
    { sheet: "axeheavy", row: 2, col: 3 },
  );
  assert.equal(
    locomotionPose(state, {
      ...base,
      sheet: "run1",
      col: 3,
      cycle: 0,
      action: true,
      x: 30,
      now: 48,
    }).col,
    6,
  );
  assert.equal(
    locomotionPose(state, { ...base, sheet: "idle", x: 30, now: 64 }).sheet,
    "idle",
  );
});
test("authored side walking contains narrow passing poses between wide contacts in all classes, with complete HD and native atlases", () => {
  for (const cl of ["warrior", "archer", "gunslinger"]) {
    const im = decodeRgba(
      readFileSync(new URL(`../art/${cl}/hd/walk.png`, import.meta.url)),
    );
    assert.equal(im.width, ART.frame * 8);
    assert.equal(im.height, ART.frame * 4);
    const spans = [];
    for (let c = 0; c < 8; c++) {
      const xs = [];
      for (let y = ART.feet[1] - 20; y < ART.feet[1] + 2; y++)
        for (let x = 80; x < 310; x++) {
          const p = ((2 * ART.frame + y) * im.width + c * ART.frame + x) * 4;
          const [r, g, b, a] = im.pixels.subarray(p, p + 4);
          if (a > 180 && r > 45 && r > g * 1.1 && g > b * 1.05) xs.push(x);
        }
      assert.ok(xs.length, `${cl}/${c} has a grounded boot`);
      spans.push(Math.max(...xs) - Math.min(...xs));
    }
    assert.ok(
      spans[2] < spans[0] * 0.65,
      cl + ": first passing phase closes the stride",
    );
    assert.ok(
      spans[6] < spans[4] * 0.65,
      cl + ": second passing phase closes the stride",
    );
    const native = decodeRgba(
      readFileSync(new URL(`../art/${cl}/walk.png`, import.meta.url)),
    );
    assert.equal(native.width, 64 * 4);
  }
});
