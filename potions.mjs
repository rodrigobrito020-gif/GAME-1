// Independent preferences for each resource and strength. All consumption is
// authoritative and shares the existing 1.5s potion recovery window.
export const POTION_THRESHOLDS = [30, 50, 70];
export const POTION_TIERS = [
  {
    tier: 1,
    key: "pequena",
    name: "Pequena",
    minLevel: 1,
    pct: 0.4,
    price: 10,
  },
  { tier: 2, key: "media", name: "Média", minLevel: 55, pct: 0.6, price: 40 },
  {
    tier: 3,
    key: "grande",
    name: "Grande",
    minLevel: 150,
    pct: 0.8,
    price: 100,
  },
];
export function potionDefinition(kind, tier) {
  const def = POTION_TIERS.find((t) => t.tier === tier);
  if (![1, 2].includes(kind) || !def) throw Error("local.invalid_item");
  return {
    ...def,
    kind,
    resource: kind === 1 ? "hp" : "mana",
    stockKey: kind === 1 ? "hpPotions" : "manaPotions",
    label: kind === 1 ? "HP" : "Mana",
  };
}
export function ensurePotions(account) {
  const c = account.character;
  c.consumables ??= {};
  c.consumables.hpPotions ??= { pequena: 0 };
  c.consumables.manaPotions ??= { pequena: 0 };
  account.potionPreferences ??= {};
  for (const kind of [1, 2])
    for (const def of POTION_TIERS) {
      const id = `${kind}:${def.tier}`,
        old = account.potionPreferences[id];
      account.potionPreferences[id] = {
        automatic: !!old?.automatic,
        threshold: POTION_THRESHOLDS.includes(old?.threshold)
          ? old.threshold
          : 50,
      };
    }
  account.potionSelection ??= {};
  for (const kind of [1, 2]) {
    const selected = POTION_TIERS.find(
      (t) => t.tier === account.potionSelection[kind],
    );
    if (!selected || c.progress.level < selected.minLevel) {
      const enabled = [...POTION_TIERS]
        .reverse()
        .filter(
          (t) =>
            c.progress.level >= t.minLevel &&
            account.potionPreferences[`${kind}:${t.tier}`].automatic,
        );
      const stock =
        kind === 1 ? c.consumables.hpPotions : c.consumables.manaPotions;
      account.potionSelection[kind] =
        (enabled.find((t) => stock[t.key] > 0) ?? enabled[0])?.tier ?? 1;
    }
  }
}
export function selectPotion(account, kind, tier) {
  ensurePotions(account);
  const def = potionDefinition(kind, tier);
  if (account.character.progress.level < def.minLevel)
    throw Error("local.level_required");
  account.potionSelection[kind] = tier;
  return { kind, tier };
}
export function configurePotion(account, kind, tier, automatic, threshold) {
  ensurePotions(account);
  const def = potionDefinition(kind, tier);
  if (typeof automatic !== "boolean" || !POTION_THRESHOLDS.includes(threshold))
    throw Error("local.invalid_item");
  if (automatic && account.character.progress.level < def.minLevel)
    throw Error("local.level_required");
  account.potionPreferences[`${kind}:${tier}`] = { automatic, threshold };
  if (automatic) account.potionSelection[kind] = tier;
  return account.potionPreferences[`${kind}:${tier}`];
}
export function consumePotion(account, kind, tier, now, readyAt) {
  ensurePotions(account);
  const def = potionDefinition(kind, tier),
    c = account.character,
    max = def.resource === "hp" ? c.derived.maxHp : c.derived.maxMana,
    stock = c.consumables[def.stockKey];
  if (c.progress.level < def.minLevel) throw Error("local.level_required");
  if (
    !c.progress.hp ||
    !(stock[def.key] > 0) ||
    c.progress[def.resource] >= max ||
    now < readyAt
  )
    throw Error("local.potion_unavailable");
  stock[def.key]--;
  c.progress[def.resource] = Math.min(
    max,
    c.progress[def.resource] + Math.ceil(max * def.pct),
  );
  return { kind, tier };
}
export function buyPotionStock(account, kind, tier, qty) {
  ensurePotions(account);
  const def = potionDefinition(kind, tier),
    c = account.character;
  if (!Number.isInteger(qty) || qty < 1 || qty > 1000)
    throw Error("local.invalid_item");
  if (c.progress.level < def.minLevel) throw Error("local.level_required");
  const cost = qty * def.price;
  if (Number(c.wallet.gold) < cost) throw Error("local.no_gold");
  const stock = c.consumables[def.stockKey];
  c.wallet.gold = Number(c.wallet.gold) - cost;
  stock[def.key] = (stock[def.key] ?? 0) + qty;
  return { kind, tier, qty, goldCost: cost, owned: stock[def.key] };
}
export function automaticPotion(account, now, readyAt) {
  ensurePotions(account);
  if (!account.character.progress.hp || now < readyAt) return null;
  const c = account.character;
  for (const kind of [1, 2])
    for (const tier of [account.potionSelection[kind]]) {
      const def = potionDefinition(kind, tier),
        pref = account.potionPreferences[`${kind}:${tier}`],
        max = kind === 1 ? c.derived.maxHp : c.derived.maxMana;
      if (
        !pref.automatic ||
        c.progress.level < def.minLevel ||
        !(c.consumables[def.stockKey][def.key] > 0) ||
        c.progress[def.resource] >= max ||
        c.progress[def.resource] * 100 > max * pref.threshold
      )
        continue;
      return consumePotion(account, kind, tier, now, readyAt);
    }
  return null;
}
export function potionState(account, now, readyAt = 0) {
  ensurePotions(account);
  const c = account.character;
  return {
    selectedPotionTiers: { ...account.potionSelection },
    potionCooldownMs: Math.max(0, readyAt - now),
    potions: [1, 2].flatMap((kind) =>
      POTION_TIERS.map((t) => {
        const d = potionDefinition(kind, t.tier);
        return {
          kind,
          tier: t.tier,
          name: `Poção ${d.label} ${t.name}`,
          minLevel: t.minLevel,
          pct: t.pct,
          price: t.price,
          stock: c.consumables[d.stockKey][d.key] ?? 0,
          unlocked: c.progress.level >= t.minLevel,
          ...account.potionPreferences[`${kind}:${t.tier}`],
          icon: `/assets/ui/royal-potions/${kind === 1 ? "hp" : "mana"}-${t.tier}.png`,
        };
      }),
    ),
  };
}
