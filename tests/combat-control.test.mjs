import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm } from "../farm.mjs";
import {
  combatMode,
  setCombatMode,
  evade,
  stepEvade,
  EVADE,
} from "../combat-control.mjs";
import {
  MONSTER_ROLES,
  startMonsterSkill,
  skillHits,
} from "../monster-combat.mjs";
import { readFileSync } from "node:fs";
import { decodeRgba } from "../png.mjs";
function setup() {
  let now = 10000;
  const account = {
    farmVersion: 1,
    skillReviewVersion: 4,
    avatarAutomationVersion: 1,
    combatMode: "manual",
    character: {
      progress: { hp: 250, mana: 100, level: 1, xp: 0 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 0 },
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
  for (const m of client.hunt.monsters)
    Object.assign(m, { hp: 0, respawnAt: Infinity });
  return {
    farm,
    client,
    account,
    step(ms) {
      now += ms;
      return farm.step(client);
    },
    now: () => now,
  };
}
test("legacy manual save resumes automatic basic combat while per-skill manual choices remain preserved", () => {
  const s = setup(),
    { farm, client, account } = s,
    m = client.hunt.monsters[0];
  assert.equal(account.combatMode, "auto");
  assert.equal(combatMode(account), "auto");
  assert.throws(
    () => setCombatMode(account, client, "manual"),
    /invalid_skill/,
  );
  Object.assign(m, {
    hp: 1000,
    maxHp: 1000,
    x: client.x + 160,
    y: client.y,
    nextAttack: Infinity,
    nextSkill: Infinity,
  });
  farm.avatar.saved.charge = 100;
  const x = client.x,
    output = s.step(50);
  assert.ok(client.x > x);
  assert.equal(output.events.casts.length, 0);
  assert.deepEqual(account.character.automation.skillOrder, []);
  farm.automation({ skillOrder: ["egide-de-luz"] });
  assert.ok(
    s.step(1000).events.casts.some((c) => c.skillId === "egide-de-luz"),
  );
  assert.equal(
    farm.avatar.saved.charge,
    100,
    "manual Avatar does not activate itself",
  );
  const restored = new LocalFarm(JSON.parse(JSON.stringify(account)));
  assert.deepEqual(restored.character.automation.skillOrder, ["egide-de-luz"]);
  assert.equal(restored.account.combatMode, "auto");
});
test("directional dash normalizes input, uses current facing when stationary, enforces cooldown and sweeps obstacles at start and during travel", () => {
  const c = { x: 0, y: 0, facing: 2 };
  const e = evade(c, { dirX: 1000, dirY: 1000 }, 1000);
  assert.equal(e.move, "humano-esquiva");
  stepEvade(c, 1240);
  assert.ok(Math.abs(Math.hypot(c.x, c.y) - 128) < 0.001);
  assert.throws(() => evade(c, {}, 1300), /cooldown/);
  evade(c, {}, 3500);
  stepEvade(c, 3740, (x, y) => x < 150);
  assert.ok(c.x < 150);
  assert.equal(c.evade, null);
  assert.throws(
    () => evade({ x: 0, y: 0, facing: 2 }, {}, 5000, () => false),
    /invalid_target/,
  );
  const wall = { x: 0, y: 0, facing: 2 };
  evade(wall, {}, 5000, (x, y) => x < 60);
  assert.ok(wall.evade.to.x < 60);
  assert.equal(EVADE.cooldownMs, 2500);
});
test("three larger monster roles prepare aimed attacks and stepping outside the marker avoids the damage", () => {
  assert.ok(MONSTER_ROLES.every((m) => m.displayHeight >= 130));
  for (const role of MONSTER_ROLES) {
    const m = {
        id: 100,
        hp: 100,
        x: 0,
        y: 0,
        aggro: true,
        role: role.role,
        nextSkill: 0,
      },
      c = { x: 60, y: 10 };
    const cast = startMonsterSkill(m, c, 1000);
    assert.ok(cast);
    assert.ok(cast.impact >= 1700);
    assert.equal(startMonsterSkill(m, c, 1100), null);
    assert.ok(skillHits(cast, c));
    assert.ok(!skillHits(cast, { x: 600, y: 600 }));
    assert.ok(m.nextSkill > cast.impact);
  }
});
test("enemy skill hit is delayed, dodgeable and cancelled when the caster dies; death cancels player pending actions", () => {
  for (const dodged of [false, true]) {
    const s = setup(),
      m = s.client.hunt.monsters[2];
    Object.assign(m, {
      hp: 1000,
      maxHp: 1000,
      x: s.client.x + 60,
      y: s.client.y,
      home: { x: s.client.x + 60, y: s.client.y },
      aggro: true,
      nextSkill: 0,
      nextAttack: Infinity,
    });
    const first = s.step(1);
    assert.equal(first.events.damage.length, 0);
    assert.equal(m.cast.type, "meteor");
    if (dodged) s.client.x += 200;
    const hit = s.step(1200);
    assert.equal(
      hit.events.damage.some((d) => d.source === m.id),
      !dodged,
    );
  }
  const s = setup(),
    m = s.client.hunt.monsters[0];
  Object.assign(m, {
    hp: 1000,
    x: s.client.x + 40,
    y: s.client.y,
    home: { x: s.client.x + 40, y: s.client.y },
    aggro: true,
    nextSkill: 0,
  });
  s.step(1);
  assert.ok(m.cast);
  m.hp = 0;
  assert.equal(s.step(1000).events.damage.length, 0);
  assert.equal(m.cast, null);
});
test("128px warrior frames contain real original detail, not magnified 64px blocks", () => {
  const im = decodeRgba(
    readFileSync(new URL("../art/warrior/hd/idle.png", import.meta.url)),
  );
  assert.equal(im.width, 512);
  assert.equal(im.height, 512);
  let different = 0;
  for (let y = 0; y < 128; y += 2)
    for (let x = 0; x < 128; x += 2) {
      const a = (y * im.width + x) * 4,
        b = (y * im.width + x + 1) * 4;
      if (
        im.pixels[a + 3] &&
        im.pixels[b + 3] &&
        !im.pixels.subarray(a, a + 3).equals(im.pixels.subarray(b, b + 3))
      )
        different++;
    }
  assert.ok(different > 300);
});

test("right-click chooses the hunt target and automatic hunting resumes against another living enemy after its death", () => {
  const s = setup(),
    { farm, client } = s,
    m = client.hunt.monsters[0],
    other = client.hunt.monsters[1];
  Object.assign(m, {
    hp: 100,
    maxHp: 100,
    x: client.x + 180,
    y: client.y,
    home: { x: client.x + 180, y: client.y },
    nextAttack: Infinity,
    nextSkill: Infinity,
  });
  Object.assign(other, {
    hp: 100,
    maxHp: 100,
    x: client.x - 30,
    y: client.y,
    home: { x: client.x - 30, y: client.y },
    nextAttack: Infinity,
    nextSkill: Infinity,
  });
  assert.throws(() => farm.orderAttack(client, 9999), /invalid_target/);
  farm.orderAttack(client, m.id);
  const x = client.x;
  s.step(50);
  assert.ok(client.x > x);
  assert.equal(client.hunt.target, m.id);
  evade(client, { dirY: 1000 }, s.now());
  assert.equal(client.hunt.manualTarget, 0);
  stepEvade(client, s.now() + 240);
  s.step(300);
  farm.orderAttack(client, m.id);
  m.hp = 0;
  m.respawnAt = Infinity;
  s.step(1000);
  assert.equal(client.hunt.target, other.id);
});

test("the common dash is manual by default, shares hotkey/icon cooldown and only evades a pending threat when automatic is enabled", () => {
  for (const automatic of [false, true]) {
    const s = setup(),
      { farm, client } = s,
      m = client.hunt.monsters[2];
    farm.automation({ skillOrder: automatic ? [EVADE.id] : [] });
    Object.assign(m, {
      hp: 1000,
      maxHp: 1000,
      x: client.x + 300,
      y: client.y,
      nextAttack: Infinity,
      nextSkill: Infinity,
    });
    m.cast = {
      caster: m.id,
      type: "meteor",
      x: m.x,
      y: m.y,
      tx: client.x,
      ty: client.y,
      radius: 90,
      start: s.now() - 800,
      release: s.now() + 400,
      impact: s.now() + 400,
    };
    const output = s.step(1);
    assert.equal(
      output.events.moves.some((e) => e.move === "humano-esquiva"),
      automatic,
    );
    if (automatic) {
      assert.ok(client.evade);
      assert.ok(output.events.cooldowns.some((c) => c.skillId === EVADE.id));
      assert.throws(() => farm.cast(client, EVADE.id, 0), /cooldown/);
    }
  }
  const s = setup();
  const before = s.farm.character.progress.mana;
  s.farm.cast(s.client, EVADE.id, 0);
  assert.equal(s.farm.character.progress.mana, before);
  assert.throws(() => s.farm.dash(s.client, {}), /cooldown/);
});
