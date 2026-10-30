import { afterAll, beforeAll, expect, it } from "vitest";
import { spawn, execFileSync, ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { io, Socket } from "socket.io-client";
import type { Snapshot, Command } from "@idle/shared";
const root = process.cwd(),
  filename = `network-${Date.now()}.db`,
  url = "http://127.0.0.1:3387",
  sockets: Socket[] = [];
let child: ChildProcess,
  output = "";
const sleep = (n: number) => new Promise((r) => setTimeout(r, n));
async function until<T>(
  get: () => T | Promise<T>,
  valid: (v: T) => boolean,
  timeout = 15000,
) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = await get();
    if (valid(v)) return v;
    await sleep(100);
  }
  throw Error(
    `Condição de integração não atingida. Servidor: ${output.slice(-1500)}`,
  );
}
async function start(dev: boolean) {
  child = spawn(
    process.execPath,
    ["--import", "tsx", "apps/server/src/index.ts"],
    {
      cwd: root,
      env: {
        ...process.env,
        PORT: "3387",
        CITY_MODE: "original",
        DATABASE_URL: `file:./${filename}`,
        DEV_MODE: dev ? "true" : "true",
        NODE_ENV: dev ? "development" : "production",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout?.on("data", (d) => (output += String(d)));
  child.stderr?.on("data", (d) => (output += String(d)));
  await until(
    async () => {
      try {
        return await (await fetch(`${url}/api/health`)).json();
      } catch {
        return null;
      }
    },
    (v) => v?.ok === true,
  );
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 4000).unref();
  });
}
beforeAll(async () => {
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: `file:./${filename}` },
      stdio: "pipe",
    },
  );
  await start(true);
}, 20000);
afterAll(async () => {
  for (const s of sockets) s.disconnect();
  await stop();
  for (const ext of ["", "-wal", "-shm", "-journal"])
    try {
      rmSync(path.join(root, "prisma", filename + ext), { force: true });
    } catch {
      /* already closed */
    }
}, 15000);
async function login(name: string) {
  const response = await fetch(`${url}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      password: "network-test-password",
      race: "dwarf",
      archetype: "fighter",
    }),
  });
  expect(response.ok).toBe(true);
  const { token } = await response.json();
  let latest: Snapshot | null = null;
  const s = io(url, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  sockets.push(s);
  s.on("snapshot", (v: Snapshot) => (latest = v));
  await until(
    () => latest,
    (v) => !!v,
  );
  return {
    socket: s,
    get state() {
      return latest!;
    },
    async send(cmd: Command, valid?: (s: Snapshot) => boolean) {
      s.emit("command", cmd);
      if (valid) await until(() => latest!, valid);
    },
  };
}
it("cinco Warsmiths reais: instância exclusiva, 25 mobs, quinze summons, EXP e loot único do líder", async () => {
  const users = [];
  for (let i = 0; i < 5; i++) {
    const u = await login(`Rede ${i} ${Date.now().toString().slice(-5)}`);
    users.push(u);
    await u.send(
      {
        type: "dev",
        level: 151,
        profession: "artisan",
        specialization: "warsmith",
        weapon: "hammer",
      },
      (s) => s.self.specialization === "warsmith",
    );
  }
  const leader = users[0];
  await leader.send({ type: "party.create" }, (s) => !!s.party);
  for (const u of users.slice(1)) {
    await leader.send({ type: "party.invite", id: u.state.self.id });
    await until(
      () => u.state,
      (s) => s.invites.length > 0,
    );
    await u.send(
      { type: "party.accept", id: leader.state.party!.id },
      (s) => !!s.party,
    );
  }
  await until(
    () => leader.state,
    (s) => s.party?.members.length === 5,
  );
  await leader.send(
    { type: "party.settings", loot: "leader", assist: true },
    (s) => s.party?.loot === "leader",
  );
  await leader.send(
    { type: "move", x: 1028, y: 618 },
    (s) => Math.hypot(s.actor.x - 1060, s.actor.y - 580) < 100,
  );
  await leader.send({ type: "enter", hunt: "hunt-1-physical" }, (s) =>
    s.map.startsWith("party:"),
  );
  expect(leader.state.actors.filter((a) => a.kind === "monster")).toHaveLength(
    25,
  );
  await until(
    () => leader.state,
    (s) => s.actors.filter((a) => a.kind === "summon").length === 15,
    24000,
  );
  for (const u of users) {
    expect(u.state.map).toBe(leader.state.map);
    expect(u.state.metrics.exp).toBeGreaterThan(0);
    expect(u.state.party?.members).toHaveLength(5);
    for (const summon of u.state.actors.filter(
      (a) => a.masterId === u.state.self.id,
    ))
      expect(summon.targetId).toBe(u.state.actor.targetId);
  }
  expect(leader.state.metrics.loot).toBeGreaterThan(0);
  for (const u of users.slice(1)) expect(u.state.metrics.loot).toBe(0);
  for (const u of users) u.socket.disconnect();
}, 45000);
it("servidor em produção recusa DEV e clientes não autenticados, mesmo com DEV_MODE=true", async () => {
  await stop();
  await start(false);
  expect((await (await fetch(`${url}/api/health`)).json()).dev).toBe(false);
  const bad = io(url, {
    auth: { token: "invalid" },
    transports: ["websocket"],
    reconnection: false,
  });
  sockets.push(bad);
  const denied = await new Promise<string>((resolve) =>
    bad.once("connect_error", (e) => resolve(e.message)),
  );
  expect(denied).toMatch(/personagem/i);
  const u = await login(`Prod ${Date.now().toString().slice(-6)}`);
  const notice = new Promise<string>((resolve) =>
    u.socket.once("notice", (v) => resolve(v.error)),
  );
  await u.send({ type: "dev", level: 300 });
  expect(await notice).toMatch(/desativadas/);
  expect(u.state.self.level).toBe(1);
  u.socket.disconnect();
}, 20000);
