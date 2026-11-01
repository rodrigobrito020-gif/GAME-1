import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeRgba } from "../png.mjs";
import {
  WARRIOR_SHEETS,
  WARRIOR_ACTIONS,
  WARRIOR_BASIC,
  WARRIOR_RETURN,
  warriorRig,
} from "../warrior.mjs";
import { warriorEffects, warriorFx, warriorIcon } from "../warrior-fx.mjs";
import { WARRIOR_VFX } from "../warrior-vfx.mjs";
import { localAssets } from "../assets.mjs";
import { LocalFarm, ACTIVE_SKILLS } from "../farm.mjs";
import { warriorWalkPose, WALK_STRIDE } from "../warrior-walk-rig.mjs";

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
        hashes.size >= (name === "idle" ? 3 : cols === 6 ? 5 : 4),
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
  for (const action of [
    WARRIOR_BASIC,
    WARRIOR_RETURN,
    ...Object.values(WARRIOR_ACTIONS),
  ]) {
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
  for (const id of [
    "humano-espada",
    "humano-avanco-luz",
    "humano-investida",
    "humano-destruidor",
  ]) {
    const move = rig.moves[id],
      entry = move.frames[move.impacts[0] / 50];
    assert.equal(
      Array.isArray(entry) ? entry[1] : entry,
      3,
      "the impact must use the committed cutting pose",
    );
  }
  const manifest = JSON.parse(
    readFileSync(new URL("../art/warrior/manifest.json", import.meta.url)),
  );
  assert.equal(
    new Set(manifest.sources.weapon.map((pose) => pose.scale)).size,
    1,
    "raising the sword must not shrink the whole character to fit its bounds",
  );
});

test("walking alternates planted legs around a stable pelvis, mirrors directions and keeps the contact-pose torso still", () => {
  const image = decodeRgba(
    readFileSync(new URL("../art/warrior/walk.png", import.meta.url)),
  );
  const torso = (row, frame) => {
    const out = [];
    for (let y = 0; y < 31; y++)
      for (let x = 0; x < 64; x++) {
        const at = ((row * 64 + y) * image.width + frame * 64 + x) * 4;
        out.push(...image.pixels.subarray(at, at + 4));
      }
    return out;
  };
  for (let row = 0; row < 4; row++) {
    const phases = [0, 1, 2, 3].map((phase) => warriorWalkPose(row, phase));
    assert.ok(phases.every((p) => p.pelvis[0] === 32));
    assert.ok(
      Math.max(...phases.map((p) => p.pelvis[1])) -
        Math.min(...phases.map((p) => p.pelvis[1])) <=
        0.7 + 1e-8,
    );
    assert.deepEqual(
      phases.map((p) => p.legs.map((l) => l.planted)),
      [
        [true, false],
        [true, false],
        [false, true],
        [false, true],
      ],
    );
    assert.deepEqual(
      torso(row, 0),
      torso(row, 2),
      "opposite strides must not resize or move the torso sideways",
    );
    if (row === 1 || row === 2) {
      assert.ok(phases[0].legs[0].foot[0] < phases[0].legs[1].foot[0]);
      assert.ok(phases[2].legs[0].foot[0] > phases[2].legs[1].foot[0]);
      assert.equal(
        (phases[1].legs[0].foot[0] - phases[0].legs[0].foot[0]) * 2,
        WALK_STRIDE / 4,
        "a planted foot must compensate for ground travel at native scale2",
      );
      for (let frame = 0; frame < 4; frame++)
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const west = ((64 + y) * image.width + frame * 64 + x) * 4;
            const east = ((128 + y) * image.width + frame * 64 + 63 - x) * 4;
            assert.deepEqual(
              image.pixels.subarray(west, west + 4),
              image.pixels.subarray(east, east + 4),
            );
          }
    } else {
      assert.ok(phases[0].legs[0].foot[1] > phases[0].legs[1].foot[1]);
      assert.ok(phases[2].legs[0].foot[1] < phases[2].legs[1].foot[1]);
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
    if (WARRIOR_VFX[id]) {
      assert.equal(sprite.type, "image/png");
      const image = decodeRgba(sprite.bytes);
      assert.equal(image.width, effect.frames * effect.quadro[0]);
      assert.equal(image.height, effect.quadro[1]);
      assert.equal(
        warriorFx(id),
        null,
        "painted skills must not fall back to the old geometric effect",
      );
    } else {
      assert.equal(sprite.type, "image/svg+xml");
      assert.match(sprite.bytes.toString(), /width="2048" height="128"/);
      assert.equal(effect.frames * effect.quadro[0], 2048);
      assert.ok(warriorFx(id));
    }
    assert.ok(effect.pivo.every((value) => value >= 0 && value <= 1));
    if (sprite.type === "image/svg+xml")
      assert.doesNotMatch(
        sprite.bytes.toString(),
        /(?:href|src)="https?:|<script|foreignObject/,
      );
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
  client.x = client.hunt.monsters[0].x;
  client.y = client.hunt.monsters[0].y - 16;
  return {
    farm,
    client,
    step(ms) {
      now += ms;
      return farm.step(client);
    },
  };
}

test("the active skill lands at its impact frame, reserves recovery and cancels pending damage on exit or death", () => {
  for (const { id } of ACTIVE_SKILLS) {
    const action = WARRIOR_ACTIONS[id];
    const { farm, client, step } = scenario(),
      target = client.hunt.monsters[0];
    const hp = target.hp,
      health = farm.character.progress.hp;
    const cast = farm.cast(client, id, target.id);
    assert.equal(cast.events.casts.length, 1);
    assert.equal(cast.events.damage.length, 0);
    assert.equal(
      step(action.impact - 1).events.damage.filter((e) => e.source === 1)
        .length,
      0,
    );
    assert.equal(target.hp, hp);
    const impact = step(1);
    assert.ok(impact.events.damage.some((e) => e.skillId === id));
    assert.ok(target.hp < hp);
    assert.throws(
      () => farm.cast(client, "avanco-de-luz", target.id),
      /cooldown/,
    );
    if (id === "furia-guerreiro")
      assert.equal(farm.character.progress.hp, health + 25);
  }
  const { farm, client, step } = scenario();
  farm.cast(client, "avanco-de-luz", 100);
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
  client.x = client.hunt.monsters[0].x;
  client.y = client.hunt.monsters[0].y - 16;
  farm.character.progress.hp = 1;
  farm.cast(client, "avanco-de-luz", 100);
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
  assert.throws(() => farm.cast(client, "avanco-de-luz", 100), /cooldown/);
  assert.equal(step(WARRIOR_BASIC.impact - 1).events.damage.length, 0);
  assert.ok(step(1).events.damage.some((e) => e.source === 1 && !e.skillId));
  const next = step(1000 - WARRIOR_BASIC.impact);
  assert.ok(
    next.events.moves.some((e) => e.move === WARRIOR_RETURN.move),
    "the combo must alternate into the return cut",
  );
});

test("painted cast effects leave time for anticipation, sustain after impact and fade with transparent gutters", () => {
  const effects = warriorEffects({ efeitos: {}, habilidades: {} }).efeitos;
  for (const [id, fx] of Object.entries(WARRIOR_VFX)) {
    if (!fx.cast) continue;
    const action = WARRIOR_ACTIONS[fx.skill];
    assert.ok(
      action.duration >= 400 && action.duration <= 900,
      "combat actions should be brief",
    );
    assert.ok(
      (fx.frames / fx.fps) * 1000 > action.duration,
      "effect tails must not block the next action",
    );
    assert.ok((fx.frames / fx.fps) * 1000 >= action.impact + 700);
    const image = decodeRgba(
      readFileSync(new URL(`../art/warrior/vfx/${id}.png`, import.meta.url)),
    );
    const mass = [];
    for (let f = 0; f < fx.frames; f++) {
      let alpha = 0;
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const a = image.pixels[(y * image.width + f * 128 + x) * 4 + 3];
          if (!x || !y || x === 127 || y === 127) assert.equal(a, 0);
          alpha += a;
        }
      mass.push(alpha);
    }
    assert.equal(mass[0], 0, "no full impact flash at cast time");
    assert.ok(Math.max(...mass) > 100000, "visible painted content");
    assert.ok(
      mass[Math.floor(((action.impact + 500) * fx.fps) / 1000)] > 50000,
      "effect persists after damage",
    );
    assert.ok(
      mass.at(-1) < Math.max(...mass) * 0.08,
      "gradual fade before removal",
    );
  }
  assert.equal(
    effects["guerreiro-destruidor-fenda"].inteiro,
    true,
    "damage must not prematurely dissolve the ground effect",
  );
});

test("draft skills cannot be cast or reenabled through automation", () => {
  const { farm, client, step } = scenario();
  const mana = farm.character.progress.mana;
  assert.deepEqual(
    ACTIVE_SKILLS.map((s) => s.id),
    ["avanco-de-luz"],
  );
  for (const id of ["investida", "golpe-destruidor", "furia-guerreiro"]) {
    assert.throws(() => farm.cast(client, id, 100), /invalid_skill/);
    assert.throws(() => farm.automation({ skillOrder: [id] }), /invalid_skill/);
  }
  assert.equal(farm.character.progress.mana, mana);
  farm.character.automation.skillOrder = [
    "investida",
    "golpe-destruidor",
    "furia-guerreiro",
  ];
  assert.equal(
    step(50).events.casts.length,
    0,
    "even stale runtime preferences cannot cast a draft skill",
  );
});

test("idle warrior cutouts contain one connected silhouette, without floating matte stains", () => {
  const image = decodeRgba(
    readFileSync(new URL("../art/warrior/idle.png", import.meta.url)),
  );
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const solid = (i) =>
        image.pixels[
          ((row * 64 + Math.floor(i / 64)) * image.width +
            col * 64 +
            (i % 64)) *
            4 +
            3
        ] >= 24;
      const all = Array.from({ length: 4096 }, (_, i) => i).filter(solid),
        seen = new Set([all[0]]),
        queue = [all[0]];
      for (let n = 0; n < queue.length; n++)
        for (const j of [
          queue[n] - 1,
          queue[n] + 1,
          queue[n] - 64,
          queue[n] + 64,
        ])
          if (
            j >= 0 &&
            j < 4096 &&
            Math.abs((j % 64) - (queue[n] % 64)) <= 1 &&
            !seen.has(j) &&
            solid(j)
          ) {
            seen.add(j);
            queue.push(j);
          }
      assert.equal(
        seen.size,
        all.length,
        `idle/${row}/${col}: detached stains outside the warrior silhouette`,
      );
    }
});
