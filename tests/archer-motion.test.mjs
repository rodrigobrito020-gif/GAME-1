import { test } from "node:test";
import assert from "node:assert/strict";
import { ARCHER_ACTIONS, archerRig } from "../archer.mjs";
import { projectilePose, rainPose } from "../archer-vfx.mjs";

test("bow releases coincide with authored release poses and rain has a dedicated skyward atlas", () => {
  const rig = archerRig({ moves: {}, basic: {}, skills: {} });
  for (const [kind, action] of Object.entries(ARCHER_ACTIONS)) {
    const move = rig.moves[action.move];
    assert.equal(move.frames.length * 50, action.durationMs);
    assert.equal(
      move.frames[action.releaseMs / 50][1],
      3,
      kind + " release frame",
    );
    assert.ok(
      move.frames.slice(0, action.releaseMs / 50).every((f) => f[1] < 3),
    );
    assert.deepEqual(move.impacts, [action.releaseMs]);
    if (kind === "rain")
      assert.ok(move.frames.every((f) => f[0] === "axeheavy"));
    else assert.ok(move.frames.every((f) => f[0] === "weapon"));
  }
});
test("arrows wait for release, begin at the muzzle, follow the target vector in every direction and disappear at arrival", () => {
  for (const [tx, ty] of [
    [200, 20],
    [-200, 20],
    [20, 200],
    [20, -200],
  ]) {
    const fx = { x: 20, y: 20, tx, ty, releaseMs: 250, durationMs: 750 };
    assert.equal(projectilePose(fx, 249), null);
    assert.deepEqual(projectilePose(fx, 250), {
      x: 20,
      y: 20,
      angle: (Math.atan2(ty - 20, tx - 20) * 180) / Math.PI,
    });
    const half = projectilePose(fx, 500);
    assert.equal(half.x, (20 + tx) / 2);
    assert.equal(half.y, (20 + ty) / 2);
    assert.equal(projectilePose(fx, 750), null);
  }
});
test("three rain volleys land exactly at the damage times, with stable in-area drop positions and bounded impact lifetimes", () => {
  const fx = { x: 500, y: 600, radius: 145 };
  assert.equal(rainPose(fx, 300).drops.length, 0);
  for (const [wave, hit] of ARCHER_ACTIONS.rain.impactsMs.entries()) {
    const first = rainPose(fx, hit - 200),
      later = rainPose(fx, hit - 100);
    assert.equal(first.drops.length, 18);
    assert.equal(later.drops.length, 18);
    assert.ok(
      first.drops.every(
        (d, i) =>
          d.wave === wave &&
          d.x === later.drops[i].x &&
          d.ground === later.drops[i].ground &&
          d.y < later.drops[i].y &&
          Math.hypot(d.x - fx.x, d.ground - fx.y) <= fx.radius,
      ),
    );
    assert.deepEqual(
      rainPose(fx, hit - 200),
      first,
      "snapshot refresh must not reshuffle arrows",
    );
    const landed = rainPose(fx, hit);
    assert.equal(landed.drops.length, 0);
    assert.equal(landed.impacts[0].wave, wave);
  }
  assert.deepEqual(rainPose(fx, 2050), {
    drops: [],
    impacts: [],
    telegraph: false,
  });
});

test("archer makes one bounded collision-checked step between shots, never during casts, ready shots, explicit orders or on cooldown", async () => {
  const { archerReposition } = await import("../archer-combat.mjs");
  const client = {
      x: 500,
      y: 500,
      hunt: { actionUntil: 0, nextAttack: 2000, manualTarget: 0 },
    },
    target = { x: 550, y: 500, hp: 100 };
  const p = archerReposition(client, target, 1000, () => true);
  assert.ok(p.x < client.x);
  assert.equal(Math.round(Math.hypot(p.x - client.x, p.y - client.y)), 96);
  assert.strictEqual(
    archerReposition(client, target, 1100, () => true),
    p,
    "do not change direction halfway through a step",
  );
  assert.equal(
    archerReposition(client, target, 1500, () => true),
    null,
    "short step ends before recast",
  );
  client.hunt.actionUntil = 1700;
  assert.equal(
    archerReposition(client, target, 1600, () => true),
    null,
  );
  client.hunt.actionUntil = 0;
  client.hunt.nextAttack = 0;
  assert.equal(
    archerReposition(client, target, 4000, () => true),
    null,
  );
  client.hunt.nextAttack = 5000;
  client.hunt.manualTarget = 1;
  assert.equal(
    archerReposition(client, target, 4000, () => true),
    null,
  );
});
test("a blocked retreat falls back to firing without crossing walls or repeatedly changing direction", async () => {
  const { archerReposition } = await import("../archer-combat.mjs");
  const client = {
      x: 500,
      y: 500,
      hunt: { actionUntil: 0, nextAttack: 2000, manualTarget: 0 },
    },
    target = { x: 550, y: 500, hp: 100 };
  assert.equal(
    archerReposition(client, target, 1000, () => false),
    null,
  );
  assert.equal(client.x, 500);
  assert.equal(client.y, 500);
  assert.equal(
    archerReposition(client, target, 1050, () => true),
    null,
  );
  assert.ok(archerReposition(client, target, 1700, () => true));
});
