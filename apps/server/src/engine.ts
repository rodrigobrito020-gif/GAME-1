import { randomUUID } from "node:crypto";
import {
  BALANCE,
  AUTO_SKILL_PRIORITY,
  BOSSES,
  CITY,
  HUNTS,
  PROFESSIONS,
  SPAWNS,
  WEAPONS,
  GRADES,
  skillsFor,
  summonLimit,
  spoilLimit,
  statsFor,
  canEnter,
  canEquip,
  partyExp,
  expFactor,
  xpRequired,
  normalLoot,
  spoilLoot,
  lootRecipient,
  damage,
  hitChance,
  addItem,
  newCharacter,
  makeEquipment,
  countMaterial,
  takeMaterial,
  reforgeRoll,
} from "@idle/shared";
import type {
  Actor,
  Buff,
  Character,
  Command,
  Grade,
  Hunt,
  Item,
  LogEntry,
  Monster,
  Party,
  Skill,
  Snapshot,
  Vfx,
  Weapon,
} from "@idle/shared";
export interface Player {
  c: Character;
  actor: Actor;
  map: string;
  auto: boolean;
  cooldowns: number[];
  attackAt: number;
  buffs: Buff[];
  logs: LogEntry[];
  autoSkills: boolean[];
  route: { x: number; y: number }[];
  direction: { x: number; y: number; until: number } | null;
  spawnCursor: number;
  partyId?: string;
  online: boolean;
  metrics: { exp: number; loot: number; since: number };
  potionAt: number;
  regen: number;
}
interface Instance {
  id: string;
  hunt: Hunt;
  players: Set<string>;
  monsters: Monster[];
  summons: Actor[];
  respawns: number[];
  bossSpawned: boolean;
}
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export class GameEngine {
  players = new Map<string, Player>();
  instances = new Map<string, Instance>();
  parties = new Map<string, Party>();
  invites = new Map<string, { partyId: string; expires: number }[]>();
  vfx: Vfx[] = [];
  now = Date.now();
  private sequence = 0;
  constructor(
    public dev = false,
    private rng = Math.random,
  ) {}
  log(p: Player, text: string, kind: LogEntry["kind"] = "system") {
    p.logs.push({ id: ++this.sequence, text, kind });
    if (p.logs.length > 65) p.logs.shift();
  }
  effect(from: string, to: string, kind: string, amount?: number) {
    this.vfx.push({ id: ++this.sequence, from, to, kind, amount });
    if (this.vfx.length > 100) this.vfx.shift();
  }
  connect(c: Character) {
    const existing = this.players.get(c.id);
    if (existing?.online) throw Error("Personagem já conectado.");
    const stats = statsFor(c);
    c.hp = Math.max(1, Math.min(stats.maxHp, c.hp));
    c.mp = Math.min(stats.maxMp, c.mp);
    const p: Player = {
      c,
      actor: {
        id: c.id,
        name: c.name,
        kind: "player",
        x: CITY.spawn.x,
        y: CITY.spawn.y,
        hp: c.hp,
        maxHp: stats.maxHp,
        targetId: null,
        lastAttack: 0,
        facing: 0,
        race: c.race,
        archetype: c.archetype,
      },
      map: "city",
      auto: false,
      cooldowns: [0, 0, 0, 0],
      attackAt: 0,
      buffs: [],
      logs: [],
      autoSkills: c.autoSkills ?? [true, true, true, true],
      route: [],
      direction: null,
      spawnCursor: 0,
      online: true,
      metrics: { exp: 0, loot: 0, since: this.now },
      potionAt: 0,
      regen: 0,
    };
    this.players.set(c.id, p);
    this.log(
      p,
      "Bem-vindo ao Refúgio de Aden. WASD/clique para andar; E conversa com o NPC próximo.",
    );
    return p;
  }
  capture(p: Player) {
    p.c.hp = p.actor.hp;
    return structuredClone(p.c);
  }
  disconnect(id: string) {
    const p = this.players.get(id);
    if (!p) return;
    p.online = false;
    this.leaveHunt(p);
    this.leaveParty(p);
  }
  private city(p: Player, npc?: string) {
    if (p.map !== "city") throw Error("Disponível somente na cidade.");
    if (npc) {
      const target = CITY.npcs.find((n) => n.id === npc)!;
      if (distance(p.actor, target) > 105)
        throw Error(`Aproxime-se de ${target.name}.`);
    }
  }
  private partyFor(p: Player) {
    return p.partyId ? this.parties.get(p.partyId) : undefined;
  }
  private members(p: Player) {
    const party = this.partyFor(p);
    return party
      ? party.members
          .map((id) => this.players.get(id)!)
          .filter((m) => m?.online)
      : [p];
  }
  command(id: string, cmd: Command) {
    const p = this.players.get(id);
    if (!p?.online) throw Error("Personagem desconectado.");
    const c = p.c;
    switch (cmd.type) {
      case "move": {
        if (p.map !== "city")
          throw Error("Movimento manual é da cidade; nas hunts use Auto Farm.");
        p.auto = false;
        if (finite(cmd.dx) && finite(cmd.dy)) {
          const len = Math.hypot(cmd.dx, cmd.dy) || 1;
          p.direction = {
            x: cmd.dx / Math.max(1, len),
            y: cmd.dy / Math.max(1, len),
            until: this.now + 350,
          };
          p.route = [];
        } else if (finite(cmd.x) && finite(cmd.y)) {
          p.direction = null;
          p.route = this.path(p.actor, { x: cmd.x, y: cmd.y });
        } else throw Error("Movimento inválido.");
        break;
      }
      case "farm":
        if (p.map === "city") throw Error("Entre em uma hunt primeiro.");
        p.auto = cmd.enabled === true;
        break;
      case "target": {
        const m = this.instances
          .get(p.map)
          ?.monsters.find((m) => m.id === cmd.id && !m.rewarded);
        if (!m) throw Error("Alvo inválido.");
        p.actor.targetId = m.id;
        break;
      }
      case "skill":
        if (
          !Number.isInteger(cmd.slot) ||
          Number(cmd.slot) < 0 ||
          Number(cmd.slot) > 3
        )
          throw Error("Slot inválido.");
        this.cast(p, Number(cmd.slot), false);
        break;
      case "autoSkill": {
        const i = Number(cmd.slot);
        if (
          !Number.isInteger(i) ||
          i < 0 ||
          i > 3 ||
          typeof cmd.enabled !== "boolean"
        )
          throw Error("Slot inválido.");
        p.autoSkills[i] = cmd.enabled;
        c.autoSkills = [...p.autoSkills];
        break;
      }
      case "potions": {
        const hp = Number(cmd.hp),
          mp = Number(cmd.mp);
        if (
          !finite(hp) ||
          !finite(mp) ||
          hp < 0 ||
          hp > 90 ||
          mp < 0 ||
          mp > 90
        )
          throw Error("Limite de poção: 0–90%.");
        c.autoPotion = { hp, mp };
        break;
      }
      case "potion":
        this.potion(p, cmd.kind === "mp" ? "mp" : "hp", true);
        break;
      case "enter":
        this.city(p, "portal");
        this.enterHunt(p, String(cmd.hunt));
        break;
      case "return":
        this.leaveHunt(p);
        break;
      case "equip": {
        this.city(p);
        const i = c.inventory.findIndex((i) => i.id === cmd.id),
          item = c.inventory[i];
        if (!item) throw Error("Item inexistente.");
        const error = canEquip(c, item);
        if (error) throw Error(error);
        const slot = item.slot!;
        if (
          c.inventory.length -
            1 +
            (c.equipment[slot] ? 1 : 0) +
            (slot === "weapon" &&
            item.weapon !== "swordShield" &&
            c.equipment.shield
              ? 1
              : 0) >
          BALANCE.inventoryLimit
        )
          throw Error("Libere espaço para o equipamento substituído.");
        if (
          slot === "weapon" &&
          item.weapon !== "swordShield" &&
          c.equipment.shield
        ) {
          addItem(c, c.equipment.shield);
          delete c.equipment.shield;
        }
        c.inventory.splice(i, 1);
        const old = c.equipment[slot];
        if (old) c.inventory.push(old);
        c.equipment[slot] = item;
        this.syncAppearance(p);
        this.log(p, `Equipado: ${item.name}.`);
        break;
      }
      case "unequip": {
        this.city(p);
        const slot = String(cmd.slot) as keyof Character["equipment"],
          item = c.equipment[slot];
        if (!Object.hasOwn(c.equipment, slot) || !item)
          throw Error("Slot vazio.");
        if (
          c.inventory.length +
            (slot === "weapon" && c.equipment.shield ? 2 : 1) >
          BALANCE.inventoryLimit
        )
          throw Error("Mochila cheia.");
        if (!addItem(c, item)) throw Error("Mochila cheia.");
        delete c.equipment[slot];
        if (slot === "weapon" && c.equipment.shield) {
          addItem(c, c.equipment.shield);
          delete c.equipment.shield;
        }
        this.syncAppearance(p);
        break;
      }
      case "profession": {
        this.city(p, "class");
        const def = PROFESSIONS.find(
          (d) =>
            d.id === cmd.id && d.race === c.race && d.archetype === c.archetype,
        );
        if (!def || c.level < 50 || c.profession)
          throw Error(
            "Primeira profissão disponível uma vez, a partir do nível 50.",
          );
        const previous = c.profession;
        c.profession = def.id;
        try {
          this.removeIncompatible(p);
        } catch (error) {
          c.profession = previous;
          throw error;
        }
        this.log(
          p,
          `Primeira profissão: ${def.name}. A arma equipada determina suas quatro skills.`,
        );
        break;
      }
      case "specialization": {
        this.city(p, "class");
        const def = PROFESSIONS.find(
          (d) => d.id === c.profession,
        )?.branches.find((b) => b.id === cmd.id);
        if (c.level < 150 || !def || c.specialization)
          throw Error(
            "Especialização indisponível. Kits 150+ aguardam aprovação.",
          );
        const previous = c.specialization;
        c.specialization = def.id;
        try {
          this.removeIncompatible(p);
        } catch (error) {
          c.specialization = previous;
          throw error;
        }
        this.log(
          p,
          "Especialização registrada. Kits superiores/talentos: TODO_APROVACAO; veja o aviso do kit de teste.",
        );
        break;
      }
      case "buy": {
        this.city(p, "shop");
        const kind = String(cmd.kind);
        if (kind === "hp" || kind === "mp") {
          if (c.adena < BALANCE.potionCost * 5)
            throw Error("Adena insuficiente.");
          const item: Item = {
            id: randomUUID(),
            name: `Poção de ${kind.toUpperCase()}`,
            kind: "potion",
            potion: kind,
            quantity: 5,
          };
          if (!addItem(c, item)) throw Error("Mochila cheia.");
          c.adena -= BALANCE.potionCost * 5;
        } else {
          if (!Object.hasOwn(WEAPONS, kind))
            throw Error("Item da loja inválido.");
          if (c.adena < 150 || c.inventory.length >= BALANCE.inventoryLimit)
            throw Error("Adena ou espaço insuficiente.");
          c.adena -= 150;
          c.inventory.push(
            makeEquipment(randomUUID(), "NG", "weapon", kind as Weapon),
          );
        }
        break;
      }
      case "sell": {
        this.city(p, "shop");
        const i = c.inventory.findIndex((i) => i.id === cmd.id),
          item = c.inventory[i];
        if (!item) throw Error("Item não está na mochila.");
        c.adena += item.kind === "equipment" ? 80 : 2 * item.quantity;
        c.inventory.splice(i, 1);
        break;
      }
      case "craft": {
        this.city(p, "forge");
        const grade = String(cmd.grade) as Grade,
          weapon = String(cmd.weapon) as Weapon;
        if (!Object.hasOwn(GRADES, grade) || !Object.hasOwn(WEAPONS, weapon))
          throw Error("Receita inválida.");
        if (c.level < GRADES[grade])
          throw Error("Nível insuficiente para esta receita.");
        const ore = `ore-${grade}`,
          bone = 5,
          needed = grade === "B" || grade === "A" || grade === "S" ? 3 : 0;
        if (
          c.adena < BALANCE.craftCost ||
          countMaterial(c, "bone") < bone ||
          countMaterial(c, ore) < needed ||
          c.inventory.length >= BALANCE.inventoryLimit
        )
          throw Error(
            "Faltam Adena, espaço ou materiais: 5 Animal Bone e, em B/A/S, 3 minérios da grade.",
          );
        takeMaterial(c, "bone", bone);
        if (needed) takeMaterial(c, ore, needed);
        c.adena -= BALANCE.craftCost;
        const item = makeEquipment(
          randomUUID(),
          grade,
          "weapon",
          weapon,
          "Comum",
        );
        c.inventory.push(item);
        this.log(
          p,
          `Fabricado ${item.name}. Receita e raridade Comum de teste: TODO_APROVACAO.`,
          "drop",
        );
        break;
      }
      case "reforge": {
        this.city(p, "forge");
        const item =
          c.inventory.find((i) => i.id === cmd.id) ??
          Object.values(c.equipment).find((i) => i?.id === cmd.id);
        if (!item || item.slot !== "weapon")
          throw Error(
            "Selecione uma arma para reforjar a linha de ataque de teste.",
          );
        if (c.adena < BALANCE.reforgeCost) throw Error("Adena insuficiente.");
        c.adena -= BALANCE.reforgeCost;
        item.bonus = reforgeRoll(this.rng);
        this.log(
          p,
          `Reforja: ataque +${item.bonus}. Pesos aprovados; custo/linha de teste.`,
          "drop",
        );
        break;
      }
      case "party.create":
        if (p.partyId) throw Error("Você já está em uma Party.");
        this.city(p);
        {
          const party: Party = {
            id: randomUUID(),
            leaderId: id,
            members: [id],
            loot: "random",
            recipientId: null,
            assist: false,
          };
          this.parties.set(party.id, party);
          p.partyId = party.id;
        }
        break;
      case "party.invite": {
        this.city(p);
        const party = this.partyFor(p),
          other = this.players.get(String(cmd.id));
        if (
          !party ||
          party.leaderId !== id ||
          party.members.length >= 5 ||
          !other?.online ||
          other.partyId ||
          other.map !== "city" ||
          other === p
        )
          throw Error("Convite inválido ou Party cheia.");
        const list = this.invites.get(other.c.id) ?? [];
        this.invites.set(other.c.id, [
          ...list.filter((i) => i.partyId !== party.id),
          { partyId: party.id, expires: this.now + 60000 },
        ]);
        this.log(other, `${c.name} convidou você para uma Party.`);
        break;
      }
      case "party.accept": {
        this.city(p);
        if (p.partyId) throw Error("Você já possui Party.");
        const party = this.parties.get(String(cmd.id)),
          invite = this.invites
            .get(id)
            ?.find((i) => i.partyId === cmd.id && i.expires > this.now);
        if (
          !invite ||
          !party ||
          party.members.length >= 5 ||
          party.members.some((id) => this.players.get(id)?.map !== "city")
        )
          throw Error("Convite expirado ou grupo indisponível.");
        party.members.push(id);
        p.partyId = party.id;
        this.invites.delete(id);
        break;
      }
      case "party.leave":
        this.city(p);
        if (this.members(p).some((m) => m.map !== "city"))
          throw Error("Todos devem retornar à cidade antes de mudar a Party.");
        this.leaveParty(p);
        break;
      case "party.settings": {
        const party = this.partyFor(p);
        if (!party || party.leaderId !== id)
          throw Error("Somente o líder configura a Party.");
        if (!["random", "leader", "designated"].includes(String(cmd.loot)))
          throw Error("Modo de loot inválido.");
        if (
          cmd.loot === "designated" &&
          !party.members.includes(String(cmd.recipient))
        )
          throw Error("Escolha um integrante.");
        party.loot = cmd.loot as Party["loot"];
        party.recipientId =
          cmd.loot === "designated" ? String(cmd.recipient) : null;
        party.assist = cmd.assist === true;
        break;
      }
      case "chat": {
        if (p.map !== "city" || typeof cmd.text !== "string")
          throw Error("Chat da cidade.");
        const text = cmd.text.trim().slice(0, 180);
        if (text)
          for (const other of this.players.values())
            if (other.online && other.map === "city")
              this.log(other, `${c.name}: ${text}`, "chat");
        break;
      }
      case "boss": {
        const instance = this.instances.get(p.map);
        if (!instance || instance.bossSpawned)
          throw Error("Boss indisponível.");
        const boss = BOSSES.find((b) => b.level === Number(cmd.level));
        if (
          !boss ||
          c.level < boss.level ||
          instance.hunt.min < 201 ||
          instance.hunt.max !== boss.level
        )
          throw Error(
            "Boss de teste disponível nas hunts avançadas a partir do nível do marco.",
          );
        instance.bossSpawned = true;
        const mob = this.spawnMonster(instance, 0, 0);
        mob.name = boss.name;
        mob.level = boss.level;
        mob.boss = true;
        mob.hp = mob.maxHp *= 12;
        mob.attack *= 2.5;
        instance.monsters.push(mob);
        break;
      }
      case "dev": {
        if (!this.dev) throw Error("Ferramentas DEV desativadas.");
        this.leaveHunt(p);
        const level = Number(cmd.level);
        if (!Number.isInteger(level) || level < 1 || level > 1000)
          throw Error("Nível de teste entre 1 e 1000.");
        const def = PROFESSIONS.find((d) => d.id === cmd.profession);
        if (def) {
          c.race = def.race;
          c.archetype = def.archetype;
          c.profession = level >= 50 ? def.id : null;
        } else {
          c.profession = null;
          c.race = cmd.race === "dwarf" ? "dwarf" : "human";
          c.archetype =
            cmd.archetype === "mystic" && c.race !== "dwarf"
              ? "mystic"
              : "fighter";
        }
        c.level = level;
        c.xp = 0;
        c.specialization = null;
        if (
          level >= 150 &&
          typeof cmd.specialization === "string" &&
          def?.branches.some((b) => b.id === cmd.specialization)
        )
          c.specialization = cmd.specialization;
        const weapon = Object.hasOwn(WEAPONS, String(cmd.weapon))
          ? (cmd.weapon as Weapon)
          : (def?.weapons[0] ??
            (c.archetype === "mystic"
              ? "staff"
              : c.race === "dwarf"
                ? "hammer"
                : "swordShield"));
        const grade = (Object.keys(GRADES) as Grade[])
          .filter((g) => GRADES[g] <= level)
          .at(-1)!;
        c.equipment = {
          weapon: makeEquipment(randomUUID(), grade, "weapon", weapon),
          chest: makeEquipment(randomUUID(), grade, "chest"),
          legs: makeEquipment(randomUUID(), grade, "legs"),
        };
        if (weapon === "swordShield")
          c.equipment.shield = makeEquipment(randomUUID(), grade, "shield");
        this.removeIncompatible(p);
        c.adena = 10000;
        for (const mat of ["bone", "ore-B", "ore-A", "ore-S"])
          addItem(c, {
            id: randomUUID(),
            name: mat === "bone" ? "Animal Bone" : `Minério ${mat.slice(-1)}`,
            material: mat,
            kind: "material",
            quantity: 30,
          });
        p.cooldowns = [0, 0, 0, 0];
        p.actor.race = c.race;
        p.actor.archetype = c.archetype;
        p.actor.maxHp = statsFor(c).maxHp;
        p.actor.hp = p.actor.maxHp;
        c.mp = statsFor(c).maxMp;
        this.log(
          p,
          "DEV: dados de demonstração aplicados. Não são recompensas da progressão normal.",
        );
        break;
      }
      default:
        throw Error("Comando desconhecido.");
    }
  }
  private removeIncompatible(p: Player) {
    const loseWeapon =
        p.c.equipment.weapon && canEquip(p.c, p.c.equipment.weapon),
      count = Object.values(p.c.equipment).filter(
        (item) =>
          item &&
          (canEquip(p.c, item) || (item.slot === "shield" && loseWeapon)),
      ).length;
    if (p.c.inventory.length + count > BALANCE.inventoryLimit)
      throw Error("Libere espaço na mochila antes de mudar de profissão.");
    for (const [slot, item] of Object.entries(p.c.equipment))
      if (item && canEquip(p.c, item)) {
        if (!addItem(p.c, item))
          throw Error(
            "Mochila cheia: libere espaço antes de mudar de profissão.",
          );
        delete p.c.equipment[slot as keyof Character["equipment"]];
      }
    for (const instance of this.instances.values())
      instance.summons = instance.summons.filter((s) => s.masterId !== p.c.id);
    this.syncAppearance(p);
  }
  private syncAppearance(p: Player) {
    p.actor.weapon = p.c.equipment.weapon?.weapon;
    p.actor.shield = !!p.c.equipment.shield;
    p.actor.armorColor = p.c.equipment.chest
      ? ["#977656", "#5e967c", "#6698c0", "#8981bb", "#b37c64", "#d3bf80"][
          Object.keys(GRADES).indexOf(p.c.equipment.chest.grade!)
        ]
      : "#4e5963";
    p.actor.maxHp = statsFor(p.c).maxHp;
    p.actor.hp = Math.min(p.actor.hp, p.actor.maxHp);
  }
  private leaveParty(p: Player) {
    const party = this.partyFor(p);
    if (!party) return;
    party.members = party.members.filter((id) => id !== p.c.id);
    delete p.partyId;
    if (!party.members.length) this.parties.delete(party.id);
    else if (party.leaderId === p.c.id) party.leaderId = party.members[0];
  }
  enterHunt(p: Player, huntId: string) {
    const hunt = HUNTS.find((h) => h.id === huntId);
    if (!hunt) throw Error("Hunt inválida.");
    const party = this.partyFor(p);
    if (party && party.leaderId !== p.c.id)
      throw Error("O líder escolhe a hunt da Party.");
    const members = this.members(p);
    for (const member of members) {
      if (member.map !== "city")
        throw Error("Todos os integrantes devem estar na cidade.");
      const error = canEnter(member.c, hunt);
      if (error) throw Error(`${member.c.name}: ${error}`);
    }
    const key = party ? `party:${party.id}` : `solo:${p.c.id}`;
    const previous = this.instances.get(key);
    if (previous?.players.size) throw Error("A instância já está em uso.");
    const instance: Instance = {
      id: key,
      hunt,
      players: new Set(members.map((m) => m.c.id)),
      monsters: [],
      summons: [],
      respawns: SPAWNS.map(() => 0),
      bossSpawned: false,
    };
    this.instances.set(key, instance);
    for (const [i, member] of members.entries()) {
      member.map = key;
      member.actor.x = 180 + i * 32;
      member.actor.y = 220;
      member.actor.targetId = null;
      member.route = [];
      member.direction = null;
      member.auto = true;
      member.spawnCursor = 0;
      this.log(
        member,
        `Entrou em ${hunt.name}. Regras/monstros de teste: TODO_APROVACAO.`,
      );
    }
    this.respawn(instance);
  }
  leaveHunt(p: Player) {
    if (p.map === "city") return;
    const instance = this.instances.get(p.map);
    instance?.players.delete(p.c.id);
    if (instance) {
      instance.summons = instance.summons.filter((s) => s.masterId !== p.c.id);
      if (!instance.players.size) this.instances.delete(instance.id);
    }
    p.map = "city";
    p.actor.x = CITY.spawn.x;
    p.actor.y = CITY.spawn.y;
    p.actor.targetId = null;
    delete p.actor.deadUntil;
    p.auto = false;
    p.buffs = [];
    p.route = [];
    p.direction = null;
    p.actor.maxHp = statsFor(p.c).maxHp;
    p.actor.hp = p.actor.maxHp;
    p.c.mp = statsFor(p.c).maxMp;
    this.log(p, "De volta à cidade. HP/MP recuperados (regra de teste).");
  }
  private spawnMonster(
    instance: Instance,
    spawn: number,
    index: number,
  ): Monster {
    const point = SPAWNS[spawn],
      species =
        instance.hunt.species[(spawn + index) % instance.hunt.species.length],
      physical = species.startsWith("physical"),
      level = instance.hunt.min + Math.min(10, index);
    return {
      id: randomUUID(),
      name: `Monstro ${physical ? "Físico" : "Mágico"} ${instance.hunt.min}–${instance.hunt.max}`,
      kind: "monster",
      x: point.x + (index % 3) * 45,
      y: point.y + Math.floor(index / 3) * 42,
      hp: 70 + level * 18,
      maxHp: 70 + level * 18,
      spawn,
      level,
      defense: physical ? level * 1.2 : level * 3,
      mdef: physical ? level * 3 : level * 1.2,
      attack: 6 + level * 2.1,
      accuracy: 18 + level * 0.55,
      exp: BALANCE.baseExp + level * 18,
      adena: BALANCE.baseAdena + level * 2,
      physical,
      buffs: [],
      lastAttack: 0,
      facing: 0,
      targetId: null,
      nextAttack: 0,
      species,
    };
  }
  private respawn(instance: Instance) {
    for (let point = 0; point < SPAWNS.length; point++) {
      if (
        instance.respawns[point] > this.now ||
        instance.monsters.some((m) => m.spawn === point && !m.rewarded)
      )
        continue;
      instance.monsters = instance.monsters.filter(
        (m) =>
          m.spawn !== point ||
          m.boss ||
          !m.rewarded ||
          (!!m.spoilOwner &&
            !m.spoilRolled &&
            this.now - (m.deadUntil ?? 0) < 12000),
      );
      for (let i = 0; i < instance.players.size; i++)
        instance.monsters.push(this.spawnMonster(instance, point, i));
      instance.respawns[point] = this.now + BALANCE.respawnMs;
    }
  }
  tick(ms = 100) {
    this.now += ms;
    const dt = ms / 1000;
    for (const p of this.players.values()) {
      if (!p.online) continue;
      this.syncAppearance(p);
      p.buffs = p.buffs.filter((b) => b.until > this.now);
      p.regen += ms;
      if (p.regen >= 1000) {
        p.regen = 0;
        p.c.mp = Math.min(statsFor(p.c).maxMp, p.c.mp + 5);
        const regen = p.buffs.find((b) => b.kind === "regen");
        if (regen && p.actor.hp > 0)
          p.actor.hp = Math.min(p.actor.maxHp, p.actor.hp + regen.value);
        if (p.map === "city")
          p.actor.hp = Math.min(p.actor.maxHp, p.actor.hp + 15);
      }
      if (p.map === "city") {
        if (p.direction && p.direction.until > this.now)
          this.moveCity(
            p,
            p.actor.x + p.direction.x * BALANCE.moveSpeed * dt,
            p.actor.y + p.direction.y * BALANCE.moveSpeed * dt,
          );
        else if (p.route.length) {
          this.step(p.actor, p.route[0], dt);
          if (distance(p.actor, p.route[0]) < 8) p.route.shift();
        }
        continue;
      }
      const instance = this.instances.get(p.map);
      if (!instance) continue;
      if (p.actor.hp <= 0) {
        if (!p.actor.deadUntil) {
          p.actor.deadUntil = this.now + 1800;
          p.auto = false;
          p.actor.targetId = null;
          this.log(p, "Você foi derrotado. Retornando à cidade.", "combat");
          for (const s of instance.summons) if (s.masterId === p.c.id) s.hp = 0;
        }
        if (this.now >= p.actor.deadUntil) this.leaveHunt(p);
        continue;
      }
      this.potion(p, "hp");
      this.potion(p, "mp");
      let target = instance.monsters.find(
        (m) => m.id === p.actor.targetId && !m.rewarded,
      );
      const party = this.partyFor(p),
        leader = party && this.players.get(party.leaderId);
      if (party?.assist && leader && leader !== p && leader.map === p.map)
        target = instance.monsters.find(
          (m) => m.id === leader.actor.targetId && !m.rewarded,
        );
      if (p.auto) {
        for (const i of AUTO_SKILL_PRIORITY) {
          if (
            p.autoSkills[i] &&
            ["summon", "sweep", "heal", "restore"].includes(
              skillsFor(p.c)[i].effect,
            )
          ) {
            try {
              this.cast(p, i, true);
            } catch {
              /* utilities wait for a valid condition */
            }
          }
        }
        if (
          party?.assist &&
          leader &&
          leader !== p &&
          leader.map === p.map &&
          !target
        ) {
          p.actor.targetId = null;
          if (distance(p.actor, leader.actor) > 70)
            this.step(p.actor, leader.actor, dt);
          continue;
        }
        const point = SPAWNS[p.spawnCursor];
        if (!target) {
          target = instance.monsters
            .filter((m) => !m.rewarded && m.spawn === p.spawnCursor)
            .sort((a, b) => distance(p.actor, a) - distance(p.actor, b))[0];
          if (!target) {
            if (distance(p.actor, point) > 35) this.step(p.actor, point, dt);
            else p.spawnCursor = (p.spawnCursor + 1) % SPAWNS.length;
          }
        }
        p.actor.targetId = target?.id ?? null;
        if (target) {
          const stats = statsFor(p.c);
          if (distance(p.actor, target) > stats.range * 0.86)
            this.step(
              p.actor,
              target,
              dt,
              p.buffs.some((b) => b.kind === "haste")
                ? BALANCE.moveSpeed * 1.25
                : BALANCE.moveSpeed,
            );
          for (const i of AUTO_SKILL_PRIORITY)
            if (p.autoSkills[i]) {
              try {
                this.cast(p, i, true);
              } catch {
                /* an unavailable skill waits for resources/target */
              }
            }
          if (
            !target.rewarded &&
            distance(p.actor, target) <= stats.range &&
            p.attackAt <= this.now
          ) {
            p.attackAt = this.now + BALANCE.attackCd;
            this.strike(p, target, 1, false);
          }
        }
      } else if (target) p.actor.targetId = target.id;
    }
    for (const instance of this.instances.values()) {
      this.respawn(instance);
      for (const mob of instance.monsters) {
        if (mob.rewarded) continue;
        mob.buffs = mob.buffs.filter((b) => b.until > this.now);
        const dot = mob.buffs.find((b) => b.kind.startsWith("dot:"));
        if (dot && (mob.dotAt ?? 0) <= this.now) {
          mob.dotAt = this.now + 1000;
          const owner = this.players.get(dot.kind.slice(4));
          if (owner) this.deal(owner, mob, dot.value, "poison");
        }
        if (mob.rewarded) continue;
        const candidates: Actor[] = [
          ...[...instance.players]
            .map((id) => this.players.get(id))
            .filter((p) => p?.online && p.actor.hp! > 0)
            .map((p) => p!.actor),
          ...instance.summons.filter((s) => s.hp > 0),
        ];
        let victim = candidates.find((actor) => actor.id === mob.targetId);
        if (!victim)
          victim = candidates
            .filter((actor) => distance(mob, actor) < 250)
            .sort((a, b) => distance(mob, a) - distance(mob, b))[0];
        if (!victim) continue;
        const target = this.players.get(
          victim.kind === "summon" ? victim.masterId! : victim.id,
        );
        if (!target) continue;
        mob.targetId = victim.id;
        if (mob.buffs.some((b) => b.kind === "stun")) continue;
        const range = mob.physical ? 58 : 185;
        if (distance(mob, victim) > range)
          this.step(
            mob,
            victim,
            dt,
            mob.buffs.some((b) => b.kind === "slow") ? 45 : 75,
          );
        else if (mob.nextAttack <= this.now) {
          mob.nextAttack = this.now + 1400;
          mob.lastAttack = this.now;
          mob.facing = Math.atan2(victim.y - mob.y, victim.x - mob.x);
          const stats = statsFor(target.c),
            evade =
              victim.kind === "player" &&
              target.buffs.some((b) => b.kind === "evade")
                ? 30
                : 0;
          if (this.rng() < hitChance(mob.accuracy, stats.evasion + evade)) {
            let amount = damage(
              mob.attack *
                (mob.buffs.some((b) => b.kind === "weaken") ? 0.7 : 1),
              (mob.physical ? stats.defense : stats.mdef) *
                (victim.kind === "summon" ? 0.65 : 1),
            );
            if (
              victim.kind === "summon"
                ? (victim.protectedUntil ?? 0) > this.now
                : target.buffs.some(
                    (b) =>
                      b.kind === "guard" ||
                      (b.kind === "physicalGuard" && mob.physical),
                  )
            )
              amount = Math.max(1, Math.round(amount * 0.5));
            if (target.buffs.some((b) => b.kind === "partyDefense"))
              amount = Math.max(1, Math.round(amount * 0.8));
            victim.hp = Math.max(0, victim.hp - amount);
            this.effect(
              mob.id,
              victim.id,
              mob.physical ? "hit" : "magic",
              amount,
            );
            if (
              victim.kind === "player" &&
              target.buffs.some((b) => b.kind === "reflect")
            )
              this.deal(
                target,
                mob,
                Math.min(amount * 0.2, stats.attack * 0.5),
                "reflect",
              );
            if (
              victim.kind === "player" &&
              target.buffs.some((b) => b.kind === "counter")
            )
              for (const other of this.area(instance, target.actor, 120))
                this.deal(target, other, stats.attack * 0.3, "counter");
          }
        }
      }
      for (const s of instance.summons) if (s.hp <= 0) s.deadUntil ??= this.now;
      instance.summons = instance.summons.filter(
        (s) => !s.deadUntil || this.now - s.deadUntil < 1500,
      );
      for (const s of instance.summons) {
        if (s.hp <= 0) continue;
        const owner = this.players.get(s.masterId!);
        if (!owner || owner.map !== instance.id) continue;
        s.targetId = owner.actor.targetId;
        const target = instance.monsters.find(
          (m) => m.id === owner.actor.targetId && !m.rewarded,
        );
        const desired = target ?? {
          x: owner.actor.x - 35,
          y: owner.actor.y + 30,
        };
        if (distance(s, desired) > (target ? 60 : 42))
          this.step(s, desired, dt, 185);
        if (
          target &&
          distance(s, target) <= 75 &&
          this.now - s.lastAttack > 1100
        ) {
          s.lastAttack = this.now;
          if (!target.targetId || target.targetId === owner.c.id)
            target.targetId = s.id;
          this.deal(
            owner,
            target,
            damage(statsFor(owner.c).attack * 0.5, target.defense),
            "summon",
          );
        }
      }
    }
  }
  private potion(p: Player, kind: "hp" | "mp", manual = false) {
    if (p.actor.hp <= 0) {
      if (manual) throw Error("Aguarde o retorno à cidade.");
      return;
    }
    if (p.potionAt > this.now) {
      if (manual) throw Error("Poção em recarga.");
      return;
    }
    const stats = statsFor(p.c),
      value = kind === "hp" ? p.actor.hp : p.c.mp,
      max = kind === "hp" ? stats.maxHp : stats.maxMp,
      threshold = p.c.autoPotion?.[kind] ?? 0;
    if (!manual && (threshold === 0 || (value / max) * 100 > threshold)) return;
    const item = p.c.inventory.find((i) => i.potion === kind && i.quantity > 0);
    if (!item) {
      if (manual) throw Error("Sem poções. Compre no mercador.");
      return;
    }
    if (value >= max) return;
    item.quantity--;
    p.c.inventory = p.c.inventory.filter((i) => i.quantity > 0);
    p.potionAt = this.now + 4000;
    if (kind === "hp") p.actor.hp = Math.min(max, value + max * 0.4);
    else p.c.mp = Math.min(max, value + max * 0.4);
    this.effect(p.c.id, p.c.id, "heal", Math.round(max * 0.4));
  }
  private cast(p: Player, index: number, automatic: boolean) {
    if (p.actor.hp <= 0) throw Error("Aguarde o retorno à cidade.");
    const skill = skillsFor(p.c)[index];
    if (!skill) throw Error("Slot inválido.");
    if (skill.effect === "pending")
      throw Error(
        "Esta habilidade aguarda definição e aprovação do dono do projeto.",
      );
    if (p.cooldowns[index] > this.now) throw Error("Habilidade em recarga.");
    if (p.c.mp < skill.mp) throw Error("MP insuficiente.");
    const instance = this.instances.get(p.map);
    if (!instance) throw Error("Skills somente nas hunts.");
    const target = instance.monsters.find(
        (m) => m.id === p.actor.targetId && !m.rewarded,
      ),
      stats = statsFor(p.c);
    let targets: Monster[] = [];
    const allies = this.members(p).filter((m) => m.map === p.map),
      ally = skill.ally
        ? (allies.sort(
            (a, b) => a.actor.hp / a.actor.maxHp - b.actor.hp / b.actor.maxHp,
          )[0] ?? p)
        : p;
    if (skill.effect === "summon") {
      if (
        instance.summons.filter((s) => s.masterId === p.c.id).length >=
        summonLimit(p.c)
      )
        throw Error("Limite de summons.");
    } else if (skill.effect === "sweep") {
      targets = instance.monsters
        .filter(
          (m) =>
            m.rewarded &&
            m.spoilOwner === p.c.id &&
            !m.spoilRolled &&
            distance(m, p.actor) < 220,
        )
        .slice(0, spoilLimit(p.c));
      if (!targets.length)
        throw Error("Não há cadáver com Spoil válido por perto.");
    } else if (["heal", "restore"].includes(skill.effect)) {
      if (
        automatic &&
        ally.actor.hp / ally.actor.maxHp > 0.72 &&
        (skill.effect !== "restore" || p.c.mp / stats.maxMp > 0.5)
      )
        throw Error("Recuperação ainda não necessária.");
    } else if (
      [
        "guard",
        "evade",
        "retreat",
        "counter",
        "vampire",
        "partyAttack",
        "partyDefense",
      ].includes(skill.effect)
    ) {
      if (!target) throw Error("Aguarde combate.");
      const kind =
        skill.effect === "retreat"
          ? "evade"
          : skill.effect === "guard" && skill.physicalOnly
            ? "physicalGuard"
            : skill.effect === "vampire"
              ? skill.multiOnly
                ? "vampireMulti"
                : skill.areaOnly
                  ? "vampireAoE"
                  : skill.physicalOnly
                    ? "physicalVampire"
                    : "vampire"
              : skill.effect;
      if (automatic && ally.buffs.some((b) => b.kind === kind))
        throw Error("Efeito já ativo.");
    } else {
      if (!target || distance(p.actor, target) > stats.range + 35)
        throw Error("Selecione um inimigo ao alcance.");
      targets =
        skill.effect === "spoil"
          ? instance.monsters
              .filter(
                (m) =>
                  !m.rewarded && !m.spoilOwner && distance(m, target) < 170,
              )
              .slice(
                0,
                Math.max(
                  0,
                  spoilLimit(p.c) -
                    instance.monsters.filter(
                      (m) => !m.rewarded && m.spoilOwner === p.c.id,
                    ).length,
                ),
              )
          : skill.effect === "aoe" || skill.effect === "debuff"
            ? this.area(
                instance,
                skill.center === "caster" ? p.actor : target,
                170,
                skill,
                p.actor,
              )
            : [target];
      if (!targets.length) throw Error("Sem alvo para essa habilidade.");
    }
    p.c.mp -= skill.mp;
    p.cooldowns[index] = this.now + skill.cd;
    p.actor.lastAttack = this.now;
    this.log(p, skill.name, "combat");
    if (skill.effect === "summon") {
      const n = instance.summons.filter((s) => s.masterId === p.c.id).length,
        names = ["Siege Golem", "Wild Hog Cannon", "Swoop Cannon"];
      instance.summons.push({
        id: randomUUID(),
        name:
          p.c.level >= 150
            ? `${names[n]} [modelo de teste]`
            : "Constructo [provisório]",
        kind: "summon",
        masterId: p.c.id,
        targetId: p.actor.targetId,
        x: p.actor.x - 30 - n * 25,
        y: p.actor.y + 35,
        protectedUntil: p.buffs.find((b) => b.kind === "guard")?.until,
        hp: stats.maxHp * 0.6,
        maxHp: stats.maxHp * 0.6,
        lastAttack: 0,
        facing: 0,
      });
    } else if (skill.effect === "spoil")
      for (const m of targets) {
        m.spoilOwner = p.c.id;
        this.effect(p.c.id, m.id, "spoil");
      }
    else if (skill.effect === "sweep")
      for (const m of targets) {
        m.spoilRolled = true;
        for (const item of spoilLoot(randomUUID, this.rng, m.species))
          this.grant(p, item, "Sweeper");
        this.effect(p.c.id, m.id, "sweep");
      }
    else if (skill.effect === "heal" || skill.effect === "restore") {
      const amount = ally.actor.maxHp * 0.25;
      if (skill.regen)
        ally.buffs.push({
          kind: "regen",
          until: this.now + 5000,
          value: ally.actor.maxHp * 0.05,
        });
      else ally.actor.hp = Math.min(ally.actor.maxHp, ally.actor.hp + amount);
      if (skill.effect === "restore")
        p.c.mp = Math.min(stats.maxMp, p.c.mp + stats.maxMp * 0.2);
      this.effect(
        p.c.id,
        ally.c.id,
        skill.regen ? "buff" : "heal",
        skill.regen ? undefined : Math.round(amount),
      );
    } else if (skill.effect === "debuff") {
      for (const m of targets) {
        m.buffs.push({ kind: "weaken", until: this.now + 6000, value: 0.3 });
        this.effect(p.c.id, m.id, "magic");
      }
    } else if (
      [
        "guard",
        "evade",
        "retreat",
        "counter",
        "vampire",
        "partyAttack",
        "partyDefense",
      ].includes(skill.effect)
    ) {
      const kind =
        skill.effect === "retreat"
          ? "evade"
          : skill.effect === "guard" && skill.physicalOnly
            ? "physicalGuard"
            : skill.effect === "vampire"
              ? skill.multiOnly
                ? "vampireMulti"
                : skill.areaOnly
                  ? "vampireAoE"
                  : skill.physicalOnly
                    ? "physicalVampire"
                    : "vampire"
              : skill.effect;
      const recipients = skill.effect.startsWith("party") ? allies : [ally];
      for (const a of recipients)
        a.buffs.push({
          kind,
          until: this.now + BALANCE.skillDuration,
          value: 0.3,
        });
      if (skill.effect === "guard" && p.c.profession === "artisan")
        for (const summon of instance.summons.filter(
          (s) => s.masterId === p.c.id,
        ))
          summon.protectedUntil = this.now + BALANCE.skillDuration;
      if (skill.evadeAlso)
        p.buffs.push({ kind: "evade", until: this.now + 6000, value: 30 });
      if (skill.guardAlso)
        p.buffs.push({ kind: "guard", until: this.now + 6000, value: 0.3 });
      if (skill.haste)
        p.buffs.push({ kind: "haste", until: this.now + 6000, value: 0.25 });
      if (skill.reflect)
        p.buffs.push({ kind: "reflect", until: this.now + 6000, value: 0.2 });
      if (skill.aggro)
        for (const mob of this.area(instance, p.actor, 190))
          mob.targetId = p.c.id;
      if (skill.effect === "retreat" && target) {
        const dx = p.actor.x - target.x,
          dy = p.actor.y - target.y,
          l = Math.hypot(dx, dy) || 1;
        p.actor.x = Math.max(45, Math.min(1450, p.actor.x + (dx / l) * 70));
        p.actor.y = Math.max(45, Math.min(1020, p.actor.y + (dy / l) * 70));
      }
      this.effect(p.c.id, ally.c.id, "buff");
    } else
      for (const m of targets) {
        if (skill.aggro) m.targetId = p.c.id;
        if (skill.stun)
          m.buffs.push({ kind: "stun", until: this.now + 1200, value: 1 });
        if (skill.slow)
          m.buffs.push({ kind: "slow", until: this.now + 4000, value: 0.5 });
        if (skill.dot)
          m.buffs.push({
            kind: `dot:${p.c.id}`,
            until: this.now + 5000,
            value: stats.attack * 0.12,
          });
        this.strike(
          p,
          m,
          skill.power,
          skill.effect === "leech",
          skill.hits ?? 1,
          skill.backstab,
          skill.effect === "aoe",
          targets.length,
        );
      }
  }
  private area(
    instance: Instance,
    target: { x: number; y: number },
    radius: number,
    skill?: Skill,
    origin?: Actor,
  ) {
    return instance.monsters.filter((m) => {
      if (m.rewarded) return false;
      if (skill?.shape === "line" && origin) {
        const dx = target.x - origin.x,
          dy = target.y - origin.y,
          len = Math.hypot(dx, dy) || 1,
          projection = ((m.x - origin.x) * dx + (m.y - origin.y) * dy) / len,
          cross = Math.abs((m.x - origin.x) * dy - (m.y - origin.y) * dx) / len;
        return projection >= -20 && projection < 250 && cross < 65;
      }
      if (skill?.shape === "cone" && origin) {
        const heading = Math.atan2(target.y - origin.y, target.x - origin.x),
          angle = Math.atan2(m.y - origin.y, m.x - origin.x),
          diff = Math.atan2(
            Math.sin(angle - heading),
            Math.cos(angle - heading),
          );
        return distance(origin, m) < 220 && Math.abs(diff) < 1.15;
      }
      return distance(m, target) < radius;
    });
  }
  private strike(
    p: Player,
    m: Monster,
    power: number,
    leech: boolean,
    hits = 1,
    backstab = false,
    area = false,
    targetCount = 1,
  ) {
    const stats = statsFor(p.c);
    p.actor.lastAttack = this.now;
    p.actor.facing = Math.atan2(m.y - p.actor.y, m.x - p.actor.x);
    if (
      this.rng() >
      hitChance(
        stats.magic ? stats.magicAccuracy : stats.accuracy,
        m.level * 0.45 + 10,
      )
    ) {
      this.effect(p.c.id, m.id, "miss");
      return;
    }
    const critical = this.rng() < stats.crit;
    const behind =
      backstab &&
      Math.cos(Math.atan2(p.actor.y - m.y, p.actor.x - m.x) - m.facing) < -0.3;
    const attack =
      stats.attack * (p.buffs.some((b) => b.kind === "partyAttack") ? 1.2 : 1);
    const amount =
      damage(
        attack,
        stats.magic ? m.mdef : m.defense,
        power * (behind ? 1.4 : 1),
        critical,
      ) * hits;
    this.deal(
      p,
      m,
      amount,
      stats.magic
        ? "magic"
        : p.c.equipment.weapon?.weapon === "bow"
          ? "arrow"
          : "hit",
    );
    if (
      leech ||
      p.buffs.some(
        (b) =>
          b.kind === "vampire" ||
          (b.kind === "physicalVampire" && !stats.magic) ||
          (b.kind === "vampireAoE" && area) ||
          (b.kind === "vampireMulti" && area && targetCount > 1),
      )
    )
      p.actor.hp = Math.min(
        p.actor.maxHp,
        p.actor.hp + amount * (leech ? 0.25 : 0.12),
      );
  }
  private deal(p: Player, m: Monster, amount: number, kind: string) {
    if (m.rewarded) return;
    m.hp = Math.max(0, m.hp - Math.round(amount));
    this.effect(p.c.id, m.id, kind, Math.round(amount));
    if (m.hp <= 0) this.kill(p, m);
  }
  private kill(killer: Player, m: Monster) {
    const instance = this.instances.get(killer.map);
    if (!instance || m.rewarded) return;
    m.rewarded = true;
    m.deadUntil = this.now;
    const members = [...instance.players]
        .map((id) => this.players.get(id)!)
        .filter((p) => p?.online && p.map === instance.id),
      ids = members.map((p) => p.c.id);
    for (const p of members) {
      const gained = partyExp(m.exp, members.length) * expFactor(p.c.level);
      p.c.xp += gained;
      p.c.sp += Math.round(gained * 0.1);
      p.c.adena += Math.round(m.adena / members.length);
      p.metrics.exp += gained;
      while (p.c.xp >= xpRequired(p.c.level)) {
        p.c.xp -= xpRequired(p.c.level);
        p.c.level++;
        this.log(p, `Nível ${p.c.level}!`);
        this.syncAppearance(p);
        p.actor.hp = p.actor.maxHp;
        p.c.mp = statsFor(p.c).maxMp;
      }
      this.log(p, `${m.name}: +${gained.toFixed(1)} EXP.`, "combat");
    }
    // Exactly one normal-loot roll per monster. Summons do not enter the divisor.
    const items = normalLoot(
      instance.hunt.min,
      members.length,
      !!m.boss,
      randomUUID,
      this.rng,
      m.species,
    );
    for (const item of items) {
      const recipient = lootRecipient(this.partyFor(killer), ids, this.rng),
        owner = this.players.get(recipient);
      if (owner) this.grant(owner, item, "Loot");
    }
    instance.respawns[m.spawn] = this.now + BALANCE.respawnMs;
  }
  private grant(p: Player, item: Item, source: string) {
    if (!addItem(p.c, item)) {
      this.log(
        p,
        "Mochila cheia: recompensa não recolhida. Libere espaço.",
        "drop",
      );
      return;
    }
    p.metrics.loot += item.quantity;
    this.log(p, `${source}: ${item.name} ×${item.quantity}`, "drop");
  }
  private step(
    actor: Actor,
    target: { x: number; y: number },
    dt: number,
    speed = BALANCE.moveSpeed,
  ) {
    const dx = target.x - actor.x,
      dy = target.y - actor.y,
      len = Math.hypot(dx, dy);
    if (len < 0.1) return;
    const amount = Math.min(len, speed * dt);
    actor.x += (dx / len) * amount;
    actor.y += (dy / len) * amount;
    actor.facing = Math.atan2(dy, dx);
  }
  private free(x: number, y: number) {
    return (
      x >= 40 &&
      y >= 40 &&
      x < CITY.width - 40 &&
      y < CITY.height - 40 &&
      !CITY.blocks.some(
        (b) =>
          x > b.x - 15 &&
          x < b.x + b.w + 15 &&
          y > b.y - 15 &&
          y < b.y + b.h + 15,
      )
    );
  }
  private moveCity(p: Player, x: number, y: number) {
    if (this.free(x, p.actor.y)) p.actor.x = x;
    if (this.free(p.actor.x, y)) p.actor.y = y;
  }
  private path(start: Actor, end: { x: number; y: number }) {
    if (!this.free(end.x, end.y))
      throw Error("Escolha um ponto livre do caminho.");
    const w = 50,
      h = 36,
      toId = (x: number, y: number) =>
        Math.floor(y / 32) * w + Math.floor(x / 32),
      from = toId(start.x, start.y),
      goal = toId(end.x, end.y),
      queue = [from],
      previous = new Map<number, number>([[from, -1]]);
    for (let k = 0; k < queue.length; k++) {
      const id = queue[k];
      if (id === goal) break;
      for (const n of [id - 1, id + 1, id - w, id + w]) {
        const x = (n % w) * 32 + 16,
          y = Math.floor(n / w) * 32 + 16;
        if (
          n < 0 ||
          n >= w * h ||
          Math.abs((n % w) - (id % w)) > 1 ||
          previous.has(n) ||
          !this.free(x, y)
        )
          continue;
        previous.set(n, id);
        queue.push(n);
      }
    }
    if (!previous.has(goal)) throw Error("Não há caminho livre.");
    const route = [];
    for (let at = goal; at !== from; at = previous.get(at)!) {
      route.unshift({ x: (at % w) * 32 + 16, y: Math.floor(at / w) * 32 + 16 });
    }
    route.push(end);
    return route;
  }
  snapshot(p: Player): Snapshot {
    const instance = this.instances.get(p.map);
    const actors =
      p.map === "city"
        ? [...this.players.values()]
            .filter((o) => o.online && o.map === "city")
            .map((o) => o.actor)
        : [
            ...[...(instance?.players ?? [])].map(
              (id) => this.players.get(id)!.actor,
            ),
            ...(instance?.monsters ?? []),
            ...(instance?.summons ?? []),
          ];
    this.syncAppearance(p);
    return {
      self: this.capture(p),
      actor: p.actor,
      stats: statsFor(p.c),
      actors,
      skills: skillsFor(p.c),
      cooldowns: p.cooldowns.map((n) => Math.max(0, n - this.now)),
      map: p.map,
      hunt: instance?.hunt ?? null,
      party: this.partyFor(p) ?? null,
      online: [...this.players.values()]
        .filter((o) => o.online)
        .map((o) => ({ id: o.c.id, name: o.c.name, level: o.c.level })),
      invites: (this.invites.get(p.c.id) ?? [])
        .filter((i) => i.expires > this.now && this.parties.has(i.partyId))
        .map((i) => ({
          partyId: i.partyId,
          leader:
            this.players.get(this.parties.get(i.partyId)!.leaderId)?.c.name ??
            "Líder",
        })),
      logs: p.logs,
      vfx: this.vfx.filter(
        (effect) =>
          actors.some((actor) => actor.id === effect.from) &&
          actors.some((actor) => actor.id === effect.to),
      ),
      autoFarm: p.auto,
      autoSkills: p.autoSkills,
      metrics: {
        exp: p.metrics.exp,
        loot: p.metrics.loot,
        seconds: Math.max(1, (this.now - p.metrics.since) / 1000),
      },
      dev: this.dev,
      serverTime: this.now,
    };
  }
}
export { newCharacter };
