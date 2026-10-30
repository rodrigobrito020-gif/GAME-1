import type { Archetype, Grade, Profession, Race, Weapon, Hunt } from "./types";
export const APPROVAL =
  "TODO_APROVACAO: valores de demonstração, não balanceamento definitivo";
export const BALANCE = {
  approval: APPROVAL,
  tickMs: 100,
  moveSpeed: 160,
  attackCd: 900,
  respawnMs: 5000,
  skillDuration: 6000,
  inventoryLimit: 100,
  initialAdena: 1200,
  potionCost: 20,
  craftCost: 500,
  reforgeCost: 150,
  spoilChance: 0.85,
  normalEquipmentChance: 0.18,
  bossEquipmentChance: 0.75,
  hitFloor: 0.15,
  critMultiplier: 1.7,
  baseExp: 24,
  baseAdena: 18,
};
export const RACES: Record<
  Race,
  { name: string; archetypes: Archetype[]; color: string }
> = {
  human: {
    name: "Humano",
    archetypes: ["fighter", "mystic"],
    color: "#e6b88a",
  },
  elf: {
    name: "Elfo Branco",
    archetypes: ["fighter", "mystic"],
    color: "#c5e5bd",
  },
  darkelf: {
    name: "Elfo Negro",
    archetypes: ["fighter", "mystic"],
    color: "#a9a4d6",
  },
  orc: { name: "Orc", archetypes: ["fighter", "mystic"], color: "#83aa61" },
  dwarf: { name: "Anão", archetypes: ["fighter"], color: "#e4b17e" },
};
export const WEAPONS: Record<Weapon, string> = {
  swordShield: "Espada + Escudo",
  dual: "Dual Swords",
  polearm: "Lança",
  dagger: "Adaga",
  bow: "Arco",
  greatsword: "Espadão",
  fist: "Soqueira",
  hammer: "Martelo / Maça",
  staff: "Cajado",
  magicMace: "Maça Mágica",
};
export const GRADES: Record<Grade, number> = {
  NG: 1,
  D: 50,
  C: 100,
  B: 150,
  A: 200,
  S: 250,
};
export const RARITIES = [
  "Comum",
  "Incomum",
  "Raro",
  "Épico",
  "Lendário",
] as const;
// Pesos APROVADOS; os demais números deste arquivo são provisórios.
export const REFORGE_WEIGHTS = [14, 14, 13, 12, 11, 10, 10, 8, 6, 2] as const;
const make = (
  id: string,
  name: string,
  race: Race,
  archetype: Archetype,
  weapons: Weapon[],
  branches: [string, string, Weapon][],
): Profession => ({
  id,
  name,
  race,
  archetype,
  weapons,
  branches: branches.map(([n, t, w]) => ({
    id: n.toLowerCase().replaceAll(" ", "-"),
    name: n,
    third: t,
    weapon: w,
  })),
});
export const PROFESSIONS: Profession[] = [
  make(
    "warrior",
    "Human Warrior",
    "human",
    "fighter",
    ["dual", "polearm"],
    [
      ["Gladiator", "Duelist", "dual"],
      ["Warlord", "Dreadnought", "polearm"],
    ],
  ),
  make(
    "knight",
    "Human Knight",
    "human",
    "fighter",
    ["swordShield"],
    [
      ["Paladin", "Phoenix Knight", "swordShield"],
      ["Dark Avenger", "Hell Knight", "swordShield"],
    ],
  ),
  make(
    "rogue",
    "Rogue",
    "human",
    "fighter",
    ["dagger", "bow"],
    [
      ["Treasure Hunter", "Adventurer", "dagger"],
      ["Hawkeye", "Sagittarius", "bow"],
    ],
  ),
  make(
    "elvenKnight",
    "Elven Knight",
    "elf",
    "fighter",
    ["swordShield"],
    [
      ["Temple Knight", "Eva's Templar", "swordShield"],
      ["Swordsinger", "Sword Muse", "swordShield"],
    ],
  ),
  make(
    "elvenScout",
    "Elven Scout",
    "elf",
    "fighter",
    ["dagger", "bow"],
    [
      ["Plains Walker", "Wind Rider", "dagger"],
      ["Silver Ranger", "Moonlight Sentinel", "bow"],
    ],
  ),
  make(
    "palusKnight",
    "Palus Knight",
    "darkelf",
    "fighter",
    ["swordShield", "dual"],
    [
      ["Shillien Knight", "Shillien Templar", "swordShield"],
      ["Bladedancer", "Spectral Dancer", "dual"],
    ],
  ),
  make(
    "assassin",
    "Assassin",
    "darkelf",
    "fighter",
    ["dagger", "bow"],
    [
      ["Abyss Walker", "Ghost Hunter", "dagger"],
      ["Phantom Ranger", "Ghost Sentinel", "bow"],
    ],
  ),
  make(
    "raider",
    "Orc Raider",
    "orc",
    "fighter",
    ["greatsword"],
    [["Destroyer", "Titan", "greatsword"]],
  ),
  make(
    "monk",
    "Orc Monk",
    "orc",
    "fighter",
    ["fist"],
    [["Tyrant", "Grand Khavatari", "fist"]],
  ),
  make(
    "scavenger",
    "Scavenger",
    "dwarf",
    "fighter",
    ["hammer", "dagger"],
    [
      ["Bounty Hunter", "Fortune Seeker", "hammer"],
      ["Bounty Hunter", "Fortune Seeker", "dagger"],
    ],
  ),
  make(
    "artisan",
    "Artisan",
    "dwarf",
    "fighter",
    ["hammer", "polearm"],
    [
      ["Warsmith", "Maestro", "hammer"],
      ["Warsmith", "Maestro", "polearm"],
    ],
  ),
  make("humanWizard", "Human Wizard", "human", "mystic", ["staff"], []),
  make("cleric", "Cleric", "human", "mystic", ["magicMace"], []),
  make("elvenWizard", "Elven Wizard", "elf", "mystic", ["staff"], []),
  make("elvenOracle", "Elven Oracle", "elf", "mystic", ["magicMace"], []),
  make("darkWizard", "Dark Wizard", "darkelf", "mystic", ["staff"], []),
  make(
    "shillienOracle",
    "Shillien Oracle",
    "darkelf",
    "mystic",
    ["magicMace"],
    [],
  ),
  make(
    "shaman",
    "Orc Shaman",
    "orc",
    "mystic",
    ["magicMace"],
    [
      ["Overlord", "Dominator", "magicMace"],
      ["Warcryer", "Doomcryer", "magicMace"],
    ],
  ),
];
export const LEVEL_BANDS = Array.from({ length: 12 }, (_, i) => ({
  min: i * 25 + 1,
  max: (i + 1) * 25,
}));
export const SPECIES = LEVEL_BANDS.flatMap((b) =>
  ["physical", "magic"].map((type) => ({
    id: `${type}-${b.min}`,
    name: `Monstro ${type === "physical" ? "Físico" : "Mágico"} ${b.min}–${b.max}`,
    min: b.min,
    max: b.max,
    type,
    pending: true,
  })),
);
export const HUNTS: Hunt[] = LEVEL_BANDS.flatMap((b, i) =>
  (i < 6 ? ["physical", "magic"] : ["mixed"]).map((type) => ({
    id: `hunt-${b.min}-${type}`,
    name: `${b.min >= 251 ? "Primeval Isle · " : ""}Hunt ${b.min}–${b.max} · ${type === "mixed" ? "Mista" : type === "physical" ? "DPS físico" : "DPS mágico"} [PROVISÓRIA]`,
    ...b,
    type: type as Hunt["type"],
    accuracy: 12 + i * 13,
    species: (type === "mixed" ? ["physical", "magic"] : [type]).map(
      (t) => `${t}-${b.min}`,
    ),
    recommendedPower: 100 + i * 1000,
    pending: true,
  })),
);
export const SPAWNS = [
  { x: 380, y: 330 },
  { x: 1020, y: 300 },
  { x: 1210, y: 820 },
  { x: 650, y: 880 },
  { x: 250, y: 720 },
];
export const CITY = {
  id: "original",
  name: "Refúgio de Aden",
  width: 1600,
  height: 1152,
  spawn: { x: 790, y: 620 },
  npcs: [
    { id: "portal", name: "Guardião das Hunts", x: 1060, y: 580 },
    { id: "forge", name: "Forja Universal", x: 500, y: 420 },
    { id: "shop", name: "Mercador", x: 1080, y: 830 },
    { id: "class", name: "Mestre de Profissões", x: 520, y: 810 },
  ],
  blocks: [
    { x: 150, y: 140, w: 370, h: 190 },
    { x: 1000, y: 120, w: 370, h: 220 },
    { x: 170, y: 820, w: 220, h: 180 },
    { x: 1190, y: 760, w: 250, h: 240 },
  ],
};
export const BOSSES = [
  { level: 225, name: "Boss provisório 225" },
  { level: 250, name: "Boss provisório 250" },
  { level: 275, name: "Boss provisório 275" },
  { level: 300, name: "Sailren" },
];
export const PENDING_BOSS_NAMES = ["Pterosaur", "Tyrannosaurus"];
export const THIRD_PARTY_SKILLS_PENDING =
  "TODO_APROVACAO: kits 150+, talentos e híbridos não definidos. Demonstração conserva o kit anterior, com exceções aprovadas de summons e Festival.";

// TODO_APROVACAO: temporary automatic priority; four slots remain unchanged.
export const AUTO_SKILL_PRIORITY = [3, 2, 1, 0] as const;
