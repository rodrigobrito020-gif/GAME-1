export type Race = "human" | "elf" | "darkelf" | "orc" | "dwarf";
export type Archetype = "fighter" | "mystic";
export type Weapon =
  | "swordShield"
  | "dual"
  | "polearm"
  | "dagger"
  | "bow"
  | "greatsword"
  | "fist"
  | "hammer"
  | "staff"
  | "magicMace";
export type Grade = "NG" | "D" | "C" | "B" | "A" | "S";
export type Rarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário";
export type Slot =
  | "weapon"
  | "shield"
  | "chest"
  | "legs"
  | "helmet"
  | "gloves"
  | "boots"
  | "ring"
  | "necklace";
export type Effect =
  | "strike"
  | "aoe"
  | "guard"
  | "heal"
  | "leech"
  | "vampire"
  | "counter"
  | "evade"
  | "retreat"
  | "summon"
  | "spoil"
  | "sweep"
  | "restore"
  | "debuff"
  | "partyAttack"
  | "partyDefense"
  | "pending";
export interface Skill {
  id: string;
  name: string;
  effect: Effect;
  shape?: "circle" | "cone" | "line";
  mp: number;
  cd: number;
  power: number;
  hits?: number;
  dot?: boolean;
  slow?: boolean;
  aggro?: boolean;
  stun?: boolean;
  backstab?: boolean;
  reflect?: boolean;
  ally?: boolean;
  pending?: boolean;
  physicalOnly?: boolean;
  evadeAlso?: boolean;
  guardAlso?: boolean;
  haste?: boolean;
  regen?: boolean;
  areaOnly?: boolean;
  multiOnly?: boolean;
  center?: "caster" | "target";
}
export interface Profession {
  id: string;
  name: string;
  race: Race;
  archetype: Archetype;
  weapons: Weapon[];
  branches: { id: string; name: string; third: string; weapon: Weapon }[];
}
export interface Item {
  id: string;
  name: string;
  kind: "equipment" | "material" | "potion";
  quantity: number;
  grade?: Grade;
  rarity?: Rarity;
  slot?: Slot;
  weapon?: Weapon;
  bonus?: number;
  material?: string;
  potion?: "hp" | "mp";
}
export interface Character {
  id: string;
  name: string;
  race: Race;
  archetype: Archetype;
  level: number;
  xp: number;
  sp: number;
  adena: number;
  profession: string | null;
  specialization: string | null;
  inventory: Item[];
  equipment: Partial<Record<Slot, Item>>;
  hp: number;
  mp: number;
  autoSkills: boolean[];
  autoPotion: { hp: number; mp: number };
  createdAt: number;
}
export interface Stats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  mdef: number;
  accuracy: number;
  magicAccuracy: number;
  evasion: number;
  crit: number;
  power: number;
  range: number;
  magic: boolean;
}
export interface Buff {
  kind: string;
  until: number;
  value: number;
}
export interface Actor {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  kind: "player" | "monster" | "summon";
  targetId: string | null;
  lastAttack: number;
  facing: number;
  deadUntil?: number;
  race?: Race;
  archetype?: Archetype;
  weapon?: Weapon;
  armorColor?: string;
  species?: string;
  masterId?: string;
  boss?: boolean;
  shield?: boolean;
  protectedUntil?: number;
}
export interface Monster extends Actor {
  spawn: number;
  level: number;
  defense: number;
  mdef: number;
  attack: number;
  accuracy: number;
  exp: number;
  adena: number;
  physical: boolean;
  buffs: Buff[];
  spoilOwner?: string;
  spoilRolled?: boolean;
  rewarded?: boolean;
  nextAttack: number;
  dotAt?: number;
}
export interface Hunt {
  id: string;
  name: string;
  min: number;
  max: number;
  type: "physical" | "magic" | "mixed";
  accuracy: number;
  species: string[];
  recommendedPower: number;
  pending: true;
}
export interface Party {
  id: string;
  leaderId: string;
  members: string[];
  loot: "random" | "leader" | "designated";
  recipientId: string | null;
  assist: boolean;
}
export interface LogEntry {
  id: number;
  text: string;
  kind: "combat" | "drop" | "system" | "chat";
}
export interface Vfx {
  id: number;
  from: string;
  to: string;
  kind: string;
  amount?: number;
}
export interface CityLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  npcs: { id: string; name: string; x: number; y: number }[];
  blocks: { x: number; y: number; w: number; h: number }[];
  collision?: {
    tileSize: number;
    columns: number;
    rows: number;
    cells: number[];
  };
  atlas?: {
    mapUrl: string;
    tilesets: { id: string; url: string }[];
    packHash: string;
  };
}
export type CityInfo = Omit<CityLayout, "collision">;
export interface Snapshot {
  city: CityInfo;
  self: Character;
  stats: Stats;
  actor: Actor;
  actors: Actor[];
  skills: Skill[];
  cooldowns: number[];
  map: string;
  hunt: Hunt | null;
  party: Party | null;
  online: { id: string; name: string; level: number }[];
  invites: { partyId: string; leader: string }[];
  logs: LogEntry[];
  vfx: Vfx[];
  autoFarm: boolean;
  autoSkills: boolean[];
  metrics: { exp: number; loot: number; seconds: number };
  dev: boolean;
  serverTime: number;
}
export type Command = { type: string; [key: string]: unknown };
