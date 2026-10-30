import type { Character, Skill, Weapon } from "./types";
import { PROFESSIONS } from "./config";
export const KITS: Record<string, Skill[]> = {
  "warrior:dual": [
    {
      id: "warrior:dual:0",
      name: "Corte Duplo",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      hits: 2,
    },
    {
      id: "warrior:dual:1",
      name: "Lâminas Giratórias",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "warrior:dual:2",
      name: "Aparar Lâminas",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "warrior:dual:3",
      name: "Fôlego de Combate",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "warrior:polearm": [
    {
      id: "warrior:polearm:0",
      name: "Estocada em Linha",
      effect: "aoe",
      mp: 8,
      cd: 3500,
      power: 1.8,
      shape: "line",
    },
    {
      id: "warrior:polearm:1",
      name: "Varredura de Lança",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "cone",
    },
    {
      id: "warrior:polearm:2",
      name: "Impacto de Haste",
      effect: "aoe",
      mp: 12,
      cd: 13000,
      power: 1,
      shape: "circle",
      stun: true,
    },
    {
      id: "warrior:polearm:3",
      name: "Vampirismo de Batalha",
      effect: "vampire",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "knight:swordShield": [
    {
      id: "knight:swordShield:0",
      name: "Corte de Guarda",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      aggro: true,
    },
    {
      id: "knight:swordShield:1",
      name: "Impacto Circular",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      aggro: true,
    },
    {
      id: "knight:swordShield:2",
      name: "Muralha de Escudo",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "knight:swordShield:3",
      name: "Vontade de Ferro",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "rogue:dagger": [
    {
      id: "rogue:dagger:0",
      name: "Punhalada Precisa",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      backstab: true,
    },
    {
      id: "rogue:dagger:1",
      name: "Corte em Leque",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "rogue:dagger:2",
      name: "Passo Evasivo",
      effect: "evade",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "rogue:dagger:3",
      name: "Fôlego do Assassino",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "rogue:bow": [
    {
      id: "rogue:bow:0",
      name: "Tiro Concentrado",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "rogue:bow:1",
      name: "Disparo em Leque",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "rogue:bow:2",
      name: "Recuo Tático",
      effect: "retreat",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "rogue:bow:3",
      name: "Respiração do Caçador",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "elvenKnight:swordShield": [
    {
      id: "elvenKnight:swordShield:0",
      name: "Corte da Aurora",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      aggro: true,
    },
    {
      id: "elvenKnight:swordShield:1",
      name: "Varredura Élfica",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      aggro: true,
    },
    {
      id: "elvenKnight:swordShield:2",
      name: "Guarda de Eva",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "elvenKnight:swordShield:3",
      name: "Brisa Revigorante",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "elvenScout:dagger": [
    {
      id: "elvenScout:dagger:0",
      name: "Estocada Veloz",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      backstab: true,
    },
    {
      id: "elvenScout:dagger:1",
      name: "Cortes Relâmpago",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "elvenScout:dagger:2",
      name: "Passo Élfico",
      effect: "evade",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "elvenScout:dagger:3",
      name: "Fôlego da Floresta",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "elvenScout:bow": [
    {
      id: "elvenScout:bow:0",
      name: "Flecha da Brisa",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "elvenScout:bow:1",
      name: "Salva Élfica",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "elvenScout:bow:2",
      name: "Recuo Ágil",
      effect: "retreat",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "elvenScout:bow:3",
      name: "Respiração da Floresta",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "palusKnight:swordShield": [
    {
      id: "palusKnight:swordShield:0",
      name: "Golpe da Penumbra",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      aggro: true,
    },
    {
      id: "palusKnight:swordShield:1",
      name: "Espiral Sombria",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      aggro: true,
    },
    {
      id: "palusKnight:swordShield:2",
      name: "Escudo de Shilen",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
      reflect: true,
    },
    {
      id: "palusKnight:swordShield:3",
      name: "Drenagem Vital",
      effect: "leech",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "palusKnight:dual": [
    {
      id: "palusKnight:dual:0",
      name: "Corte Cruzado Sombrio",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      hits: 2,
    },
    {
      id: "palusKnight:dual:1",
      name: "Redemoinho de Lâminas",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "palusKnight:dual:2",
      name: "Guarda Cruel",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "palusKnight:dual:3",
      name: "Golpe Sanguíneo",
      effect: "leech",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "assassin:dagger": [
    {
      id: "assassin:dagger:0",
      name: "Punhalada Negra",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      backstab: true,
    },
    {
      id: "assassin:dagger:1",
      name: "Corte Sangrento",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      dot: true,
    },
    {
      id: "assassin:dagger:2",
      name: "Sombra Fugaz",
      effect: "evade",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "assassin:dagger:3",
      name: "Punção Vital",
      effect: "leech",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "assassin:bow": [
    {
      id: "assassin:bow:0",
      name: "Disparo Obscuro",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "assassin:bow:1",
      name: "Chuva de Espinhos",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      dot: true,
    },
    {
      id: "assassin:bow:2",
      name: "Camuflagem Sombria",
      effect: "evade",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "assassin:bow:3",
      name: "Flecha Sanguessuga",
      effect: "leech",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "raider:greatsword": [
    {
      id: "raider:greatsword:0",
      name: "Corte Devastador",
      effect: "aoe",
      mp: 8,
      cd: 3500,
      power: 1.8,
      shape: "cone",
    },
    {
      id: "raider:greatsword:1",
      name: "Terremoto Orc",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "raider:greatsword:2",
      name: "Rugido de Guerra",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
      aggro: true,
    },
    {
      id: "raider:greatsword:3",
      name: "Instinto de Sobrevivência",
      effect: "vampire",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "monk:fist": [
    {
      id: "monk:fist:0",
      name: "Punhos Relâmpago",
      effect: "aoe",
      mp: 8,
      cd: 3500,
      power: 1.8,
      shape: "cone",
      hits: 3,
    },
    {
      id: "monk:fist:1",
      name: "Ciclone de Punhos",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "monk:fist:2",
      name: "Contra-Ataque Orc",
      effect: "counter",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "monk:fist:3",
      name: "Ritmo de Combate",
      effect: "vampire",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "scavenger:hammer": [
    {
      id: "scavenger:hammer:0",
      name: "Martelada Precisa",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      stun: true,
    },
    {
      id: "scavenger:hammer:1",
      name: "Impacto de Mineração",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "scavenger:hammer:2",
      name: "Spoil",
      effect: "spoil",
      mp: 12,
      cd: 5000,
      power: 1,
    },
    {
      id: "scavenger:hammer:3",
      name: "Sweeper",
      effect: "sweep",
      mp: 18,
      cd: 3000,
      power: 1.3,
    },
  ],
  "scavenger:dagger": [
    {
      id: "scavenger:dagger:0",
      name: "Punhalada do Caçador",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "scavenger:dagger:1",
      name: "Cortes de Saque",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "scavenger:dagger:2",
      name: "Spoil",
      effect: "spoil",
      mp: 12,
      cd: 5000,
      power: 1,
    },
    {
      id: "scavenger:dagger:3",
      name: "Sweeper",
      effect: "sweep",
      mp: 18,
      cd: 3000,
      power: 1.3,
    },
  ],
  "artisan:hammer": [
    {
      id: "artisan:hammer:0",
      name: "Martelo de Combate",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "artisan:hammer:1",
      name: "Impacto de Engrenagem",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "artisan:hammer:2",
      name: "Blindagem de Combate",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "artisan:hammer:3",
      name: "Summon",
      effect: "summon",
      mp: 24,
      cd: 8000,
      power: 1.3,
    },
  ],
  "artisan:polearm": [
    {
      id: "artisan:polearm:0",
      name: "Estocada de Haste",
      effect: "aoe",
      mp: 8,
      cd: 3500,
      power: 1.8,
      shape: "line",
    },
    {
      id: "artisan:polearm:1",
      name: "Varredura Mecânica",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "artisan:polearm:2",
      name: "Formação Defensiva",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "artisan:polearm:3",
      name: "Summon",
      effect: "summon",
      mp: 24,
      cd: 8000,
      power: 1.3,
    },
  ],
  "humanWizard:staff": [
    {
      id: "humanWizard:staff:0",
      name: "Rajada Arcana",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "humanWizard:staff:1",
      name: "Explosão Elemental",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "humanWizard:staff:2",
      name: "Barreira Arcana",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "humanWizard:staff:3",
      name: "Restauração Mística",
      effect: "restore",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "cleric:magicMace": [
    {
      id: "cleric:magicMace:0",
      name: "Luz Sagrada",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "cleric:magicMace:1",
      name: "Onda Consagrada",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "cleric:magicMace:2",
      name: "Bênção Protetora",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
      ally: true,
    },
    {
      id: "cleric:magicMace:3",
      name: "Cura Restauradora",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
      ally: true,
    },
  ],
  "elvenWizard:staff": [
    {
      id: "elvenWizard:staff:0",
      name: "Lança de Gelo",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
      slow: true,
    },
    {
      id: "elvenWizard:staff:1",
      name: "Tempestade Glacial",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      slow: true,
    },
    {
      id: "elvenWizard:staff:2",
      name: "Barreira de Cristal",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "elvenWizard:staff:3",
      name: "Fonte de Eva",
      effect: "restore",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "elvenOracle:magicMace": [
    {
      id: "elvenOracle:magicMace:0",
      name: "Raio de Eva",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "elvenOracle:magicMace:1",
      name: "Onda de Luz",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
    },
    {
      id: "elvenOracle:magicMace:2",
      name: "Proteção Élfica",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
      ally: true,
    },
    {
      id: "elvenOracle:magicMace:3",
      name: "Bênção Restauradora",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
      ally: true,
    },
  ],
  "darkWizard:staff": [
    {
      id: "darkWizard:staff:0",
      name: "Lança das Sombras",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "darkWizard:staff:1",
      name: "Nuvem Venenosa",
      effect: "aoe",
      mp: 16,
      cd: 6500,
      power: 1.3,
      shape: "circle",
      dot: true,
    },
    {
      id: "darkWizard:staff:2",
      name: "Véu Obscuro",
      effect: "guard",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "darkWizard:staff:3",
      name: "Toque Vampírico",
      effect: "leech",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
  "shillienOracle:magicMace": [
    {
      id: "shillienOracle:magicMace:0",
      name: "Raio Sombrio",
      effect: "strike",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "shillienOracle:magicMace:1",
      name: "Névoa Debilitante",
      effect: "debuff",
      mp: 16,
      cd: 6500,
      power: 1.3,
    },
    {
      id: "shillienOracle:magicMace:2",
      name: "Bênção Vampírica",
      effect: "vampire",
      mp: 12,
      cd: 13000,
      power: 1,
      ally: true,
    },
    {
      id: "shillienOracle:magicMace:3",
      name: "Cura de Shilen",
      effect: "heal",
      mp: 18,
      cd: 14000,
      power: 1.3,
      ally: true,
    },
  ],
  "shaman:magicMace": [
    {
      id: "shaman:magicMace:0",
      name: "Dreno Espiritual",
      effect: "leech",
      mp: 8,
      cd: 3500,
      power: 1.8,
    },
    {
      id: "shaman:magicMace:1",
      name: "Maldição de Pa'agrio",
      effect: "debuff",
      mp: 16,
      cd: 6500,
      power: 1.3,
    },
    {
      id: "shaman:magicMace:2",
      name: "Cântico de Batalha",
      effect: "partyAttack",
      mp: 12,
      cd: 13000,
      power: 1,
    },
    {
      id: "shaman:magicMace:3",
      name: "Cântico de Proteção",
      effect: "partyDefense",
      mp: 18,
      cd: 14000,
      power: 1.3,
    },
  ],
};

for (const [key, kit] of Object.entries(KITS)) {
  const melee =
    !key.endsWith(":bow") &&
    !key.endsWith(":staff") &&
    !key.endsWith(":magicMace");
  for (const skill of kit)
    if (melee && skill.shape === "circle") skill.center = "caster";
}
KITS["rogue:dagger"][1].shape = "cone";
// Approved behaviors; magnitudes/durations remain provisional in BALANCE.
KITS["warrior:dual"][2].physicalOnly = true;
KITS["palusKnight:dual"][2].reflect = true;
KITS["elvenKnight:swordShield"][2].evadeAlso = true;
KITS["elvenKnight:swordShield"][3].regen = true;
KITS["elvenScout:dagger"][2].haste = true;
KITS["assassin:dagger"][2].haste = true;
KITS["assassin:bow"][2].guardAlso = true;
KITS["shillienOracle:magicMace"][2].physicalOnly = true;
KITS["warrior:polearm"][3].areaOnly = true;
KITS["raider:greatsword"][3].multiOnly = true;
KITS["monk:fist"][3].multiOnly = true;
const initial: Skill[] = [
  {
    id: "initial:0",
    name: "Ataque Reforçado",
    effect: "strike",
    mp: 8,
    cd: 3500,
    power: 1.8,
  },
  {
    id: "initial:1",
    name: "Ataque em Área",
    effect: "aoe",
    shape: "circle",
    mp: 15,
    cd: 6500,
    power: 1.3,
  },
  {
    id: "initial:2",
    name: "Proteção",
    effect: "guard",
    mp: 12,
    cd: 13000,
    power: 1,
  },
  {
    id: "initial:3",
    name: "Recuperação",
    effect: "heal",
    mp: 18,
    cd: 14000,
    power: 1,
  },
];
export function weaponOf(c: Character): Weapon {
  return (
    c.equipment.weapon?.weapon ??
    (c.archetype === "mystic"
      ? "staff"
      : c.race === "dwarf"
        ? "hammer"
        : "swordShield")
  );
}
export function skillsFor(c: Character): Skill[] {
  if (c.level < 50 || !c.profession) {
    if (c.race === "dwarf")
      return [
        initial[0],
        {
          id: "dwarf:summon",
          name: "Summon",
          effect: "summon",
          mp: 24,
          cd: 8000,
          power: 1,
        },
        {
          id: "dwarf:spoil",
          name: "Spoil",
          effect: "spoil",
          mp: 10,
          cd: 5000,
          power: 1,
        },
        {
          id: "dwarf:sweep",
          name: "Sweeper",
          effect: "sweep",
          mp: 6,
          cd: 3000,
          power: 1,
        },
      ];
    return initial;
  }
  if (
    c.level >= 150 &&
    ["overlord", "warcryer"].includes(c.specialization ?? "")
  ) {
    const drain = KITS["shaman:magicMace"][0];
    return [
      drain,
      ...[1, 2, 3].map((n) => ({
        id: `pending:${c.specialization}:${n}`,
        name: `${c.specialization === "overlord" ? "Debuff em área" : "Pacote de buffs"} ${n} · aguarda aprovação`,
        effect: "pending" as const,
        mp: 0,
        cd: 0,
        power: 0,
        pending: true,
      })),
    ];
  }
  const profession = PROFESSIONS.find((p) => p.id === c.profession);
  const weapon = weaponOf(c);
  const base =
    KITS[
      `${c.profession}:${profession?.weapons.includes(weapon) ? weapon : profession?.weapons[0]}`
    ] ?? initial;
  return base.map((s) => {
    if (
      c.level >= 150 &&
      c.specialization === "bounty-hunter" &&
      s.effect === "spoil"
    )
      return { ...s, name: "Spoil Festival", shape: "circle" };
    if (
      c.level >= 150 &&
      c.specialization === "bounty-hunter" &&
      s.effect === "sweep"
    )
      return { ...s, name: "Sweeper Festival", shape: "circle" };
    return { ...s, pending: c.level >= 150 };
  });
}
export function summonLimit(c: Character) {
  if (c.race !== "dwarf") return 0;
  if (c.level < 50 || !c.profession) return 1;
  if (c.profession !== "artisan") return 0;
  return c.level >= 150 && c.specialization === "warsmith" ? 3 : 2;
}
export function spoilLimit(c: Character) {
  if (c.race !== "dwarf") return 0;
  if (c.level < 50 || !c.profession) return 1;
  return c.profession === "scavenger"
    ? c.level >= 150 && c.specialization === "bounty-hunter"
      ? Infinity
      : 2
    : 0;
}
