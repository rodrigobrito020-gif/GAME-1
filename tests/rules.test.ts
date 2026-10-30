import { describe, it, expect } from "vitest";
import {
  BALANCE,
  HUNTS,
  SPECIES,
  LEVEL_BANDS,
  KITS,
  PROFESSIONS,
  GRADES,
  REFORGE_WEIGHTS,
  RARITIES,
  newCharacter,
  skillsFor,
  summonLimit,
  spoilLimit,
  canEnter,
  canEquip,
  makeEquipment,
  partyExp,
  dropChance,
  lootRecipient,
  normalLoot,
  spoilLoot,
  reforgeRoll,
  xpRequired,
} from "@idle/shared";
import { GameEngine } from "../apps/server/src/engine";
import type { Character, Party } from "@idle/shared";
function character(id = "a", profession?: string, level = 1): Character {
  const c = newCharacter(id, `Hero ${id}`, "human", "fighter");
  c.level = level;
  if (profession) {
    const p = PROFESSIONS.find((p) => p.id === profession)!;
    c.profession = p.id;
    c.race = p.race;
    c.archetype = p.archetype;
    c.equipment.weapon = makeEquipment(
      `${id}-weapon`,
      "NG",
      "weapon",
      p.weapons[0],
    );
  }
  return c;
}
function engineWith(count = 1, profession?: string, level = 1) {
  const e = new GameEngine(true, () => 0.01);
  for (let i = 0; i < count; i++)
    e.connect(character(String(i), profession, level));
  return e;
}
function party(e: GameEngine, count: number) {
  e.command("0", { type: "party.create" });
  for (let i = 1; i < count; i++) {
    e.command("0", { type: "party.invite", id: String(i) });
    e.command(String(i), {
      type: "party.accept",
      id: e.players.get("0")!.partyId,
    });
  }
}
describe("dados aprovados", () => {
  it("25 kits possuem exatamente os quatro nomes e slots aprovados", () => {
    expect(Object.keys(KITS)).toHaveLength(25);
    for (const kit of Object.values(KITS)) expect(kit).toHaveLength(4);
    expect(KITS["warrior:polearm"].map((s) => s.name)).toEqual([
      "Estocada em Linha",
      "Varredura de Lança",
      "Impacto de Haste",
      "Vampirismo de Batalha",
    ]);
    expect(KITS["artisan:hammer"][3].name).toBe("Summon");
    expect(KITS["scavenger:dagger"].slice(2).map((s) => s.name)).toEqual([
      "Spoil",
      "Sweeper",
    ]);
  });
  it("12 faixas, 18 hunts, 24 espécies, duas espécies em todas as mistas", () => {
    expect(LEVEL_BANDS).toHaveLength(12);
    expect(HUNTS).toHaveLength(18);
    expect(SPECIES).toHaveLength(24);
    expect(LEVEL_BANDS.at(-1)).toEqual({ min: 276, max: 300 });
    for (const h of HUNTS) expect(h.species).toHaveLength(h.min > 150 ? 2 : 1);
  });
  it("grades têm os níveis aprovados e S é o máximo", () => {
    expect(GRADES).toEqual({ NG: 1, D: 50, C: 100, B: 150, A: 200, S: 250 });
    expect(RARITIES).toHaveLength(5);
  });
  it("anão inicial tem reforçado, summon, spoil e sweeper; todos ativos com custos e recargas", () => {
    const c = character();
    c.race = "dwarf";
    expect(skillsFor(c).map((s) => s.name)).toEqual([
      "Ataque Reforçado",
      "Summon",
      "Spoil",
      "Sweeper",
    ]);
    for (const s of skillsFor(c)) {
      expect(s.mp).toBeGreaterThan(0);
      expect(s.cd).toBeGreaterThan(0);
    }
  });
  it("profissões e armas trocam kits sem admitir famílias incompatíveis", () => {
    const c = character("a", "warrior", 50);
    expect(canEquip(c, makeEquipment("bow", "D", "weapon", "bow"))).toMatch(
      /incompatível/,
    );
    c.equipment.weapon = makeEquipment("dual", "D", "weapon", "dual");
    expect(skillsFor(c)[0].name).toBe("Corte Duplo");
    c.equipment.weapon = makeEquipment("pole", "D", "weapon", "polearm");
    expect(skillsFor(c)[0].shape).toBe("line");
    expect(canEquip(c, makeEquipment("s", "S", "weapon", "polearm"))).toMatch(
      /250/,
    );
  });
  it("nível 150 respeita especialização da arma e não introduz talentos antes dela", () => {
    const c = character("a", "warrior", 150);
    c.specialization = "gladiator";
    expect(
      canEquip(c, makeEquipment("pole", "NG", "weapon", "polearm")),
    ).toMatch(/incompatível/);
    expect(skillsFor(c)).toHaveLength(4);
    expect(skillsFor(c).every((s) => s.pending)).toBe(true);
  });
  it("limites e perdas de summon/spoil por profissão, incluindo Festival", () => {
    const c = character();
    c.race = "dwarf";
    expect(summonLimit(c)).toBe(1);
    expect(spoilLimit(c)).toBe(1);
    c.level = 50;
    c.profession = "scavenger";
    expect(summonLimit(c)).toBe(0);
    expect(spoilLimit(c)).toBe(2);
    c.profession = "artisan";
    expect(summonLimit(c)).toBe(2);
    expect(spoilLimit(c)).toBe(0);
    c.level = 150;
    c.specialization = "warsmith";
    expect(summonLimit(c)).toBe(3);
    c.profession = "scavenger";
    c.specialization = "bounty-hunter";
    expect(
      skillsFor(c)
        .slice(2)
        .map((s) => s.name),
    ).toEqual(["Spoil Festival", "Sweeper Festival"]);
  });
});
describe("regras de combate, acesso, loot e persistência de estado", () => {
  it("hunt exige nível E precisão; poder recomendado não bloqueia", () => {
    const c = character();
    expect(canEnter(c, HUNTS[2])).toMatch(/nível/);
    expect(canEnter(c, { ...HUNTS[0], accuracy: 999 })).toMatch(/Precisão/);
    expect(canEnter(c, { ...HUNTS[0], recommendedPower: 1e12 })).toBeNull();
  });
  it("bônus só para cinco, EXP dividida por personagens e chance relativa, nunca Boss", () => {
    expect(partyExp(100, 5)).toBe(24);
    expect(partyExp(100, 4)).toBe(25);
    expect(dropChance(0.01, 5)).toBeCloseTo(0.011);
    expect(dropChance(0.01, 4)).toBe(0.01);
    expect(dropChance(0.01, 5, true)).toBe(0.01);
  });
  it("três distribuições de loot, uma rolagem, tabelas de Bone independentes", () => {
    const p: Party = {
      id: "p",
      leaderId: "a",
      members: ["a", "b"],
      loot: "leader",
      recipientId: null,
      assist: false,
    };
    expect(lootRecipient(p, p.members)).toBe("a");
    p.loot = "designated";
    p.recipientId = "b";
    expect(lootRecipient(p, p.members)).toBe("b");
    p.loot = "random";
    expect(lootRecipient(p, p.members, () => 0.99)).toBe("b");
    const normal = normalLoot(
        1,
        1,
        false,
        () => "item",
        () => 0.01,
      ).find((i) => i.material === "bone")!,
      spoil = spoilLoot(
        () => "spoil",
        () => 0.01,
      )[0];
    expect(normal.quantity).toBe(1);
    expect(spoil.quantity).toBe(5);
    expect(normal.quantity + spoil.quantity).toBe(6);
  });
  it("materiais B/A/S substituem equipamentos prontos em hunts comuns avançadas", () => {
    for (const [min, grade] of [
      [151, "B"],
      [201, "A"],
      [251, "S"],
    ] as const) {
      const items = normalLoot(
        min,
        5,
        false,
        () => "i",
        () => 0.01,
      );
      expect(items.some((i) => i.material === `ore-${grade}`)).toBe(true);
      expect(items.some((i) => i.kind === "equipment")).toBe(false);
      expect(
        normalLoot(
          min,
          5,
          true,
          () => "i",
          () => 0.01,
        ).some((i) => i.grade === grade && i.kind === "equipment"),
      ).toBe(true);
    }
  });
  it("reforja utiliza exatamente os pesos aprovados de +1 a +10", () => {
    expect(REFORGE_WEIGHTS.reduce((a, b) => a + b, 0)).toBe(100);
    const counts = Array(10).fill(0);
    for (let i = 0; i < 100; i++)
      counts[reforgeRoll(() => (i + 0.5) / 100) - 1]++;
    expect(counts).toEqual([...REFORGE_WEIGHTS]);
  });
  it("solo e parties diferentes têm instâncias isoladas, múltiplos respawns", () => {
    const e = engineWith(3);
    e.enterHunt(e.players.get("0")!, HUNTS[0].id);
    e.enterHunt(e.players.get("1")!, HUNTS[0].id);
    expect(e.players.get("0")!.map).not.toBe(e.players.get("1")!.map);
    expect(e.instances.size).toBe(2);
    expect(e.instances.get(e.players.get("0")!.map)!.monsters).toHaveLength(5);
  });
  it("permite cinco Warsmiths, cinco monstros por ponto e quinze summons sem vagas extras", () => {
    const e = engineWith(5, "artisan", 151);
    for (const p of e.players.values()) p.c.specialization = "warsmith";
    party(e, 5);
    e.enterHunt(e.players.get("0")!, HUNTS[12].id);
    expect(e.instances.size).toBe(1);
    const instance = [...e.instances.values()][0];
    expect(instance.players.size).toBe(5);
    expect(instance.monsters).toHaveLength(25);
    for (let n = 0; n < 3; n++) {
      for (const p of e.players.values()) {
        p.auto = false;
        p.cooldowns[3] = 0;
        e.command(p.c.id, { type: "skill", slot: 3 });
      }
      e.now += 9000;
    }
    expect(instance.summons).toHaveLength(15);
    expect(e.parties.values().next().value?.members).toHaveLength(5);
    for (let i = 0; i < 100; i++) e.tick();
    expect(instance.players.size).toBe(5);
  });
  it("summons copiam sempre o alvo do mestre e respeitam cooldown/MP/limite", () => {
    const e = engineWith(1, "artisan", 150),
      p = e.players.get("0")!;
    p.c.specialization = "warsmith";
    e.enterHunt(p, HUNTS[0].id);
    p.auto = false;
    e.command("0", { type: "skill", slot: 3 });
    expect(() => e.command("0", { type: "skill", slot: 3 })).toThrow(/recarga/);
    const inst = [...e.instances.values()][0];
    p.actor.targetId = inst.monsters[1].id;
    e.tick();
    expect(inst.summons[0].targetId).toBe(p.actor.targetId);
    p.actor.targetId = inst.monsters[2].id;
    e.tick();
    expect(inst.summons[0].targetId).toBe(p.actor.targetId);
  });
  it("produção não permite comandos DEV nem aceita mutação de moeda enviada pelo cliente", () => {
    const e = new GameEngine(false);
    e.connect(character("0"));
    expect(() => e.command("0", { type: "dev", level: 300 })).toThrow(
      /desativadas/,
    );
    expect(() => e.command("0", { type: "adena", value: 99999 })).toThrow(
      /desconhecido/,
    );
    expect(e.players.get("0")!.c.adena).toBe(BALANCE.initialAdena);
  });
  it("cidade tem colisão, destino validado e cliente não controla velocidade", () => {
    const e = engineWith(),
      p = e.players.get("0")!;
    expect(() => e.command("0", { type: "move", x: 200, y: 200 })).toThrow(
      /livre/,
    );
    const x = p.actor.x;
    e.command("0", { type: "move", dx: 10000, dy: 0 });
    e.tick(100);
    expect(p.actor.x - x).toBeCloseTo(16);
    expect(() => e.command("0", { type: "move", x: NaN, y: 50 })).toThrow(
      /inválido/,
    );
  });
  it("Auto Farm caminha e combate gera EXP real e loot, sem travar em um ponto", () => {
    const e = engineWith(),
      p = e.players.get("0")!;
    e.enterHunt(p, HUNTS[0].id);
    const seen = new Set<number>();
    for (let i = 0; i < 2200; i++) {
      e.tick();
      seen.add(p.spawnCursor);
      if (p.map === "city") e.enterHunt(p, HUNTS[0].id);
    }
    expect(p.metrics.exp).toBeGreaterThan(0);
    expect(p.c.adena).toBeGreaterThan(1200);
    expect(seen.size).toBeGreaterThan(1);
  });
  it("craft universal consome materiais e moeda uma vez, reforja aplica valor inteiro", () => {
    const e = engineWith(),
      p = e.players.get("0")!;
    p.actor.x = 500;
    p.actor.y = 450;
    p.c.inventory.push({
      id: "bone",
      name: "Animal Bone",
      material: "bone",
      kind: "material",
      quantity: 5,
    });
    e.command("0", { type: "craft", grade: "NG", weapon: "bow" });
    expect(p.c.adena).toBe(700);
    expect(p.c.inventory.find((i) => i.id === "bone")).toBeUndefined();
    expect(() =>
      e.command("0", { type: "craft", grade: "NG", weapon: "bow" }),
    ).toThrow(/Faltam/);
    const weapon = p.c.inventory.find((i) => i.weapon === "bow")!;
    e.command("0", { type: "reforge", id: weapon.id });
    expect(weapon.bonus).toBe(1);
    expect(p.c.adena).toBe(550);
  });
  it("recompensa de nível 300 usa 0,5x e níveis continuam além de 300", () => {
    const e = engineWith(1, "warrior", 300),
      p = e.players.get("0")!;
    e.enterHunt(p, HUNTS[0].id);
    p.c.xp = xpRequired(300) - 1;
    const inst = [...e.instances.values()][0];
    p.actor.x = inst.monsters[0].x;
    p.actor.y = inst.monsters[0].y;
    inst.monsters[0].hp = 1;
    for (let i = 0; i < 20; i++) e.tick();
    expect(p.c.level).toBeGreaterThanOrEqual(301);
  });
});

describe("conservação de itens, efeitos e casos de morte", () => {
  it("equipar move da mochila ao slot sem duplicar e retirar devolve o mesmo item", () => {
    const e = engineWith(),
      p = e.players.get("0")!,
      bow = makeEquipment("owned-bow", "NG", "weapon", "bow");
    p.c.inventory.push(bow);
    const initial = p.c.inventory.length + Object.keys(p.c.equipment).length;
    e.command("0", { type: "equip", id: bow.id });
    expect(p.c.equipment.weapon?.id).toBe(bow.id);
    expect(p.c.inventory.some((i) => i.id === bow.id)).toBe(false);
    expect(p.c.equipment.shield).toBeUndefined();
    expect(p.c.inventory.length + Object.keys(p.c.equipment).length).toBe(
      initial,
    );
    e.command("0", { type: "unequip", slot: "weapon" });
    expect(p.c.inventory.filter((i) => i.id === bow.id)).toHaveLength(1);
  });
  it("slots de protótipo e ações inválidas não corrompem o inventário", () => {
    const e = engineWith(),
      p = e.players.get("0")!,
      before = structuredClone(p.c);
    for (const slot of ["__proto__", "constructor", "not-a-slot"])
      expect(() => e.command("0", { type: "unequip", slot })).toThrow(/vazio/);
    expect(p.c).toEqual(before);
  });
  it("Spoil e Sweeper executam coleta adicional de Bone uma vez, com MP e recarga reais", () => {
    const e = engineWith(2, "scavenger", 50);
    party(e, 2);
    const p = e.players.get("0")!;
    e.enterHunt(p, HUNTS[0].id);
    for (const player of e.players.values()) player.auto = false;
    const inst = [...e.instances.values()][0],
      m = inst.monsters[0];
    p.actor.x = m.x;
    p.actor.y = m.y;
    p.actor.targetId = m.id;
    const mp = p.c.mp;
    e.command("0", { type: "skill", slot: 2 });
    expect(inst.monsters.filter((m) => m.spoilOwner === p.c.id)).toHaveLength(
      2,
    );
    expect(p.c.mp).toBeLessThan(mp);
    m.hp = 1;
    e.command("0", { type: "skill", slot: 0 });
    expect(m.rewarded).toBe(true);
    e.command("0", { type: "skill", slot: 3 });
    expect(p.c.inventory.find((i) => i.material === "bone")?.quantity).toBe(6);
    const before = structuredClone(p.c.inventory);
    expect(() => e.command("0", { type: "skill", slot: 3 })).toThrow(/recarga/);
    e.now += 3100;
    expect(() => e.command("0", { type: "skill", slot: 3 })).toThrow(/cadáver/);
    expect(p.c.inventory).toEqual(before);
  });
  it("tabela de Spoil de outra espécie não herda o exemplo global de 5–10 Bone", () => {
    expect(
      spoilLoot(
        () => "i",
        () => 0.01,
        "magic-1",
      )[0].material,
    ).toBe("arcane-fragment");
  });
  it("duas Parties diferentes continuam isoladas mesmo na mesma hunt", () => {
    const e = engineWith(4);
    party(e, 2);
    e.command("2", { type: "party.create" });
    e.command("2", { type: "party.invite", id: "3" });
    e.command("3", { type: "party.accept", id: e.players.get("2")!.partyId });
    e.enterHunt(e.players.get("0")!, HUNTS[0].id);
    e.enterHunt(e.players.get("2")!, HUNTS[0].id);
    expect(e.instances.size).toBe(2);
    expect(e.players.get("0")!.map).not.toBe(e.players.get("2")!.map);
    for (const inst of e.instances.values())
      expect(inst.monsters).toHaveLength(10);
  });
  it("morte permanece visível antes de voltar à cidade e poção não ressuscita", () => {
    const e = engineWith(),
      p = e.players.get("0")!;
    e.enterHunt(p, HUNTS[0].id);
    p.actor.hp = 0;
    e.tick();
    expect(p.map).not.toBe("city");
    expect(p.actor.deadUntil).toBeGreaterThan(e.now);
    expect(() => e.command("0", { type: "potion", kind: "hp" })).toThrow(
      /Aguarde/,
    );
    expect(() => e.command("0", { type: "skill", slot: 3 })).toThrow(/Aguarde/);
    for (let i = 0; i < 20; i++) e.tick();
    expect(p.map).toBe("city");
    expect(p.actor.hp).toBe(p.actor.maxHp);
  });
  it("Overlord e Warcryer reservam três slots pendentes sem inventar nomes/efeitos definitivos", () => {
    const c = character("a", "shaman", 150);
    for (const branch of ["overlord", "warcryer"]) {
      c.specialization = branch;
      expect(skillsFor(c)).toHaveLength(4);
      expect(
        skillsFor(c)
          .slice(1)
          .every((s) => s.effect === "pending"),
      ).toBe(true);
    }
  });
});
