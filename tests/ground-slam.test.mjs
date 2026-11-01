import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm, ACTIVE_SKILLS } from "../farm.mjs";
import { WARRIOR_GROUND_SLAM as SLAM, warriorRig } from "../warrior.mjs";
import { warriorEffects } from "../warrior-fx.mjs";

function fixture({ order = [], version = 2 } = {}) {
  let now = 10000;
  const account = {
    farmVersion: 1,
    avatarAutomationVersion: 1,
    skillReviewVersion: version,
    bag: [],
    warehouse: [],
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1234 },
      inventory: {},
      automation: { skillOrder: order },
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
  for (const m of client.hunt.monsters)
    Object.assign(m, { hp: 0, respawnAt: Infinity });
  const place = (index, dx, dy = 0) => {
    const m = client.hunt.monsters[index];
    Object.assign(m, {
      x: client.x + dx,
      y: client.y + dy,
      home: { x: client.x + dx, y: client.y + dy },
      hp: 1000,
      maxHp: 1000,
      nextAttack: Infinity,
    });
    return m;
  };
  return {
    account,
    farm,
    client,
    place,
    step(ms) {
      now += ms;
      return farm.step(client, { free: () => false });
    },
  };
}

test("Impacto de Luz hits live occupants once at landing, around the caster rather than the selected enemy", () => {
  const { farm, client, place, step } = fixture();
  const near = place(0, 48),
    opposite = place(1, -145),
    edge = place(2, 150),
    outside = place(3, 151),
    entrant = place(4, 180),
    leaver = place(5, 100);
  const origin = { x: client.x, y: client.y };
  const cast = farm.cast(client, SLAM.id, near.id);
  assert.equal(cast.events.damage.length, 0);
  assert.deepEqual(cast.events.casts[0].origin, {
    x: origin.x * 10,
    y: origin.y * 10,
  });
  assert.deepEqual(cast.events.casts[0].dest, cast.events.casts[0].origin);
  assert.deepEqual(client.hunt.impacts[0].area, { ...origin, radius: 150 });
  assert.equal(farm.character.progress.mana, 88);
  assert.equal(client.hunt.cooldowns[SLAM.id], 17000);
  assert.equal(client.hunt.actionUntil, 10950);
  assert.equal(client.hunt.dash, undefined);
  assert.deepEqual(step(549).events.damage, []);
  entrant.x = origin.x + 100;
  leaver.x = origin.x + 180;
  const hits = step(1).events.damage.filter((e) => e.source === 1);
  assert.deepEqual(
    hits.map((e) => e.target).sort(),
    [near.id, opposite.id, edge.id, entrant.id].sort(),
  );
  assert.ok(hits.every((e) => e.skillId === SLAM.id && e.amount === 38));
  assert.equal(outside.hp, 1000);
  assert.equal(leaver.hp, 1000);
  assert.deepEqual(
    { x: client.x, y: client.y },
    origin,
    "jump is visual; do not move the ground anchor",
  );
  assert.deepEqual(
    step(100).events.damage,
    [],
    "the wave does not repeatedly apply its hit",
  );
  assert.throws(() => farm.cast(client, SLAM.id, near.id), /cooldown/);
  assert.ok(
    step(300).events.moves.some((e) => e.entity === 1),
    "basic attacks resume at 950ms before the floor VFX finishes",
  );
});

test("slam survives loss of its initial target, but death and leaving the hunt cancel pending hits", () => {
  const a = fixture(),
    target = a.place(0, 40),
    other = a.place(1, -80);
  a.farm.cast(a.client, SLAM.id, target.id);
  target.hp = 0;
  assert.deepEqual(
    a
      .step(550)
      .events.damage.filter((e) => e.source === 1)
      .map((e) => e.target),
    [other.id],
  );
  for (const exit of ["stop", "death"]) {
    const b = fixture(),
      enemy = b.place(0, 40);
    b.farm.cast(b.client, SLAM.id, enemy.id);
    if (exit === "stop") b.farm.stop(b.client);
    else {
      b.farm.character.progress.hp = 1;
      enemy.nextAttack = 0;
      b.step(50);
      assert.ok(b.client.hunt.deadAt);
    }
    assert.equal(
      b.step(550).events.damage.filter((e) => e.source === 1).length,
      0,
    );
    assert.equal(enemy.hp, 1000);
  }
});

test("invalid, distant and unavailable slam casts consume no resources and reserve no animation", () => {
  for (const reason of ["distance", "dead", "mana"]) {
    const a = fixture(),
      enemy = a.place(0, reason === "distance" ? 76 : 40);
    if (reason === "dead") enemy.hp = 0;
    if (reason === "mana") a.farm.character.progress.mana = 11;
    const mana = a.farm.character.progress.mana;
    assert.throws(
      () => a.farm.cast(a.client, SLAM.id, enemy.id),
      /invalid_target|no_mana/,
    );
    assert.equal(a.farm.character.progress.mana, mana);
    assert.equal(a.client.hunt.impacts.length, 0);
    assert.deepEqual(a.client.hunt.cooldowns, {});
    assert.equal(a.client.combatAnimUntil, undefined);
  }
});

test("combined skill review migrates once, keeps manual slots and preserves disabled automation and earned progress", () => {
  assert.deepEqual(
    ACTIVE_SKILLS.map((s) => [s.id, s.key]),
    [
      ["avanco-de-luz", "1"],
      [SLAM.id, "2"],
      ["egide-de-luz", "3"],
      ["avatar-da-luz", "4"],
    ],
  );
  const a = fixture({ order: ["corte-poderoso"], version: 1 });
  assert.deepEqual(a.account.character.automation.skillOrder, [
    "avanco-de-luz",
    SLAM.id,
    "egide-de-luz",
  ]);
  assert.deepEqual(
    fixture({ order: [SLAM.id], version: 2 }).account.character.automation
      .skillOrder,
    ["avanco-de-luz", SLAM.id, "egide-de-luz"],
  );
  assert.equal(a.account.character.wallet.gold, 1234);
  a.farm.automation({ skillOrder: ["avanco-de-luz", SLAM.id] });
  new LocalFarm(a.account);
  assert.deepEqual(a.account.character.automation.skillOrder, [
    "avanco-de-luz",
    SLAM.id,
  ]);
  assert.deepEqual(
    fixture({ order: [], version: 1 }).account.character.automation.skillOrder,
    [],
  );
  delete a.account.farmVersion;
  new LocalFarm(a.account);
  assert.deepEqual(a.account.character.automation.skillOrder, [
    "avanco-de-luz",
    SLAM.id,
    "egide-de-luz",
  ]);
});

test("two-handed plunge and ground wave agree on landing, recovery and render layer", () => {
  const rig = warriorRig({ stepMs: 50, moves: {}, skills: {}, basic: {} });
  const move = rig.moves["humano-impacto-luz"];
  assert.equal(move.frames.length * 50, SLAM.duration);
  assert.deepEqual(move.frames[SLAM.impact / 50], ["axeheavy", 4]);
  assert.deepEqual(move.motion.jump, SLAM.jump);
  assert.equal(move.motion.jump.at[1], SLAM.impact);
  assert.equal(move.motion.trail, undefined);
  assert.equal(move.motion.shake, undefined);
  const effects = warriorEffects({ habilidades: {}, efeitos: {} });
  assert.deepEqual(effects.habilidades[SLAM.id], {
    indicador: "guerreiro-impacto-luz",
  });
  assert.equal(effects.efeitos["guerreiro-impacto-luz"].camada, "chao");
  assert.equal(effects.efeitos["guerreiro-impacto-luz"].inteiro, true);
});
