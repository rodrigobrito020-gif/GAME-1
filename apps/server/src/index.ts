import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import path from "node:path";
import { Server } from "socket.io";
import { createDatabase, rootDir } from "./db";
import { RACES, newCharacter } from "@idle/shared";
import type { Archetype, Character, Command, Race } from "@idle/shared";
import { GameEngine } from "./engine";
const db = createDatabase(),
  app = express(),
  http = createServer(app),
  dev =
    process.env.NODE_ENV !== "production" && process.env.DEV_MODE === "true";
const io = new Server(http, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" },
  maxHttpBufferSize: 16384,
});
export const engine = new GameEngine(dev);
app.disable("x-powered-by");
app.use(express.json({ limit: "12kb" }));
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const passwordHash = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};
const check = (password: string, stored: string) => {
  const [salt, value] = stored.split(":");
  try {
    return timingSafeEqual(
      Buffer.from(value, "hex"),
      scryptSync(password, salt, 64),
    );
  } catch {
    return false;
  }
};
const attempts = new Map<string, { n: number; until: number }>();
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, dev, version: "0.1.0" }),
);
for (const route of ["register", "login"])
  app.post(`/api/${route}`, async (req, res) => {
    try {
      const key = req.ip ?? "local",
        old = attempts.get(key),
        now = Date.now();
      const gate = old && old.until > now ? old : { n: 0, until: now + 60000 };
      attempts.set(key, gate);
      if (++gate.n > 30) {
        res
          .status(429)
          .json({ error: "Muitas tentativas. Aguarde um minuto." });
        return;
      }
      const { name, password, race, archetype } = req.body ?? {};
      if (
        typeof name !== "string" ||
        !/^[\p{L}\p{N}_ -]{3,20}$/u.test(name) ||
        typeof password !== "string" ||
        password.length < 6 ||
        password.length > 100
      )
        throw Error("Use nome de 3–20 caracteres e senha de 6–100 caracteres.");
      let character = await db.character.findUnique({ where: { name } });
      if (route === "register") {
        if (character) throw Error("Nome já utilizado.");
        if (
          !Object.hasOwn(RACES, String(race)) ||
          !RACES[race as Race].archetypes.includes(archetype)
        )
          throw Error("Raça/classe inicial inválida. Anões não têm Mystic.");
        const c = newCharacter(
          randomUUID(),
          name,
          race as Race,
          archetype as Archetype,
        );
        character = await db.character.create({
          data: {
            id: c.id,
            name,
            passwordHash: passwordHash(password),
            data: JSON.stringify(c),
          },
        });
      } else if (!character || !check(password, character.passwordHash))
        throw Error("Nome ou senha inválidos.");
      const token = randomBytes(32).toString("hex");
      await db.session.create({
        data: {
          tokenHash: hash(token),
          characterId: character.id,
          expiresAt: new Date(now + 7 * 86400000),
        },
      });
      res.json({ token });
    } catch (error) {
      res
        .status(400)
        .json({
          error:
            error instanceof Error ? error.message : "Não foi possível entrar.",
        });
    }
  });
const pending = new Set<string>();
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length !== 64)
      throw Error("Entre com seu personagem.");
    const session = await db.session.findUnique({
      where: { tokenHash: hash(token) },
      include: { character: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now())
      throw Error("Sessão expirada.");
    if (
      engine.players.get(session.characterId)?.online ||
      pending.has(session.characterId)
    )
      throw Error("Personagem já conectado em outra aba.");
    pending.add(session.characterId);
    await writes.get(session.characterId);
    const fresh = await db.character.findUniqueOrThrow({
      where: { id: session.characterId },
    });
    socket.data.character = JSON.parse(fresh.data);
    next();
  } catch (error) {
    next(error instanceof Error ? error : Error("Autenticação falhou."));
  }
});
// Serialize database writes per character so an older save cannot overwrite a newer one.
const writes = new Map<string, Promise<unknown>>();
function save(id: string) {
  const p = engine.players.get(id);
  if (!p) return Promise.resolve();
  const data = JSON.stringify(engine.capture(p)),
    previous = writes.get(id) ?? Promise.resolve();
  const task = previous
    .catch(() => {})
    .then(() => db.character.update({ where: { id }, data: { data } }));
  writes.set(id, task);
  task.catch((error) => console.error("Falha de persistência:", error.message));
  return task;
}
io.on("connection", (socket) => {
  const c = socket.data.character as Character;
  pending.delete(c.id);
  try {
    engine.connect(c);
  } catch (error) {
    socket.emit("notice", { error: String(error) });
    socket.disconnect();
    return;
  }
  let windowAt = Date.now(),
    actions = 0,
    chatAt = 0;
  socket.emit("snapshot", engine.snapshot(engine.players.get(c.id)!));
  socket.on("command", (cmd: Command) => {
    try {
      if (Date.now() - windowAt > 1000) {
        windowAt = Date.now();
        actions = 0;
      }
      if (++actions > 35) throw Error("Muitos comandos; aguarde.");
      if (!cmd || typeof cmd.type !== "string")
        throw Error("Comando inválido.");
      if (cmd.type === "chat") {
        if (Date.now() - chatAt < 1200)
          throw Error("Aguarde antes de enviar outra mensagem.");
        chatAt = Date.now();
      }
      engine.command(c.id, cmd);
      if (cmd.type !== "move") void save(c.id);
      socket.emit("snapshot", engine.snapshot(engine.players.get(c.id)!));
    } catch (error) {
      socket.emit("notice", {
        error: error instanceof Error ? error.message : "Ação inválida.",
      });
    }
  });
  socket.on("disconnect", () => {
    engine.disconnect(c.id);
    void save(c.id);
  });
});
let ticks = 0;
const timer = setInterval(() => {
  engine.tick(100);
  ticks++;
  if (ticks % 2 === 0)
    for (const socket of io.sockets.sockets.values()) {
      const p = engine.players.get(socket.data.character.id);
      if (p?.online) socket.emit("snapshot", engine.snapshot(p));
    }
  if (ticks % 50 === 0) {
    for (const p of engine.players.values()) if (p.online) void save(p.c.id);
    for (const [ip, value] of attempts)
      if (value.until < Date.now()) attempts.delete(ip);
  }
}, 100);
app.use(express.static(path.join(rootDir, "apps/client/dist")));
app.get("*", (_req, res) =>
  res.sendFile(path.join(rootDir, "apps/client/dist/index.html")),
);
const port = Number(process.env.PORT ?? 3001);
http.listen(port, "0.0.0.0", () =>
  console.log(
    `Lineage 2D Idle: porta ${port}; DEV ${dev ? "ATIVO (somente teste local)" : "desativado"}`,
  ),
);
async function shutdown() {
  clearInterval(timer);
  for (const p of engine.players.values()) if (p.online) void save(p.c.id);
  await Promise.allSettled(writes.values());
  io.close();
  await db.$disconnect();
  http.close();
  process.exit(0);
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
