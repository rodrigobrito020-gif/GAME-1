import { DROP_TABLES } from "./drops";
import {
  BALANCE,
  GRADES,
  PROFESSIONS,
  RARITIES,
  REFORGE_WEIGHTS,
  WEAPONS,
} from "./config";
import type {
  Character,
  Grade,
  Hunt,
  Item,
  Party,
  Rarity,
  Slot,
  Stats,
  Weapon,
} from "./types";
export const xpRequired = (level: number) =>
  Math.round(40 * Math.pow(level, 1.5));
export const expFactor = (level: number) => (level >= 300 ? 0.5 : 1);
export function allowedWeapons(c: Character): Weapon[] {
  const p = PROFESSIONS.find((p) => p.id === c.profession);
  if (c.level >= 150 && c.specialization && p) {
    const branch = p.branches.filter((b) => b.id === c.specialization);
    return [...new Set(branch.map((b) => b.weapon))];
  }
  if (c.level >= 50 && p) return p.weapons;
  return c.archetype === "mystic"
    ? ["staff", "magicMace"]
    : c.race === "dwarf"
      ? ["hammer", "dagger", "polearm"]
      : [
          "swordShield",
          "dual",
          "polearm",
          "dagger",
          "bow",
          "greatsword",
          "fist",
          "hammer",
        ];
}
export function canEquip(c: Character, item: Item): string | null {
  if (item.kind !== "equipment" || !item.grade || !item.slot)
    return "Esse item não é um equipamento.";
  if (c.level < GRADES[item.grade])
    return `Requer nível ${GRADES[item.grade]}.`;
  if (item.weapon && !allowedWeapons(c).includes(item.weapon))
    return "Arma incompatível com sua profissão/especialização.";
  if (item.slot === "shield" && c.equipment.weapon?.weapon !== "swordShield")
    return "Escudo requer a empunhadura Espada + Escudo.";
  return null;
}
export function statsFor(c: Character): Stats {
  const weapon = c.equipment.weapon?.weapon,
    magic =
      weapon === "staff" ||
      weapon === "magicMace" ||
      (!weapon && c.archetype === "mystic");
  let attack = 9 + c.level * 3.8,
    defense = 3 + c.level * 1.5,
    mdef = 3 + c.level * 1.5;
  for (const item of Object.values(c.equipment)) {
    if (!item?.grade) continue;
    const rank = Object.keys(GRADES).indexOf(item.grade) + 1,
      rarity = RARITIES.indexOf(item.rarity ?? "Comum") + 1;
    if (item.slot === "weapon")
      attack += rank * 12 + rarity * 3 + (item.bonus ?? 0);
    else {
      defense += rank * 3 + rarity;
      mdef += rank * 3 + rarity;
    }
  }
  const maxHp = Math.round(200 + c.level * 35),
    maxMp = Math.round(100 + c.level * 6),
    accuracy = Math.round(20 + c.level * 0.65),
    magicAccuracy = Math.round(20 + c.level * 0.65);
  return {
    maxHp,
    maxMp,
    attack,
    defense,
    mdef,
    accuracy,
    magicAccuracy,
    evasion: 8 + c.level * 0.32,
    crit: 0.1,
    power: Math.round(attack * 10 + defense * 5 + maxHp),
    range: weapon === "bow" || magic ? 210 : 62,
    magic,
  };
}
export function canEnter(c: Character, hunt: Hunt) {
  const stats = statsFor(c);
  if (c.level < hunt.min) return `Requer nível ${hunt.min}.`;
  if ((stats.magic ? stats.magicAccuracy : stats.accuracy) < hunt.accuracy)
    return `Precisão ${stats.magic ? "mágica" : "física"} mínima: ${hunt.accuracy}.`;
  return null;
}
export const partyExp = (base: number, members: number) =>
  (base * (members === 5 ? 1.2 : 1)) / Math.max(1, members);
export const dropChance = (base: number, members: number, boss = false) =>
  Math.min(1, base * (members === 5 && !boss ? 1.1 : 1));
export function lootRecipient(
  party: Party | undefined,
  participants: string[],
  random = Math.random,
) {
  if (!party || party.loot === "random")
    return participants[
      Math.min(
        participants.length - 1,
        Math.floor(random() * participants.length),
      )
    ];
  if (
    party.loot === "designated" &&
    participants.includes(party.recipientId ?? "")
  )
    return party.recipientId!;
  return participants.includes(party.leaderId)
    ? party.leaderId
    : participants[0];
}
export function huntGrade(min: number): Grade {
  return min <= 50
    ? "NG"
    : min <= 100
      ? "D"
      : min <= 150
        ? "C"
        : min <= 200
          ? "B"
          : min <= 250
            ? "A"
            : "S";
}
export function reforgeRoll(random = Math.random) {
  let roll = random() * 100;
  for (let i = 0; i < REFORGE_WEIGHTS.length; i++) {
    roll -= REFORGE_WEIGHTS[i];
    if (roll < 0) return i + 1;
  }
  return 10;
}
export function hitChance(accuracy: number, evasion: number) {
  return Math.max(
    BALANCE.hitFloor,
    Math.min(0.98, 0.9 + (accuracy - evasion) * 0.006),
  );
}
export function damage(
  attack: number,
  defense: number,
  power = 1,
  critical = false,
) {
  return Math.max(
    1,
    Math.round(
      attack *
        power *
        (100 / (100 + Math.max(0, defense))) *
        (critical ? BALANCE.critMultiplier : 1),
    ),
  );
}
export function makeEquipment(
  id: string,
  grade: Grade,
  slot: Slot,
  weapon?: Weapon,
  rarity: Rarity = "Comum",
): Item {
  const set: Record<Grade, string> = {
    NG: "Couro",
    D: "Brigandine",
    C: "Composite",
    B: "Doom",
    A: "Majestic",
    S: "Imperial Crusader",
  };
  return {
    id,
    name:
      slot === "weapon"
        ? `${WEAPONS[weapon ?? "swordShield"]} · ${grade === "NG" ? "No Grade" : grade}`
        : `${set[grade]} · ${slot === "chest" ? "Peitoral" : slot === "legs" ? "Calças" : slot === "helmet" ? "Elmo" : slot === "gloves" ? "Luvas" : slot === "boots" ? "Botas" : slot === "shield" ? "Escudo" : slot === "ring" ? "Anel" : "Colar"}`,
    kind: "equipment",
    quantity: 1,
    grade,
    slot,
    rarity,
    ...(weapon ? { weapon } : {}),
    bonus: 0,
  };
}
export function newCharacter(
  id: string,
  name: string,
  race: Character["race"],
  archetype: Character["archetype"],
): Character {
  const c: Character = {
    id,
    name,
    race,
    archetype,
    level: 1,
    xp: 0,
    sp: 0,
    adena: BALANCE.initialAdena,
    profession: null,
    specialization: null,
    inventory: [
      {
        id: "hp-stock",
        name: "Poção de HP",
        kind: "potion",
        potion: "hp",
        quantity: 10,
      },
      {
        id: "mp-stock",
        name: "Poção de MP",
        kind: "potion",
        potion: "mp",
        quantity: 10,
      },
    ],
    equipment: {
      weapon: makeEquipment(
        `${id}-weapon`,
        "NG",
        "weapon",
        archetype === "mystic"
          ? "staff"
          : race === "dwarf"
            ? "hammer"
            : "swordShield",
      ),
      chest: makeEquipment(`${id}-chest`, "NG", "chest"),
      legs: makeEquipment(`${id}-legs`, "NG", "legs"),
    },
    hp: 235,
    mp: 106,
    autoSkills: [true, true, true, true],
    autoPotion: { hp: 35, mp: 20 },
    createdAt: Date.now(),
  };
  if (c.equipment.weapon?.weapon === "swordShield")
    c.equipment.shield = makeEquipment(`${id}-shield`, "NG", "shield");
  return c;
}
export function addItem(c: Character, item: Item): boolean {
  const stack = c.inventory.find(
    (i) => i.kind !== "equipment" && i.name === item.name,
  );
  if (stack) {
    stack.quantity += item.quantity;
    return true;
  }
  if (c.inventory.length >= BALANCE.inventoryLimit) return false;
  c.inventory.push({ ...item });
  return true;
}
export const countMaterial = (c: Character, name: string) =>
  c.inventory
    .filter((i) => i.material === name)
    .reduce((n, i) => n + i.quantity, 0);
export function takeMaterial(c: Character, name: string, amount: number) {
  if (countMaterial(c, name) < amount) return false;
  let remain = amount;
  for (const i of c.inventory) {
    if (i.material !== name) continue;
    const n = Math.min(i.quantity, remain);
    i.quantity -= n;
    remain -= n;
  }
  c.inventory = c.inventory.filter((i) => i.quantity > 0);
  return true;
}
export function normalLoot(
  min: number,
  members: number,
  boss: boolean,
  id: () => string,
  random = Math.random,
  species = `physical-${min}`,
): Item[] {
  const grade = huntGrade(min),
    items: Item[] = [];
  // Animal Bone uses its own table; this is not a universal spoil multiplier.
  for (const row of DROP_TABLES[species]?.normal ?? [])
    if (random() < dropChance(row.chance, members, boss))
      items.push({
        id: id(),
        name: row.name,
        material: row.material,
        kind: "material",
        quantity: row.min + Math.floor(random() * (row.max - row.min + 1)),
      });
  if (min > 150 && !boss) {
    items.push({
      id: id(),
      name: `Minério ${grade}`,
      material: `ore-${grade}`,
      kind: "material",
      quantity: 1 + Math.floor(random() * 2),
    });
    return items;
  }
  if (
    random() <
    dropChance(
      boss ? BALANCE.bossEquipmentChance : BALANCE.normalEquipmentChance,
      members,
      boss,
    )
  ) {
    const slots: Slot[] = boss
      ? ["chest", "legs", "boots", "helmet"]
      : [
          "weapon",
          "chest",
          "legs",
          "helmet",
          "gloves",
          "boots",
          "ring",
          "necklace",
        ];
    const slot = slots[Math.floor(random() * slots.length)],
      weapons = Object.keys(WEAPONS) as Weapon[];
    const r = random(),
      rarity: Rarity =
        r < 0.7
          ? "Comum"
          : r < 0.91
            ? "Incomum"
            : r < 0.98
              ? "Raro"
              : r < 0.997
                ? "Épico"
                : "Lendário";
    items.push(
      makeEquipment(
        id(),
        grade,
        slot,
        slot === "weapon"
          ? weapons[Math.floor(random() * weapons.length)]
          : undefined,
        rarity,
      ),
    );
  }
  return items;
}
export function spoilLoot(
  id: () => string,
  random = Math.random,
  species = "physical-1",
): Item[] {
  const items: Item[] = [];
  for (const row of DROP_TABLES[species]?.spoil ?? [])
    if (random() < row.chance)
      items.push({
        id: id(),
        name: row.name,
        material: row.material,
        kind: "material",
        quantity: row.min + Math.floor(random() * (row.max - row.min + 1)),
      });
  return items;
}

export function professionName(c: Character) {
  const first = PROFESSIONS.find((p) => p.id === c.profession),
    branch = first?.branches.find((b) => b.id === c.specialization);
  if (c.level >= 300 && branch) return branch.third;
  if (c.level >= 150 && branch) return branch.name;
  return first?.name ?? (c.archetype === "mystic" ? "Mystic" : "Fighter");
}
