import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import WebSocket from "ws";
import { fileURLToPath } from "node:url";
import { readZip } from "../zip-reader.mjs";
import { Protocol } from "../protocol.mjs";
const root = path.dirname(
    fileURLToPath(new URL("../package.json", import.meta.url)),
  ),
  source = [
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
  "repeated dash requests return gameplay errors without disconnecting or leaving the hunt, and right-click selects the automatic hunt priority",
  { skip: !source || !existsSync(source), timeout: 20000 },
  async () => {
    const entries = readZip(readFileSync(source)),
      build = [...entries].find(
        ([k]) => k.replace(/^\d+_/, "") === "overlays-CiSZXpkZ.js",
      )[1](),
      protocol = new Protocol(build.toString("utf8"));
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    const data = mkdtempSync(path.join(tmpdir(), "dash-connection-"));
    let child,
      ws,
      stderr = "";
    try {
      child = spawn(process.execPath, ["server.mjs", source], {
        cwd: root,
        env: {
          ...process.env,
          CAPTURE_PORT: String(port),
          LOCAL_DATA_DIR: data,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stderr.on("data", (b) => (stderr += b));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("startup " + stderr)),
          4000,
        );
        child.stdout.on("data", (b) => {
          if (b.toString().includes("Ctrl+C")) {
            clearTimeout(timer);
            resolve();
          }
        });
        child.once("exit", () => {
          clearTimeout(timer);
          reject(Error(stderr));
        });
      });
      const messages = [];
      ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
      ws.on("message", (b) =>
        messages.push(protocol.decode("ServerMessage", b)),
      );
      await once(ws, "open");
      let id = 0;
      const send = (kind, value = {}) => {
        const requestId = ++id;
        ws.send(
          protocol.encode("ClientMessage", {
            requestId,
            body: { case: kind, value },
          }),
        );
        return requestId;
      };
      const wait = async (predicate, timeout = 6000) => {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
          const m = messages.find(predicate);
          if (m) return m;
          if (ws.readyState !== 1)
            throw Error("unexpected disconnect " + stderr);
          await new Promise((r) => setTimeout(r, 20));
        }
        throw Error("response timeout " + stderr);
      };
      let req = send("login", { username: "teste", password: "Teste123!" });
      await wait((m) => m.requestId === req && m.body?.case === "authOk");
      req = send("startHunt", {
        gateId: "treino-local",
        tierMin: 1,
        difficulty: "normal",
      });
      await wait(
        (m) => m.requestId === req && m.body?.case === "startHuntResult",
      );
      req = send("setAutomation", { automation: { skillOrder: [] } });
      await wait(
        (m) => m.requestId === req && m.body?.case === "setAutomationResult",
      );
      let mark = messages.length,
        started = false;
      for (let attempt = 0; attempt < 8 && !started; attempt++) {
        send("roll", { dirX: 0, dirY: 1000 });
        await new Promise((r) => setTimeout(r, 150));
        started = messages
          .slice(mark)
          .some(
            (m) =>
              m.body?.case === "worldEvents" &&
              m.body.value.cooldowns.some((c) => c.skillId === "dash"),
          );
      }
      assert.ok(started);
      const sceneCount = messages.filter(
        (m) => m.body?.case === "sceneEnter",
      ).length;
      for (let n = 0; n < 4; n++) {
        req = send("roll", { dirX: 1000, dirY: 0 });
        const rejected = await wait((m) => m.requestId === req);
        assert.equal(rejected.body.case, "error");
        assert.equal(rejected.body.value.code, "local.cooldown");
      }
      await new Promise((r) => setTimeout(r, 300));
      assert.equal(ws.readyState, 1);
      assert.equal(
        messages.filter((m) => m.body?.case === "sceneEnter").length,
        sceneCount,
      );
      req = send("ping", { clientTimeMs: 123 });
      await wait((m) => m.requestId === req && m.body?.case === "pong");
      assert.ok(!stderr.includes("Local protocol:"));
      // A manual right-click is a server validated order, without enabling skills.
      mark = messages.length;
      send("useSkill", { skillId: "ataque-direito", target: 109 });
      await wait(
        (m) =>
          messages.indexOf(m) >= mark &&
          m.body?.case === "worldEvents" &&
          m.body.value.deaths.some((d) => d.entity === 109 && d.killer === 1),
        10000,
      );
      const hits = messages
        .slice(mark)
        .filter((m) => m.body?.case === "worldEvents")
        .flatMap((m) => m.body.value.damage)
        .filter((d) => d.source === 1);
      assert.ok(hits.length >= 1);
      assert.ok(hits.some((h) => h.target === 109));
      assert.equal(ws.readyState, 1);
      assert.equal(
        messages.filter((m) => m.body?.case === "sceneEnter").length,
        sceneCount,
      );
    } finally {
      ws?.terminate();
      if (child && child.exitCode === null) {
        child.kill();
        await once(child, "exit");
      }
      rmSync(data, { recursive: true, force: true });
    }
  },
);
