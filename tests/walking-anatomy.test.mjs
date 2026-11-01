import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
import { warriorWalkPose } from "../warrior-walk-rig.mjs";

test("standing silhouettes keep full leg proportions and a connected path from each hip through its knee to the sole in all directions", () => {
  for (const cl of ["warrior", "archer"]) {
    const im = decodeRgba(
      readFileSync(new URL(`../art/${cl}/hd/idle.png`, import.meta.url)),
    );
    for (let row = 0; row < 4; row++)
      for (let phase = 0; phase < 4; phase++) {
        const solid = (x, y) =>
          x >= 0 &&
          x < 128 &&
          y >= 0 &&
          y < 128 &&
          im.pixels[((row * 128 + y) * im.width + phase * 128 + x) * 4 + 3] >
            100;
        let top = 128;
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) if (solid(x, y)) top = Math.min(top, y);
        const pose = warriorWalkPose(row, phase, true);
        assert.ok(
          (118 - pose.pelvis[1] * 2) / (118 - top) >= 0.46,
          `${cl}/${row}/${phase}: legs must occupy almost half the standing height`,
        );
        for (const leg of pose.legs) {
          const flip = row === 2,
            xAt = (x) => (flip ? 127 - Math.round(x * 2) : Math.round(x * 2));
          const hx = xAt(leg.hip[0]),
            hy = Math.round(leg.hip[1] * 2),
            fx = xAt(leg.foot[0]),
            fy = Math.round(leg.foot[1] * 2);
          const seen = new Set(),
            queue = [];
          for (let dy = -4; dy <= 4; dy++)
            for (let dx = -4; dx <= 4; dx++)
              if (solid(hx + dx, hy + dy)) {
                const key = (hy + dy) * 128 + hx + dx;
                seen.add(key);
                queue.push(key);
              }
          for (let n = 0; n < queue.length; n++)
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const x = (queue[n] % 128) + dx,
                  y = Math.floor(queue[n] / 128) + dy,
                  key = y * 128 + x;
                if (
                  y < hy - 5 ||
                  x < 24 ||
                  x > 104 ||
                  seen.has(key) ||
                  !solid(x, y)
                )
                  continue;
                seen.add(key);
                queue.push(key);
              }
          assert.ok(
            queue.some(
              (k) =>
                Math.abs((k % 128) - fx) <= 8 && Math.floor(k / 128) >= fy - 4,
            ),
            `${cl}/${row}/${phase}: disconnected hip/knee/boot`,
          );
        }
      }
  }
});

test("side idle legs rest straight; walking has alternating support, reachable knees and restrained foot lift", () => {
  for (const row of [1, 2]) {
    for (const leg of warriorWalkPose(row, 0, true).legs) {
      const [hx, hy] = leg.hip,
        [kx, ky] = leg.knee,
        [fx, fy] = leg.foot;
      assert.ok(
        Math.abs((kx - hx) * (fy - hy) - (ky - hy) * (fx - hx)) < 0.01,
        "idle must not hold a permanent crouch",
      );
    }
    for (let phase = 0; phase < 4; phase++)
      for (const leg of warriorWalkPose(row, phase).legs) {
        assert.ok(
          Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]) < 15,
        );
        assert.ok(
          Math.hypot(leg.foot[0] - leg.knee[0], leg.foot[1] - leg.knee[1]) < 15,
        );
        assert.ok(
          59 - leg.foot[1] <= 4,
          "walking must not lift a foot into the torso",
        );
      }
  }
});
