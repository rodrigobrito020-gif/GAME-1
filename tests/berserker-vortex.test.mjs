import { test } from "node:test";
import assert from "node:assert/strict";
import { BERSERKER_SPIN } from "../berserker.mjs";
import {
  vortexPose,
  vortexGeometry,
  drawVortex,
} from "../berserker-vortex.mjs";

test("hurricane lasts three seconds, turns ten times and keeps eight upright poses at every starting facing", () => {
  assert.equal(BERSERKER_SPIN.durationMs, 3000);
  for (let row = 0; row < 4; row++) {
    const cols = new Set();
    let turns = 0,
      last = 0;
    for (let t = 0; t < 3000; t += 5) {
      const pose = vortexPose(t, row),
        g = vortexGeometry(t, row);
      assert.equal(pose.row, row);
      assert.equal(pose.sheet, "axeheavy");
      assert.ok(pose.col >= 0 && pose.col < 8);
      cols.add(pose.col);
      if (t > 0 && pose.col < last) turns++;
      last = pose.col;
      assert.ok(g.fade >= 0 && g.fade <= 1);
    }
    assert.equal(cols.size, 8);
    assert.equal(turns, 9);
    assert.equal(vortexPose(3000, row), null);
  }
  for (const t of [-1, NaN, Infinity, 3001]) assert.equal(vortexPose(t), null);
});
test("hurricane is a continuous projected funnel, with front/back wind, two blade sweeps and a bounded three-second fade", () => {
  const first = vortexGeometry(400),
    next = vortexGeometry(401);
  assert.ok(
    first.ribbons.some((r) => r.front) && first.ribbons.some((r) => !r.front),
  );
  const vertices = first.ribbons.flatMap((r) => [r.a, r.b]);
  assert.ok(
    Math.max(...vertices.map((p) => p.x)) -
      Math.min(...vertices.map((p) => p.x)) >
      145,
  );
  assert.ok(
    Math.max(...vertices.map((p) => p.y)) -
      Math.min(...vertices.map((p) => p.y)) >
      145,
  );
  for (let i = 0; i < first.ribbons.length; i++) {
    assert.ok(
      Math.hypot(
        first.ribbons[i].a.x - next.ribbons[i].a.x,
        first.ribbons[i].a.y - next.ribbons[i].a.y,
      ) < 3,
    );
    for (const p of [first.ribbons[i].a, first.ribbons[i].b]) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(Math.abs(p.x) < 100 && p.y > -195 && p.y < 15);
    }
  }
  assert.equal(first.blades.length, 72);
  assert.ok(
    first.blades.some((b) => b.front) && first.blades.some((b) => !b.front),
  );
  assert.equal(vortexGeometry(0).fade, 0);
  assert.ok(vortexGeometry(1500).fade === 1);
  assert.ok(vortexGeometry(2999).fade < 0.01);
  assert.equal(vortexGeometry(3000), null);
  const commands = [];
  const context = new Proxy(
    {},
    {
      get:
        (_, k) =>
        (...args) => {
          commands.push([k, args]);
          return context;
        },
    },
  );
  drawVortex(context, context, 1500);
  assert.ok(
    commands.some(([kind]) => kind === "fillPoints"),
    "volumetric ribbons, not a painted image",
  );
  assert.ok(commands.filter(([kind]) => kind === "lineBetween").length > 300);
});
