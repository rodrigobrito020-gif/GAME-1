import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm } from "../farm.mjs";
import { LIGHT_AVATAR as AVATAR } from "../light-avatar.mjs";
function setup() {
  let now = 10000;
  const account = {
    farmVersion: 1,
    avatarAutomationVersion: 1,
    skillReviewVersion: 4,
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: { skillOrder: [] },
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now, random: () => 0 }),
    client = {};
  const start = () =>
    farm.start(client, {
      gateId: "treino-local",
      tierMin: 1,
      difficulty: "normal",
    });
  start();
  for (const m of client.hunt.monsters)
    Object.assign(m, { hp: 0, respawnAt: Infinity });
  return {
    account,
    farm,
    client,
    start,
    step(ms) {
      now += ms;
      return farm.step(client, { free: () => false });
    },
  };
}
test("ultimate starts empty, cannot be cast without earned charge, gains nothing from idle or dead targets, and preserves an explicitly disabled auto preference", () => {
  const s = setup(),
    { farm, client } = s;
  assert.equal(farm.avatar.saved.charge, 0);
  assert.throws(() => farm.cast(client, AVATAR.id, 0), /ultimate_energy/);
  assert.equal(farm.character.progress.mana, 100);
  assert.equal(client.hunt.cooldowns[AVATAR.id], undefined);
  s.step(10000);
  assert.equal(farm.avatar.saved.charge, 0);
  farm.hit(client.hunt, client.hunt.monsters[0], 999, "", farm.events(), []);
  assert.equal(farm.avatar.saved.charge, 0);
  assert.deepEqual(farm.character.automation.skillOrder, []);
});
test("real basic hits and received attacks charge the bar, while a killed enemy grants its kill charge only once", () => {
  const s = setup(),
    { farm, client } = s,
    m = client.hunt.monsters[0];
  Object.assign(m, {
    hp: 100,
    maxHp: 100,
    x: client.x,
    y: client.y + 30,
    aggro: true,
    nextAttack: Infinity,
  });
  s.step(1);
  s.step(150);
  assert.equal(farm.avatar.saved.charge, AVATAR.hitCharge);
  m.home = { x: m.x, y: m.y };
  m.nextAttack = 0;
  s.step(1);
  assert.equal(
    farm.avatar.saved.charge,
    AVATAR.hitCharge + AVATAR.receivedCharge,
  );
  const events = farm.events();
  farm.hit(client.hunt, m, 999, "", events, []);
  assert.equal(
    farm.avatar.saved.charge,
    AVATAR.hitCharge + AVATAR.receivedCharge + AVATAR.killCharge,
  );
  farm.hit(client.hunt, m, 999, "", events, []);
  assert.equal(events.deaths.length, 1);
});
test("activation consumes exactly 100, applies at the raised-sword frame, preserves mana/items and expires while cooldown survives scene exit and reload", () => {
  const s = setup(),
    { farm, client, account } = s;
  farm.avatar.saved.charge = 100;
  const mana = farm.character.progress.mana,
    equipment = structuredClone(farm.character.equipment);
  const cast = farm.cast(client, AVATAR.id, 0);
  assert.equal(cast.events.casts[0].skillId, AVATAR.id);
  assert.equal(farm.avatar.saved.charge, 0);
  assert.equal(farm.avatar.active(), false);
  assert.equal(s.step(299).events.buffs.length, 0);
  assert.equal(s.step(1).events.buffs[0].buffId, AVATAR.id);
  assert.equal(farm.avatar.active(), true);
  assert.equal(farm.character.progress.mana, mana);
  assert.deepEqual(farm.character.equipment, equipment);
  assert.equal(s.step(AVATAR.durationMs - 1).events.buffs.length, 0);
  assert.equal(s.step(1).events.buffs[0].removed, true);
  assert.equal(farm.avatar.active(), false);
  farm.stop(client);
  s.start();
  farm.avatar.saved.charge = 100;
  assert.throws(() => farm.cast(client, AVATAR.id, 0), /cooldown/);
  const saved = JSON.parse(JSON.stringify(account)),
    restored = new LocalFarm(saved, {
      now: () => 10000 + 300 + AVATAR.durationMs,
    });
  assert.equal(restored.avatar.active(), false);
  assert.equal(restored.avatar.saved.readyAt, 10000 + AVATAR.cooldownMs);
  assert.equal(restored.avatar.saved.charge, 100);
});
test("avatar cleaves each nearby living enemy once at basic impact, does not hit distant enemies or recharge itself", () => {
  const s = setup(),
    { farm, client } = s;
  farm.avatar.saved.charge = 100;
  farm.cast(client, AVATAR.id, 0);
  s.step(300);
  const [a, b, out] = client.hunt.monsters;
  for (const [m, dx] of [
    [a, 0],
    [b, 60],
    [out, 230],
  ])
    Object.assign(m, {
      hp: 100,
      maxHp: 100,
      x: client.x + dx,
      y: client.y + 30,
      nextAttack: Infinity,
    });
  s.step(300);
  const impact = s.step(150),
    hits = impact.events.damage.filter((e) => e.source === 1);
  assert.deepEqual(hits.map((e) => e.target).sort(), [a.id, b.id].sort());
  assert.ok(hits.every((e) => e.skillId === AVATAR.id && e.amount === 15));
  assert.equal(out.hp, 100);
  assert.equal(farm.avatar.saved.charge, 0);
});
test("damage reduction combines with existing defense and aegis, and death removes the transformation and charge", () => {
  const s = setup(),
    { farm, client } = s;
  farm.avatar.saved.charge = 100;
  farm.cast(client, AVATAR.id, 0);
  s.step(300);
  const m = client.hunt.monsters[0];
  Object.assign(m, {
    hp: 10000,
    x: client.x,
    y: client.y + 20,
    aggro: true,
    nextAttack: 0,
  });
  m.home = { x: m.x, y: m.y };
  client.hunt.area = { ...client.hunt.area, damage: 100 };
  farm.defenseBuffs.apply(farm.member(client)); // Base DEF 0 + minimum aegis bonus 2.
  const before = farm.character.progress.hp,
    damage = s.step(1).events.damage.find((e) => e.source === m.id);
  assert.equal(damage.amount, Math.round(98 * 0.65));
  assert.equal(farm.character.progress.hp, before - damage.amount);
  farm.character.progress.hp = 1;
  m.nextAttack = 0;
  const death = s.step(1);
  assert.equal(death.died, true);
  assert.equal(farm.avatar.active(), false);
  assert.equal(farm.avatar.saved.charge, 0);
  assert.ok(
    death.events.buffs.some((e) => e.buffId === AVATAR.id && e.removed),
  );
  assert.equal(client.hunt.impacts.length, 0);
});

test("manual ultimate queues behind a committed strike, consumes energy only on activation and is cancelled on scene exit", () => {
  const s = setup(),
    { farm, client } = s;
  farm.avatar.saved.charge = 100;
  client.hunt.actionUntil = 10200;
  const request = farm.cast(client, AVATAR.id, 0);
  assert.equal(request.events.casts.length, 0);
  assert.equal(client.hunt.avatarQueued, true);
  assert.equal(farm.avatar.saved.charge, 100);
  assert.equal(s.step(199).events.casts.length, 0);
  const cast = s.step(1);
  assert.equal(cast.events.casts[0].skillId, AVATAR.id);
  assert.equal(farm.avatar.saved.charge, 0);
  s.step(300);
  const stopped = farm.stop(client);
  assert.ok(stopped.buffs.some((e) => e.buffId === AVATAR.id && e.removed));
  assert.equal(farm.avatar.active(), false);
  assert.equal(farm.avatar.saved.readyAt, 10200 + AVATAR.cooldownMs);
  const other = setup();
  other.farm.avatar.saved.charge = 100;
  other.client.hunt.actionUntil = 10200;
  other.farm.cast(other.client, AVATAR.id, 0);
  other.farm.stop(other.client);
  other.step(1000);
  assert.equal(other.farm.avatar.saved.charge, 100);
  assert.equal(other.farm.avatar.saved.readyAt, 0);
});

test("auto-ultimate can be toggled, does not stall when uncharged and uses a full bar before normal combat", () => {
  const s = setup(),
    { farm, client } = s;
  assert.ok(!farm.character.automation.skillOrder.includes(AVATAR.id));
  farm.automation({ skillOrder: [AVATAR.id] });
  const m = client.hunt.monsters[0];
  Object.assign(m, {
    hp: 1000,
    maxHp: 1000,
    x: client.x,
    y: client.y + 30,
    nextAttack: Infinity,
  });
  const uncharged = s.step(1);
  assert.ok(uncharged.events.moves.some((e) => e.move === "humano-espada"));
  assert.equal(uncharged.events.casts.length, 0);
  farm.avatar.saved.charge = 100;
  const cast = s.step(400);
  assert.equal(cast.events.casts[0].skillId, AVATAR.id);
  assert.equal(farm.avatar.saved.charge, 0);
});

test("existing saves enable Avatar once without changing other automatic choices", () => {
  const s = setup();
  delete s.account.avatarAutomationVersion;
  s.account.character.automation.skillOrder = ["impacto-de-luz"];
  const f = new LocalFarm(s.account);
  assert.deepEqual(f.character.automation.skillOrder, [
    "impacto-de-luz",
    AVATAR.id,
  ]);
  assert.equal(s.account.avatarAutomationVersion, 1);
  f.automation({ skillOrder: ["impacto-de-luz"] });
  assert.deepEqual(new LocalFarm(s.account).character.automation.skillOrder, [
    "impacto-de-luz",
  ]);
});
test("approved durations are 45 seconds active and 60 seconds cooldown", () => {
  assert.equal(AVATAR.durationMs, 45000);
  assert.equal(AVATAR.cooldownMs, 60000);
  const s = setup(),
    { farm, client } = s;
  farm.automation({ skillOrder: [AVATAR.id] });
  const m = client.hunt.monsters[0];
  Object.assign(m, {
    hp: 100000,
    maxHp: 100000,
    x: client.x,
    y: client.y + 30,
    nextAttack: Infinity,
  });
  farm.avatar.saved.charge = 100;
  assert.equal(s.step(1).events.casts[0].skillId, AVATAR.id);
  s.step(300);
  assert.equal(farm.avatar.active(), true);
  s.step(AVATAR.durationMs - 1);
  assert.equal(farm.avatar.active(), true);
  s.step(1);
  assert.equal(farm.avatar.active(), false);
  farm.avatar.saved.charge = 100;
  assert.equal(s.step(1000).events.casts.length, 0);
  const cast = s.step(AVATAR.cooldownMs);
  assert.equal(cast.events.casts[0].skillId, AVATAR.id);
});
