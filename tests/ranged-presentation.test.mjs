import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { rangedMotion, nativeMoveName } from "../ranged-motion.mjs";
import {
  rainBursts,
  fallingPoint,
  impactFrame,
  RANGED_ATLAS,
} from "../ranged-vfx.mjs";
import { rainPose } from "../archer-vfx.mjs";
import { gunslingerRainPose } from "../gunslinger-vfx.mjs";
import { ARCHER_ACTIONS } from "../archer.mjs";
import { GUNSLINGER_RAIN } from "../gunslinger.mjs";
import { decodeRgba } from "../png.mjs";
const actions = [
  ["arqueira", "elfa-flecha", 500],
  ["arqueira", "elfa-perfurante", 550],
  ["arqueira", "elfa-chuva", 650],
  ["arqueira", "elfa-bencao", 600],
  ["arqueira", "elfa-espirito", 650],
  ["pistoleira", "dark-elf-tiros", 500],
  ["pistoleira", "dark-elf-disparo", 550],
  ["pistoleira", "dark-elf-rajada", 900],
  ["pistoleira", "dark-elf-instinto", 600],
  ["pistoleira", "dark-elf-eclipse", 600],
];
test("ranged action weight is continuous, bounded, returns to rest and never alters scale", () => {
  for (const [cls, move, duration] of actions)
    for (let row = 0; row < 4; row++) {
      let last = rangedMotion(cls, move, 0, row),
        distance = 0;
      for (let age = 1; age <= duration + 100; age++) {
        const current = rangedMotion(cls, move, age, row);
        assert.deepEqual(Object.keys(current), ["x", "y", "angle"]);
        assert.ok(
          Math.abs(current.x) < 6 &&
            Math.abs(current.y) < 4 &&
            Math.abs(current.angle) < 2,
        );
        assert.ok(
          Math.hypot(current.x - last.x, current.y - last.y) < 0.4,
          `${move} has no snap at ${age}`,
        );
        distance += Math.hypot(current.x - last.x, current.y - last.y);
        last = current;
      }
      assert.ok(distance > 1, move + " has real movement");
      for (const value of Object.values(last))
        assert.ok(Math.abs(value) < 1e-10);
    }
  for (const cls of ["guerreiro", "arqueira", "pistoleira"])
    for (const move of [
      "walk",
      "idle",
      "dash",
      "elfa-esquiva",
      "dark-elf-esquiva",
      "avanco-de-luz",
      "",
    ])
      assert.deepEqual(rangedMotion(cls, move, 200, 2), {
        x: 0,
        y: 0,
        angle: 0,
      });
  const record = { id: "elfa-chuva" };
  assert.equal(nativeMoveName({ act: { move: record } }), "elfa-chuva");
  assert.equal(nativeMoveName({}), "");
});
test("accelerating rain bursts coincide with actual falling projectile positions and damage times", () => {
  for (const cls of ["arqueira", "pistoleira"]) {
    const gun = cls === "pistoleira",
      hits = gun ? GUNSLINGER_RAIN.impactsMs : ARCHER_ACTIONS.rain.impactsMs,
      pose = gun ? gunslingerRainPose : rainPose,
      fx = { id: "rain-1", x: 400, y: 600, radius: 125, releaseMs: 350 };
    assert.equal(rainBursts(cls, fx, hits[0] - 1).length, 0);
    for (const [wave, time] of hits.entries()) {
      const falling = pose(fx, time - 1).drops,
        bursts = rainBursts(cls, fx, time).filter((b) => b.wave === wave);
      assert.equal(bursts.length, 8);
      for (const b of bursts) {
        const d = falling.find((d) => d.index === b.index && d.wave === wave);
        assert.equal(b.x, d.x);
        assert.equal(b.y, d.ground);
        assert.equal(b.age, 0);
        assert.ok(
          Math.abs(fallingPoint(d, gun ? 170 : 155).y - d.ground) < 1.5,
        );
      }
      assert.deepEqual(rainBursts(cls, fx, time), rainBursts(cls, fx, time));
      assert.equal(
        rainBursts(cls, fx, time + 500).filter((b) => b.wave === wave).length,
        0,
      );
    }
  }
  assert.equal(impactFrame(-1), null);
  assert.equal(impactFrame(0), 0);
  assert.equal(impactFrame(499), 15);
  assert.equal(impactFrame(500), null);
});
test("both authored impact atlases contain sixteen different images with transparent gutters and fixed cells", () => {
  for (const cls of ["arqueira", "pistoleira"]) {
    const im = decodeRgba(
      readFileSync(new URL(`../art/ranged/${cls}-impact.png`, import.meta.url)),
    );
    assert.equal(im.width, 640);
    assert.equal(im.height, 640);
    const hashes = [];
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const data = Buffer.alloc(160 * 160 * 4);
        let ink = 0;
        for (let y = 0; y < 160; y++)
          for (let x = 0; x < 160; x++) {
            const i = ((row * 160 + y) * im.width + col * 160 + x) * 4,
              j = (y * 160 + x) * 4;
            for (let c = 0; c < 4; c++) data[j + c] = im.pixels[i + c];
            if (x < 16 || x >= 144 || y < 16 || y >= 144)
              assert.equal(im.pixels[i + 3], 0);
            if (im.pixels[i + 3] > 1) ink++;
          }
        assert.ok(ink > 0);
        hashes.push(createHash("sha256").update(data).digest("hex"));
      }
    assert.equal(new Set(hashes).size, 16);
  }
});
test("animated impacts advance frames at constant size, deduplicate snapshots, follow targets, expire and clean up", async () => {
  let now = 0;
  const callbacks = new Map(),
    listeners = new Map(),
    objects = [];
  class Img {
    decode() {
      return Promise.resolve();
    }
  }
  const scene = {
    add: {
      image(x, y, key, frame) {
        const sprite = {
          x,
          y,
          key,
          frame,
          active: true,
          setFrame(v) {
            this.frame = v;
            return this;
          },
          setPosition(x, y) {
            this.x = x;
            this.y = y;
            return this;
          },
          setDisplaySize(w, h) {
            this.width = w;
            this.height = h;
            return this;
          },
          setAngle() {
            return this;
          },
          setAlpha(a) {
            this.alpha = a;
            return this;
          },
          setDepth() {
            return this;
          },
          setBlendMode() {
            return this;
          },
          destroy() {
            this.active = false;
          },
        };
        objects.push(sprite);
        return sprite;
      },
    },
    textures: {
      keys: new Set(),
      exists(k) {
        return this.keys.has(k);
      },
      addSpriteSheet(k) {
        this.keys.add(k);
        return { setFilter() {} };
      },
    },
    events: {
      on(e, fn) {
        callbacks.set(e, fn);
      },
      once(e, fn) {
        callbacks.set(e, fn);
      },
      off(e) {
        callbacks.delete(e);
      },
    },
  };
  const window = { addEventListener: (n, f) => listeners.set(n, f) };
  const code = readFileSync(
    new URL("../ranged-effects.js", import.meta.url),
    "utf8",
  ).replace(/^import[^;]+;/, "");
  vm.runInNewContext(code, {
    window,
    Image: Img,
    performance: { now: () => now },
    Map,
    RANGED_ATLAS,
    ATLAS: RANGED_ATLAS,
    impactFrame,
  });
  await Promise.resolve();
  await Promise.resolve();
  const fx = window.__royalRangedFx;
  assert.ok(fx.ready());
  const target = { x: 10, y: 20, root: { active: true } };
  fx.emit(scene, "hit:1", "arqueira", 10, 15, 0, {
    size: 112,
    follow: target,
    offsetY: -5,
  });
  now = 125;
  callbacks.get("postupdate")();
  assert.equal(objects[0].frame, 4);
  assert.equal(objects[0].width, 112);
  target.x = 30;
  target.y = 50;
  now = 250;
  callbacks.get("postupdate")();
  assert.equal(objects[0].frame, 8);
  assert.equal(objects[0].x, 30);
  assert.equal(objects[0].y, 45);
  fx.emit(scene, "hit:1", "arqueira", 10, 15, 0);
  assert.equal(objects.length, 1);
  assert.equal(objects[0].frame, 8);
  now = 501;
  callbacks.get("postupdate")();
  assert.equal(objects[0].active, false);
  fx.emit(scene, "hit:1", "arqueira", 10, 15, 0);
  assert.equal(objects.length, 1, "no resurrection from a stale snapshot");
  fx.emit(scene, "rain:2", "pistoleira", 50, 60, 100, { ground: true });
  assert.equal(objects.at(-1).frame, 3);
  assert.equal(objects.at(-1).royalSkillImpact, false);
  listeners.get("royal-skill-scene-reset")();
  assert.ok(objects.every((o) => !o.active));
  fx.emit(scene, "hit:1", "arqueira", 10, 15, 0);
  assert.equal(objects.length, 3, "reset permits new scene IDs");
  callbacks.get("shutdown")();
  assert.ok(objects.every((o) => !o.active));
  assert.equal(callbacks.has("postupdate"), false);
});
