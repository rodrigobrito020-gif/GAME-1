import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ensurePotions,
  selectPotion,
  configurePotion,
  buyPotionStock,
  consumePotion,
  automaticPotion,
  potionState,
} from "../potions.mjs";
function setup(level = 1) {
  const a = {
    character: {
      progress: { level, hp: 100, mana: 100 },
      derived: { maxHp: 100, maxMana: 100 },
      wallet: { gold: 10000 },
      consumables: {
        hpPotions: { pequena: 10, media: 3, grande: 2 },
        manaPotions: { pequena: 10, media: 3, grande: 2 },
      },
    },
  };
  ensurePotions(a);
  return a;
}
test("six potion types unlock exactly at levels 1, 55 and 150; buying, using and auto mode all enforce the level", () => {
  for (const kind of [1, 2])
    for (const [tier, level] of [
      [2, 55],
      [3, 150],
    ]) {
      const a = setup(level - 1),
        kept = structuredClone(a.character);
      a.character.progress.hp = 10;
      a.character.progress.mana = 10;
      assert.throws(() => buyPotionStock(a, kind, tier, 1), /level_required/);
      assert.throws(
        () => consumePotion(a, kind, tier, 1000, 0),
        /level_required/,
      );
      assert.throws(
        () => configurePotion(a, kind, tier, true, 50),
        /level_required/,
      );
      assert.equal(a.character.wallet.gold, kept.wallet.gold);
      a.character.progress.level = level;
      configurePotion(a, kind, tier, true, 50);
      const before = structuredClone(a.character.consumables);
      assert.equal(automaticPotion(a, 1000, 0).tier, tier);
      assert.equal(
        a.character.progress[kind === 1 ? "hp" : "mana"],
        tier === 2 ? 70 : 90,
      );
      const stock = kind === 1 ? "hpPotions" : "manaPotions",
        key = tier === 2 ? "media" : "grande";
      assert.equal(a.character.consumables[stock][key], before[stock][key] - 1);
      const cost = buyPotionStock(a, kind, tier, 2);
      assert.equal(cost.goldCost, tier === 2 ? 80 : 200);
    }
  assert.equal(potionState(setup(), 1000).potions.length, 6);
  assert.equal(
    potionState(setup(), 1000).potions.filter((p) => p.unlocked).length,
    2,
  );
});
test("each resource/tier remembers independent Manual/Auto and 30, 50 or 70 percent choices after serialization without granting stock", () => {
  const a = setup(150);
  for (const kind of [1, 2])
    for (const tier of [1, 2, 3])
      configurePotion(a, kind, tier, tier !== 2, [30, 50, 70][tier - 1]);
  const stock = structuredClone(a.character.consumables),
    b = JSON.parse(JSON.stringify(a));
  ensurePotions(b);
  assert.deepEqual(b.potionPreferences, a.potionPreferences);
  assert.deepEqual(b.character.consumables, stock);
  assert.deepEqual(b.potionPreferences["1:1"], {
    automatic: true,
    threshold: 30,
  });
  assert.deepEqual(b.potionPreferences["2:2"], {
    automatic: false,
    threshold: 50,
  });
  assert.throws(() => configurePotion(a, 1, 1, true, 99), /invalid_item/);
});
test("automatic potion triggers at each chosen boundary, never above it, and never consumes a manual tier", () => {
  for (const kind of [1, 2])
    for (const threshold of [30, 50, 70]) {
      const a = setup(150),
        res = kind === 1 ? "hp" : "mana";
      configurePotion(a, kind, 1, true, threshold);
      a.character.progress[res] = threshold + 1;
      assert.equal(automaticPotion(a, 1000, 0), null);
      a.character.progress[res] = threshold;
      assert.deepEqual(automaticPotion(a, 1000, 0), { kind, tier: 1 });
      assert.equal(a.character.progress[res], Math.min(100, threshold + 40));
      assert.equal(
        a.character.consumables[kind === 1 ? "hpPotions" : "manaPotions"].media,
        3,
      );
    }
});
test("auto consumes the selected enabled tier, shares recovery across HP/mana and cannot revive a dead character", () => {
  const a = setup(150);
  a.character.progress.hp = 20;
  a.character.progress.mana = 20;
  for (const kind of [1, 2])
    for (const tier of [1, 2, 3]) configurePotion(a, kind, tier, true, 70);
  assert.deepEqual(automaticPotion(a, 1000, 0), { kind: 1, tier: 3 });
  assert.equal(a.character.progress.hp, 100);
  assert.equal(automaticPotion(a, 1100, 2500), null);
  assert.throws(() => consumePotion(a, 2, 1, 1100, 2500), /potion_unavailable/);
  assert.deepEqual(automaticPotion(a, 2500, 2500), { kind: 2, tier: 3 });
  a.character.progress.hp = 0;
  a.character.progress.mana = 1;
  assert.equal(automaticPotion(a, 5000, 0), null);
  assert.throws(() => consumePotion(a, 1, 3, 5000, 0), /potion_unavailable/);
});
test("manual use respects stock, resource cap and cooldown; invalid shop quantities or gold leave stock untouched", () => {
  const a = setup(150);
  assert.throws(() => consumePotion(a, 1, 1, 1000, 0), /potion_unavailable/);
  a.character.progress.hp = 90;
  consumePotion(a, 1, 3, 1000, 0);
  assert.equal(a.character.progress.hp, 100);
  assert.equal(a.character.consumables.hpPotions.grande, 1);
  a.character.wallet.gold = 0;
  const kept = structuredClone(a.character.consumables);
  assert.throws(() => buyPotionStock(a, 1, 3, 1), /no_gold/);
  assert.throws(() => buyPotionStock(a, 1, 3, -1), /invalid_item/);
  assert.throws(() => buyPotionStock(a, 1, 3, 1.5), /invalid_item/);
  assert.deepEqual(a.character.consumables, kept);
});

test("selected type persists per resource and only its automatic preference can consume hidden stock", () => {
  const a = setup(150);
  configurePotion(a, 1, 3, true, 70);
  configurePotion(a, 1, 1, true, 50);
  selectPotion(a, 1, 1);
  a.character.progress.hp = 30;
  assert.deepEqual(automaticPotion(a, 1000, 0), { kind: 1, tier: 1 });
  assert.equal(a.character.consumables.hpPotions.grande, 2);
  selectPotion(a, 1, 2);
  a.character.progress.hp = 10;
  assert.equal(
    automaticPotion(a, 3000, 0),
    null,
    "hidden auto tiers must not fire when selected type is manual",
  );
  configurePotion(a, 1, 2, true, 30);
  assert.equal(automaticPotion(a, 4000, 0).tier, 2);
  const b = JSON.parse(JSON.stringify(a));
  assert.equal(potionState(b, 5000).selectedPotionTiers[1], 2);
  assert.equal(potionState(b, 5000).selectedPotionTiers[2], 1);
  selectPotion(b, 1, 3);
  b.character.consumables.hpPotions.grande = 0;
  b.character.progress.hp = 1;
  assert.equal(
    automaticPotion(b, 6000, 0),
    null,
    "empty selection does not secretly use another size",
  );
  const low = setup(54);
  assert.throws(() => selectPotion(low, 1, 2), /level_required/);
  assert.equal(low.potionSelection[1], 1);
  assert.throws(() => selectPotion(low, 3, 1), /invalid_item/);
});
test("old potion preferences migrate to one usable selected type without granting stock or discarding per-tier thresholds", () => {
  const a = setup(150);
  delete a.potionSelection;
  a.potionPreferences["1:2"] = { automatic: true, threshold: 30 };
  a.potionPreferences["1:3"] = { automatic: true, threshold: 70 };
  const stock = structuredClone(a.character.consumables);
  ensurePotions(a);
  assert.equal(a.potionSelection[1], 3);
  assert.deepEqual(a.character.consumables, stock);
  assert.equal(a.potionPreferences["1:2"].threshold, 30);
});
