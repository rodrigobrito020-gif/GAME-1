import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeRgba } from "../png.mjs";
import {
  WARRIOR_SHEETS,
  WARRIOR_ACTIONS,
  WARRIOR_BASIC,
  warriorRig,
} from "../warrior.mjs";
import { warriorEffects, warriorFx, warriorIcon } from "../warrior-fx.mjs";
import { localAssets } from "../assets.mjs";
import { LocalFarm } from "../farm.mjs";

test("authored warrior poses have transparent gutters, stable feet and distinct movement/attack frames in all directions", () => {
  for (const [name, cols] of Object.entries(WARRIOR_SHEETS)) {
    const image = decodeRgba(
      readFileSync(new URL(`../art/warrior/${name}.png`, import.meta.url)),
    );
    assert.equal(image.width, cols * 64);
    assert.equal(image.height, 256);
    for (let row = 0; row < 4; row++) {
      const hashes = new Set();
      for (let col = 0; col < cols; col++) {
        let opaque = 0,
          minX = 64,
          minY = 64,
          maxX = -1,
          maxY = -1;
        const frame = Buffer.alloc(64 * 64 * 4);
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const i = ((row * 64 + y) * image.width + col * 64 + x) * 4;
            image.pixels.copy(frame, (y * 64 + x) * 4, i, i + 4);
            if (image.pixels[i + 3] > 24) {
              opaque++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        assert.ok(
          opaque > 180,
          `${name}/${row}/${col} must contain a full pose`,
        );
        assert.ok(
          minX >= 1 && maxX <= 62 && minY >= 1,
          `${name}/${row}/${col} clips a sword or cape`,
        );
        assert.ok(
          maxY >= 58 && maxY <= 60,
          "soles/ground contact must stay at the shared pivot",
        );
        hashes.add(createHash("sha256").update(frame).digest("hex"));
      }
      assert.ok(
        hashes.size >= (cols === 6 ? 5 : 4),
        `${name}/${row} cannot reuse idle as every frame`,
      );
    }
  }
});

test("warrior combat rig uses real exported poses and the server impact/recovery timings without altering other classes", () => {
  const original = {
    stepMs: 50,
    moves: { existing: { sheet: "punch", frames: [0] } },
    basic: { mago: { chain: ["existing"] } },
    skills: { "bola-de-fogo": { move: "existing" } },
  };
  const rig = warriorRig(original);
  assert.deepEqual(rig.basic.mago, original.basic.mago);
  assert.deepEqual(rig.skills["bola-de-fogo"], original.skills["bola-de-fogo"]);
  assert.equal(original.moves[WARRIOR_BASIC.move], undefined);
  for (const action of [WARRIOR_BASIC, ...Object.values(WARRIOR_ACTIONS)]) {
    const move = rig.moves[action.move];
    assert.equal(move.frames.length * rig.stepMs, action.duration);
    assert.deepEqual(move.impacts, [action.impact]);
    for (const entry of move.frames) {
      const [sheet, frame] = Array.isArray(entry) ? entry : [move.sheet, entry];
      assert.ok(
        frame >= 0 && frame < WARRIOR_SHEETS[sheet],
        `invalid ${sheet}/${frame}`,
      );
    }
  }
});

test("warrior assets and skill effects are served locally with matching flipbook dimensions and normalized pivots", () => {
  const json = (obj) => [{ read: () => Buffer.from(JSON.stringify(obj)) }];
  const assets = localAssets(
    new Map([
      ["paperdoll-looks.json", json({ entities: {}, looks: {} })],
      ["errors.json", json({})],
    ]),
    {},
  );
  const looks = JSON.parse(assets("/data/paperdoll-looks.json").bytes);
  assert.equal(looks.looks["humano-guerreiro"].entity, "humano-guerreiro");
  assert.ok(
    looks.entities["local-sombra"],
    "NPC/monster fallback must remain available",
  );
  for (const [name, count] of Object.entries(WARRIOR_SHEETS)) {
    const result = assets(
      `/assets/paperdoll/entities/humano-guerreiro/${name}.png`,
    );
    assert.equal(result.type, "image/png");
    assert.equal(decodeRgba(result.bytes).width, count * 64);
  }
  const original = {
    efeitos: { other: { folha: "untouched" } },
    habilidades: { mago: {} },
  };
  const effects = warriorEffects(original);
  assert.deepEqual(effects.efeitos.other, original.efeitos.other);
  for (const [id, effect] of Object.entries(effects.efeitos)) {
    if (id === "other") continue;
    const sprite = assets(effect.folha);
    assert.equal(sprite.type, "image/svg+xml");
    assert.match(sprite.bytes.toString(), /width="2048" height="128"/);
    assert.equal(effect.frames * effect.quadro[0], 2048);
    assert.ok(effect.pivo.every((value) => value >= 0 && value <= 1));
    assert.doesNotMatch(
      sprite.bytes.toString(),
      /(?:href|src)="https?:|<script|foreignObject/,
    );
    assert.ok(warriorFx(id));
  }
  for (const id of Object.keys(WARRIOR_ACTIONS)) assert.ok(warriorIcon(id));
  assert.equal(warriorFx("unknown"), null);
});

function scenario() {
  let now = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 200, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: {},
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now });
  const client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  farm.character.automation.skillOrder = [];
  client.x = 848;
  client.y = 960;
  return {
    farm,
    client,
    step(ms) {
      now += ms;
      return farm.step(client);
    },
  };
}

test("all four skills land at their impact frame, reserve recovery and cancel pending damage on exit or death", () => {
  for (const [id, action] of Object.entries(WARRIOR_ACTIONS)) {
    const { farm, client, step } = scenario(),
      target = client.hunt.monsters[0];
    const hp = target.hp,
      health = farm.character.progress.hp;
    const cast = farm.cast(client, id, target.id);
    assert.equal(cast.events.casts.length, 1);
    assert.equal(cast.events.damage.length, 0);
    assert.equal(step(action.impact - 1).events.damage.length, 0);
    assert.equal(target.hp, hp);
    const impact = step(1);
    assert.ok(impact.events.damage.some((e) => e.skillId === id));
    assert.ok(target.hp < hp);
    assert.throws(
      () => farm.cast(client, "corte-poderoso", target.id),
      /cooldown/,
    );
    if (id === "furia-guerreiro")
      assert.equal(farm.character.progress.hp, health + 25);
  }
  const { farm, client, step } = scenario();
  farm.cast(client, "golpe-destruidor", 100);
  const gold = farm.character.wallet.gold;
  farm.stop(client);
  assert.equal(
    client.combatAnimUntil,
    0,
    "return to the city must use the normal idle state",
  );
  assert.equal(step(1000).events.damage.length, 0);
  assert.equal(farm.character.wallet.gold, gold);
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  client.x = 848;
  client.y = 960;
  farm.character.progress.hp = 1;
  farm.cast(client, "golpe-destruidor", 100);
  client.hunt.monsters[0].nextAttack = 0;
  assert.equal(step(50).died, true);
  assert.equal(step(1000).events.damage.length, 0);
  assert.equal(farm.character.wallet.gold, gold);
});

test("basic sword attack announces the authored animation before damage and cannot overlap a skill", () => {
  const { farm, client, step } = scenario();
  const start = step(1);
  assert.equal(start.events.moves[0].move, WARRIOR_BASIC.move);
  assert.equal(start.events.moves[0].dirY, 1000);
  assert.equal(client.facing, 0);
  assert.equal(start.events.damage.length, 0);
  assert.throws(() => farm.cast(client, "investida", 100), /cooldown/);
  assert.equal(step(199).events.damage.length, 0);
  assert.ok(step(1).events.damage.some((e) => e.source === 1 && !e.skillId));
});
