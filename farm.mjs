// Own local gameplay rules. These are test values, not the original server rules.
import { WARRIOR_ACTIONS, WARRIOR_BASIC, WARRIOR_RETURN } from "./warrior.mjs";
export const SKILLS = [
  {
    id: "corte-poderoso",
    name: "Corte Poderoso",
    icon: "/assets/ui/royal-warrior/corte-poderoso.svg",
    key: "1",
    manaCost: 8,
    cooldownMs: 4000,
    range: 75,
    multiplier: 2,
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
    icon: "/assets/ui/v2/inventario.png",
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
  constructor(account, { now = Date.now, random = Math.random } = {}) {
    this.account = account;
    this.now = now;
    this.random = random;
    account.bag ??= [];
    account.warehouse ??= [];
    account.nextUid ??= 1;
    const c = this.character;
    c.equipment.slots ??= [];
    if (!account.farmVersion) {
      c.automation.skillOrder = SKILLS.map((s) => s.id);
      c.consumables.hpPotions = { pequena: 10 };
      c.consumables.manaPotions = { pequena: 10 };
      account.farmVersion = 1;
    }
    c.progress.hp ||= 250;
    c.progress.mana = Math.max(0, c.progress.mana);
    this.recalculate();
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
      atk: 15 + (level - 1) * 2 + sum("atk"),
      def: sum("def"),
      maxHp: 250 + (level - 1) * 20 + sum("hp"),
      maxMana: 100 + (level - 1) * 5,
      attackRange: 65,
      attackCooldown: 1,
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
    client.hunt = null;
    client.combatAnimUntil = 0;
    client.target = null;
    client.route = [];
    client.until = 0;
    client.moving = false;
  }
  target(client, entity) {
    if (
      !client.hunt ||
      !Number.isInteger(entity) ||
      entity < 0 ||
      (entity && !client.hunt.monsters.some((m) => m.id === entity && m.hp > 0))
    )
      throw Error("local.invalid_target");
    client.hunt.manualTarget = entity;
    client.hunt.target = entity;
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
    };
  }
  reward(hunt, monster, events) {
    const c = this.character,
      a = hunt.area;
    c.wallet.gold = Number(c.wallet.gold) + a.gold;
    c.progress.xp = Number(c.progress.xp) + a.xp;
    hunt.session.kills++;
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
    monster.anim = monster.hp ? 4 : 5;
    events.damage.push({ source: 1, target: monster.id, amount, skillId });
    if (!monster.hp) {
      monster.respawnAt = this.now() + monster.respawnDelay;
      events.deaths.push({ entity: monster.id, killer: 1 });
      deltas.push(this.reward(hunt, monster, events));
    }
  }
  cast(client, id, targetId, events = this.events(), deltas = []) {
    const h = client.hunt,
      c = this.character,
      now = this.now();
    const skill = SKILLS.find((s) => s.id === id);
    if (!h || h.deadAt || !c.progress.hp) throw Error("local.not_hunting");
    if (!skill) throw Error("local.invalid_skill");
    if ((h.cooldowns[id] ?? 0) > now || h.nextCast > now || h.actionUntil > now)
      throw Error("local.cooldown");
    if (c.progress.mana < skill.manaCost) throw Error("local.no_mana");
    const target = h.monsters.find((m) => m.id === targetId && m.hp > 0);
    if (
      !target ||
      Math.hypot(target.x - client.x, target.y - client.y) > skill.range
    )
      throw Error("local.invalid_target");
    c.progress.mana -= skill.manaCost;
    h.cooldowns[id] = now + skill.cooldownMs;
    const action = WARRIOR_ACTIONS[id];
    h.nextCast = h.actionUntil = now + action.duration;
    client.combatAnimUntil = h.actionUntil;
    const dx = target.x - client.x,
      dy = target.y - client.y;
    if (Math.hypot(dx, dy) > 0.01)
      client.facing =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
    events.casts.push({
      caster: 1,
      skillId: id,
      target: target.id,
      origin: { x: Math.round(client.x * 10), y: Math.round(client.y * 10) },
      dest: { x: Math.round(target.x * 10), y: Math.round(target.y * 10) },
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
            Math.hypot(m.x - target.x, m.y - target.y) <= skill.radius,
        )
      : [target];
    h.impacts.push({
      at: now + action.impact,
      targets: targets.map((m) => m.id),
      amount: c.derived.atk * skill.multiplier,
      skillId: id,
      heal: skill.heal ?? 0,
      ...(skill.radius
        ? { area: { x: target.x, y: target.y, radius: skill.radius } }
        : {}),
    });
    return { events, deltas };
  }
  step(client, { free = () => true, route = () => [] } = {}) {
    const h = client.hunt,
      c = this.character,
      now = this.now(),
      events = this.events(),
      deltas = [],
      spawned = [],
      despawned = [];
    if (!h) return { events, deltas, spawned, despawned };
    if (h.deadAt)
      return {
        events,
        deltas,
        spawned,
        despawned,
        returnCity: now >= h.deadAt + 3000,
      };
    for (const impact of h.impacts.filter((p) => p.at <= now)) {
      const targets = impact.area
        ? h.monsters
            .filter(
              (m) =>
                m.hp > 0 &&
                Math.hypot(m.x - impact.area.x, m.y - impact.area.y) <=
                  impact.area.radius,
            )
            .map((m) => m.id)
        : impact.targets;
      for (const id of targets) {
        const monster = h.monsters.find((m) => m.id === id && m.hp > 0);
        if (monster)
          this.hit(h, monster, impact.amount, impact.skillId, events, deltas);
      }
      const amount = Math.min(impact.heal, c.derived.maxHp - c.progress.hp);
      if (amount > 0) {
        c.progress.hp += amount;
        events.heals.push({ source: 1, target: 1, amount });
      }
    }
    h.impacts = h.impacts.filter((p) => p.at > now);
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
        });
        spawned.push(m);
      }
    // Keep a committed strike's target until recovery ends; between actions,
    // select the nearest live enemy again rather than locking a distant one.
    const locked = now < h.actionUntil;
    let target = h.monsters.find(
      (m) => m.id === (locked ? h.target : h.manualTarget) && m.hp > 0,
    );
    if (!target)
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
    )
      h.manualTarget = 0;
    h.target = target?.id ?? 0;
    client.moving = false;
    if (target && now >= h.actionUntil) {
      if (
        Math.hypot(target.x - client.x, target.y - client.y) >
        c.derived.attackRange
      ) {
        const way = route(client, target)[0] ?? target;
        client.moving = move(client, way, c.derived.moveSpeed);
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
          try {
            this.cast(client, id, target.id, events, deltas);
            break;
          } catch {
            /* An unavailable skill must not stall basic attacks. */
          }
        }
        if (target.hp > 0 && now >= h.nextAttack && now >= h.actionUntil) {
          h.nextAttack = now + 1000;
          const basic = h.basicChain++ % 2 ? WARRIOR_RETURN : WARRIOR_BASIC;
          h.actionUntil = now + basic.duration;
          client.combatAnimUntil = h.actionUntil;
          const dx = target.x - client.x,
            dy = target.y - client.y;
          const distance = Math.hypot(dx, dy) || 1;
          events.moves.push({
            entity: 1,
            move: basic.move,
            target: target.id,
            dirX: Math.round((dx / distance) * 1000),
            dirY: Math.round((dy / distance) * 1000),
            durationMs: basic.duration,
          });
          h.impacts.push({
            at: now + basic.impact,
            targets: [target.id],
            amount: c.derived.atk,
            skillId: "",
            heal: 0,
          });
        }
      }
    }
    if (!target && now >= h.actionUntil) {
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
      if (!m.hp) continue;
      const distance = Math.hypot(m.x - client.x, m.y - client.y);
      m.anim = 0;
      const fromHome = Math.hypot(m.x - m.home.x, m.y - m.home.y);
      if (distance <= AGGRO_RADIUS) m.aggro = true;
      if (fromHome > LEASH_RADIUS || distance > 300) m.aggro = false;
      if (!m.aggro) {
        if (fromHome > 8 && move(m, m.home, 70)) m.anim = 1;
      } else if (distance > 48) {
        if (move(m, client, 70)) m.anim = 1;
      } else if (distance <= 55 && now >= m.nextAttack) {
        m.nextAttack = now + 1400;
        m.anim = 2;
        const amount = Math.min(
          c.progress.hp,
          Math.max(1, h.area.damage - c.derived.def),
        );
        c.progress.hp -= amount;
        events.damage.push({ source: m.id, target: 1, amount });
        if (c.progress.hp > 0 && now >= h.actionUntil) {
          h.actionUntil = now + 100;
          events.moves.push({
            entity: 1,
            move: "humano-ferido",
            target: m.id,
            dirX: 0,
            dirY: 0,
            durationMs: 100,
          });
        }
        if (!c.progress.hp) {
          h.deadAt = now;
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
      order.length > SKILLS.length ||
      new Set(order).size !== order.length ||
      order.some((id) => !SKILLS.some((s) => s.id === id))
    )
      throw Error("local.invalid_skill");
    // Other automation systems are not implemented; do not claim to enable them.
    this.character.automation.skillOrder = [...order];
    this.character.automation.skillOrderStrict = !!value.skillOrderStrict;
    return this.character.automation;
  }
  potion(kind, tier) {
    if (![1, 2].includes(kind) || tier !== 1) throw Error("local.invalid_item");
    const c = this.character,
      stock = kind === 1 ? c.consumables.hpPotions : c.consumables.manaPotions,
      key = kind === 1 ? "hp" : "mana",
      max = kind === 1 ? c.derived.maxHp : c.derived.maxMana;
    if (
      !c.progress.hp ||
      !stock.pequena ||
      c.progress[key] >= max ||
      this.now() < (this.nextPotion ?? 0)
    )
      throw Error("local.potion_unavailable");
    stock.pequena--;
    c.progress[key] = Math.min(max, c.progress[key] + Math.ceil(max * 0.4));
    this.nextPotion = this.now() + 1500;
    return { kind, tier };
  }
  buyPotion(kind, tier, qty) {
    if (![1, 2].includes(kind) || tier !== 1 || !finiteId(qty) || qty > 1000)
      throw Error("local.invalid_item");
    const c = this.character,
      cost = qty * 10,
      stock = kind === 1 ? c.consumables.hpPotions : c.consumables.manaPotions;
    if (Number(c.wallet.gold) < cost) throw Error("local.no_gold");
    c.wallet.gold = Number(c.wallet.gold) - cost;
    stock.pequena = (stock.pequena ?? 0) + qty;
    return { kind, tier, qty, goldCost: cost, owned: stock.pequena };
  }
}
