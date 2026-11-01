import { withDefenseBuffUi } from "../client-defense-buff.mjs";
import { withLightAfterimages } from "../client-afterimages.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
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
  "real captured client protocol: authentication, movement, farm, skills, rewards, equipment, potions, NPCs, selling, storage, level labels and saved progress after restart",
  { skip: !source, timeout: 45000 },
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
    let child,
      stderr = "",
      ws;
    const startServer = async () => {
      child = spawn(process.execPath, ["server.mjs", source], {
        cwd: root,
        env: {
          ...process.env,
          CAPTURE_PORT: String(port),
          LOCAL_DATA_DIR: data,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stderr.on("data", (chunk) => (stderr += chunk));
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
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(Error("Server exited " + code + " " + stderr));
        });
      });
    };
    try {
      await startServer();
      const base = `http://127.0.0.1:${port}`;
      const original = await (
        await fetch(base + "/assets/main-Du8N-0Wf.js")
      ).arrayBuffer();
      assert.deepEqual(
        Buffer.from(original),
        withDefenseBuffUi(withLightAfterimages(read("main-Du8N-0Wf.js"))),
      );
      const syntax = spawnSync(
        process.execPath,
        ["--check", "--input-type=module"],
        {
          input: Buffer.from(original),
          encoding: "utf8",
        },
      );
      assert.equal(
        syntax.status,
        0,
        "adapted native client must parse: " + syntax.stderr,
      );
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
      const catalog = (await wait((m) => m.body?.case === "contentCatalog"))
        .body.value;
      assert.deepEqual(
        catalog.skills
          .filter((s) => ["guerreiro", "universal"].includes(s.classId))
          .map((s) => s.id),
        [
          "avanco-de-luz",
          "impacto-de-luz",
          "egide-de-luz",
          "avatar-da-luz",
          "dash",
        ],
        "approved dash and new slam keep their native slots",
      );
      assert.deepEqual(
        catalog.skills.filter((s) => s.classId === "arqueira").map((s) => s.id),
        [
          "tiro-perfurante",
          "chuva-de-flechas",
          "olhos-da-floresta",
          "espirito-da-floresta",
        ],
      );
      assert.equal(catalog.consumables.length, 6);
      const scene = (await wait((m) => m.body?.case === "sceneEnter")).body
        .value;
      assert.equal(scene.map.source.case, "atlasMapId");
      assert.equal(scene.map.source.value, "praca-da-coroa");
      const monsterAnim = await (
        await fetch(base + "/assets/monsters/local-treino/anim.json")
      ).json();
      assert.ok(monsterAnim.pivo.x >= 0 && monsterAnim.pivo.x <= 1);
      assert.ok(monsterAnim.pivo.y >= 0 && monsterAnim.pivo.y <= 1);
      const cityMap = await (
        await fetch(base + "/assets/maps/praca-da-coroa/map.json")
      ).json();
      assert.equal(cityMap.name, "Praça da Coroa");
      assert.equal(cityMap.tilesets[0].src, "tilesets/coroa.svg");
      const texture = await fetch(
        base + "/assets/maps/praca-da-coroa/tilesets/coroa.svg",
      );
      assert.match(texture.headers.get("content-type"), /image\/svg/);
      assert.match(await texture.text(), /data:image\/png;base64,/);
      const theme = await (await fetch(base + "/royal-theme.css")).text();
      assert.match(theme, /--sl-texto:\s*#342c20/);
      assert.equal(scene.worldWidth, 19200);
      assert.equal(scene.walk.grid.blocked.length, 360);
      assert.deepEqual(
        scene.npcs.map((n) => n.service),
        [2, 5, 4],
      );
      const start = (await wait((m) => m.body?.case === "entitySpawn")).body
        .value.entities[0].state;
      const spawnMessage = messages.find((m) => m.body?.case === "entitySpawn")
        .body.value;
      assert.equal(
        spawnMessage.entities.find((e) => e.state.id === 1).skinId,
        "humano-guerreiro",
      );
      assert.ok(
        spawnMessage.entities
          .filter((e) => e.state.kind === 4)
          .every((e) => e.skinId === "local-sombra"),
      );
      const heroSheet = await fetch(
        base + "/assets/paperdoll/entities/humano-guerreiro/weapon.png",
      );
      assert.equal(heroSheet.status, 200);
      assert.match(heroSheet.headers.get("content-type"), /image\/png/);
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
      // This plaza cell was walkable in the captured map; the new fountain must block it.
      send("moveTo", { x: 9600, y: 9920 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const fountainBlocked = await (
        await fetch(base + "/__diagnostic.json")
      ).json();
      assert.equal(fountainBlocked.position.x, x);
      assert.equal(fountainBlocked.position.y, y);
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
        "local.invalid_hunt",
      );
      id = send("startHunt", {
        gateId: "elite-local",
        tierMin: 5,
        difficulty: "normal",
      });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.level_required",
      );
      id = send("startHunt", {
        gateId: "treino-local",
        tierMin: 1,
        difficulty: "normal",
      });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.case,
        "startHuntResult",
      );
      const huntScene = (
        await wait(
          (m) => m.body?.case === "sceneEnter" && m.body.value.kind === 2,
        )
      ).body.value;
      assert.equal(huntScene.map.source.value, "patio-da-coroa");
      const huntMap = await (
        await fetch(base + "/assets/maps/patio-da-coroa/map.json")
      ).json();
      assert.equal(huntMap.layers[0].data.length, 60 * 48);
      assert.equal(
        (await fetch(base + "/assets/maps/patio-da-coroa/tilesets/patio.svg"))
          .status,
        200,
      );
      assert.notDeepEqual(huntScene.walk.grid.blocked, scene.walk.grid.blocked);
      await wait(
        (m) =>
          m.body?.case === "entitySpawn" &&
          m.body.value.entities.some((e) => e.state.kind === 2),
      );
      for (const skillId of [
        "investida",
        "golpe-destruidor",
        "furia-guerreiro",
      ]) {
        id = send("useSkill", { skillId, target: 100 });
        assert.equal(
          (await wait((m) => m.requestId === id)).body.value.code,
          "local.invalid_skill",
        );
      }
      id = send("setAutomation", {
        automation: { skillOrder: ["avanco-de-luz", "furia-guerreiro"] },
      });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.invalid_skill",
      );
      for (
        let n = 0;
        n < 1800 &&
        !messages.some(
          (m) =>
            m.body?.case === "huntSession" && Number(m.body.value.kills) >= 6,
        );
        n++
      )
        await new Promise((resolve) => setTimeout(resolve, 20));
      assert.ok(
        messages.some(
          (m) =>
            m.body?.case === "huntSession" && Number(m.body.value.kills) >= 6,
        ),
        "must travel between enemies and earn six kills",
      );
      assert.ok(
        messages.some(
          (m) => m.body?.case === "worldEvents" && m.body.value.damage.length,
        ),
      );
      assert.ok(
        messages.some(
          (m) => m.body?.case === "worldEvents" && m.body.value.casts.length,
        ),
      );
      assert.ok(
        messages.some(
          (m) => m.body?.case === "inventoryDelta" && m.body.value.added.length,
        ),
      );
      assert.ok(
        messages.some(
          (m) =>
            m.body?.case === "entitySpawn" &&
            m.body.value.entities.some(
              (e) => e.state.id === 1 && e.level === 2,
            ),
        ),
        "level label metadata must refresh during the hunt",
      );
      id = send("warehouseMove", { uids: ["1"], direction: 1 });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.city_only",
      );
      id = send("equip", { uid: "999999" });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.code,
        "local.city_only",
      );
      id = send("leaveHunt", {});
      assert.equal(
        (await wait((m) => m.requestId === id)).body.case,
        "leaveHuntResult",
      );
      id = send("inventoryPage", { scope: 1, page: 1, pageSize: 30 });
      const earned = (await wait((m) => m.requestId === id)).body.value.items;
      assert.ok(earned.some((i) => i.defId === "fragmento-local"));
      const gear = earned.find((i) => i.defId !== "fragmento-local");
      assert.ok(gear);
      id = send("equip", { uid: gear.uid });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.equippedUid,
        gear.uid,
      );
      id = send("unequip", { slot: gear.defId === "espada-local" ? 1 : 4 });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.uid,
        gear.uid,
      );
      id = send("buyConsumable", { kind: 1, tier: 1, qty: 2 });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.goldCost,
        "20",
      );
      id = send("interact", { entity: 201 });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.service,
        2,
      );
      id = send("equipBestPreview", { criterion: 2 });
      const preview = (await wait((m) => m.requestId === id)).body.value;
      assert.ok(preview.changes.length);
      id = send("lockItem", { uid: gear.uid, locked: true });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.locked,
        true,
      );
      id = send("sellItems", {
        selection: {
          case: "uids",
          value: { entries: [{ uid: gear.uid, qty: 1 }] },
        },
      });
      assert.equal((await wait((m) => m.requestId === id)).body.value.sold, 0);
      const material = earned.find((i) => i.defId === "fragmento-local");
      id = send("sellItems", {
        selection: {
          case: "uids",
          value: { entries: [{ uid: material.uid, qty: 1 }] },
        },
      });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.gold,
        "2",
      );
      id = send("interact", { entity: 202 });
      assert.equal(
        (await wait((m) => m.requestId === id)).body.value.service,
        5,
      );
      id = send("warehouseMove", { uids: [gear.uid], direction: 1 });
      assert.deepEqual(
        (await wait((m) => m.requestId === id)).body.value.moved,
        [gear.uid],
      );
      id = send("inventoryPage", { scope: 3, page: 1, pageSize: 30 });
      assert.ok(
        (await wait((m) => m.requestId === id)).body.value.items.some(
          (i) => i.uid === gear.uid && i.locked,
        ),
      );
      const saved = JSON.parse(
        readFileSync(path.join(data, "account.json"), "utf8"),
      );
      assert.ok(saved.character.wallet.gold > 1000);
      assert.equal(
        saved.warehouse.some((i) => i.uid === gear.uid),
        true,
      );
      ws.close();
      await once(ws, "close");
      ws = await connect();
      id = send("resume", { token: auth.token });
      assert.equal((await wait((m) => m.requestId === id)).body.case, "authOk");
      assert.ok(existsSync(path.join(data, "account.json")));
      ws.close();
      await once(ws, "close");
      child.kill("SIGTERM");
      await once(child, "exit");
      const legacy = JSON.parse(readFileSync(path.join(data, "account.json")));
      legacy.character.identity.skinId = "local-sombra";
      legacy.character.identity.ownedSkins = ["local-sombra"];
      writeFileSync(path.join(data, "account.json"), JSON.stringify(legacy));
      await startServer();
      messages.length = 0;
      ws = await connect();
      id = send("login", { username: "teste", password: "Teste123!" });
      assert.equal((await wait((m) => m.requestId === id)).body.case, "authOk");
      const restored = (await wait((m) => m.body?.case === "characterState"))
        .body.value;
      assert.equal(restored.identity.skinId, "humano-guerreiro");
      assert.equal(restored.wallet.gold, String(saved.character.wallet.gold));
      assert.equal(restored.progress.xp, String(saved.character.progress.xp));
      assert.equal(restored.consumables.hpPotions.pequena, 12);
      id = send("inventoryPage", { scope: 3, page: 1, pageSize: 30 });
      assert.ok(
        (await wait((m) => m.requestId === id)).body.value.items.some(
          (i) => i.uid === gear.uid,
        ),
      );
      assert.equal(stderr, "");
    } finally {
      ws?.terminate();
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
        await once(child, "exit");
      }
      if (stderr) console.error(stderr);
      rmSync(data, { recursive: true, force: true });
    }
  },
);
