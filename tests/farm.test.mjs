import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm, SKILLS } from "../farm.mjs";
function setup() {
  let clock = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: {},
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => clock, random: () => 0 });
  const client = { x: 944, y: 1008 };
  return {
    account,
    farm,
    client,
    advance(ms = 50) {
      clock += ms;
      return farm.step(client);
    },
  };
}
test("farm awards only a live enemy kill, respawns, levels and preserves earned items", () => {
  const { farm, client, account, advance } = setup();
  assert.throws(
    () =>
      farm.start(client, {
        gateId: "elite-local",
        tierMin: 5,
        difficulty: "normal",
      }),
    /level_required/,
  );
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  assert.throws(
    () =>
      farm.start(client, {
        gateId: "treino-local",
        tierMin: 1,
        difficulty: "normal",
      }),
    /already_hunting/,
  );
  for (let n = 0; n < 1600 && farm.character.progress.level < 2; n++) advance();
  assert.ok(client.hunt.session.kills >= 6);
  assert.equal(farm.character.progress.level, 2);
  assert.ok(Number(farm.character.wallet.gold) > 1000);
  assert.ok(account.bag.some((i) => i.defId === "espada-local"));
  assert.equal(
    account.bag.find((i) => i.defId === "fragmento-local").qty,
    client.hunt.session.kills,
  );
  const dead = { ...client.hunt.monsters[0], hp: 0 };
  const gold = account.character.wallet.gold;
  farm.hit(client.hunt, dead, 999, "", farm.events(), []);
  assert.equal(account.character.wallet.gold, gold);
  const saved = JSON.parse(JSON.stringify(account));
  farm.stop(client);
  for (let n = 0; n < 100; n++) advance();
  assert.equal(account.character.wallet.gold, gold);
  const restored = new LocalFarm(saved);
  assert.deepEqual(restored.account.bag, account.bag);
  assert.equal(restored.character.progress.level, 2);
});
test("skills validate target, range, mana and cooldown; basic attacks continue without mana", () => {
  const { farm, client, advance } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  client.x = 848;
  client.y = 960;
  const target = client.hunt.monsters[0];
  assert.throws(() => farm.cast(client, SKILLS[0].id, 999), /invalid_target/);
  const mp = farm.character.progress.mana;
  const cast = farm.cast(client, SKILLS[0].id, target.id);
  assert.equal(farm.character.progress.mana, mp - 8);
  assert.ok(cast.events.damage.length);
  assert.throws(() => farm.cast(client, SKILLS[0].id, target.id), /cooldown/);
  farm.character.progress.mana = 0;
  for (let n = 0; n < 25; n++) advance();
  assert.ok(client.hunt.session.kills > 0);
});
test("death stops rewards and returns to city, while leaving ends simulation immediately", () => {
  const { farm, client, advance } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  farm.character.progress.hp = 1;
  farm.character.automation.skillOrder = [];
  for (const m of client.hunt.monsters) {
    m.x = client.x;
    m.y = client.y;
    m.nextAttack = 0;
  }
  const death = advance();
  assert.equal(death.died, true);
  assert.equal(farm.character.progress.hp, 0);
  const gold = farm.character.wallet.gold;
  for (let n = 0; n < 61; n++) advance();
  assert.equal(farm.character.wallet.gold, gold);
  assert.equal(advance().returnCity, true);
  farm.stop(client);
  assert.equal(client.hunt, null);
});
test("equipment swaps preserve UIDs and affect stats; capacity and invalid items cannot destroy gear", () => {
  const { farm, client, account } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (let n = 0; n < 3; n++)
    farm.reward(client.hunt, client.hunt.monsters[0], farm.events());
  const item = account.bag.find((i) => i.defId === "espada-local"),
    atk = farm.character.derived.atk;
  const equipped = farm.equip(item.uid);
  assert.equal(equipped.result.equippedUid, item.uid);
  assert.equal(farm.character.derived.atk, atk + 6);
  assert.equal(
    account.bag.some((i) => i.uid === item.uid),
    false,
  );
  assert.throws(() => farm.equip("999999"), /invalid_item/);
  farm.unequip(1);
  assert.equal(farm.character.derived.atk, atk);
  assert.equal(account.bag.filter((i) => i.uid === item.uid).length, 1);
  farm.equip(item.uid);
  while (account.bag.length < 100)
    account.bag.push({
      uid: String(account.nextUid++),
      defId: "fragmento-local",
      qty: 999,
      level: 1,
    });
  assert.throws(() => farm.unequip(1), /invalid_item/);
  assert.equal(farm.character.equipment.slots[0].item.uid, item.uid);
});
test("inventory filters paginate without mutation and potions consume real stock and gold", () => {
  const { farm, account } = setup();
  assert.equal(farm.inventory({ scope: 3 }).total, 0);
  assert.throws(() => farm.potion(1, 1), /potion_unavailable/);
  farm.character.progress.hp = 100;
  farm.potion(1, 1);
  assert.equal(farm.character.consumables.hpPotions.pequena, 9);
  assert.equal(farm.character.progress.hp, 200);
  assert.throws(() => farm.potion(1, 1), /potion_unavailable/);
  farm.buyPotion(1, 1, 2);
  assert.equal(farm.character.wallet.gold, 980);
  assert.equal(farm.character.consumables.hpPotions.pequena, 11);
  assert.throws(() => farm.buyPotion(1, 1, -1), /invalid_item/);
  assert.throws(() => farm.buyPotion(1, 1, 1000), /no_gold/);
  assert.throws(
    () => farm.automation({ skillOrder: ["hacked"] }),
    /invalid_skill/,
  );
  assert.equal(account.bag.length, 0);
});
