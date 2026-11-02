import {
  GUNSLINGER_CLASS,
  GUNSLINGER_SKIN,
  GUNSLINGER_SKILLS,
} from "./gunslinger.mjs";
import { gunslingerFxState } from "./gunslinger-combat.mjs";
import { ARCHER_CLASS, ARCHER_SKIN } from "./archer.mjs";
import { archerFxState } from "./archer-combat.mjs";
import { POTION_TIERS, potionState } from "./potions.mjs";
import { classVisuals } from "./class-visuals.mjs";
import { combatMode, setCombatMode, stepEvade } from "./combat-control.mjs";
import { MONSTER_ROLES, combatState } from "./monster-combat.mjs";
import { LIGHT_AVATAR } from "./light-avatar.mjs";
import { withUltimateState } from "./ultimate-wire.mjs";
import { WebSocketServer } from "ws";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { Protocol } from "./protocol.mjs";
import { LocalFarm, AREAS, ITEMS, ALL_SKILLS as SKILLS } from "./farm.mjs";
import {
  equipmentIdentity,
  equipmentSkin,
  TRAINING_ARMOR_LOOK,
} from "./equipment-look.mjs";
import { WARRIOR_SKIN } from "./warrior.mjs";
import { ROYAL_HUNT_MAP_ID } from "./royal-hunt.mjs";
export function attachLocalGame(
  server,
  {
    build,
    map,
    cityMap = map,
    cityMapId = "praca-local",
    cityName = "Praça local",
    root,
    status,
  },
) {
  const protocol = new Protocol(build),
    connections = new Set(),
    tokens = new Map();
  const directory =
    process.env.LOCAL_DATA_DIR ?? path.join(root, ".local-runtime");
  mkdirSync(directory, { recursive: true });
  const accountFile = path.join(directory, "account.json");
  const empty = (name, depth = 0) => {
    const result = {};
    if (depth > 5) return result;
    for (const f of protocol.schema(name).fields) {
      if (f.oneof) continue;
      if (f.map) result[f.name] = {};
      else if (f.repeated) result[f.name] = [];
      else if (f.type === 11) result[f.name] = empty(f.typeName, depth + 1);
      else
        result[f.name] =
          f.type === 9
            ? ""
            : f.type === 8
              ? false
              : f.type === 12
                ? Buffer.alloc(0)
                : 0;
    }
    return result;
  };
  const catalog = empty("ContentCatalog");
  catalog.version = "local-classes-31";
  Object.assign(catalog.rules, {
    maxLevel: 300,
    awakenLevel: 50,
    bagCapacity: 100,
    warehouseCapacity: 100,
    shadowTeamMax: 3,
    shadowArmyMax: 100,
    citySceneId: "cidade-local",
  });
  catalog.classes = [
    {
      id: "guerreiro",
      name: "Guerreiro",
      icon: "ataque_24",
      range: 65,
      hpBase: 250,
      manaBase: 100,
      attacksPerSecond: 1,
      initialStats: [],
    },
  ];
  catalog.classes.push({
    id: ARCHER_CLASS,
    name: "Arqueira Elfa",
    icon: "agilidade",
    range: 320,
    hpBase: 220,
    manaBase: 120,
    attacksPerSecond: 1,
    initialStats: [],
  });
  catalog.classes.push({
    id: GUNSLINGER_CLASS,
    name: "Pistoleira Dark Elf",
    icon: "agilidade",
    range: 300,
    hpBase: 230,
    manaBase: 110,
    attacksPerSecond: 1,
    initialStats: [],
  });
  catalog.skins = [
    {
      id: WARRIOR_SKIN,
      name: "Guerreiro Humano — Coroa",
      gender: 1,
      classId: "guerreiro",
      kit: [],
    },
    {
      id: "local-sombra",
      name: "Sombra de teste local",
      gender: 1,
      classId: "guerreiro",
      kit: [],
    },
    {
      id: "guerreiro-m",
      name: "Guerreiro",
      gender: 1,
      classId: "guerreiro",
      kit: [],
    },
    {
      id: "guerreiro-f",
      name: "Guerreira",
      gender: 2,
      classId: "guerreiro",
      kit: [],
    },
  ];
  catalog.skins.push({
    id: ARCHER_SKIN,
    name: "Arqueira Elfa",
    gender: 2,
    classId: ARCHER_CLASS,
    forSale: false,
    kit: [],
  });
  catalog.skins.push({
    id: TRAINING_ARMOR_LOOK,
    name: "Guerreiro Humano — peitoral de treino",
    gender: 1,
    classId: "guerreiro",
    forSale: false,
    kit: [],
  });
  catalog.skins.push({
    id: GUNSLINGER_SKIN,
    name: "Pistoleira Dark Elf",
    gender: 2,
    classId: GUNSLINGER_CLASS,
    forSale: false,
    kit: [],
  });
  catalog.scenes = [
    {
      id: "cidade-local",
      name: cityName,
      kind: 1,
      map: {
        source: { case: "atlasMapId", value: cityMapId },
        scale: 1,
        viewScale: 1,
      },
    },
  ];
  catalog.items = ITEMS;
  catalog.skills = SKILLS.map((skill) => ({
    ...skill,
    classId: skill.universal
      ? "universal"
      : GUNSLINGER_SKILLS.some((s) => s.id === skill.id)
        ? GUNSLINGER_CLASS
        : [
              "tiro-perfurante",
              "chuva-de-flechas",
              "olhos-da-floresta",
              "espirito-da-floresta",
            ].includes(skill.id)
          ? ARCHER_CLASS
          : "guerreiro",
    kind: skill.kind ?? (skill.radius ? "area" : "damage"),
    source: "physical",
    description:
      skill.description ?? "Habilidade local de teste. Valores provisórios.",
  }));
  catalog.consumables = [1, 2].flatMap((kind) =>
    POTION_TIERS.map((t) => ({
      kind,
      tier: t.tier,
      name: `Poção de ${kind === 1 ? "HP" : "Mana"} ${t.name}`,
      icon: kind === 1 ? "pocao-vida" : "pocao-mana",
      pct: t.pct,
      price: t.price,
      basePrice: t.price,
      minLevel: t.minLevel,
    })),
  );
  catalog.gates = AREAS.map((a) => ({
    id: a.id,
    sceneId: a.id,
    name: a.name,
    minLevel: a.required,
    icon: "p-cacadas",
  }));
  catalog.difficulties = [
    {
      id: "normal",
      name: "Normal — teste local",
      reqLevel: 1,
      statusMult: 1,
      rewardMult: 1,
      dropMult: 1,
      rarityCap: "comum",
      levelOffset: 0,
    },
  ];
  catalog.monsters = AREAS.flatMap((a) =>
    MONSTER_ROLES.map((role, index) => ({
      id: a.id + "-mob" + (index ? "-" + role.id : ""),
      name: role.name,
      category: "normal",
      role: role.role,
      spriteDir: "local-treino",
      displayHeight: role.displayHeight,
      artHeight: 64,
      tint: role.tint,
      stats: {
        level: a.required,
        fixedHp: a.hp,
        fixedDamage: a.damage,
        speed: 70,
        attackInterval: 1.4,
        range: role.role === "melee" ? 55 : 250,
      },
      drops: [{ itemId: "fragmento-local", chance: 1, min: 1, max: 1 }],
    })),
  );
  catalog.tiers = AREAS.map((a) => ({
    min: a.tier,
    max: a.max,
    gateId: a.id,
    monsterId: a.id + "-mob",
    layers: [],
    areas: [
      { difficulty: "normal", level: a.required, requiredLevel: a.required },
    ],
  }));
  catalog.scenes.push(
    ...AREAS.map((a) => ({
      id: a.id,
      kind: 2,
      name: a.name,
      map: {
        source: { case: "atlasMapId", value: ROYAL_HUNT_MAP_ID },
        scale: 1,
        viewScale: 1,
      },
    })),
  );
  catalog.appearance.skinTones = ["clara", "media", "escura"];
  catalog.rarities = [
    { id: "comum", name: "Comum", color: "#655d51", order: 0, statMult: 1 },
  ];
  const character = empty("CharacterState");
  character.accountId = 1;
  Object.assign(character.identity, {
    name: "Teste Local",
    gender: 1,
    classId: "guerreiro",
    skinId: WARRIOR_SKIN,
    ownedSkins: [WARRIOR_SKIN],
    ownedHairStyles: ["curto"],
    appearance: {
      hairStyle: "curto",
      hairColor: 0,
      eyeStyle: "normal",
      eyeColor: 0,
      skinTone: "media",
    },
  });
  Object.assign(character.progress, {
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: 250,
    mana: 100,
    levelCap: 300,
  });
  Object.assign(character.derived, {
    atk: 15,
    atkMag: 10,
    maxHp: 250,
    maxMana: 100,
    moveSpeed: 160,
    attackRange: 65,
    attackCooldown: 1,
    critMult: 1.5,
    power: 30,
    cooldownMult: 1,
    damageCooldownMult: 1,
  });
  Object.assign(character.wallet, { gold: 1000, diamonds: 0 });
  Object.assign(character.inventory, {
    bagCapacity: 100,
    warehouseCapacity: 100,
  });
  Object.assign(character.multipliers, {
    xp: 1,
    gold: 1,
    drop: 1,
    capture: 1,
    xpCap: 1,
  });
  Object.assign(character.economy, {
    stoneIndex: 1,
    goldIndex: 1,
    dustIndex: 1,
  });
  character.createdAtMs = Date.now();
  let account;
  if (existsSync(accountFile))
    account = JSON.parse(readFileSync(accountFile, "utf8"));
  else {
    const salt = randomBytes(16).toString("hex");
    account = {
      username: "teste",
      salt,
      passwordHash: scryptSync("Teste123!", salt, 64).toString("hex"),
      character,
    };
    writeFileSync(accountFile, JSON.stringify(account));
  }
  if (!account.character.hunt.lastDeath?.diedAtMs)
    delete account.character.hunt.lastDeath;
  const farm = new LocalFarm(account);
  // Appearance migration only. Equipment, items, currency and progress stay intact.
  const identity = account.character.identity;
  if (identity.classId === "guerreiro") {
    if (["", "local-sombra", "guerreiro-m"].includes(identity.skinId))
      identity.skinId = WARRIOR_SKIN;
    identity.ownedSkins = [
      ...new Set([...(identity.ownedSkins ?? []), WARRIOR_SKIN]),
    ];
  }
  const persist = () => {
    writeFileSync(accountFile + ".tmp", JSON.stringify(account));
    renameSync(accountFile + ".tmp", accountFile);
  };
  status.mode = "local-compatible-farm";
  status.localBackend = true;
  status.protocolMessages = protocol.messages.size;
  status.commands = {};
  status.authenticated = 0;
  // Read-only empty states let the original HUD query its badges without
  // inventing events, guilds, trades, rewards or successful write operations.
  const readResponses = {
    mailRequest: { list: "page" },
    walletRequest: { config: "config", state: "state" },
    marketRequest: { config: "config", overview: "overview" },
    poolRequest: { get: "state" },
    tradeRequest: { getState: "idle" },
    guildRequest: { get: "info", config: "config", invites: "invites" },
    socialRequest: {
      chatHistory: "chatHistory",
      friendList: "friendList",
      dmThreads: "dmThreads",
      dailyStatus: "dailyStatus",
      topidleStatus: "topidleStatus",
      halloweenStatus: "halloweenStatus",
      messengerStatus: "messengerStatus",
    },
    commerceRequest: {
      methods: "methods",
      referral: "referral",
      partner: "partner",
      affiliateStatus: "affiliateStatus",
      packages: "packages",
    },
    gvgRequest: { get: "panel" },
    newsRequest: { list: "list" },
    housingRequest: { overview: "overview" },
    guildBossRequest: { state: "state", banners: "banners" },
    dungeonBreakRequest: { state: "state" },
    teamWarRequest: { state: "state", here: "state" },
    tournamentRequest: { state: "state" },
    battlePassRequest: { state: "state" },
  };
  const readState = (client, kind, value, id) => {
    const operation = value.op?.case;
    const responseCase = readResponses[kind]?.[operation];
    if (!responseCase) return false;
    const responseKind = kind.replace(/Request$/, "Response");
    const descriptor = protocol
      .schema("ServerMessage")
      .fields.find((field) => field.name === responseKind);
    const schema = protocol.schema(descriptor.typeName),
      field = schema.fields.find((field) => field.name === responseCase);
    if (!field) return false;
    const result = field.type === 11 ? {} : field.type === 8 ? true : 0;
    send(
      client,
      responseKind,
      { [field.oneof]: { case: responseCase, value: result } },
      id,
    );
    return true;
  };
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
    verifyClient: ({ origin }) =>
      !origin ||
      [
        `http://127.0.0.1:${server.address().port}`,
        `http://localhost:${server.address().port}`,
      ].includes(origin),
  });
  let tick = 0;
  const spawn = { x: cityMap.spawn.x * 32 + 16, y: cityMap.spawn.y * 32 + 16 };
  const free = (x, y, layout = map) => {
    for (const dx of [-8, 8])
      for (const dy of [-8, 8]) {
        const c = Math.floor((x + dx) / 32),
          r = Math.floor((y + dy) / 32);
        if (
          c < 0 ||
          r < 0 ||
          c >= 60 ||
          r >= 48 ||
          layout.collisions[r * 60 + c]
        )
          return false;
      }
    return true;
  };
  const gridBits = (layout) => {
    const bytes = Buffer.alloc(360);
    layout.collisions.forEach((value, index) => {
      if (value) bytes[index >> 3] |= 1 << (index & 7);
    });
    return bytes;
  };
  const blockedBits = gridBits(cityMap),
    huntBlockedBits = gridBits(map);
  const route = (from, to, layout = map) => {
    // Open courtyards should be crossed directly, not one orthogonal tile at
    // a time. Sample the body corridor before skipping the grid path.
    const count = Math.max(
      1,
      Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 8),
    );
    let clear = true;
    for (let i = 0; i <= count; i++)
      if (
        !free(
          from.x + ((to.x - from.x) * i) / count,
          from.y + ((to.y - from.y) * i) / count,
          layout,
        )
      ) {
        clear = false;
        break;
      }
    if (clear) return [to];

    const origin = Math.floor(from.y / 32) * 60 + Math.floor(from.x / 32),
      target = Math.floor(to.y / 32) * 60 + Math.floor(to.x / 32),
      queue = [origin],
      prev = new Map([[origin, -1]]);
    for (let index = 0; index < queue.length && !prev.has(target); index++)
      for (const delta of [-1, 1, -60, 60]) {
        const next = queue[index] + delta;
        if (
          next < 0 ||
          next >= 2880 ||
          Math.abs((next % 60) - (queue[index] % 60)) > 1 ||
          layout.collisions[next] ||
          prev.has(next)
        )
          continue;
        prev.set(next, queue[index]);
        queue.push(next);
      }
    if (!prev.has(target)) return [];
    const result = [to];
    for (let cell = target; cell !== origin; cell = prev.get(cell))
      result.unshift({
        x: (cell % 60) * 32 + 16,
        y: Math.floor(cell / 60) * 32 + 16,
      });
    return result;
  };
  const cityNpcs = [
    {
      entity: 201,
      npcId: "mercador-local",
      name: "Mercador",
      skinId: "local-sombra",
      pos: { x: 8480, y: 7200 },
      facing: 2,
      service: 2,
    },
    {
      entity: 202,
      npcId: "armazem-local",
      name: "Armazém",
      skinId: "local-sombra",
      pos: { x: 10400, y: 7200 },
      facing: 1,
      service: 5,
    },
    {
      entity: 203,
      npcId: "guia-local",
      name: "Guia de caçadas",
      skinId: "local-sombra",
      pos: { x: 9440, y: 6240 },
      facing: 0,
      service: 4,
    },
  ];
  const requireService = (client, service) => {
    if (client.hunt) throw Error("local.city_only");
    const npc = cityNpcs.find(
      (n) =>
        n.service === service &&
        Math.hypot(n.pos.x / 10 - client.x, n.pos.y / 10 - client.y) <= 128,
    );
    if (!npc) throw Error("local.npc_range");
    return npc;
  };
  const scene = {
    sceneId: "cidade-local",
    npcs: cityNpcs,
    instanceId: 1,
    yourEntity: 1,
    map: {
      source: { case: "atlasMapId", value: cityMapId },
      scale: 1,
      viewScale: 1,
    },
    worldWidth: 19200,
    worldHeight: 15360,
    spawn: { x: spawn.x * 10, y: spawn.y * 10 },
    channel: 1,
    kind: 1,
    snapshotHz: 10,
    tickHz: 20,
    moveSpeed: 160,
    walk: {
      bodyRadius: 8,
      grid: {
        scale: 1,
        width: 1920,
        height: 1536,
        cols: 60,
        rows: 48,
        blocked: blockedBits,
      },
    },
  };
  const send = (client, kind, value, requestId = 0) => {
    if (client.ws.readyState === 1) {
      let packet = protocol.encode("ServerMessage", {
        requestId,
        body: { case: kind, value },
      });
      if (["characterState", "characterPatch", "worldSnapshot"].includes(kind))
        packet = withUltimateState(packet, {
          ...farm.avatar.state(client),
          automatic:
            combatMode(account) === "auto" &&
            (account.character.automation.skillOrder ?? []).includes(
              farm.ultimateDefinition.id,
            ),
          ...combatState(account, client, Date.now()),
          activeBuffs: farm.activeBuffs(),
          archerFx: archerFxState(client, Date.now()),
          gunslingerFx: gunslingerFxState(client, Date.now()),
          classId: account.character.identity.classId,
          classVisuals: classVisuals(account.character.identity.classId),
          className:
            account.character.identity.classId === GUNSLINGER_CLASS
              ? "Pistoleira Dark Elf"
              : account.character.identity.classId === ARCHER_CLASS
                ? "Arqueira Elfa"
                : "Guerreiro Humano",
          ...potionState(account, Date.now(), farm.nextPotion ?? 0),
          level: account.character.progress.level,
          hp: account.character.progress.hp,
          maxHp: account.character.derived.maxHp,
          mana: account.character.progress.mana,
          maxMana: account.character.derived.maxMana,
        });
      client.ws.send(packet);
    }
  };
  const actor = (client) => ({
    id: 1,
    kind: 1,
    x: Math.round(client.x * 10),
    y: Math.round(client.y * 10),
    facing: client.facing,
    anim: client.hunt?.deadAt
      ? 5
      : client.combatAnimUntil > Date.now()
        ? 2
        : client.moving
          ? 1
          : 0,
    hp: account.character.progress.hp,
    maxHp: account.character.derived.maxHp,
    mana: account.character.progress.mana,
    maxMana: account.character.derived.maxMana,
    target: client.hunt?.target ?? 0,
  });
  const selfInfo = (client) => ({
    state: actor(client),
    name: account.character.identity.name,
    level: account.character.progress.level,
    skinId: equipmentSkin(account.character),
    classId: account.character.identity.classId,
    scale: 1,
    appearance: account.character.identity.appearance,
  });
  const refreshSelf = (client) => {
    send(client, "entitySpawn", { tick, entities: [selfInfo(client)] });
    client.displayedLevel = account.character.progress.level;
    client.displayedSkin = equipmentSkin(account.character);
  };
  const patch = (client) => {
    const c = account.character;
    if (
      client.displayedLevel !== c.progress.level ||
      client.displayedSkin !== equipmentSkin(c)
    )
      refreshSelf(client);
    send(client, "characterPatch", {
      identity: equipmentIdentity(c),
      progress: c.progress,
      wallet: c.wallet,
      derived: c.derived,
      equipment: c.equipment,
      consumables: c.consumables,
      automation: c.automation,
      inventory: c.inventory,
      hunt: c.hunt,
    });
  };
  const delta = (client, value, reason = 1) => {
    if (
      !(value.added?.length || value.updated?.length || value.removed?.length)
    )
      return;
    send(client, "inventoryDelta", {
      scope: value.scope ?? 1,
      ...value,
      usedSlots:
        value.scope === 3 ? account.warehouse.length : account.bag.length,
      capacity: 100,
      reason,
    });
  };
  const monsterState = (m) => ({
    id: m.id,
    kind: 2,
    x: Math.round(m.x * 10),
    y: Math.round(m.y * 10),
    facing: m.facing,
    anim: m.anim,
    hp: m.hp,
    maxHp: m.maxHp,
    target: m.hp ? 1 : 0,
  });
  const monsterInfo = (client, m) => ({
    state: monsterState(m),
    defId:
      client.hunt.area.id +
      "-mob" +
      (m.roleIndex ? "-" + MONSTER_ROLES[m.roleIndex].id : ""),
    name: MONSTER_ROLES[m.roleIndex ?? 0].name,
    level: client.hunt.area.required,
    scale: 1,
  });
  const enterScene = (client) => {
    client.moving = false;
    client.route = [];
    client.target = null;
    client.until = 0;
    const hunt = client.hunt;
    if (!hunt) {
      client.x = spawn.x;
      client.y = spawn.y;
    }
    const localScene = {
      ...scene,
      sceneId: hunt ? hunt.area.id : scene.sceneId,
      instanceId: hunt ? 2 : 1,
      kind: hunt ? 2 : 1,
      npcs: hunt ? [] : cityNpcs,
      spawn: { x: Math.round(client.x * 10), y: Math.round(client.y * 10) },
      map: hunt
        ? {
            source: { case: "atlasMapId", value: ROYAL_HUNT_MAP_ID },
            scale: 1,
            viewScale: 1,
          }
        : scene.map,
      walk: hunt
        ? {
            ...scene.walk,
            grid: { ...scene.walk.grid, blocked: huntBlockedBits },
          }
        : scene.walk,
    };
    if (hunt)
      localScene.hunt = {
        gateId: hunt.area.id,
        tierMin: hunt.area.tier,
        difficulty: "normal",
      };
    send(client, "sceneEnter", localScene);
    send(client, "entitySpawn", {
      tick,
      entities: [
        selfInfo(client),
        ...(hunt ? hunt.monsters.map((m) => monsterInfo(client, m)) : []),
      ],
    });
    client.displayedLevel = account.character.progress.level;
    client.displayedSkin = equipmentSkin(account.character);
    if (hunt) send(client, "huntSession", hunt.session);
    const ultimateRemaining = farm.avatar.saved.readyAt - Date.now();
    if (ultimateRemaining > 0)
      send(client, "worldEvents", {
        tick,
        cooldowns: [
          {
            skillId: farm.ultimateDefinition.id,
            readyInMs: ultimateRemaining,
            totalMs: farm.ultimateDefinition.cooldownMs,
          },
        ],
      });
  };
  const returnCity = (client) => {
    const removed = farm.stop(client);
    if (removed.buffs.length) send(client, "worldEvents", { tick, ...removed });
    account.character.progress.hp = account.character.derived.maxHp;
    account.character.progress.mana = account.character.derived.maxMana;
    send(client, "deathState", { dead: false });
    enterScene(client);
    patch(client);
    persist();
  };
  const auth = (client, requestId) => {
    // One authoritative local character: a second tab cannot double rewards.
    for (const other of connections)
      if (other !== client && other.auth) {
        other.auth = false;
        farm.stop(other);
        other.ws.close(1000, "Conta local aberta em outra janela");
      }
    if (client.hunt) farm.stop(client);
    const token = randomBytes(32).toString("hex");
    tokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
    client.auth = true;
    account.character.progress.hp = account.character.derived.maxHp;
    account.character.progress.mana = account.character.derived.maxMana;
    send(
      client,
      "authOk",
      {
        token,
        accountId: 1,
        username: account.username,
        role: 1,
        serverTimeMs: Date.now(),
        hasEmail: false,
        emailService: false,
      },
      requestId,
    );
    send(client, "contentCatalog", catalog);
    send(client, "characterState", {
      ...account.character,
      identity: equipmentIdentity(account.character),
    });
    enterScene(client);
    status.authenticated++;
  };
  wss.on("connection", (ws, request) => {
    status.websocketAttempts++;
    const client = {
      ws,
      auth: false,
      x: spawn.x,
      y: spawn.y,
      facing: 0,
      moving: false,
      dx: 0,
      dy: 0,
      target: null,
      route: [],
      seq: 0,
      ackSeq: 0,
      until: 0,
      frames: 0,
      window: Date.now(),
    };
    connections.add(client);
    ws.on("message", (bytes) => {
      try {
        const now = Date.now();
        if (now - client.window > 1000) {
          client.frames = 0;
          client.window = now;
        }
        if (++client.frames > 100) {
          ws.close(1008, "Too many commands");
          return;
        }
        const message = protocol.decode("ClientMessage", bytes),
          kind = message.body?.case,
          value = message.body?.value ?? {};
        if (!kind) return;
        status.commands[kind] = (status.commands[kind] ?? 0) + 1;
        if (kind === "ping") {
          send(
            client,
            "pong",
            {
              clientTimeMs: value.clientTimeMs,
              serverTimeMs: now,
              online: [...connections].filter((c) => c.auth).length,
            },
            message.requestId,
          );
          return;
        }
        if (kind === "login") {
          if (client.lastLogin && now - client.lastLogin < 1000) {
            send(
              client,
              "error",
              { code: "local.not_implemented" },
              message.requestId,
            );
            return;
          }
          client.lastLogin = now;
          const input = scryptSync(
            String(value.password).slice(0, 100),
            account.salt,
            64,
          );
          if (
            value.username !== account.username ||
            !timingSafeEqual(input, Buffer.from(account.passwordHash, "hex"))
          ) {
            send(
              client,
              "error",
              { code: "auth.invalid_credentials" },
              message.requestId,
            );
            return;
          }
          auth(client, message.requestId);
          return;
        }
        if (kind === "resume") {
          if ((tokens.get(value.token) ?? 0) < Date.now()) {
            send(
              client,
              "error",
              { code: "session.expired" },
              message.requestId,
            );
            return;
          }
          auth(client, message.requestId);
          return;
        }
        if (!client.auth) {
          send(client, "error", { code: "session.expired" }, message.requestId);
          return;
        }
        if (kind === "logout") {
          farm.stop(client);
          persist();
          client.auth = false;
          send(client, "logoutOk", {}, message.requestId);
          return;
        }
        if (kind === "roll") {
          try {
            const output = farm.dash(client, value, undefined, {
              free: (x, y) => free(x, y, client.hunt ? map : cityMap),
            });
            send(client, "worldEvents", { tick, ...output.events });
          } catch (error) {
            if (!error.message?.startsWith("local.")) throw error;
            send(client, "error", { code: error.message }, message.requestId);
          }
          return;
        }
        if (kind === "moveDir") {
          if (client.hunt && combatMode(account) === "auto") return;
          if (client.hunt && (value.dirX || value.dirY)) {
            client.hunt.attackOrder = 0;
            client.hunt.manualTarget = 0;
          }
          client.dx = Math.max(-1, Math.min(1, value.dirX / 1000));
          client.dy = Math.max(-1, Math.min(1, value.dirY / 1000));
          client.until = now + 350;
          client.target = null;
          client.route = [];
          client.seq = value.seq;
          return;
        }
        if (kind === "moveTo") {
          if (client.hunt && combatMode(account) === "auto") return;
          if (free(value.x / 10, value.y / 10, client.hunt ? map : cityMap)) {
            if (client.hunt) {
              client.hunt.attackOrder = 0;
              client.hunt.manualTarget = 0;
            }
            client.route = route(
              client,
              { x: value.x / 10, y: value.y / 10 },
              client.hunt ? map : cityMap,
            );
            client.target = client.route.shift() ?? null;
          }
          return;
        }
        if (
          [
            "startHunt",
            "leaveHunt",
            "setTarget",
            "useSkill",
            "inventoryPage",
            "equip",
            "unequip",
            "setAutomation",
            "useConsumable",
            "buyConsumable",
            "dismissDeathReport",
            "resetHuntStats",
            "interact",
            "equipBestPreview",
            "equipBestApply",
            "sellItems",
            "lockItem",
            "warehouseMove",
          ].includes(kind)
        ) {
          try {
            if (kind === "interact") {
              if (client.hunt) throw Error("local.city_only");
              const candidates = cityNpcs
                .filter(
                  (n) =>
                    (!value.entity || n.entity === value.entity) &&
                    Math.hypot(
                      n.pos.x / 10 - client.x,
                      n.pos.y / 10 - client.y,
                    ) <= 128,
                )
                .sort(
                  (a, b) =>
                    Math.hypot(
                      a.pos.x / 10 - client.x,
                      a.pos.y / 10 - client.y,
                    ) -
                    Math.hypot(
                      b.pos.x / 10 - client.x,
                      b.pos.y / 10 - client.y,
                    ),
                );
              if (!candidates.length) throw Error("local.npc_range");
              const npc = candidates[0];
              send(
                client,
                "npcInteraction",
                { entity: npc.entity, npcId: npc.npcId, service: npc.service },
                message.requestId,
              );
            } else if (
              kind === "equipBestPreview" ||
              kind === "equipBestApply"
            ) {
              if (client.hunt) throw Error("local.city_only");
              const apply = kind === "equipBestApply",
                output = farm.bestEquipment(value.criterion, apply);
              send(
                client,
                kind + "Result",
                apply ? output.result : output,
                message.requestId,
              );
              if (apply) {
                delta(client, output.delta, 6);
                patch(client);
                persist();
              }
            } else if (kind === "sellItems") {
              requireService(client, 2);
              const output = farm.sell(value.selection, value.confirmRare);
              send(client, "sellResult", output.result, message.requestId);
              delta(client, output.delta, 3);
              patch(client);
              persist();
            } else if (kind === "lockItem") {
              const output = farm.lock(value.uid, value.locked);
              send(client, "lockItemResult", output.result, message.requestId);
              delta(client, { ...output.delta, scope: output.scope }, 10);
              patch(client);
              persist();
            } else if (kind === "warehouseMove") {
              requireService(client, 5);
              const output = farm.warehouseMove(value.uids, value.direction);
              send(
                client,
                "warehouseMoveResult",
                output.result,
                message.requestId,
              );
              for (const d of output.deltas) delta(client, d, 9);
              patch(client);
              persist();
            } else if (kind === "startHunt") {
              const hunt = farm.start(client, value);
              send(
                client,
                "startHuntResult",
                {
                  gateId: hunt.area.id,
                  tierMin: hunt.area.tier,
                  difficulty: "normal",
                  sceneId: hunt.area.id,
                },
                message.requestId,
              );
              enterScene(client);
              patch(client);
              persist();
            } else if (kind === "leaveHunt") {
              returnCity(client);
              send(
                client,
                "leaveHuntResult",
                { sceneId: "cidade-local" },
                message.requestId,
              );
            } else if (kind === "setTarget") farm.target(client, value.entity);
            else if (kind === "useSkill") {
              const change = /^classe:(guerreiro|arqueira|pistoleira)$/.exec(
                value.skillId,
              );
              if (change) {
                farm.changeClass(client, change[1]);
                patch(client);
                persist();
                return;
              }

              const potionSelect = /^potion-select:([12]):([123])$/.exec(
                value.skillId,
              );
              if (potionSelect) {
                farm.selectPotion(
                  Number(potionSelect[1]),
                  Number(potionSelect[2]),
                );
                patch(client);
                persist();
                return;
              }
              const potionConfig =
                /^potion-config:([12]):([123]):(manual|auto):(30|50|70)$/.exec(
                  value.skillId,
                );
              if (potionConfig) {
                farm.configurePotion(
                  Number(potionConfig[1]),
                  Number(potionConfig[2]),
                  potionConfig[3] === "auto",
                  Number(potionConfig[4]),
                );
                patch(client);
                persist();
                return;
              }

              if (value.skillId === "ataque-direito") {
                farm.orderAttack(client, value.target);
                patch(client);
                return;
              }
              if (["modo-manual", "modo-auto"].includes(value.skillId)) {
                setCombatMode(
                  account,
                  client,
                  value.skillId === "modo-manual" ? "manual" : "auto",
                );
                patch(client);
                persist();
                return;
              }
              const output = farm.cast(
                client,
                value.skillId,
                value.target || client.hunt?.target,
                undefined,
                undefined,
                { free },
              );
              send(client, "worldEvents", { tick, ...output.events });
              for (const d of output.deltas) delta(client, d);
              patch(client);
              persist();
            } else if (kind === "inventoryPage")
              send(
                client,
                "inventoryPage",
                farm.inventory(value),
                message.requestId,
              );
            else if (kind === "equip" || kind === "unequip") {
              if (client.hunt) throw Error("local.city_only");
              const output =
                kind === "equip"
                  ? farm.equip(value.uid)
                  : farm.unequip(value.slot);
              send(client, kind + "Result", output.result, message.requestId);
              delta(client, output.delta, 6);
              patch(client);
              persist();
            } else if (kind === "setAutomation") {
              send(
                client,
                "setAutomationResult",
                { automation: farm.automation(value.automation ?? {}) },
                message.requestId,
              );
              patch(client);
              persist();
            } else if (kind === "useConsumable") {
              send(
                client,
                "useConsumableResult",
                farm.potion(value.kind, value.tier),
                message.requestId,
              );
              patch(client);
              persist();
            } else if (kind === "buyConsumable") {
              if (client.hunt) throw Error("local.city_only");
              send(
                client,
                "buyConsumableResult",
                farm.buyPotion(value.kind, value.tier, value.qty),
                message.requestId,
              );
              patch(client);
              persist();
            } else if (kind === "dismissDeathReport") {
              delete account.character.hunt.lastDeath;
              send(client, "dismissDeathReportResult", {}, message.requestId);
              patch(client);
              persist();
            } else if (kind === "resetHuntStats") {
              if (!client.hunt) throw Error("local.not_hunting");
              // Session counters also determine scheduled drops; cannot reset them mid-hunt.
              throw Error("local.not_implemented");
            }
          } catch (error) {
            send(
              client,
              "error",
              {
                code: error.message.startsWith("local.")
                  ? error.message
                  : "local.not_implemented",
              },
              message.requestId,
            );
          }
          return;
        }
        if (kind === "channelList") {
          send(
            client,
            "channelListResult",
            { channels: [{ id: 1, online: 1 }], current: 1 },
            message.requestId,
          );
          return;
        }
        if (readState(client, kind, value, message.requestId)) return;
        if (message.requestId)
          send(
            client,
            "error",
            { code: "local.not_implemented" },
            message.requestId,
          );
      } catch (error) {
        console.error("Local protocol:", error.message);
        ws.close(1003, "Invalid message");
      }
    });
    ws.on("close", () => {
      if (client.auth) {
        farm.stop(client);
        persist();
      }
      connections.delete(client);
    });
    ws.on("error", () => connections.delete(client));
  });
  persist();
  const timer = setInterval(() => {
    tick++;
    const now = Date.now();
    for (const client of connections) {
      if (!client.auth) continue;
      client.classId = account.character.identity.classId;
      if (client.hunt && !client.hunt.deadAt && farm.autoPotion()) {
        patch(client);
        persist();
      }
      if (client.hunt) {
        const output = farm.step(client, { free, route });
        if (output.returnCity) {
          returnCity(client);
          continue;
        }
        if (output.spawned.length) {
          send(client, "entityDespawn", {
            tick,
            ids: output.despawned,
          });
          send(client, "entitySpawn", {
            tick,
            entities: output.spawned.map((m) => monsterInfo(client, m)),
          });
        }
        if (Object.values(output.events).some((events) => events.length))
          send(client, "worldEvents", { tick, ...output.events });
        for (const d of output.deltas) delta(client, d);
        if (output.died)
          send(client, "deathState", {
            dead: true,
            diedAtMs: now,
            autoReturnAtMs: now + 3000,
            noHealItems: true,
          });
        if (
          output.deltas.length ||
          output.died ||
          output.events.buffs.length ||
          tick % 20 === 0
        ) {
          patch(client);
          send(client, "huntSession", client.hunt.session);
        }
        if (
          output.deltas.length ||
          output.died ||
          output.events.buffs.length ||
          output.events.casts.some((e) => e.skillId === "avatar-da-luz") ||
          tick % 100 === 0
        )
          persist();
      }
      const evading = stepEvade(client, now, (x, y) =>
        free(x, y, client.hunt ? map : cityMap),
      );
      const canMove =
        (!client.hunt || combatMode(account) === "manual") &&
        !evading &&
        !client.hunt?.attackOrder &&
        !client.hunt?.deadAt &&
        now >= (client.combatAnimUntil ?? 0);
      let dx = 0,
        dy = 0;
      if (canMove && client.target) {
        dx = client.target.x - client.x;
        dy = client.target.y - client.y;
        if (Math.hypot(dx, dy) < 5) {
          client.target = client.route.shift() ?? null;
          dx = 0;
          dy = 0;
        }
      } else if (canMove && client.until > now) {
        dx = client.dx;
        dy = client.dy;
      }
      const len = Math.hypot(dx, dy);
      if (canMove) client.moving = len > 0;
      if (len) {
        const amount = client.target ? Math.min(8, len) : 8;
        const x = client.x + (dx / len) * amount,
          y = client.y + (dy / len) * amount;
        if (free(x, client.y, client.hunt ? map : cityMap)) client.x = x;
        if (free(client.x, y, client.hunt ? map : cityMap)) client.y = y;
        client.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
      }
      if (evading || client.seq !== client.ackSeq) {
        send(client, "moveAck", {
          seq: client.seq,
          x: client.x,
          y: client.y,
          speed: 160,
        });
        client.ackSeq = client.seq;
      }
      status.position = {
        x: Math.round(client.x),
        y: Math.round(client.y),
        facing: client.facing,
      };
      if (tick % 2 === 0)
        send(client, "worldSnapshot", {
          tick,
          serverTimeMs: now,
          entities: [
            actor(client),
            ...(client.hunt
              ? client.hunt.monsters.map(monsterState)
              : cityNpcs.map((n) => ({
                  id: n.entity,
                  kind: 4,
                  x: n.pos.x,
                  y: n.pos.y,
                  facing: n.facing,
                  anim: 0,
                }))),
          ],
          full: true,
        });
    }
  }, 50);
  timer.unref();
  server.on("close", () => {
    clearInterval(timer);
    for (const client of connections) client.ws.close();
    wss.close();
    persist();
  });
  const close = () => {
    clearInterval(timer);
    persist();
    for (const client of connections) client.ws.terminate();
    wss.close();
  };
  return { protocol, catalog, character: account.character, scene, close };
}
