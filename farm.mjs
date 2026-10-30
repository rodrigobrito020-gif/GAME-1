// Own local gameplay rules. These are test values, not the original server rules.
export const SKILLS = [
  {
    id: "corte-poderoso",
    name: "Corte Poderoso",
    icon: "/assets/ui/v2/ataque_24.png",
    key: "1",
    manaCost: 8,
    cooldownMs: 4000,
    range: 75,
    multiplier: 2,
  },
  {
    id: "investida",
    name: "Investida",
    icon: "/assets/ui/v2/agilidade.png",
    key: "2",
    manaCost: 12,
    cooldownMs: 7000,
    range: 180,
    multiplier: 1.5,
  },
  {
    id: "golpe-destruidor",
    name: "Golpe Destruidor",
    icon: "/assets/ui/v2/ataque_24.png",
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
    icon: "/assets/ui/v2/agilidade.png",
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
    name: "Arena local — treino",
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
    name: "Arena local — desafio",
    hp: 180,
    damage: 18,
    xp: 44,
    gold: 18,
  },
];
const positions = [
  { x: 848, y: 976 },
  { x: 1040, y: 976 },
  { x: 944, y: 1072 },
];
const finiteId = (value) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;
export class LocalFarm {
  constructor(account, { now = Date.now, random = Math.random } = {}) {
    this.account = account;
    this.now = now;
    this.random = random;
    account.bag ??= [];
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
      monsters: positions.map((p, index) => ({
        ...p,
        home: { ...p },
        id: 100 + index,
        hp: area.hp,
        maxHp: area.hp,
        facing: 0,
        anim: 0,
        nextAttack: now + 1000,
        respawnAt: 0,
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
      monster.respawnAt = this.now() + 3000;
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
    if ((h.cooldowns[id] ?? 0) > now || h.nextCast > now)
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
    h.nextCast = now + 600;
    client.combatAnimUntil = now + 450;
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
    for (const m of targets)
      this.hit(h, m, c.derived.atk * skill.multiplier, id, events, deltas);
    if (skill.heal) {
      const amount = Math.min(skill.heal, c.derived.maxHp - c.progress.hp);
      c.progress.hp += amount;
      if (amount) events.heals.push({ source: 1, target: 1, amount });
    }
    return { events, deltas };
  }
  step(client, { free = () => true, route = () => [] } = {}) {
    const h = client.hunt,
      c = this.character,
      now = this.now(),
      events = this.events(),
      deltas = [],
      spawned = [];
    if (!h) return { events, deltas, spawned };
    if (h.deadAt)
      return { events, deltas, spawned, returnCity: now >= h.deadAt + 3000 };
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
        Object.assign(m, m.home, {
          hp: m.maxHp,
          anim: 0,
          nextAttack: now + 1000,
        });
        spawned.push(m);
      }
    let target = h.monsters.find((m) => m.id === h.target && m.hp > 0);
    target ??= h.monsters
      .filter((m) => m.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - client.x, a.y - client.y) -
          Math.hypot(b.x - client.x, b.y - client.y),
      )[0];
    h.target = target?.id ?? 0;
    client.moving = false;
    if (target) {
      if (
        Math.hypot(target.x - client.x, target.y - client.y) >
        c.derived.attackRange
      ) {
        const way = route(client, target)[0] ?? target;
        client.moving = move(client, way, 160);
      } else {
        client.facing = target.x < client.x ? 1 : 2;
        for (const id of c.automation.skillOrder ?? []) {
          try {
            this.cast(client, id, target.id, events, deltas);
            break;
          } catch {
            /* An unavailable skill must not stall basic attacks. */
          }
        }
        if (target.hp > 0 && now >= h.nextAttack) {
          h.nextAttack = now + 1000;
          client.combatAnimUntil = now + 350;
          this.hit(h, target, c.derived.atk, "", events, deltas);
        }
      }
    }
    for (const m of h.monsters) {
      if (!m.hp) continue;
      const distance = Math.hypot(m.x - client.x, m.y - client.y);
      m.anim = 0;
      if (distance > 48 && distance < 300) {
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
          return { events, deltas, spawned, died: true };
        }
      }
    }
    if (now >= h.nextRegen) {
      h.nextRegen = now + 1000;
      c.progress.mana = Math.min(c.derived.maxMana, c.progress.mana + 3);
    }
    return { events, deltas, spawned };
  }
  inventory(input) {
    if (![0, 1, 2, 3].includes(input.scope ?? 0))
      throw Error("local.invalid_inventory");
    const bag = input.scope === 3 ? [] : this.account.bag;
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
    list = [...list].sort((a, b) =>
      input.sort === 2 ? b.power - a.power : Number(b.uid) - Number(a.uid),
    );
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
    if (!def?.slot || item.level > this.character.progress.level)
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
