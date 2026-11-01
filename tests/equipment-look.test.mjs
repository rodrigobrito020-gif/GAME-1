import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  equipmentSkin,
  equipmentIdentity,
  TRAINING_ARMOR_LOOK,
} from "../equipment-look.mjs";
import { WARRIOR_SHEETS } from "../warrior.mjs";
import { decodeRgba } from "../png.mjs";
import vm from "node:vm";
import { EventEmitter } from "node:events";

test("equipment appearance derives from an actually equipped chest item without granting a cosmetic skin or changing saved identity", () => {
  const character = {
    identity: {
      skinId: "humano-guerreiro",
      classId: "guerreiro",
      ownedSkins: ["humano-guerreiro"],
    },
    equipment: { slots: [] },
  };
  assert.equal(equipmentSkin(character), "humano-guerreiro");
  character.equipment.slots = [{ slot: 4, item: { defId: "peitoral-local" } }];
  assert.equal(equipmentSkin(character), TRAINING_ARMOR_LOOK);
  assert.equal(equipmentIdentity(character).skinId, TRAINING_ARMOR_LOOK);
  assert.equal(character.identity.skinId, "humano-guerreiro");
  assert.deepEqual(character.identity.ownedSkins, ["humano-guerreiro"]);
  character.equipment.slots = [{ slot: 1, item: { defId: "peitoral-local" } }];
  assert.equal(equipmentSkin(character), "humano-guerreiro");
  character.identity.classId = "mago";
  character.equipment.slots[0].slot = 4;
  assert.equal(equipmentSkin(character), "humano-guerreiro");
});

test("cuirass variants preserve original silhouettes and animation dimensions, face and limbs remain untouched outside authored torso masks", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../art/warrior/training/manifest.json", import.meta.url),
    ),
  );
  for (const [name, cols] of Object.entries(WARRIOR_SHEETS)) {
    const base = decodeRgba(
        readFileSync(new URL(`../art/warrior/${name}.png`, import.meta.url)),
      ),
      equipped = decodeRgba(
        readFileSync(
          new URL(`../art/warrior/training/${name}.png`, import.meta.url),
        ),
      );
    assert.equal(equipped.width, cols * 64);
    assert.equal(equipped.height, 256);
    let changed = 0;
    const byDirection = [0, 0, 0, 0];
    for (let y = 0; y < base.height; y++)
      for (let x = 0; x < base.width; x++) {
        const i = (y * base.width + x) * 4;
        assert.equal(equipped.pixels[i + 3], base.pixels[i + 3]);
        if (
          base.pixels
            .subarray(i, i + 3)
            .equals(equipped.pixels.subarray(i, i + 3))
        )
          continue;
        changed++;
        byDirection[Math.floor(y / 64)]++;
        const row = Math.floor(y / 64),
          col = Math.floor(x / 64),
          pose = manifest.poses.find(
            (p) => p.sheet === name && p.row === row && p.col === col,
          );
        assert.ok(pose);
        const px = x % 64,
          py = y % 64;
        assert.ok(
          px >= pose.box.x &&
            px < pose.box.x + pose.box.w &&
            py >= pose.box.y &&
            py < pose.box.y + pose.box.h,
          "only the chest garment changes",
        );
      }
    assert.ok(changed > 100, `${name} needs a visible equipment variant`);
    assert.ok(
      byDirection.every((n) => n > 20),
      `${name}: equipped chest must also appear from the back without a cape`,
    );
  }
});

test("body protection always draws three readable shields, moves their positions and destroys them on expiry or scene reset", async () => {
  const shield = decodeRgba(
    readFileSync(
      new URL("../art/warrior/vfx/guerreiro-egide-escudo.png", import.meta.url),
    ),
  );
  let left = 128,
    right = 0,
    top = 128,
    bottom = 0;
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++)
      if (shield.pixels[(y * 128 + x) * 4 + 3] > 100) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  assert.ok(
    right - left > 75 && bottom - top > 105,
    "painted shields fill their sprite rather than shrinking inside transparent gutters",
  );
  let now = 0;
  const callbacks = {},
    sprites = [];
  const image = () => {
    const s = {
      visible: true,
      destroyed: false,
      setOrigin() {
        return this;
      },
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      setDisplaySize(w, h) {
        this.w = w;
        this.h = h;
        return this;
      },
      setAlpha(a) {
        this.alpha = a;
        return this;
      },
      setDepth(d) {
        this.depth = d;
        return this;
      },
      setVisible(v) {
        this.visible = v;
        return this;
      },
      destroy() {
        this.destroyed = true;
      },
    };
    sprites.push(s);
    return s;
  };
  const scene = {
    events: new EventEmitter(),
    textures: { exists: () => true },
    add: { image },
    cameras: { main: { zoom: 0.5 } },
    game: {
      events: new EventEmitter(),
      canvas: { getBoundingClientRect: () => ({ width: 1000 }) },
    },
    scale: { width: 1000 },
  };
  const actor = {
    alive: true,
    hidden: false,
    root: { active: true, visible: true, depth: 500, scene },
    x: 300,
    y: 500,
    body: { x: 0, y: 0 },
    height: 120,
  };
  const window = {
    addEventListener: (key, fn) => {
      callbacks[key] = fn;
    },
  };
  vm.runInNewContext(
    readFileSync(new URL("../aegis-visuals.js", import.meta.url), "utf8"),
    {
      window,
      performance: { now: () => now },
      Image: class {
        decode() {
          return Promise.resolve();
        }
      },
      setInterval: () => 0,
    },
  );
  await Promise.resolve();
  const api = window.__royalAegisVisuals;
  api.apply(actor, 12000, false);
  api.update(actor);
  scene.events.emit("postupdate");
  assert.equal(sprites.length, 3);
  assert.ok(sprites.every((s) => s.w * 0.5 >= 38 && s.visible));
  const positions = sprites.map((s) => s.x);
  now = 600;
  api.update(actor);
  scene.events.emit("postupdate");
  assert.ok(sprites.every((s, i) => s.x !== positions[i]));
  now = 12000;
  api.update(actor);
  scene.events.emit("postupdate");
  assert.ok(sprites.every((s) => s.destroyed));
  api.apply(actor, 12000, false);
  api.update(actor);
  scene.events.emit("postupdate");
  callbacks["royal-skill-scene-reset"]();
  assert.ok(sprites.every((s) => s.destroyed));
});
