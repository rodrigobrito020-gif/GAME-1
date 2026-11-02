import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { direction8, warriorPresentation } from "../warrior-motion.mjs";
import { decodeRgba } from "../png.mjs";

const pose = { sheet: "walk", row: 2, col: 3 };
const sample = { x: 0, y: 0, now: 0, cycle: 0.4 };
const directions = [
  [1, 0, 2],
  [1, 1, 4],
  [0, 1, 0],
  [-1, 1, 5],
  [-1, 0, 1],
  [-1, -1, 7],
  [0, -1, 3],
  [1, -1, 6],
];
test("warrior uses eight authored directions, preserves the current step and turns consistently at different frame rates", () => {
  for (const fps of [30, 60, 144])
    for (const [dx, dy, row] of directions) {
      assert.equal(direction8(dx, dy), row);
      const state = {};
      warriorPresentation(state, pose, sample);
      let last = state.angle,
        view;
      for (let frame = 1; frame <= Math.ceil(fps * 0.3); frame++) {
        const now = (frame * 1000) / fps;
        view = warriorPresentation(state, pose, {
          ...sample,
          now,
          x: (dx * now) / 10,
          y: (dy * now) / 10,
        });
        const turn = Math.abs(
          Math.atan2(
            Math.sin(state.angle - last),
            Math.cos(state.angle - last),
          ),
        );
        assert.ok(
          turn <= (1000 / fps) * 0.025 + 1e-10,
          "turn uses elapsed time",
        );
        assert.equal(view.pose.col, 3, "turn does not restart the step");
        assert.deepEqual(
          [view.motion.x, view.motion.y],
          [0, 0],
          "native world position remains authoritative",
        );
        assert.ok(
          Math.abs(view.motion.angle) < 1,
          "subtle weight shift, no body spin",
        );
        last = state.angle;
      }
      assert.equal(view.pose.row, row);
      const endTime = (Math.ceil(fps * 0.3) * 1000) / fps;
      const stopped = warriorPresentation(
        state,
        { sheet: "idle", row: 2, col: 0 },
        { x: (dx * endTime) / 10, y: (dy * endTime) / 10, now: endTime + 100 },
      );
      assert.equal(
        stopped.pose.row,
        row,
        "normal stopping retains the eight-way facing",
      );
    }
});
test("diagonal sword follows windup, strike and recovery without reversing the attack or altering release time", () => {
  const state = {},
    action = {};
  warriorPresentation(state, pose, sample);
  const cols = [];
  for (const age of [0, 50, 100, 150, 200, 250, 300, 350]) {
    const view = warriorPresentation(
      state,
      { sheet: "weapon", row: 0, col: 0 },
      {
        ...sample,
        now: 100 + age,
        action,
        move: "humano-espada",
        age,
        aim: { x: 100, y: 100 },
      },
    );
    if (age >= 50) assert.equal(view.pose.row, 4);
    cols.push(view.pose.col);
    assert.deepEqual(view.motion, { x: 0, y: 0, angle: 0 });
  }
  assert.deepEqual(cols.slice(1), [1, 2, 3, 4, 4, 5, 5]);
  const locked = warriorPresentation(
    state,
    { sheet: "weapon", row: 0, col: 0 },
    {
      ...sample,
      now: 500,
      action,
      move: "humano-espada",
      age: 350,
      aim: { x: -100, y: -100 },
    },
  );
  assert.equal(
    locked.pose.row,
    4,
    "one action does not swivel when its target moves",
  );
  const native = warriorPresentation(
    {},
    { sheet: "axeheavy", row: 3, col: 4 },
    { ...sample, action: {}, move: "humano-impacto-luz", age: 550 },
  );
  assert.deepEqual(
    native.pose,
    { sheet: "axeheavy", row: 3, col: 4 },
    "landing frame remains native",
  );
});
test("ultimate sword variants keep the same diagonal contact and recovery", () => {
  for (const move of ["humano-espada-avatar", "humano-retorno-avatar"]) {
    const state = {};
    const action = {};
    warriorPresentation(
      state,
      { sheet: "weapon", row: 4, col: 0 },
      { ...sample, action, move, age: 0, aim: { x: 100, y: 100 } },
    );
    const strike = warriorPresentation(
      state,
      { sheet: "weapon", row: 0, col: 1 },
      { ...sample, now: 150, action, move, age: 150, aim: { x: 100, y: 100 } },
    );
    assert.deepEqual(strike.pose, { sheet: "weapon", row: 4, col: 3 });
    const recovery = warriorPresentation(
      state,
      { sheet: "weapon", row: 0, col: 5 },
      { ...sample, now: 350, action, move, age: 350, aim: { x: 100, y: 100 } },
    );
    assert.deepEqual(recovery.pose, { sheet: "weapon", row: 4, col: 5 });
  }
});
test("stopping, death, dodging and teleporting do not inherit a stale turn or shift the native body", () => {
  const state = {};
  warriorPresentation(state, pose, sample);
  warriorPresentation(state, pose, { ...sample, x: 10, y: -10, now: 100 });
  const idle = warriorPresentation(
    state,
    { sheet: "idle", row: 2, col: 2 },
    { x: 10, y: -10, now: 200 },
  );
  assert.equal(idle.pose.row, 6);
  const correction = warriorPresentation(
    state,
    { sheet: "idle", row: 2, col: 2 },
    { x: 9.9, y: -9.9, now: 216 },
  );
  assert.equal(
    correction.pose.row,
    6,
    "a settling position correction cannot reverse facing",
  );
  const dead = warriorPresentation(
    state,
    { sheet: "special", row: 0, col: 5 },
    { x: 11, y: -11, now: 300, dead: true },
  );
  assert.deepEqual(dead.pose, { sheet: "special", row: 6, col: 5 });
  assert.deepEqual(dead.motion, { x: 0, y: 0, angle: 0 });
  const teleport = warriorPresentation(
    state,
    { sheet: "idle", row: 1, col: 0 },
    { x: 900, y: 900, now: 400 },
  );
  assert.equal(teleport.pose.row, 1);
  const dodge = warriorPresentation(
    state,
    { sheet: "run1", row: 0, col: 6 },
    {
      x: 900,
      y: 920,
      now: 500,
      action: {},
      move: "humano-esquiva",
      aim: { x: 1000, y: 800 },
    },
  );
  assert.equal(
    dodge.pose.row,
    0,
    "dash faces actual travel rather than the selected target",
  );
  assert.equal(dodge.pose.col, 6);
});

test("local prediction corrections cannot make the warrior face backwards after key release", () => {
  const state = {};
  warriorPresentation(state, pose, { ...sample, travel: { x: 1, y: 1 } });
  warriorPresentation(state, pose, {
    x: 10,
    y: 10,
    now: 100,
    travel: { x: 1, y: 1 },
  });
  const correction = warriorPresentation(
    state,
    { sheet: "walk", row: 2, col: 4 },
    {
      x: 7,
      y: 7,
      now: 166,
      travel: { x: 1, y: 1 },
    },
  );
  assert.equal(correction.pose.row, 4);
  assert.equal(correction.pose.col, 4);
});

const read = (p) =>
  decodeRgba(readFileSync(new URL("../art/warrior/" + p, import.meta.url)));
function frame(im, row, col) {
  const out = Buffer.alloc(384 * 384 * 4);
  for (let y = 0; y < 384; y++)
    out.set(
      im.pixels.subarray(
        ((row * 384 + y) * im.width + col * 384) * 4,
        ((row * 384 + y) * im.width + col * 384 + 384) * 4,
      ),
      y * 384 * 4,
    );
  return out;
}
test("all eight warrior views have complete poses, eight unique steps and preserved approved cardinal combat", () => {
  for (const look of ["base", "training"])
    for (const sheet of [
      "idle",
      "walk",
      "run1",
      "weapon",
      "axeheavy",
      "special",
    ]) {
      const hd = read(`motion43/${look}/${sheet}.png`),
        cols = {
          idle: 4,
          walk: 8,
          run1: 8,
          weapon: 6,
          axeheavy: 8,
          special: 6,
        }[sheet];
      assert.equal(hd.width, cols * 384);
      assert.equal(hd.height, 8 * 384);
      const old = !["walk", "run1"].includes(sheet)
        ? read(`hd/${look === "training" ? "training/" : ""}${sheet}.png`)
        : null;
      for (let row = 0; row < 8; row++) {
        const hashes = new Set();
        for (let col = 0; col < cols; col++) {
          const pixels = frame(hd, row, col);
          let left = 384,
            top = 384,
            right = 0,
            bottom = 0;
          for (let y = 0; y < 384; y++)
            for (let x = 0; x < 384; x++)
              if (pixels[(y * 384 + x) * 4 + 3] > 80) {
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
              }
          assert.ok(
            left > 2 && top > 2 && right < 381 && bottom < 381,
            `${look}/${sheet}/${row}/${col}: full head, weapon and boots`,
          );
          hashes.add(createHash("sha256").update(pixels).digest("hex"));
          if (old && row < 4)
            assert.deepEqual(
              pixels,
              frame(old, row, col),
              "approved cardinal combat is pixel identical",
            );
        }
        if (sheet === "walk" || sheet === "run1")
          assert.equal(
            hashes.size,
            8,
            look + "/" + sheet + "/" + row + ": all eight steps are distinct",
          );
      }
    }
});
test("warrior Ki and equipment masks match all eight directions of the displayed body", () => {
  for (const look of ["base", "training"]) {
    const family = look === "base" ? "warrior" : "warrior-training";
    const emitters = JSON.parse(
      readFileSync(
        new URL(
          `../art/warrior/motion43/energy/${family}/emitters.json`,
          import.meta.url,
        ),
      ),
    );
    for (const sheet of [
      "idle",
      "walk",
      "run1",
      "weapon",
      "axeheavy",
      "special",
    ]) {
      const body = read(`motion43/${look}/${sheet}.png`),
        surface = read(`motion43/energy/${family}/${sheet}-surface.png`),
        equipment = read(`motion43/masks/${sheet}.png`);
      assert.equal(surface.width, body.width);
      assert.equal(surface.height, body.height);
      assert.equal(equipment.height, body.height);
      for (let p = 3; p < body.pixels.length; p += 4) {
        assert.ok(
          surface.pixels[p] <= body.pixels[p],
          "surface light belongs to body alpha",
        );
        assert.ok(
          equipment.pixels[p] <= body.pixels[p],
          "equipment is attached to body",
        );
      }
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < body.width / 384; col++) {
          const points = emitters[`${sheet}:${row}:${col}`];
          assert.ok(points.length >= 4 && points.length <= 16);
          for (const [x, y] of points)
            assert.ok(
              body.pixels[
                ((row * 384 + y) * body.width + col * 384 + x) * 4 + 3
              ] > 128,
              "particle originates on the current pose",
            );
        }
    }
  }
});
