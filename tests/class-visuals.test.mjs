import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
import { classVisuals } from "../class-visuals.mjs";
import { archerRig } from "../archer.mjs";
import { dashTrailPoints } from "../dash-visuals.mjs";
test("dash trail samples the actual swept path, caps silhouettes and ignores teleports or standing still", () => {
  assert.deepEqual(dashTrailPoints({ x: 0, y: 0 }, { x: 0, y: 0 }), []);
  assert.deepEqual(dashTrailPoints({ x: 0, y: 0 }, { x: 500, y: 0 }), []);
  for (const to of [
    { x: 128, y: 0 },
    { x: 0, y: -128 },
    { x: 90, y: 90 },
  ]) {
    const p = dashTrailPoints({ x: 0, y: 0 }, to);
    assert.equal(p.length, 5);
    assert.ok(
      p.every(
        (a) =>
          a.x >= Math.min(0, to.x) &&
          a.x <= Math.max(0, to.x) &&
          a.y >= Math.min(0, to.y) &&
          a.y <= Math.max(0, to.y),
      ),
    );
  }
});
test("elf dash trail and class icon share the class energy while warrior colors remain gold", () => {
  const elf = classVisuals("arqueira"),
    warrior = classVisuals("guerreiro");
  assert.equal(
    archerRig({ moves: {}, basic: {}, skills: {} }).moves["elfa-esquiva"].motion
      .trail.color,
    elf.trailColor,
  );
  assert.equal(elf.color, "#62e89c");
  assert.match(elf.dashIcon, /royal-archer\/dash.png$/);
  assert.equal(warrior.trailColor, 0xffe4a0);
  assert.match(warrior.dashIcon, /royal-warrior/);
  for (const file of [
    "icons/dash.png",
    "icons/tiro-perfurante.png",
    "vfx/aura.png",
  ]) {
    const im = decodeRgba(
      readFileSync(new URL("../art/archer/" + file, import.meta.url)),
    );
    let green = 0,
      gold = 0;
    for (let i = 0; i < im.pixels.length; i += 4) {
      const [r, g, b, a] = im.pixels.subarray(i, i + 4);
      if (a > 100 && g > 90 && g > r * 1.15 && g > b * 1.05) green++;
      if (a > 100 && r > 150 && g > 110 && b < g * 0.9) gold++;
    }
    assert.ok(
      green > im.width * im.height * (file === "vfx/aura.png" ? 0.08 : 0.12),
      file + " must visibly carry forest-green energy",
    );
    if (file === "vfx/aura.png")
      assert.ok(
        gold > im.width * im.height * 0.08,
        "aura carries soft gold alongside emerald",
      );
  }
});
test("elf ultimate aura is a tall transparent body surround rather than only a ground ring", () => {
  const im = decodeRgba(
    readFileSync(new URL("../art/archer/vfx/aura.png", import.meta.url)),
  );
  assert.equal(im.width, 256);
  assert.equal(im.height, 256);
  assert.equal(im.pixels[3], 0);
  let top = 256,
    bottom = 0;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++)
      if (im.pixels[(y * 256 + x) * 4 + 3] > 150) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  assert.ok(bottom - top > 210);
  assert.ok(
    im.pixels[(128 * 256 + 128) * 4 + 3] < 100,
    "open center leaves the player readable",
  );
});

test("high-refresh small movement frames still accumulate into a bounded dash trail", async () => {
  const { updateDashTrail } = await import("../dash-visuals.mjs");
  const image = () => {
    const target = { visible: false };
    let proxy;
    proxy = new Proxy(target, {
      get(t, k) {
        if (String(k).startsWith("set"))
          return (...args) => {
            if (k === "setVisible") t.visible = args[0];
            return proxy;
          };
        return t[k];
      },
    });
    return proxy;
  };
  const actor = {
    x: 0,
    y: 0,
    alive: true,
    dead: false,
    ghosts: [],
    body: { x: 0, y: 0 },
    pose: { alpha: 1 },
    root: { depth: 10, scene: { add: { image } } },
  };
  const body = {
    texture: { key: "elf" },
    frame: { name: "0:0" },
    originX: 0.5,
    originY: 0.9,
    scaleX: 0.5,
    scaleY: 0.5,
    angle: 0,
    flipX: false,
  };
  updateDashTrail(actor, body, true);
  actor.act = { move: { id: "elfa-esquiva" } };
  for (let i = 1; i <= 32; i++) {
    actor.x = i * 4;
    updateDashTrail(actor, body, true);
  }
  assert.ok(actor.ghosts.length > 0);
  assert.ok(actor.ghosts.length <= 5);
  assert.ok(actor.ghosts.every((g) => g.royalLight));
});
