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
export function attachLocalGame(server, { build, map, root, status }) {
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
  catalog.version = "local-bootstrap-1";
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
  catalog.skins = [
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
  catalog.scenes = [
    {
      id: "cidade-local",
      name: "Praça local",
      kind: 1,
      map: {
        source: { case: "atlasMapId", value: "praca-local" },
        scale: 1,
        viewScale: 1,
      },
    },
  ];
  catalog.appearance.skinTones = ["clara", "media", "escura"];
  catalog.rarities = [
    { id: "comum", name: "Comum", color: "#aaaaaa", order: 0, statMult: 1 },
  ];
  const character = empty("CharacterState");
  character.accountId = 1;
  Object.assign(character.identity, {
    name: "Teste Local",
    gender: 1,
    classId: "guerreiro",
    skinId: "local-sombra",
    ownedSkins: ["local-sombra"],
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
  delete account.character.hunt.lastDeath;
  account.character.identity.skinId = "local-sombra";
  account.character.identity.ownedSkins = ["local-sombra"];
  const persist = () => {
    writeFileSync(accountFile + ".tmp", JSON.stringify(account));
    renameSync(accountFile + ".tmp", accountFile);
  };
  status.mode = "local-compatible-bootstrap";
  status.localBackend = true;
  status.protocolMessages = protocol.messages.size;
  status.commands = {};
  status.authenticated = 0;
  // Read-only empty states let the original HUD query its badges without
  // inventing events, guilds, trades, rewards or successful write operations.
  const readResponses = {
    mailRequest: { list: "page" },
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
  const spawn = { x: map.spawn.x * 32 + 16, y: map.spawn.y * 32 + 16 };
  const free = (x, y) => {
    for (const dx of [-8, 8])
      for (const dy of [-8, 8]) {
        const c = Math.floor((x + dx) / 32),
          r = Math.floor((y + dy) / 32);
        if (c < 0 || r < 0 || c >= 60 || r >= 48 || map.collisions[r * 60 + c])
          return false;
      }
    return true;
  };
  const blockedBits = Buffer.alloc(360);
  map.collisions.forEach((value, index) => {
    if (value) blockedBits[index >> 3] |= 1 << (index & 7);
  });
  const route = (from, to) => {
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
          map.collisions[next] ||
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
  const scene = {
    sceneId: "cidade-local",
    instanceId: 1,
    yourEntity: 1,
    map: {
      source: { case: "atlasMapId", value: "praca-local" },
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
    if (client.ws.readyState === 1)
      client.ws.send(
        protocol.encode("ServerMessage", {
          requestId,
          body: { case: kind, value },
        }),
      );
  };
  const actor = (client) => ({
    id: 1,
    kind: 1,
    x: Math.round(client.x * 10),
    y: Math.round(client.y * 10),
    facing: client.facing,
    anim: client.moving ? 1 : 0,
    hp: 250,
    maxHp: 250,
    mana: 100,
    maxMana: 100,
  });
  const auth = (client, requestId) => {
    const token = randomBytes(32).toString("hex");
    tokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
    client.auth = true;
    client.x = spawn.x;
    client.y = spawn.y;
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
    send(client, "characterState", account.character);
    send(client, "sceneEnter", scene);
    send(client, "entitySpawn", {
      tick,
      entities: [
        {
          state: actor(client),
          name: account.character.identity.name,
          level: 1,
          skinId: account.character.identity.skinId,
          classId: "guerreiro",
          scale: 1,
          appearance: account.character.identity.appearance,
        },
      ],
    });
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
          client.auth = false;
          send(client, "logoutOk", {}, message.requestId);
          return;
        }
        if (kind === "moveDir") {
          client.dx = Math.max(-1, Math.min(1, value.dirX / 1000));
          client.dy = Math.max(-1, Math.min(1, value.dirY / 1000));
          client.until = now + 350;
          client.target = null;
          client.route = [];
          client.seq = value.seq;
          return;
        }
        if (kind === "moveTo") {
          if (free(value.x / 10, value.y / 10)) {
            client.route = route(client, { x: value.x / 10, y: value.y / 10 });
            client.target = client.route.shift() ?? null;
          }
          return;
        }
        if (kind === "inventoryPage") {
          send(
            client,
            "inventoryPage",
            {
              scope: value.scope,
              page: 1,
              pages: 1,
              pageSize: 30,
              capacity: 100,
              counts: {},
            },
            message.requestId,
          );
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
    ws.on("close", () => connections.delete(client));
    ws.on("error", () => connections.delete(client));
  });
  const timer = setInterval(() => {
    tick++;
    const now = Date.now();
    for (const client of connections) {
      if (!client.auth) continue;
      let dx = 0,
        dy = 0;
      if (client.target) {
        dx = client.target.x - client.x;
        dy = client.target.y - client.y;
        if (Math.hypot(dx, dy) < 5) {
          client.target = client.route.shift() ?? null;
          dx = 0;
          dy = 0;
        }
      } else if (client.until > now) {
        dx = client.dx;
        dy = client.dy;
      }
      const len = Math.hypot(dx, dy);
      client.moving = len > 0;
      if (len) {
        const amount = client.target ? Math.min(8, len) : 8;
        const x = client.x + (dx / len) * amount,
          y = client.y + (dy / len) * amount;
        if (free(x, client.y)) client.x = x;
        if (free(client.x, y)) client.y = y;
        client.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
      }
      if (client.seq !== client.ackSeq) {
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
          entities: [actor(client)],
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
