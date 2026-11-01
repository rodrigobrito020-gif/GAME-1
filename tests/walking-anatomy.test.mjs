import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
import { CHARACTER_ART as ART } from "../character-art.mjs";
const read = (p) =>
  decodeRgba(readFileSync(new URL("../art/" + p, import.meta.url)));
function bounds(im, row, col) {
  let left = ART.frame,
    right = 0,
    top = ART.frame,
    bottom = 0;
  for (let y = 0; y < ART.frame; y++)
    for (let x = 0; x < ART.frame; x++)
      if (
        im.pixels[
          ((row * ART.frame + y) * im.width + col * ART.frame + x) * 4 + 3
        ] > 100
      ) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  return { left, right, top, bottom, height: bottom - top + 1 };
}
test("whole-figure atlases keep both classes at the same body height, ground line and frame contract in every standing direction", () => {
  const all = [];
  for (const cl of ["warrior", "archer"]) {
    const im = read(cl + "/hd/idle.png");
    assert.equal(im.width, ART.frame * 4);
    assert.equal(im.height, ART.frame * 4);
    for (let row = 0; row < 4; row++) {
      const b = bounds(im, row, 0);
      all.push(b);
      assert.ok(
        Math.abs(b.height - ART.bodyHeight) <= 3,
        `${cl}/${row}: full stature`,
      );
      assert.ok(
        Math.abs(b.bottom - ART.feet[1]) <= 2,
        `${cl}/${row}: common ground`,
      );
      assert.ok(
        b.top > 30,
        "headroom belongs to the frame, not extra body scaling",
      );
    }
    const m = JSON.parse(
      readFileSync(new URL(`../art/${cl}/manifest.json`, import.meta.url)),
    );
    assert.equal(m.method, "whole-authored-figures");
    for (const [sheet, poses] of Object.entries(m.sources))
      for (let row = 0; row < 4; row++) {
        const p = poses.filter((p) => p.row === row);
        assert.equal(
          new Set(p.map((p) => p.sourceScale)).size,
          1,
          `${cl}/${sheet}/${row}: no per-pose fitting`,
        );
        assert.ok(
          p.every(
            (p) =>
              Math.abs(p.sourceScale * p.sourceBodyHeight - ART.bodyHeight) <
              0.001,
          ),
        );
      }
  }
  assert.ok(
    Math.max(...all.map((b) => b.height)) -
      Math.min(...all.map((b) => b.height)) <=
      3,
    "human and elf must share stature",
  );
});
test("standing artwork has a continuous lower body and its visible belt leaves full-length legs rather than a compressed lower half", () => {
  for (const cl of ["warrior", "archer"]) {
    const im = read(cl + "/hd/idle.png"),
      b = bounds(im, 0, 0),
      px = (x, y) =>
        im.pixels.subarray((y * im.width + x) * 4, (y * im.width + x) * 4 + 4);
    const belt = [];
    for (
      let y = Math.round(b.top + b.height * 0.33);
      y < b.top + b.height * 0.58;
      y++
    )
      for (let x = 176; x < 210; x++) {
        const [r, g, blue, a] = px(x, y);
        if (a > 180 && r > 110 && g > 65 && blue < g * 0.65) belt.push(y);
      }
    assert.ok(belt.length, "painted belt must be visible");
    belt.sort((a, b) => a - b);
    const y = belt[Math.floor(belt.length / 2)];
    assert.ok(
      (b.bottom - y) / b.height >= 0.46,
      cl + ": legs must occupy at least 46% of complete standing figure",
    );
    const queue = [],
      seen = new Set();
    for (let yy = y - 2; yy < y + 3; yy++)
      for (let x = 176; x < 210; x++)
        if (px(x, yy)[3] > 100) {
          queue.push(yy * ART.frame + x);
          seen.add(yy * ART.frame + x);
        }
    for (let n = 0; n < queue.length; n++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = (queue[n] % ART.frame) + dx,
            yy = Math.floor(queue[n] / ART.frame) + dy,
            k = yy * ART.frame + x;
          if (
            x < 80 ||
            x > 300 ||
            yy < y - 3 ||
            yy >= ART.frame ||
            seen.has(k) ||
            px(x, yy)[3] < 100
          )
            continue;
          seen.add(k);
          queue.push(k);
        }
    assert.ok(
      queue.some((k) => Math.floor(k / ART.frame) >= b.bottom - 2),
      "belt-to-sole silhouette is continuous",
    );
  }
});
