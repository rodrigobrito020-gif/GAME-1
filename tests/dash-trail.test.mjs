import { test } from "node:test";
import assert from "node:assert/strict";
import { updateDashTrail, clearDashTrail } from "../dash-visuals.mjs";
function fixture() {
  const images = [];
  const create = () => {
    const i = { visible: true, destroyed: false };
    for (const method of [
      "setTexture",
      "setPosition",
      "setOrigin",
      "setScale",
      "setAngle",
      "setFlipX",
      "setTint",
      "setBlendMode",
      "setDepth",
    ])
      i[method] = () => i;
    i.setVisible = (v) => ((i.visible = v), i);
    i.setAlpha = (v) => ((i.alpha = v), i);
    i.destroy = () => {
      i.destroyed = true;
      i.visible = false;
    };
    images.push(i);
    return i;
  };
  const native = { img: { visible: true } };
  return {
    images,
    actor: {
      x: 0,
      y: 0,
      alive: true,
      body: { x: 0, y: 0 },
      root: { depth: 2, scene: { add: { image: create } } },
      ghosts: [native],
    },
    body: {
      texture: { key: "hd" },
      frame: { name: "0:0" },
      originX: 0.5,
      originY: 0.9,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 0,
      flipX: false,
    },
  };
}
test("Dash has its own bounded pool and expires on real time even if the action is frozen", () => {
  const { actor: a, body, images } = fixture();
  updateDashTrail(a, body, "arqueira", 0);
  a.act = { move: { id: "elfa-esquiva", durationMs: 240 }, t: 0 };
  a.x = 60;
  updateDashTrail(a, body, "arqueira", 10);
  assert.equal(images.length, 2);
  assert.equal(a.ghosts.length, 1);
  const alpha = images[0].alpha;
  updateDashTrail(a, body, "arqueira", 90);
  assert.ok(images[0].alpha < alpha);
  updateDashTrail(a, body, "arqueira", 190);
  assert.ok(images.every((i) => !i.visible));
  a.x = 120;
  updateDashTrail(a, body, "arqueira", 400);
  assert.ok(
    images.every((i) => !i.visible),
    "frozen action cannot restart a trail",
  );
  clearDashTrail(a);
  assert.ok(images.every((i) => i.destroyed));
  assert.equal(
    a.ghosts[0].img.visible,
    true,
    "native Avanço trail is independent",
  );
});
test("walking, teleporting and dead actors cannot leave Dash ghosts; successive dashes reuse at most four sprites", () => {
  const { actor: a, body, images } = fixture();
  updateDashTrail(a, body, "pistoleira", 0);
  a.x = 50;
  updateDashTrail(a, body, "pistoleira", 10);
  assert.equal(images.length, 0);
  a.act = { move: { id: "dark-elf-esquiva", durationMs: 240 }, t: 10 };
  a.x = 400;
  updateDashTrail(a, body, "pistoleira", 20);
  assert.equal(images.length, 0);
  for (let n = 0; n < 6; n++) {
    a.x += 35;
    updateDashTrail(a, body, "pistoleira", 30 + n * 10);
  }
  assert.ok(images.length <= 4 && images.some((i) => i.visible));
  a.dead = true;
  updateDashTrail(a, body, "pistoleira", 100);
  assert.ok(images.every((i) => !i.visible));
  clearDashTrail(a);
});
