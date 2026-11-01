import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm, SKILLS } from "../farm.mjs";
import { WARRIOR_ACTIONS, WARRIOR_LIGHT_DASH as DASH } from "../warrior.mjs";

function fixture(dx = 260, dy = 0) {
  let now = 10000;
  const account = {
    farmVersion: 1,
    bag: [],
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1234 },
      inventory: {},
      automation: { skillOrder: [] },
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now }),
    client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  client.x = 944;
  client.y = 800;
  for (const m of client.hunt.monsters) {
    m.hp = 0;
    m.respawnAt = Infinity;
  }
  const target = client.hunt.monsters[0];
  Object.assign(target, {
    x: client.x + dx,
    y: client.y + dy,
    home: { x: client.x + dx, y: client.y + dy },
    hp: 1000,
    maxHp: 1000,
    nextAttack: Infinity,
  });
  return {
    farm,
    client,
    target,
    account,
    step(ms = 50, options) {
      now += ms;
      return farm.step(client, options);
    },
  };
}

test("Avanço de Luz translates the hero in eight directions, stops before the enemy and hits once on arrival", () => {
  for (const [dx, dy] of [
    [260, 0],
    [-260, 0],
    [0, 260],
    [0, -260],
    [180, 180],
    [-180, 180],
    [180, -180],
    [-180, -180],
  ]) {
    const { farm, client, target, step } = fixture(dx, dy),
      from = { x: client.x, y: client.y },
      distance = Math.hypot(dx, dy),
      travel = distance - DASH.stopDistance;
    const cast = farm.cast(client, DASH.id, target.id);
    assert.equal(client.x, from.x, "cast does not teleport");
    assert.equal(cast.events.damage.length, 0);
    const damage = [];
    let prior = 0;
    for (let n = 1; n <= 6; n++) {
      const out = step(50),
        moved = Math.hypot(client.x - from.x, client.y - from.y);
      damage.push(...out.events.damage.filter((d) => d.skillId === DASH.id));
      assert.ok(
        moved >= prior - 1e-6 && moved <= travel + 1e-6,
        "one-way movement, no overshoot",
      );
      if (n < 6) assert.equal(damage.length, 0);
      if (n === 3)
        assert.ok(
          moved > 8 && moved < travel,
          "the dash has intermediate positions",
        );
      prior = moved;
    }
    assert.ok(Math.abs(client.x - (from.x + (dx / distance) * travel)) < 1e-6);
    assert.ok(Math.abs(client.y - (from.y + (dy / distance) * travel)) < 1e-6);
    assert.equal(damage.length, 1);
    assert.equal(damage[0].target, target.id);
    assert.equal(target.hp, 1000 - farm.character.derived.atk * 2);
    assert.equal(client.hunt.dash, null);
    assert.equal(farm.character.progress.mana, 92);
    assert.throws(() => farm.cast(client, DASH.id, target.id), /cooldown/);
  }
});

test("a blocked dash is refused before spending mana or starting cooldown and checks the entire corridor", () => {
  const { farm, client, target } = fixture(),
    start = { x: client.x, y: client.y };
  assert.throws(
    () =>
      farm.cast(client, DASH.id, target.id, undefined, undefined, {
        free: (x) => x < 1040 || x > 1072,
      }),
    /invalid_target/,
  );
  assert.equal(farm.character.progress.mana, 100);
  assert.equal(client.hunt.cooldowns[DASH.id], undefined);
  assert.ok(!client.hunt.dash);
  assert.deepEqual({ x: client.x, y: client.y }, start);
});

test("an obstacle introduced during a dash stops traversal and cancels the arrival damage", () => {
  const { farm, client, target, step } = fixture();
  farm.cast(client, DASH.id, target.id);
  step(150, { free: (x) => x < 1020 });
  assert.ok(client.x < 1020);
  const stopped = client.x;
  target.x = client.x + 20;
  target.home = { x: target.x, y: target.y };
  const impact = step(150, { free: (x) => x < 1020 });
  assert.equal(client.x, stopped);
  assert.ok(!impact.events.damage.some((d) => d.skillId === DASH.id));
  assert.equal(target.hp, 1000, "no damage through a newly blocked path");
});

test("dash does not hit a target that leaves its landing range", () => {
  const { farm, client, target, step } = fixture();
  farm.cast(client, DASH.id, target.id);
  target.x += 200;
  target.home = { x: target.x, y: target.y };
  assert.ok(!step(300).events.damage.some((d) => d.skillId === DASH.id));
  assert.equal(target.hp, 1000);
});

test("a lost target, leaving the hunt or death cancels an unfinished dash without remote damage", () => {
  {
    const { farm, client, target, step } = fixture();
    farm.cast(client, DASH.id, target.id);
    target.hp = 0;
    target.respawnAt = Infinity;
    const out = step(100);
    assert.equal(client.hunt.dash, null);
    assert.ok(!out.events.damage.length);
    assert.ok(
      Math.hypot(client.x - 944, client.y - 800) <= 8.01,
      "only ordinary patrol movement after cancellation",
    );
  }
  {
    const { farm, client, target, step } = fixture();
    farm.cast(client, DASH.id, target.id);
    farm.stop(client);
    assert.equal(step(300).events.damage.length, 0);
    assert.equal(client.combatAnimUntil, 0);
  }
  {
    const { farm, client, target, step } = fixture();
    farm.cast(client, DASH.id, target.id);
    const other = client.hunt.monsters[1];
    Object.assign(other, {
      x: client.x,
      y: client.y,
      home: { x: client.x, y: client.y },
      hp: 48,
      nextAttack: 0,
    });
    farm.character.progress.hp = 1;
    assert.ok(step(50).died);
    assert.equal(client.hunt.dash, null);
    assert.equal(step(300).events.damage.length, 0);
  }
});

test("automatic farming uses the dash from outside melee, honors disabled automation and falls back around obstacles", () => {
  const a = fixture();
  a.farm.character.automation.skillOrder = [DASH.id];
  assert.ok(a.step().events.casts.some((c) => c.skillId === DASH.id));
  assert.equal(a.client.x, 944, "initial anticipation stays in place");
  a.step(150);
  assert.ok(a.client.x > 970);
  const b = fixture();
  assert.equal(b.step().events.casts.length, 0);
  assert.ok(b.client.x > 944 && b.client.x <= 952);
  const c = fixture();
  c.farm.character.automation.skillOrder = [DASH.id];
  const out = c.step(50, { free: (x) => x < 1040 || x > 1072 });
  assert.equal(out.events.casts.length, 0);
  assert.equal(c.farm.character.progress.mana, 100);
  assert.ok(c.client.moving);
});

test("existing saves migrate the first skill without changing inventory, progress or disabled slots", () => {
  const { account } = fixture();
  account.character.automation.skillOrder = [
    "furia-guerreiro",
    "corte-poderoso",
    "investida",
  ];
  const gold = account.character.wallet.gold,
    progress = structuredClone(account.character.progress),
    bag = structuredClone(account.bag);
  new LocalFarm(account);
  assert.deepEqual(account.character.automation.skillOrder, [DASH.id]);
  assert.equal(account.character.wallet.gold, gold);
  assert.deepEqual(account.character.progress, progress);
  assert.deepEqual(account.bag, bag);
  account.character.automation.skillOrder = [];
  new LocalFarm(account);
  assert.deepEqual(account.character.automation.skillOrder, []);
  assert.equal(SKILLS[0].id, DASH.id);
  assert.equal(SKILLS[0].name, "Avanço de Luz");
  assert.ok(WARRIOR_ACTIONS[DASH.id].duration <= 600);
});
