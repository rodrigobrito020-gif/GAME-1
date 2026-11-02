import {
  ARCHER_CLASS,
  ARCHER_SKIN,
  ARCHER_SKILLS,
  ARCHER_EYES,
  ARCHER_SPIRIT,
  isArcher,
} from "./archer.mjs";
import {
  archerBasic,
  archerReposition,
  castArcher,
  piercedTargets,
  archerFxState,
} from "./archer-combat.mjs";
import {
  ensurePotions,
  selectPotion,
  configurePotion,
  consumePotion,
  buyPotionStock,
  automaticPotion,
} from "./potions.mjs";
import { combatMode, evade, EVADE } from "./combat-control.mjs";
import { classVisuals } from "./class-visuals.mjs";
import {
  MONSTER_ROLES,
  startMonsterSkill,
  skillHits,
} from "./monster-combat.mjs";
// Own local gameplay rules. These are test values, not the original server rules.
import {
  WARRIOR_ACTIONS,
  WARRIOR_BASIC,
  WARRIOR_RETURN,
  WARRIOR_LIGHT_DASH,
  WARRIOR_GROUND_SLAM,
} from "./warrior.mjs";
import { LIGHT_AEGIS, TeamDefenseBuff } from "./defense-buff.mjs";
import { LIGHT_AVATAR, LightAvatar } from "./light-avatar.mjs";
export const SKILLS = [
  {
    id: WARRIOR_LIGHT_DASH.id,
    name: "Avanço de Luz",
    description:
      "Avança em linha reta até um inimigo distante e atinge na chegada. Não pode ser usado perto demais do alvo.",
    icon: "/assets/ui/royal-warrior/avanco-de-luz-card.png",
    key: "1",
    manaCost: 8,
    cooldownMs: 4000,
    range: WARRIOR_LIGHT_DASH.range,
    multiplier: 2,
  },
  {
    id: WARRIOR_GROUND_SLAM.id,
    name: "Impacto de Luz",
    description:
      "Salta e crava a espada no chão com as duas mãos. A aterrissagem atinge os inimigos ao redor do guerreiro.",
    icon: "/assets/ui/royal-warrior/impacto-de-luz-card.png",
    key: "2",
    manaCost: 12,
    cooldownMs: 7000,
    range: WARRIOR_GROUND_SLAM.range,
    radius: WARRIOR_GROUND_SLAM.radius,
    multiplier: 2.5,
  },
  {
    id: LIGHT_AEGIS.id,
    name: LIGHT_AEGIS.name,
    description:
      "Aumenta a defesa do guerreiro e de todos os jogadores e companheiros vivos do mesmo grupo na instância. DEF +30% (mínimo +2) por 5 minutos. Recarga de 120 segundos.",
    icon: "/assets/ui/royal-warrior/egide-de-luz-card.png",
    key: "3",
    kind: "buff",
    manaCost: LIGHT_AEGIS.manaCost,
    cooldownMs: LIGHT_AEGIS.cooldownMs,
    range: 0,
    durationMs: LIGHT_AEGIS.durationMs,
  },
  {
    id: LIGHT_AVATAR.id,
    name: LIGHT_AVATAR.name,
    key: "4",
    kind: "buff",
    description:
      "Ultimate: consome 100 de energia de combate. Por 45s, os ataques básicos atingem uma pequena área e o guerreiro recebe 35% menos dano. Intervalo mínimo de 60s.",
    icon: "/assets/ui/royal-warrior/avatar-da-luz-card.png",
    manaCost: 0,
    cooldownMs: LIGHT_AVATAR.cooldownMs,
    range: 0,
    durationMs: LIGHT_AVATAR.durationMs,
  },
  {
    id: EVADE.id,
    name: EVADE.name,
    key: "SHIFT",
    kind: "movement",
    universal: true,
    description:
      "Esquiva direcional comum a todas as classes. Avança até 128 unidades, respeitando paredes, sem causar dano ou conceder invulnerabilidade. Em automático, tenta sair de ataques inimigos marcados no chão; em manual, use Shift esquerdo ou clique no ícone.",
    icon: "/assets/ui/royal-warrior/dash-card.png",
    manaCost: 0,
    cooldownMs: EVADE.cooldownMs,
    range: EVADE.distance,
  },
  {
    id: "investida",
    name: "Investida",
    icon: "/assets/ui/royal-warrior/investida.svg",
    key: "2",
    manaCost: 12,
    cooldownMs: 7000,
    range: 180,
    multiplier: 1.5,
  },
  {
    id: "golpe-destruidor",
    name: "Golpe Destruidor",
    icon: "/assets/ui/royal-warrior/golpe-destruidor.svg",
    key: "3",
    manaCost: 15,
    cooldownMs: 9000,
    range: 75,
    radius: 90,
    multiplier: 2.5,
  },
  {
    id: "furia-guerreiro",
    name: "Fúria do Guerreiro",
    icon: "/assets/ui/royal-warrior/furia-guerreiro.svg",
    key: "4",
    manaCost: 10,
    cooldownMs: 14000,
    range: 75,
    multiplier: 1,
    heal: 25,
  },
];
// Approved warrior skills in their stable manual hotbar slots.
// Unapproved draft skills remain unavailable to both manual and automatic use.
export const ACTIVE_SKILLS = SKILLS.filter((skill) =>
  [
    EVADE.id,
    WARRIOR_LIGHT_DASH.id,
    WARRIOR_GROUND_SLAM.id,
    LIGHT_AEGIS.id,
    LIGHT_AVATAR.id,
  ].includes(skill.id),
).sort((a, b) => (Number(a.key) || 99) - (Number(b.key) || 99));
export const ALL_SKILLS = [
  ...ACTIVE_SKILLS.filter((s) => !s.universal),
  ...ARCHER_SKILLS,
  ...ACTIVE_SKILLS.filter((s) => s.universal),
];
export const ITEMS = [
  {
    id: "fragmento-local",
    name: "Fragmento de treino",
    category: 4,
    slot: 0,
    icon: "/assets/ui/v2/caveira.png",
    stackable: true,
    maxStack: 999,
    baseRarity: "comum",
    base: {},
    sellBase: 2,
  },
  {
    id: "espada-local",
    name: "Espada de treino",
    category: 1,
    slot: 1,
    icon: "/assets/ui/v2/ataque_24.png",
    classes: ["guerreiro"],
    baseRarity: "comum",
    base: { atk: 6 },
    sellBase: 25,
  },
  {
    id: "peitoral-local",
    name: "Peitoral de treino",
    category: 2,
    slot: 4,
    icon: "/assets/ui/royal-warrior/peitoral-treino.png",
    classes: ["guerreiro"],
    baseRarity: "comum",
    base: { def: 3, hp: 25 },
    sellBase: 20,
  },
];
export const AREAS = [
  {
    id: "treino-local",
    tier: 1,
    max: 4,
    required: 1,
    name: "Pátio da Coroa — treino",
    hp: 48,
    damage: 4,
    xp: 18,
    gold: 8,
  },
  {
    id: "elite-local",
    tier: 5,
    max: 10,
    required: 5,
    name: "Pátio da Coroa — desafio",
    hp: 180,
    damage: 18,
    xp: 44,
    gold: 18,
  },
];
// Distributed homes across the walkable courtyard. Never pull the whole map
// toward the entry point: each monster defends a small region of its own.
export const MONSTER_HOMES = [
  { x: 448, y: 528 },
  { x: 800, y: 480 },
  { x: 1168, y: 496 },
  { x: 1504, y: 560 },
  { x: 320, y: 800 },
  { x: 704, y: 752 },
  { x: 1200, y: 752 },
  { x: 1584, y: 848 },
  { x: 448, y: 1104 },
  { x: 816, y: 1152 },
  { x: 1184, y: 1088 },
  { x: 1568, y: 1136 },
];
export const RESPAWN_DELAY_MS = 20000;
const AGGRO_RADIUS = 145,
  LEASH_RADIUS = 220;
const finiteId = (value) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;
export class LocalFarm {
  constructor(
    account,
    {
      now = Date.now,
      random = Math.random,
      defenseBuffs,
      resolveTeam = () => [],
    } = {},
  ) {
    this.account = account;
    account.combatMode = "auto";
    this.now = now;
    this.random = random;
    this.defenseBuffs = defenseBuffs ?? new TeamDefenseBuff({ now });
    this.resolveTeam = resolveTeam;
    this.avatar = new LightAvatar(this.character, {
      now,
      definition: this.ultimateDefinition,
    });
    account.bag ??= [];
    account.warehouse ??= [];
    account.nextUid ??= 1;
    const c = this.character;
    c.equipment.slots ??= [];
    if (!account.farmVersion) {
      c.automation.skillOrder = this.skills
        .filter(
          (skill) =>
            skill.id !== this.ultimateDefinition.id && skill.id !== EVADE.id,
        )
        .map((skill) => skill.id);
      c.consumables.hpPotions = { pequena: 10 };
      c.consumables.manaPotions = { pequena: 10 };
      account.farmVersion = 1;
    }
    // Rename the first skill without enabling disabled slots or resetting saves.
    c.automation.skillOrder = (c.automation.skillOrder ?? [])
      .map((id) => (id === "corte-poderoso" ? WARRIOR_LIGHT_DASH.id : id))
      .filter((id) => this.skills.some((skill) => skill.id === id));
    // Once per save, add the team defense buff to the approved sequence. Respect a
    // deliberately empty order and preserve later player edits on restart.
    if (account.skillReviewVersion !== 4) {
      if (c.automation.skillOrder.length)
        c.automation.skillOrder = this.skills
          .filter(
            (skill) =>
              skill.id !== this.ultimateDefinition.id && skill.id !== EVADE.id,
          )
          .map((skill) => skill.id);
      account.skillReviewVersion = 4;
    }
    if (account.avatarAutomationVersion !== 1) {
      if (!c.automation.skillOrder.includes(this.ultimateDefinition.id))
        c.automation.skillOrder.push(this.ultimateDefinition.id);
      account.avatarAutomationVersion = 1;
    }
    ensurePotions(account);
    c.progress.hp ||= 250;
    c.progress.mana = Math.max(0, c.progress.mana);
    this.recalculate();
  }
  get skills() {
    return isArcher(this.character)
      ? [
          ...ARCHER_SKILLS,
          ...ACTIVE_SKILLS.filter((s) => s.universal).map((s) => ({
            ...s,
            icon: classVisuals(ARCHER_CLASS).dashIcon,
          })),
        ]
      : ACTIVE_SKILLS;
  }
  get ultimateDefinition() {
    return isArcher(this.character) ? ARCHER_SPIRIT : LIGHT_AVATAR;
  }
  changeClass(client, id) {
    if (client.hunt) throw Error("local.city_only");
    if (!["guerreiro", ARCHER_CLASS].includes(id))
      throw Error("local.invalid_skill");
    const c = this.character,
      old = c.identity.classId;
    if (old === id) return;
    this.account.classAutomation ??= {};
    this.account.classAutomation[old] = [...c.automation.skillOrder];
    const hp = c.progress.hp / c.derived.maxHp,
      mana = c.progress.mana / c.derived.maxMana;
    c.identity.classId = id;
    c.identity.skinId = id === ARCHER_CLASS ? ARCHER_SKIN : "humano-guerreiro";
    c.identity.gender = id === ARCHER_CLASS ? 2 : 1;
    c.identity.ownedSkins = [
      ...new Set([...(c.identity.ownedSkins ?? []), c.identity.skinId]),
    ];
    this.eyesUntil = 0;
    this.avatar = new LightAvatar(c, {
      now: this.now,
      definition: this.ultimateDefinition,
    });
    c.automation.skillOrder = [
      ...(this.account.classAutomation[id] ??
        this.skills.filter((s) => !s.universal).map((s) => s.id)),
    ];
    this.recalculate();
    c.progress.hp = Math.max(1, Math.round(c.derived.maxHp * hp));
    c.progress.mana = Math.round(c.derived.maxMana * mana);
  }
  activeBuffs() {
    const now = this.now(),
      c = this.character,
      ids = [];
    const defense = this.defenseBuffs.state(c);
    if (defense)
      ids.push({
        id: LIGHT_AEGIS.id,
        remainingMs: defense.until - now,
        totalMs: LIGHT_AEGIS.durationMs,
      });
    if (this.eyesUntil > now)
      ids.push({
        id: ARCHER_EYES.id,
        remainingMs: this.eyesUntil - now,
        totalMs: ARCHER_EYES.durationMs,
      });
    if (this.avatar.active())
      ids.push({
        id: this.ultimateDefinition.id,
        remainingMs: this.avatar.until - now,
        totalMs: this.ultimateDefinition.durationMs,
      });
    return ids.map((b) => ({
      ...b,
      icon: ALL_SKILLS.find((s) => s.id === b.id)?.icon,
      name: ALL_SKILLS.find((s) => s.id === b.id)?.name,
    }));
  }
  get character() {
    return this.account.character;
  }
  recalculate() {
    const c = this.character,
      level = c.progress.level;
    const sum = (key) =>
      c.equipment.slots.reduce((n, e) => n + (e.item.stats?.[key] ?? 0), 0);
    Object.assign(c.derived, {
      atk: Math.round(
        ((isArcher(c) ? 14 : 15) + (level - 1) * 2 + sum("atk")) *
          (isArcher(c) && this.eyesUntil > this.now() ? 1.2 : 1),
      ),
      def: this.defenseBuffs.defense(c, sum("def")),
      maxHp: (isArcher(c) ? 220 : 250) + (level - 1) * 20 + sum("hp"),
      maxMana: (isArcher(c) ? 120 : 100) + (level - 1) * 5,
      attackRange: isArcher(c) ? 320 : 65,
      attackCooldown:
        isArcher(c) && this.avatar.active()
          ? 1 / (1 + ARCHER_SPIRIT.attackSpeedPercent)
          : 1,
      moveSpeed: 160,
      manaRegen: 3,
      cooldownMult: 1,
      damageCooldownMult: 1,
    });
    c.derived.power = Math.round(c.derived.atk * 2 + c.derived.def * 3);
    c.progress.hp = Math.min(c.progress.hp, c.derived.maxHp);
    c.progress.mana = Math.min(c.progress.mana, c.derived.maxMana);
    c.progress.xpToNext = this.xpRequired(level);
    c.inventory.bagUsed = this.account.bag.length;
    c.inventory.warehouseUsed = this.account.warehouse.length;
  }
  member(client) {
    const instanceId = client.instanceId ?? client.hunt;
    return {
      entity: client.entityId ?? 1,
      kind: client.memberKind ?? "player",
      partyId: client.partyId ?? null,
      instanceId,
      character: this.character,
      isAlive: () =>
        !!client.hunt && !client.hunt.deadAt && this.character.progress.hp > 0,
      isPresent: () => (client.instanceId ?? client.hunt) === instanceId,
      refresh: () => this.recalculate(),
    };
  }
  xpRequired(level) {
    return Math.floor(100 * Math.pow(level, 1.35));
  }
  start(client, input) {
    const area = AREAS.find(
      (a) => a.id === input.gateId && a.tier === input.tierMin,
    );
    if (!area || input.difficulty !== "normal")
      throw Error("local.invalid_hunt");
    if (this.character.progress.level < area.required)
      throw Error("local.level_required");
    if (client.hunt) throw Error("local.already_hunting");
    const now = this.now();
    client.x = 944;
    client.y = 1008;
    client.target = null;
    client.route = [];
    client.until = 0;
    client.moving = false;
    client.hunt = {
      area,
      nextAttack: now,
      nextCast: now,
      actionUntil: now,
      impacts: [],
      nextMonsterId: 100 + MONSTER_HOMES.length,
      basicChain: 0,
      patrolIndex: 0,
      manualTarget: 0,
      nextRegen: now + 1000,
      cooldowns: {},
      target: 0,
      deadAt: 0,
      session: {
        gateId: area.id,
        tierMin: area.tier,
        difficulty: "normal",
        startedAtMs: now,
        kills: 0,
        xp: 0,
        gold: 0,
        drops: [],
      },
      monsters: MONSTER_HOMES.map((p, index) => ({
        ...p,
        role: MONSTER_ROLES[index % 3].role,
        roleIndex: index % 3,
        nextSkill: now + 5000 + index * 400,
        home: { ...p },
        id: 100 + index,
        hp: area.hp,
        maxHp: area.hp,
        facing: 0,
        aggro: false,
        anim: 0,
        nextAttack: now + 1000,
        respawnAt: 0,
        respawnDelay: RESPAWN_DELAY_MS + (index % 5) * 2000,
      })),
    };
    Object.assign(this.character.hunt, {
      tierMin: area.tier,
      difficulty: "normal",
    });
    return client.hunt;
  }
  stop(client) {
    const events = this.events();
    events.buffs.push(...this.defenseBuffs.remove(this.character));
    events.buffs.push(...this.avatar.clear(client.entityId ?? 1));
    this.eyesUntil = 0;
    this.recalculate();
    client.hunt = null;
    client.evade = null;
    client.combatAnimUntil = 0;
    client.target = null;
    client.route = [];
    client.until = 0;
    client.moving = false;
    return events;
  }
  target(client, entity) {
    if (
      !client.hunt ||
      !Number.isInteger(entity) ||
      entity < 0 ||
      (entity && !client.hunt.monsters.some((m) => m.id === entity && m.hp > 0))
    )
      throw Error("local.invalid_target");
    client.hunt.attackOrder = 0;
    client.hunt.manualTarget = entity;
    client.hunt.target = entity;
  }
  orderAttack(client, entity) {
    if (!client.hunt || client.hunt.deadAt || !this.character.progress.hp)
      throw Error("local.not_hunting");
    if (!entity) throw Error("local.invalid_target");
    this.target(client, entity);
    client.hunt.attackOrder = entity;
    client.target = null;
    client.route = [];
    client.until = 0;
    client.dx = client.dy = 0;
  }
  events() {
    return {
      damage: [],
      deaths: [],
      casts: [],
      cooldowns: [],
      levelUps: [],
      loot: [],
      heals: [],
      moves: [],
      buffs: [],
    };
  }
  reward(hunt, monster, events) {
    const c = this.character,
      a = hunt.area;
    c.wallet.gold = Number(c.wallet.gold) + a.gold;
    c.progress.xp = Number(c.progress.xp) + a.xp;
    hunt.session.kills++;
    this.avatar.gain(LIGHT_AVATAR.killCharge);
    hunt.session.gold += a.gold;
    hunt.session.xp += a.xp;
    while (
      c.progress.level < 300 &&
      c.progress.xp >= this.xpRequired(c.progress.level)
    ) {
      c.progress.xp -= this.xpRequired(c.progress.level);
      c.progress.level++;
      this.recalculate();
      c.progress.hp = c.derived.maxHp;
      c.progress.mana = c.derived.maxMana;
      events.levelUps.push({ entity: 1, level: c.progress.level });
    }
    if (c.progress.level === 300)
      c.progress.xp = Math.min(c.progress.xp, this.xpRequired(300) - 1);
    c.progress.xpToNext = this.xpRequired(c.progress.level);
    const ids = ["fragmento-local"];
    if (hunt.session.kills % 3 === 0)
      ids.push(this.random() < 0.5 ? "espada-local" : "peitoral-local");
    const added = [],
      updated = [];
    for (const id of ids) {
      const def = ITEMS.find((d) => d.id === id);
      let item =
        def.stackable &&
        this.account.bag.find((i) => i.defId === id && i.qty < def.maxStack);
      if (item) {
        item.qty++;
        updated.push(item);
      } else if (this.account.bag.length < 100) {
        item = {
          uid: String(this.account.nextUid++),
          defId: id,
          rarity: "comum",
          level: 1,
          stats: { ...def.base },
          qty: 1,
          sellPrice: def.sellBase,
          power: (def.base.atk ?? 0) * 2 + (def.base.def ?? 0) * 3,
          createdAtMs: this.now(),
          durability: 100,
        };
        this.account.bag.push(item);
        added.push(item);
      } else continue;
      const entry = hunt.session.drops.find((d) => d.defId === id);
      if (entry) entry.qty++;
      else hunt.session.drops.push({ defId: id, qty: 1, rarity: "comum" });
      events.loot.push({
        pos: { x: Math.round(monster.x * 10), y: Math.round(monster.y * 10) },
        defId: id,
        rarity: "comum",
        qty: 1,
        receiver: 1,
      });
    }
    events.loot.push({
      pos: { x: Math.round(monster.x * 10), y: Math.round(monster.y * 10) },
      gold: a.gold,
      receiver: 1,
    });
    this.recalculate();
    return { added, updated };
  }
  hit(hunt, monster, amount, skillId, events, deltas) {
    if (monster.hp <= 0) return;
    amount = Math.min(monster.hp, Math.max(1, Math.round(amount)));
    monster.hp -= amount;
    if (monster.hp > 0 && isArcher(this.character)) monster.aggro = true;
    monster.anim = monster.hp ? 4 : 5;
    events.damage.push({ source: 1, target: monster.id, amount, skillId });
    if (!monster.hp) {
      monster.respawnAt = this.now() + monster.respawnDelay;
      events.deaths.push({ entity: monster.id, killer: 1 });
      deltas.push(this.reward(hunt, monster, events));
    }
  }
  basic(client, targetId, events = this.events()) {
    const h = client.hunt,
      c = this.character,
      now = this.now();
    if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
    const target = h.monsters.find(
      (m) =>
        m.id === (typeof targetId === "object" ? targetId.id : targetId) &&
        m.hp > 0,
    );
    if (
      !target ||
      Math.hypot(target.x - client.x, target.y - client.y) >
        c.derived.attackRange
    )
      throw Error("local.invalid_target");
    if (now < h.nextAttack || now < h.actionUntil || client.evade)
      throw Error("local.cooldown");
    if (isArcher(c)) return archerBasic(this, client, target, events);
    h.nextAttack = now + 1000;
    const basic = h.basicChain++ % 2 ? WARRIOR_RETURN : WARRIOR_BASIC;
    h.actionUntil = now + basic.duration;
    client.combatAnimUntil = h.actionUntil;
    const dx = target.x - client.x,
      dy = target.y - client.y;
    const distance = Math.hypot(dx, dy) || 1;
    client.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
    events.moves.push({
      entity: 1,
      move: this.avatar.active() ? basic.move + "-avatar" : basic.move,
      target: target.id,
      dirX: Math.round((dx / distance) * 1000),
      dirY: Math.round((dy / distance) * 1000),
      durationMs: basic.duration,
    });
    h.impacts.push({
      at: now + basic.impact,
      basic: true,
      targets: [target.id],
      amount: c.derived.atk,
      skillId: "",
      heal: 0,
    });
    return { events, deltas: [] };
  }
  dash(
    client,
    direction = {},
    events = this.events(),
    { free = () => true } = {},
  ) {
    if (!this.character.progress.hp) throw Error("local.not_hunting");
    const move = evade(client, direction, this.now(), free);
    events.moves.push(move);
    events.cooldowns.push(
      ...[EVADE.id, "rolamento"].map((skillId) => ({
        skillId,
        readyInMs: EVADE.cooldownMs,
        totalMs: EVADE.cooldownMs,
      })),
    );
    return { events, deltas: [] };
  }
  autoDash(client, events, free) {
    const h = client.hunt,
      now = this.now();
    if (
      !(this.character.automation.skillOrder ?? []).includes(EVADE.id) ||
      client.evade ||
      now < (client.evadeReadyAt ?? 0) ||
      now < h.actionUntil
    )
      return;
    const threat = h.monsters.find(
      (m) =>
        m.hp > 0 &&
        m.cast &&
        m.cast.impact - now <= 550 &&
        m.cast.impact > now &&
        skillHits(m.cast, client),
    );
    if (!threat) return;
    const c = threat.cast;
    let dx = client.x - c.tx,
      dy = client.y - c.ty;
    if (Math.hypot(dx, dy) < 1) {
      dx = -(c.ty - c.y) || 1;
      dy = c.tx - c.x;
    }
    const candidates = Array.from({ length: 8 }, (_, i) => {
      const angle = Math.atan2(dy, dx) + (i * Math.PI) / 4;
      return {
        dirX: Math.round(Math.cos(angle) * 1000),
        dirY: Math.round(Math.sin(angle) * 1000),
      };
    });
    for (const d of candidates) {
      const x = client.x + (d.dirX / 1000) * EVADE.distance,
        y = client.y + (d.dirY / 1000) * EVADE.distance;
      if (Math.hypot(x - c.tx, y - c.ty) <= c.radius + 15) continue;
      let clear = true;
      for (let t = 0; t <= 1; t += 0.025)
        if (
          !free(client.x + (x - client.x) * t, client.y + (y - client.y) * t)
        ) {
          clear = false;
          break;
        }
      if (!clear) continue;
      try {
        const selected = h.manualTarget;
        this.dash(client, d, events, { free });
        h.manualTarget = selected;
        break;
      } catch {
        /* Unavailable dash never stalls normal combat. */
      }
    }
  }
  cast(
    client,
    id,
    targetId,
    events = this.events(),
    deltas = [],
    { free = () => true } = {},
  ) {
    if (id === "corte-poderoso") id = WARRIOR_LIGHT_DASH.id;
    const h = client.hunt,
      c = this.character,
      now = this.now();
    if (id === "ataque-basico") return this.basic(client, targetId, events);
    if (id === EVADE.id) return this.dash(client, {}, events, { free });
    if (isArcher(c))
      return castArcher(this, client, id, targetId, events, deltas);
    const skill = this.skills.find((s) => s.id === id);
    if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
    if (!skill) throw Error("local.invalid_skill");
    if (id === LIGHT_AVATAR.id && (h.nextCast > now || h.actionUntil > now)) {
      if (this.avatar.saved.readyAt > now || this.avatar.active())
        throw Error("local.cooldown");
      if (this.avatar.saved.charge < LIGHT_AVATAR.maxCharge)
        throw Error("local.ultimate_energy");
      h.avatarQueued = true;
      return { events, deltas };
    }
    if ((h.cooldowns[id] ?? 0) > now || h.nextCast > now || h.actionUntil > now)
      throw Error("local.cooldown");
    if (c.progress.mana < skill.manaCost) throw Error("local.no_mana");
    if (id === LIGHT_AVATAR.id) {
      this.avatar.reserve();
      h.avatarQueued = false;
      h.cooldowns[id] = this.avatar.saved.readyAt;
      h.nextCast = h.actionUntil = now + LIGHT_AVATAR.castMs;
      client.combatAnimUntil = h.actionUntil;
      const origin = {
        x: Math.round(client.x * 10),
        y: Math.round(client.y * 10),
      };
      events.casts.push({
        caster: client.entityId ?? 1,
        skillId: id,
        target: client.entityId ?? 1,
        origin,
        dest: { ...origin },
        facing: client.facing,
      });
      events.cooldowns.push({
        skillId: id,
        readyInMs: LIGHT_AVATAR.cooldownMs,
        totalMs: LIGHT_AVATAR.cooldownMs,
      });
      h.impacts.push({ at: now + LIGHT_AVATAR.applyAtMs, avatarBuff: true });
      return { events, deltas };
    }
    if (id === LIGHT_AEGIS.id) {
      if (this.defenseBuffs.state(c)) throw Error("local.buff_active");
      c.progress.mana -= skill.manaCost;
      h.cooldowns[id] = now + skill.cooldownMs;
      h.nextCast = h.actionUntil = now + LIGHT_AEGIS.castMs;
      client.combatAnimUntil = h.actionUntil;
      const origin = {
        x: Math.round(client.x * 10),
        y: Math.round(client.y * 10),
      };
      events.casts.push({
        caster: client.entityId ?? 1,
        skillId: id,
        target: client.entityId ?? 1,
        origin,
        dest: { ...origin },
        facing: client.facing,
      });
      events.cooldowns.push({
        skillId: id,
        readyInMs: skill.cooldownMs,
        totalMs: skill.cooldownMs,
      });
      h.impacts.push({ at: now + LIGHT_AEGIS.applyAtMs, defenseBuff: true });
      return { events, deltas };
    }
    const target = h.monsters.find((m) => m.id === targetId && m.hp > 0);
    if (
      !target ||
      Math.hypot(target.x - client.x, target.y - client.y) > skill.range
    )
      throw Error("local.invalid_target");
    let dash = null;
    if (id === WARRIOR_LIGHT_DASH.id) {
      const distance = Math.hypot(target.x - client.x, target.y - client.y);
      if (distance < WARRIOR_LIGHT_DASH.minRange)
        throw Error("local.target_too_close");
      const travel = distance - WARRIOR_LIGHT_DASH.stopDistance;
      const from = { x: client.x, y: client.y },
        to = {
          x: client.x + ((target.x - client.x) / (distance || 1)) * travel,
          y: client.y + ((target.y - client.y) / (distance || 1)) * travel,
        };
      // Sample the complete swept body corridor before charging mana/cooldown.
      const samples = Math.max(1, Math.ceil(travel / 4));
      for (let i = 0; i <= samples; i++)
        if (
          !free(
            from.x + ((to.x - from.x) * i) / samples,
            from.y + ((to.y - from.y) * i) / samples,
          )
        )
          throw Error("local.invalid_target");
      dash = {
        from,
        to,
        target: target.id,
        startsAt: now + WARRIOR_LIGHT_DASH.start,
        endsAt: now + WARRIOR_LIGHT_DASH.end,
        blocked: false,
      };
    }
    c.progress.mana -= skill.manaCost;
    h.cooldowns[id] = now + skill.cooldownMs;
    const action = WARRIOR_ACTIONS[id];
    h.nextCast = h.actionUntil = now + action.duration;
    client.combatAnimUntil = h.actionUntil;
    if (dash) {
      h.dash = dash;
      h.target = target.id;
    }
    const dx = target.x - client.x,
      dy = target.y - client.y;
    const center = id === WARRIOR_GROUND_SLAM.id ? client : target;
    if (Math.hypot(dx, dy) > 0.01)
      client.facing =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
    events.casts.push({
      caster: 1,
      skillId: id,
      target: target.id,
      origin: { x: Math.round(client.x * 10), y: Math.round(client.y * 10) },
      dest: { x: Math.round(center.x * 10), y: Math.round(center.y * 10) },
      facing: client.facing,
    });
    events.cooldowns.push({
      skillId: id,
      readyInMs: skill.cooldownMs,
      totalMs: skill.cooldownMs,
    });
    const targets = skill.radius
      ? h.monsters.filter(
          (m) =>
            m.hp > 0 &&
            Math.hypot(m.x - center.x, m.y - center.y) <= skill.radius,
        )
      : [target];
    h.impacts.push({
      at: now + action.impact,
      targets: targets.map((m) => m.id),
      amount: c.derived.atk * skill.multiplier,
      skillId: id,
      heal: skill.heal ?? 0,
      ...(dash ? { dash: true } : {}),
      ...(skill.radius
        ? { area: { x: center.x, y: center.y, radius: skill.radius } }
        : {}),
    });
    return { events, deltas };
  }
  step(client, { free = () => true, route = () => [] } = {}) {
    const h = client.hunt,
      c = this.character,
      now = this.now(),
      automatic = combatMode(this.account) === "auto",
      events = this.events(),
      deltas = [],
      spawned = [],
      despawned = [];
    events.buffs.push(...this.defenseBuffs.expire());
    if (this.avatar.until && !this.avatar.active()) {
      events.buffs.push(...this.avatar.clear(client.entityId ?? 1));
      this.recalculate();
    }
    if (this.eyesUntil && this.eyesUntil <= now) {
      this.eyesUntil = 0;
      this.recalculate();
      events.buffs.push({
        entity: 1,
        buffId: ARCHER_EYES.id,
        durationMs: 0,
        removed: true,
      });
    }
    if (h?.archerFx) h.archerFx = h.archerFx.filter((f) => f.end > now);

    if (!h) return { events, deltas, spawned, despawned };
    if (h.deadAt)
      return {
        events,
        deltas,
        spawned,
        despawned,
        returnCity: now >= h.deadAt + 3000,
      };
    this.autoDash(client, events, free);
    if (h.avatarQueued && now >= h.actionUntil && now >= h.nextCast) {
      try {
        this.cast(client, this.ultimateDefinition.id, 0, events, deltas, {
          free,
        });
      } catch {
        h.avatarQueued = false;
      }
    }
    let dashMoved = false;
    if (h.dash) {
      const dash = h.dash;
      if (!h.monsters.some((m) => m.id === dash.target && m.hp > 0)) {
        h.dash = null;
        h.impacts = h.impacts.filter((p) => !p.dash);
        h.actionUntil = h.nextCast = now;
        client.combatAnimUntil = 0;
      } else if (now >= dash.startsAt && !dash.blocked) {
        const t = Math.min(
          1,
          (now - dash.startsAt) / (dash.endsAt - dash.startsAt),
        );
        const x = dash.from.x + (dash.to.x - dash.from.x) * t,
          y = dash.from.y + (dash.to.y - dash.from.y) * t;
        const origin = { x: client.x, y: client.y },
          samples = Math.max(
            1,
            Math.ceil(Math.hypot(x - origin.x, y - origin.y) / 4),
          );
        for (let i = 1; i <= samples; i++) {
          const nx = origin.x + ((x - origin.x) * i) / samples,
            ny = origin.y + ((y - origin.y) * i) / samples;
          if (!free(nx, ny)) {
            dash.blocked = true;
            break;
          }
          dashMoved ||= nx !== client.x || ny !== client.y;
          client.x = nx;
          client.y = ny;
        }
      }
    }
    for (const impact of h.impacts.filter((p) => p.at <= now)) {
      if (impact.avatarBuff) {
        events.buffs.push(this.avatar.activate(client.entityId ?? 1));
        this.recalculate();
        continue;
      }
      if (impact.eyesBuff) {
        this.eyesUntil = now + ARCHER_EYES.durationMs;
        this.recalculate();
        events.buffs.push({
          entity: 1,
          buffId: ARCHER_EYES.id,
          durationMs: ARCHER_EYES.durationMs,
          removed: false,
        });
        continue;
      }
      if (impact.defenseBuff) {
        events.buffs.push(
          ...this.defenseBuffs.apply(
            this.member(client),
            this.resolveTeam(client),
          ),
        );
        continue;
      }
      const primary = impact.basic
        ? h.monsters.find((m) => m.id === impact.targets[0] && m.hp > 0)
        : null;
      const cleave =
        impact.basic && !isArcher(c) && this.avatar.active() && primary;
      const targets = impact.cone
        ? [
            ...new Set(
              impact.cone.flatMap((ray) => piercedTargets(h.monsters, ray)),
            ),
          ]
        : impact.pierce
          ? piercedTargets(h.monsters, impact.pierce)
          : cleave
            ? h.monsters
                .filter(
                  (m) =>
                    m.hp > 0 &&
                    Math.hypot(m.x - primary.x, m.y - primary.y) <=
                      LIGHT_AVATAR.cleaveRadius,
                )
                .map((m) => m.id)
            : impact.area
              ? h.monsters
                  .filter(
                    (m) =>
                      m.hp > 0 &&
                      Math.hypot(m.x - impact.area.x, m.y - impact.area.y) <=
                        impact.area.radius,
                  )
                  .map((m) => m.id)
              : impact.targets;
      let landed = false;
      for (const id of targets) {
        const monster = h.monsters.find((m) => m.id === id && m.hp > 0);
        if (
          monster &&
          (!impact.dash ||
            (!h.dash?.blocked &&
              Math.hypot(monster.x - client.x, monster.y - client.y) <=
                WARRIOR_LIGHT_DASH.hitRange))
        ) {
          this.hit(
            h,
            monster,
            impact.amount,
            cleave ? LIGHT_AVATAR.id : impact.skillId,
            events,
            deltas,
          );
          landed = true;
        }
      }
      if (landed) this.avatar.gain(LIGHT_AVATAR.hitCharge);
      const amount = Math.min(impact.heal, c.derived.maxHp - c.progress.hp);
      if (amount > 0) {
        c.progress.hp += amount;
        events.heals.push({ source: 1, target: 1, amount });
      }
    }
    h.impacts = h.impacts.filter((p) => p.at > now);
    if (h.dash && now >= h.dash.endsAt) h.dash = null;
    const move = (unit, target, speed) => {
      const dx = target.x - unit.x,
        dy = target.y - unit.y,
        length = Math.hypot(dx, dy),
        amount = Math.min(speed / 20, length);
      if (!length) return false;
      let moved = false;
      const x = unit.x + (dx / length) * amount,
        y = unit.y + (dy / length) * amount;
      if (free(x, unit.y)) {
        moved ||= x !== unit.x;
        unit.x = x;
      }
      if (free(unit.x, y)) {
        moved ||= y !== unit.y;
        unit.y = y;
      }
      unit.facing =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
      return moved;
    };
    for (const m of h.monsters)
      if (!m.hp && now >= m.respawnAt) {
        // A dying actor can still be in the client's delayed animation queues.
        // A new life must not reuse that network identity.
        despawned.push(m.id);
        Object.assign(m, m.home, {
          id: h.nextMonsterId++,
          hp: m.maxHp,
          aggro: false,
          anim: 0,
          nextAttack: now + 1000,
          nextSkill: now + 5000,
          cast: null,
        });
        spawned.push(m);
      }
    // Keep a committed strike's target until recovery ends; between actions,
    // select the nearest live enemy again rather than locking a distant one.
    const locked = now < h.actionUntil;
    let target = h.monsters.find(
      (m) => m.id === (locked ? h.target : h.manualTarget) && m.hp > 0,
    );
    // A ranged volley keeps its aim between shots while that enemy remains in
    // range. Explicit right-click orders still take priority. Melee selection
    // continues to use the nearest living target between actions.
    if (!target && automatic && isArcher(c) && !h.manualTarget) {
      const focused = h.monsters.find((m) => m.id === h.target && m.hp > 0);
      if (
        focused &&
        Math.hypot(focused.x - client.x, focused.y - client.y) <=
          c.derived.attackRange
      )
        target = focused;
    }
    if (!target && automatic)
      target = h.monsters
        .filter((m) => m.hp > 0)
        .reduce(
          (nearest, m) =>
            !nearest ||
            Math.hypot(m.x - client.x, m.y - client.y) <
              Math.hypot(nearest.x - client.x, nearest.y - client.y)
              ? m
              : nearest,
          null,
        );
    if (
      h.manualTarget &&
      !h.monsters.some((m) => m.id === h.manualTarget && m.hp > 0)
    ) {
      h.manualTarget = 0;
      h.attackOrder = 0;
    }
    h.target = target?.id ?? 0;
    client.moving = dashMoved;
    if (
      automatic &&
      target &&
      now >= h.actionUntil &&
      (c.automation.skillOrder ?? []).includes(this.ultimateDefinition.id)
    ) {
      try {
        this.cast(client, this.ultimateDefinition.id, 0, events, deltas, {
          free,
        });
      } catch {
        /* Not ready: normal combat continues. */
      }
    }
    if (
      automatic &&
      target &&
      now >= h.actionUntil &&
      (c.automation.skillOrder ?? []).includes(LIGHT_AEGIS.id) &&
      !this.defenseBuffs.state(c)
    ) {
      try {
        this.cast(client, LIGHT_AEGIS.id, 0, events, deltas, { free });
      } catch {
        /* A buff on cooldown must not stop movement or basic attacks. */
      }
    }
    if (
      isArcher(c) &&
      target &&
      now >= h.actionUntil &&
      (c.automation.skillOrder ?? []).includes(ARCHER_EYES.id) &&
      !(this.eyesUntil > now)
    ) {
      try {
        this.cast(client, ARCHER_EYES.id, 0, events, deltas, { free });
      } catch {
        /* Resume normal combat. */
      }
    }
    if (automatic && target && now >= h.actionUntil && !client.evade) {
      if (
        Math.hypot(target.x - client.x, target.y - client.y) >
        c.derived.attackRange
      ) {
        let dashed = false;
        if (
          (c.automation.skillOrder ?? []).includes(WARRIOR_LIGHT_DASH.id) &&
          Math.hypot(target.x - client.x, target.y - client.y) >=
            WARRIOR_LIGHT_DASH.minRange &&
          Math.hypot(target.x - client.x, target.y - client.y) <=
            WARRIOR_LIGHT_DASH.range
        ) {
          try {
            this.cast(
              client,
              WARRIOR_LIGHT_DASH.id,
              target.id,
              events,
              deltas,
              { free },
            );
            dashed = true;
          } catch {
            /* A blocked/unavailable dash falls back to normal navigation. */
          }
        }
        if (!dashed) {
          const way = route(client, target)[0] ?? target;
          client.moving = move(client, way, c.derived.moveSpeed);
        }
      } else if (
        isArcher(c) &&
        now < h.nextAttack &&
        archerReposition(client, target, now, free)
      ) {
        client.moving = move(client, h.archerRetreat, c.derived.moveSpeed);
      } else {
        const faceX = target.x - client.x,
          faceY = target.y - client.y;
        client.facing =
          Math.abs(faceX) > Math.abs(faceY)
            ? faceX > 0
              ? 2
              : 1
            : faceY > 0
              ? 0
              : 3;
        for (const id of c.automation.skillOrder ?? []) {
          if (id === EVADE.id) continue;
          if (
            id === WARRIOR_LIGHT_DASH.id &&
            Math.hypot(target.x - client.x, target.y - client.y) <
              WARRIOR_LIGHT_DASH.minRange
          )
            continue;
          try {
            this.cast(client, id, target.id, events, deltas, { free });
            break;
          } catch {
            /* An unavailable skill must not stall basic attacks. */
          }
        }
        if (target.hp > 0 && now >= h.nextAttack && now >= h.actionUntil) {
          this.basic(client, target.id, events);
        }
      }
    }
    if (automatic && !target && now >= h.actionUntil && !client.evade) {
      const waypoint = MONSTER_HOMES[h.patrolIndex % MONSTER_HOMES.length];
      if (Math.hypot(client.x - waypoint.x, client.y - waypoint.y) < 20)
        h.patrolIndex++;
      else
        client.moving = move(
          client,
          route(client, waypoint)[0] ?? waypoint,
          c.derived.moveSpeed,
        );
    }
    for (const m of h.monsters) {
      if (!m.hp) {
        m.cast = null;
        continue;
      }
      let skillDamage = 0;
      const casting = m.cast;
      if (casting) {
        m.anim = 2;
        if (now < casting.impact) continue;
        if (skillHits(casting, client))
          skillDamage =
            casting.type === "cleave"
              ? 1.8
              : casting.type === "meteor"
                ? 2
                : 1.35;
        m.cast = null;
        m.recoverUntil = now + 400;
      }
      if (!skillDamage && now < (m.recoverUntil ?? 0)) continue;
      const distance = Math.hypot(m.x - client.x, m.y - client.y);
      m.anim = 0;
      const fromHome = Math.hypot(m.x - m.home.x, m.y - m.home.y);
      if (distance <= AGGRO_RADIUS) m.aggro = true;
      if (fromHome > LEASH_RADIUS || distance > (isArcher(c) ? 500 : 300))
        m.aggro = false;
      if (!skillDamage && startMonsterSkill(m, client, now)) {
        m.anim = 2;
        continue;
      }
      if (skillDamage) {
        /* Resolve the committed marked attack below. */
      } else if (!m.aggro) {
        if (fromHome > 8 && move(m, m.home, 70)) m.anim = 1;
      } else if (m.role && m.role !== "melee" && distance < 120) {
        const away = { x: m.x + (m.x - client.x), y: m.y + (m.y - client.y) };
        if (
          Math.hypot(away.x - m.home.x, away.y - m.home.y) < LEASH_RADIUS &&
          move(m, away, 85)
        )
          m.anim = 1;
      } else if (distance > (m.role && m.role !== "melee" ? 230 : 48)) {
        if (move(m, client, 70)) m.anim = 1;
      }
      if (
        skillDamage ||
        (distance <= 55 &&
          now >= m.nextAttack &&
          (!m.role || m.role === "melee"))
      ) {
        m.nextAttack = now + 1400;
        m.anim = 2;
        const amount = Math.min(
          c.progress.hp,
          Math.max(
            1,
            Math.round(
              Math.max(1, h.area.damage * (skillDamage || 1) - c.derived.def) *
                (this.avatar.active()
                  ? 1 - this.ultimateDefinition.damageReduction
                  : 1),
            ),
          ),
        );
        c.progress.hp -= amount;
        this.avatar.gain(LIGHT_AVATAR.receivedCharge);
        events.damage.push({ source: m.id, target: 1, amount });
        if (c.progress.hp > 0 && now >= h.actionUntil) {
          h.actionUntil = now + 100;
          events.moves.push({
            entity: 1,
            move: isArcher(c) ? "elfa-ferida" : "humano-ferido",
            target: m.id,
            dirX: 0,
            dirY: 0,
            durationMs: 100,
          });
        }
        if (!c.progress.hp) {
          h.deadAt = now;
          h.dash = null;
          client.evade = null;
          h.impacts = [];
          for (const enemy of h.monsters) enemy.cast = null;
          this.eyesUntil = 0;
          h.archerFx = [];
          this.recalculate();
          events.buffs.push(...this.defenseBuffs.remove(c));
          events.buffs.push(...this.avatar.clear(client.entityId ?? 1, true));
          this.recalculate();
          client.moving = false;
          events.deaths.push({ entity: 1, killer: m.id });
          c.hunt.lastDeath = {
            diedAtMs: now,
            gateId: h.area.id,
            tierMin: h.area.tier,
            tierMax: h.area.max,
            difficulty: "normal",
            xpLost: 0,
          };
          return { events, deltas, spawned, despawned, died: true };
        }
      }
    }
    if (now >= h.nextRegen) {
      h.nextRegen = now + 1000;
      c.progress.mana = Math.min(c.derived.maxMana, c.progress.mana + 3);
    }
    return { events, deltas, spawned, despawned };
  }
  inventory(input) {
    if (![0, 1, 2, 3].includes(input.scope ?? 0))
      throw Error("local.invalid_inventory");
    const bag = input.scope === 3 ? this.account.warehouse : this.account.bag;
    const f = input.filter ?? {};
    let list = bag.filter((i) => {
      const d = ITEMS.find((d) => d.id === i.defId);
      return (
        d &&
        (!f.category || d.category === f.category) &&
        (!f.slot || d.slot === f.slot) &&
        (!f.rarity || i.rarity === f.rarity) &&
        (!f.levelMin || i.level >= f.levelMin) &&
        (!f.levelMax || i.level <= f.levelMax) &&
        (!f.defIds?.length || f.defIds.includes(i.defId)) &&
        f.equipped !== 1
      );
    });
    const recent = (a, b) => Number(b.uid) - Number(a.uid);
    const rarity = (i) =>
      ({ comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4 })[i.rarity] ?? 0;
    const organized = (a, b) => {
      const ad = ITEMS.find((d) => d.id === a.defId),
        bd = ITEMS.find((d) => d.id === b.defId);
      return (
        ad.category - bd.category ||
        rarity(b) - rarity(a) ||
        (b.power ?? 0) - (a.power ?? 0) ||
        a.defId.localeCompare(b.defId) ||
        recent(a, b)
      );
    };
    const order =
      {
        2: (a, b) => (b.power ?? 0) - (a.power ?? 0),
        3: (a, b) => b.level - a.level,
        4: (a, b) => rarity(b) - rarity(a),
        5: (a, b) => (b.power ?? 0) - (a.power ?? 0),
        6: (a, b) => (b.enchant ?? 0) - (a.enchant ?? 0),
        7: (a, b) => (b.sockets?.length ?? 0) - (a.sockets?.length ?? 0),
        8: organized,
      }[input.sort] ?? recent;
    list = [...list].sort((a, b) => order(a, b) || recent(a, b));
    const pageSize = Math.max(1, Math.min(100, input.pageSize || 30)),
      pages = Math.max(1, Math.ceil(list.length / pageSize));
    let page = Math.max(1, Math.min(pages, input.page || 1));
    if (input.focusUid && input.focusUid !== "0") {
      const n = list.findIndex((i) => i.uid === String(input.focusUid));
      if (n >= 0) page = Math.floor(n / pageSize) + 1;
    }
    return {
      scope: input.scope || 1,
      items: list.slice((page - 1) * pageSize, page * pageSize),
      total: list.length,
      page,
      pages,
      pageSize,
      capacity: 100,
      usedSlots: bag.length,
      hasPrev: page > 1,
      hasNext: page < pages,
      counts: {
        all: bag.length,
        categories: [1, 2, 3, 4, 5].map((category) => ({
          category,
          count: bag.filter(
            (i) => ITEMS.find((d) => d.id === i.defId)?.category === category,
          ).length,
        })),
        slots: Array.from({ length: 13 }, (_, index) => ({
          slot: index + 1,
          count: bag.filter(
            (i) => ITEMS.find((d) => d.id === i.defId)?.slot === index + 1,
          ).length,
        })),
      },
    };
  }
  equip(uid) {
    const index = this.account.bag.findIndex((i) => i.uid === String(uid));
    if (index < 0) throw Error("local.invalid_item");
    const item = this.account.bag[index],
      def = ITEMS.find((d) => d.id === item.defId);
    if (
      !def?.slot ||
      item.level > this.character.progress.level ||
      (def.classes?.length &&
        !def.classes.includes(this.character.identity?.classId ?? "guerreiro"))
    )
      throw Error("local.invalid_item");
    const old = this.character.equipment.slots.find((e) => e.slot === def.slot);
    this.account.bag.splice(index, 1);
    item.equippedSlot = def.slot;
    this.character.equipment.slots = this.character.equipment.slots.filter(
      (e) => e.slot !== def.slot,
    );
    this.character.equipment.slots.push({ slot: def.slot, item });
    if (old) {
      delete old.item.equippedSlot;
      this.account.bag.push(old.item);
    }
    this.recalculate();
    return {
      result: {
        slot: def.slot,
        equippedUid: item.uid,
        unequippedUid: old?.item.uid,
      },
      delta: { removed: [item.uid], added: old ? [old.item] : [] },
    };
  }
  unequip(slot) {
    const entry = this.character.equipment.slots.find((e) => e.slot === slot);
    if (!entry || this.account.bag.length >= 100)
      throw Error("local.invalid_item");
    this.character.equipment.slots = this.character.equipment.slots.filter(
      (e) => e !== entry,
    );
    delete entry.item.equippedSlot;
    this.account.bag.push(entry.item);
    this.recalculate();
    return {
      result: { slot, uid: entry.item.uid },
      delta: { added: [entry.item] },
    };
  }
  bestEquipment(criterion = 0, apply = false) {
    if (!Number.isInteger(criterion) || criterion < 0 || criterion > 6)
      throw Error("local.invalid_item");
    const score = (item) => {
      const s = item.stats ?? {};
      return criterion === 3
        ? (s.atk ?? 0)
        : criterion === 4
          ? (s.def ?? 0)
          : criterion === 5
            ? (s.hp ?? 0)
            : (s.atk ?? 0) * 2 + (s.def ?? 0) * 3 + (s.hp ?? 0) / 10;
    };
    const slots = new Map(
      this.character.equipment.slots.map((e) => [e.slot, e.item]),
    );
    const currentPower = this.character.derived.power,
      changes = [];
    for (const item of this.account.bag) {
      const d = ITEMS.find((d) => d.id === item.defId);
      if (
        !d?.slot ||
        item.level > this.character.progress.level ||
        (d.classes?.length &&
          !d.classes.includes(this.character.identity?.classId ?? "guerreiro"))
      )
        continue;
      const old = slots.get(d.slot);
      if (score(item) > score(old ?? {})) slots.set(d.slot, item);
    }
    let newPower = currentPower;
    const power = (i) => (i?.stats?.atk ?? 0) * 2 + (i?.stats?.def ?? 0) * 3;
    for (const [slot, item] of slots) {
      const current = this.character.equipment.slots.find(
        (e) => e.slot === slot,
      )?.item;
      if (item.uid !== current?.uid) {
        changes.push({
          slot,
          currentUid: current?.uid,
          newUid: item.uid,
          delta: score(item) - score(current ?? {}),
        });
        newPower += power(item) - power(current);
      }
    }
    const result = {
      alreadyBest: !changes.length,
      currentPower,
      newPower,
      deltaPower: newPower - currentPower,
      changes,
    };
    const items = changes.map((c) =>
      this.account.bag.find((i) => i.uid === c.newUid),
    );
    if (!apply) return { ...result, items };
    const added = [],
      removed = [];
    for (const item of items) {
      const output = this.equip(item.uid);
      added.push(...output.delta.added);
      removed.push(...output.delta.removed);
    }
    return { result, delta: { added, removed } };
  }
  lock(uid, locked) {
    const item = [
      ...this.account.bag,
      ...this.account.warehouse,
      ...this.character.equipment.slots.map((e) => e.item),
    ].find((i) => i.uid === String(uid));
    if (!item) throw Error("local.invalid_item");
    item.locked = !!locked;
    const scope = this.account.warehouse.includes(item) ? 3 : 1;
    return {
      result: { uid: item.uid, locked: item.locked },
      scope,
      delta: { updated: [item] },
    };
  }
  warehouseMove(uids, direction) {
    if (
      ![1, 2].includes(direction) ||
      !Array.isArray(uids) ||
      !uids.length ||
      uids.length > 100
    )
      throw Error("local.invalid_item");
    const from = direction === 1 ? this.account.bag : this.account.warehouse,
      to = direction === 1 ? this.account.warehouse : this.account.bag;
    const moved = [],
      refused = [],
      items = [];
    for (const uid of new Set(uids.map(String))) {
      const index = from.findIndex((i) => i.uid === uid);
      if (index < 0 || to.length >= 100) {
        refused.push(uid);
        continue;
      }
      const [item] = from.splice(index, 1);
      to.push(item);
      moved.push(uid);
      items.push(item);
    }
    this.recalculate();
    return {
      result: {
        moved,
        refused,
        bagUsed: this.account.bag.length,
        bagCapacity: 100,
        warehouseUsed: this.account.warehouse.length,
        warehouseCapacity: 100,
      },
      deltas: [
        { scope: direction === 1 ? 1 : 3, removed: moved },
        { scope: direction === 1 ? 3 : 1, added: items },
      ],
    };
  }
  sell(selection, confirmRare = false) {
    let entries;
    if (selection?.case === "uids") entries = selection.value?.entries;
    else if (selection?.case === "bulk") {
      const filter = selection.value ?? {};
      if (!filter.categories?.length || !filter.rarities?.length)
        throw Error("local.invalid_item");
      entries = this.account.bag
        .filter(
          (i) =>
            filter.categories.includes(
              ITEMS.find((d) => d.id === i.defId)?.category,
            ) && filter.rarities.includes(i.rarity),
        )
        .map((i) => ({ uid: i.uid, qty: i.qty }));
    } else throw Error("local.invalid_item");
    if (!Array.isArray(entries) || !entries.length || entries.length > 100)
      throw Error("local.invalid_item");
    // Validate and deduplicate the whole request before changing money or stock.
    const selected = new Map();
    let skipped = 0;
    for (const entry of entries) {
      const uid = String(entry.uid);
      if (selected.has(uid)) throw Error("local.invalid_item");
      const item = this.account.bag.find((i) => i.uid === uid);
      const qty = entry.qty || item?.qty || 0;
      if (!item || item.locked) {
        skipped++;
        selected.set(uid, null);
        continue;
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > item.qty)
        throw Error("local.invalid_item");
      selected.set(uid, { item, qty });
    }
    const rare = new Map();
    for (const entry of selected.values())
      if (entry && ["epico", "lendario", "monarca"].includes(entry.item.rarity))
        rare.set(
          entry.item.rarity,
          (rare.get(entry.item.rarity) ?? 0) + entry.qty,
        );
    if (rare.size && !confirmRare)
      return {
        result: {
          sold: 0,
          units: 0,
          gold: 0,
          skipped,
          needsRareConfirmation: true,
          rarePending: [...rare].map(([rarity, qty]) => ({ rarity, qty })),
        },
        delta: {},
      };
    let gold = 0,
      units = 0,
      sold = 0;
    const removed = [],
      updated = [];
    for (const entry of selected.values()) {
      if (!entry) continue;
      const { item, qty } = entry,
        def = ITEMS.find((d) => d.id === item.defId);
      if (!def) {
        skipped++;
        continue;
      }
      gold += Number(item.sellPrice ?? def.sellBase) * qty;
      units += qty;
      sold++;
      if (qty === item.qty) {
        this.account.bag.splice(this.account.bag.indexOf(item), 1);
        removed.push(item.uid);
      } else {
        item.qty -= qty;
        updated.push(item);
      }
    }
    this.character.wallet.gold = Number(this.character.wallet.gold) + gold;
    this.recalculate();
    return {
      result: { sold, units, gold, skipped },
      delta: { removed, updated },
    };
  }
  automation(value) {
    const order = value.skillOrder ?? [];
    if (
      order.length > this.skills.length ||
      new Set(order).size !== order.length ||
      order.some((id) => !this.skills.some((s) => s.id === id))
    )
      throw Error("local.invalid_skill");
    // Other automation systems are not implemented; do not claim to enable them.
    this.character.automation.skillOrder = [...order];
    this.character.automation.skillOrderStrict = !!value.skillOrderStrict;
    this.account.classAutomation ??= {};
    this.account.classAutomation[
      this.character.identity?.classId ?? "guerreiro"
    ] = [...order];
    return this.character.automation;
  }
  potion(kind, tier) {
    const result = consumePotion(
      this.account,
      kind,
      tier,
      this.now(),
      this.nextPotion ?? 0,
    );
    this.nextPotion = this.now() + 1500;
    return result;
  }
  configurePotion(kind, tier, automatic, threshold) {
    return configurePotion(this.account, kind, tier, automatic, threshold);
  }
  selectPotion(kind, tier) {
    return selectPotion(this.account, kind, tier);
  }
  autoPotion() {
    const result = automaticPotion(
      this.account,
      this.now(),
      this.nextPotion ?? 0,
    );
    if (result) this.nextPotion = this.now() + 1500;
    return result;
  }
  buyPotion(kind, tier, qty) {
    return buyPotionStock(this.account, kind, tier, qty);
  }
}
