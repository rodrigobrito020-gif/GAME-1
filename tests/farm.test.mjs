import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm, SKILLS } from "../farm.mjs";
import { WARRIOR_ACTIONS } from "../warrior.mjs";
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
  assert.equal(
    cast.events.damage.length,
    0,
    "windup must not deal damage immediately",
  );
  const hp = target.hp;
  assert.equal(
    advance(WARRIOR_ACTIONS[SKILLS[0].id].impact - 50).events.damage.length,
    0,
  );
  assert.equal(target.hp, hp);
  assert.ok(advance(50).events.damage.some((e) => e.skillId === SKILLS[0].id));
  assert.ok(target.hp < hp, "damage lands on the shared animation impact");
  assert.throws(() => farm.cast(client, SKILLS[0].id, target.id), /cooldown/);
  farm.character.progress.mana = 0;
  for (let n = 0; n < 45; n++) advance();
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

test("warehouse preserves item identities, survives reload, and refuses overflow without losing stock", () => {
  const { farm, account, client } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (let n = 0; n < 3; n++)
    farm.reward(client.hunt, client.hunt.monsters[0], farm.events());
  const item = account.bag.find((i) => i.defId === "espada-local"),
    original = structuredClone(item);
  const transfer = farm.warehouseMove([item.uid, item.uid, "999999"], 1);
  assert.deepEqual(transfer.result.moved, [item.uid]);
  assert.deepEqual(transfer.result.refused, ["999999"]);
  assert.equal(
    account.bag.some((i) => i.uid === item.uid),
    false,
  );
  assert.deepEqual(farm.inventory({ scope: 3 }).items[0], original);
  const restored = new LocalFarm(JSON.parse(JSON.stringify(account)));
  assert.deepEqual(restored.inventory({ scope: 3 }).items[0], original);
  while (account.bag.length < 100)
    account.bag.push({
      uid: String(account.nextUid++),
      defId: "fragmento-local",
      qty: 999,
    });
  assert.deepEqual(farm.warehouseMove([item.uid], 2).result.refused, [
    item.uid,
  ]);
  assert.equal(account.warehouse.length, 1);
  account.bag.pop();
  assert.deepEqual(farm.warehouseMove([item.uid], 2).result.moved, [item.uid]);
  assert.equal(account.warehouse.length, 0);
  assert.equal(account.bag.filter((i) => i.uid === item.uid).length, 1);
});
test("selling supports partial stacks, protects locked gear, and cannot pay twice or mutate malformed requests", () => {
  const { farm, account, client } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (let n = 0; n < 3; n++)
    farm.reward(client.hunt, client.hunt.monsters[0], farm.events());
  const material = account.bag.find((i) => i.defId === "fragmento-local"),
    sword = account.bag.find((i) => i.defId === "espada-local");
  const choose = (entries) => ({ case: "uids", value: { entries } }),
    before = farm.character.wallet.gold;
  const sold = farm.sell(choose([{ uid: material.uid, qty: 2 }]));
  assert.equal(sold.result.gold, 4);
  assert.equal(material.qty, 1);
  assert.equal(farm.character.wallet.gold, before + 4);
  farm.lock(sword.uid, true);
  assert.equal(farm.sell(choose([{ uid: sword.uid, qty: 1 }])).result.sold, 0);
  assert.equal(account.bag.includes(sword), true);
  const snapshot = JSON.stringify(account);
  assert.throws(
    () =>
      farm.sell(
        choose([
          { uid: material.uid, qty: 1 },
          { uid: material.uid, qty: 1 },
        ]),
      ),
    /invalid_item/,
  );
  assert.equal(JSON.stringify(account), snapshot);
  assert.throws(
    () => farm.sell(choose([{ uid: material.uid, qty: 2 }])),
    /invalid_item/,
  );
  assert.equal(JSON.stringify(account), snapshot);
  const final = farm.sell(choose([{ uid: material.uid, qty: 1 }]));
  assert.equal(final.result.gold, 2);
  assert.equal(
    farm.sell(choose([{ uid: material.uid, qty: 1 }])).result.gold,
    0,
  );
  farm.lock(sword.uid, false);
  sword.rarity = "epico";
  const gold = farm.character.wallet.gold;
  assert.equal(
    farm.sell(choose([{ uid: sword.uid, qty: 1 }])).result
      .needsRareConfirmation,
    true,
  );
  assert.equal(farm.character.wallet.gold, gold);
  assert.ok(account.bag.includes(sword));
  assert.equal(
    farm.sell(choose([{ uid: sword.uid, qty: 1 }]), true).result.gold,
    25,
  );
});
test("equip best previews without mutation, applies valid upgrades, and remains stable on repeated requests", () => {
  const { farm, account, client } = setup();
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (let n = 0; n < 6; n++)
    farm.reward(client.hunt, client.hunt.monsters[0], farm.events());
  const snapshot = JSON.stringify(account),
    preview = farm.bestEquipment(2, false);
  assert.equal(preview.changes.length, 1);
  assert.equal(preview.deltaPower, 12);
  assert.equal(JSON.stringify(account), snapshot);
  const applied = farm.bestEquipment(2, true);
  assert.equal(applied.result.newPower, farm.character.derived.power);
  assert.equal(applied.delta.removed.length, 1);
  assert.equal(farm.bestEquipment(2, true).result.alreadyBest, true);
  const ids = [
    ...account.bag,
    ...farm.character.equipment.slots.map((e) => e.item),
  ].map((i) => i.uid);
  assert.equal(ids.length, new Set(ids).size);
  assert.throws(() => farm.bestEquipment(99), /invalid_item/);
});
test("inventory applies category filters, requested page size, and power sorting to both bag and storage", () => {
  const { farm, account } = setup();
  account.bag = [
    { uid: "1", defId: "espada-local", qty: 1, level: 1, power: 12 },
    { uid: "2", defId: "peitoral-local", qty: 1, level: 2, power: 9 },
    { uid: "3", defId: "espada-local", qty: 1, level: 3, power: 30 },
  ];
  const before = JSON.stringify(account.bag);
  assert.equal(
    farm.inventory({ scope: 1, sort: 2, pageSize: 1, page: 1 }).items[0].uid,
    "3",
  );
  assert.equal(farm.inventory({ scope: 1, filter: { category: 1 } }).total, 2);
  assert.equal(
    farm.inventory({ scope: 1, filter: { slot: 4 } }).items[0].uid,
    "2",
  );
  assert.equal(farm.inventory({ scope: 1, sort: 3 }).items[0].uid, "3");
  assert.equal(JSON.stringify(account.bag), before);
  farm.warehouseMove(["1", "2"], 1);
  assert.equal(farm.inventory({ scope: 3, sort: 2 }).items[0].uid, "1");
});
