import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
import { readZip } from "../zip-reader.mjs";
import { Protocol } from "../protocol.mjs";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = [
  process.env.TEST_CAPTURE_ZIP,
  path.join(root, "recursos-publicos.zip"),
  path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? root,
    "Downloads",
    "recursos-publicos.zip",
  ),
]
  .filter(Boolean)
  .find(existsSync);
test(
  "real captured protocol: local auth, map, collisions, movement, inventory, resume and blocked unsupported actions",
  { skip: !source, timeout: 20000 },
  async () => {
    const entries = readZip(readFileSync(source));
    const read = (name) =>
      [...entries].find(([key]) => key.replace(/^\d+_/, "") === name)?.[1]();
    const protocol = new Protocol(
      read("overlays-CiSZXpkZ.js").toString("utf8"),
    );
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const data = mkdtempSync(path.join(tmpdir(), "captured-server-test-"));
    const child = spawn(process.execPath, ["server.mjs", source], {
      cwd: root,
      env: { ...process.env, CAPTURE_PORT: String(port), LOCAL_DATA_DIR: data },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    let ws;
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("Server start timeout " + stderr)),
          4000,
        );
        child.stdout.on("data", (chunk) => {
          if (chunk.toString().includes("Ctrl+C")) {
            clearTimeout(timer);
            resolve();
          }
        });
        child.once("exit", (code) =>
          reject(Error("Server exited " + code + " " + stderr)),
        );
      });
      const base = `http://127.0.0.1:${port}`;
      const original = await (
        await fetch(base + "/assets/main-Du8N-0Wf.js")
      ).arrayBuffer();
      assert.deepEqual(Buffer.from(original), read("main-Du8N-0Wf.js"));
      const messages = [];
      let requestId = 0;
      const connect = async () => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        socket.on("message", (data) =>
          messages.push(protocol.decode("ServerMessage", data)),
        );
        await once(socket, "open");
        return socket;
      };
      const send = (kind, value = {}) => {
        const id = ++requestId;
        ws.send(
          protocol.encode("ClientMessage", {
            requestId: id,
            body: { case: kind, value },
          }),
        );
        return id;
      };
      const wait = async (predicate) => {
        for (let n = 0; n < 150; n++) {
          const match = messages.find(predicate);
          if (match) return match;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw Error("Protocol response timeout " + stderr);
      };
      ws = await connect();
      let id = send("startHunt", {});
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "session.expired",
      );
      id = send("login", { username: "teste", password: "wrong" });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "auth.invalid_credentials",
      );
      await new Promise((resolve) => setTimeout(resolve, 1050));
      id = send("login", { username: "teste", password: "Teste123!" });
      const auth = (await wait((m) => m.requestId === id)).body.value;
      assert.equal(auth.role, 1);
      assert.ok(auth.token);
      const scene = (await wait((m) => m.body?.case === "sceneEnter")).body
        .value;
      assert.equal(scene.map.source.case, "atlasMapId");
      assert.equal(scene.worldWidth, 19200);
      assert.equal(scene.walk.grid.blocked.length, 360);
      const start = (await wait((m) => m.body?.case === "entitySpawn")).body
        .value.entities[0].state;
      send("moveDir", { dirX: 1000, dirY: 0, seq: 1 });
      await new Promise((resolve) => setTimeout(resolve, 280));
      send("moveDir", { dirX: 0, dirY: 0, seq: 2 });
      await wait((m) => m.body?.case === "moveAck" && m.body.value.seq === 2);
      const report = await (await fetch(base + "/__diagnostic.json")).json();
      assert.ok(report.position.x > start.x / 10 + 20);
      assert.ok(report.position.x < start.x / 10 + 90);
      const x = report.position.x,
        y = report.position.y;
      send("moveTo", { x: 160, y: 160 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const blocked = await (await fetch(base + "/__diagnostic.json")).json();
      assert.equal(blocked.position.x, x);
      assert.equal(blocked.position.y, y);
      id = send("inventoryPage", { scope: 1, page: 1, pageSize: 30 });
      const inventory = (await wait((m) => m.requestId === id)).body;
      assert.equal(inventory.case, "inventoryPage");
      assert.equal(inventory.value.total, 0);
      assert.equal(inventory.value.capacity, 100);
      id = send("guildRequest", { op: { case: "get", value: {} } });
      const guild = (await wait((m) => m.requestId === id)).body;
      assert.equal(guild.case, "guildResponse");
      assert.equal(guild.value.result.case, "info");
      assert.equal(guild.value.result.value.guild, undefined);
      id = send("guildRequest", {
        op: { case: "create", value: { name: "Not created" } },
      });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.not_implemented",
      );
      id = send("startHunt", {});
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.not_implemented",
      );
      ws.close();
      await once(ws, "close");
      ws = await connect();
      id = send("resume", { token: auth.token });
      assert.equal((await wait((m) => m.requestId === id)).body.case, "authOk");
      assert.ok(existsSync(path.join(data, "account.json")));
      assert.equal(stderr, "");
    } finally {
      ws?.terminate();
      child.kill("SIGTERM");
      await once(child, "exit");
      rmSync(data, { recursive: true, force: true });
    }
  },
);
