import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
const sheets = ["idle", "walk", "run1", "weapon", "axeheavy", "special"];
const read = (p) =>
  decodeRgba(readFileSync(new URL("../art/" + p, import.meta.url)));
test("attached light uses every approved pose alpha, protects the face and has an actual silhouette halo", () => {
  for (const look of ["archer", "gunslinger", "warrior", "warrior-training"])
    for (const sheet of sheets) {
      const base = read(
          `${look === "warrior-training" ? "warrior/hd/training" : look + "/hd"}/${sheet}.png`,
        ),
        surface = read(`energy/${look}/${sheet}-surface.png`),
        rim = read(`energy/${look}/${sheet}-contour.png`);
      assert.equal(surface.width, base.width);
      assert.equal(surface.height, base.height);
      assert.equal(rim.width, base.width);
      assert.equal(rim.height, base.height);
      let interior = 0,
        outside = 0;
      for (let p = 3; p < base.pixels.length; p += 4) {
        assert.ok(surface.pixels[p] <= base.pixels[p]);
        if (surface.pixels[p] > 50) interior++;
        if (base.pixels[p] === 0 && rim.pixels[p] > 10) outside++;
      }
      assert.ok(interior > 1000);
      assert.ok(outside > 1000);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < base.width / 384; col++)
          for (let y = 135; y < 180; y += 3)
            for (let x = 168; x < 216; x += 3) {
              const p = ((row * 384 + y) * base.width + col * 384 + x) * 4 + 3;
              assert.ok(
                surface.pixels[p] <= Math.ceil(base.pixels[p] * 0.13),
                "face stays readable",
              );
            }
    }
});
test("aura emitters sit on the real body in all directions, including eight HD walking phases", () => {
  for (const look of ["archer", "gunslinger", "warrior", "warrior-training"]) {
    const meta = JSON.parse(
      readFileSync(
        new URL(`../art/energy/${look}/emitters.json`, import.meta.url),
      ),
    );
    for (const sheet of sheets) {
      const base = read(
        `${look === "warrior-training" ? "warrior/hd/training" : look + "/hd"}/${sheet}.png`,
      );
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < base.width / 384; col++) {
          const points = meta[`${sheet}:${row}:${col}`];
          assert.ok(points.length >= 4 && points.length <= 16);
          for (const [x, y] of points)
            assert.ok(
              base.pixels[
                ((row * 384 + y) * base.width + col * 384 + x) * 4 + 3
              ] > 128,
              "particle starts on the current figure",
            );
        }
    }
    assert.ok(meta["walk:3:7"]);
    assert.notDeepEqual(meta["walk:1:0"], meta["walk:2:0"]);
  }
});
