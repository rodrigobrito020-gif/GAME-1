import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm } from "../farm.mjs";
import {
  BERSERKER_ACTIONS,
  BERSERKER_CRY,
  BERSERKER_ULTIMATE,
  berserkerRig,
} from "../berserker.mjs";
import { warriorRig } from "../warrior.mjs";
import { classVisuals } from "../class-visuals.mjs";
import { characterDisplayScale } from "../character-proportions.mjs";
function fixture() {
  let now = 10000;
  const account = {
    farmVersion: 1,
    skillReviewVersion: 4,
    avatarAutomationVersion: 1,
    bag: [],
    warehouse: [],
    character: {
      identity: {
        classId: "berserker",
        skinId: "orc-berserker",
        ownedSkins: ["orc-berserker"],
      },
      progress: { level: 1, xp: 0, hp: 280, mana: 90 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: { skillOrder: [] },
      consumables: {},
      hunt: {},
      ultimate: { charge: 100, readyAt: 0 },
    },
  };
  const farm = new LocalFarm(account, { now: () => now, random: () => 0 }),
    client = { entityId: 1 };
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  client.x = 944;
  client.y = 800;
  for (const m of client.hunt.monsters)
    Object.assign(m, { hp: 0, respawnAt: Infinity });
  return {
    farm,
    client,
    account,
    place(index, dx, dy = 0) {
      const m = client.hunt.monsters[index];
      Object.assign(m, {
        x: client.x + dx,
        y: client.y + dy,
        home: { x: client.x + dx, y: client.y + dy },
        hp: 10000,
        maxHp: 10000,
        nextAttack: Infinity,
      });
      return m;
    },
    step(ms) {
      now += ms;
      return farm.step(client, { free: () => false });
    },
  };
}
test("Berserker cone hits current live occupants once, excludes behind/outside, and costs nothing on invalid use", () => {
  const { farm, client, place, step } = fixture(),
    front = place(0, 70),
    side = place(1, 50, 50),
    behind = place(2, -40),
    outside = place(3, 106),
    entrant = place(4, 140);
  const hp = front.hp;
  farm.cast(client, "corte-selvagem", front.id);
  assert.equal(step(299).events.damage.length, 0);
  entrant.x = client.x + 60;
  entrant.y = client.y + 10;
  const hits = step(1).events.damage.filter((d) => d.source === 1);
  assert.deepEqual(
    hits.map((d) => d.target).sort((a, b) => a - b),
    [front.id, side.id, entrant.id].sort((a, b) => a - b),
  );
  assert.equal(new Set(hits.map((d) => d.target)).size, 3);
  assert.ok(front.hp < hp);
  assert.equal(behind.hp, hp);
  assert.equal(outside.hp, hp);
  assert.equal(
    step(50).events.damage.filter((d) => d.skillId === "corte-selvagem").length,
    0,
  );
  const mana = farm.character.progress.mana;
  assert.throws(
    () => farm.cast(client, "corte-selvagem", front.id),
    /cooldown/,
  );
  assert.equal(farm.character.progress.mana, mana);
});
test("Orc rupture uses warrior landing timing and resolves the area at landing", () => {
  const { farm, client, place, step } = fixture(),
    near = place(0, 60),
    back = place(1, -149),
    out = place(2, 151),
    enter = place(3, 180),
    leave = place(4, 80);
  const result = farm.cast(client, "ruptura-da-terra", near.id);
  assert.equal(result.events.casts[0].dest.x, client.x * 10);
  assert.equal(step(549).events.damage.length, 0);
  enter.x = client.x + 120;
  leave.x = client.x + 170;
  const hits = step(1).events.damage.filter((d) => d.source === 1);
  assert.deepEqual(
    hits.map((d) => d.target).sort((a, b) => a - b),
    [near.id, back.id, enter.id].sort((a, b) => a - b),
  );
  assert.equal(out.hp, 10000);
  assert.equal(leave.hp, 10000);
});
test("War cry and ultimate give independent attack speed without inflating per-hit attack and clear on exit", () => {
  const { farm, client, place, step } = fixture(),
    base = farm.character.derived.atk;
  farm.cast(client, BERSERKER_CRY.id, 0);
  assert.equal(farm.character.derived.attackCooldown, 1);
  step(300);
  assert.equal(farm.character.derived.atk, base);
  assert.ok(Math.abs(farm.character.derived.attackCooldown - 1 / 1.3) < 1e-10);
  assert.ok(farm.activeBuffs().some((b) => b.id === BERSERKER_CRY.id));
  step(300);
  farm.cast(client, BERSERKER_ULTIMATE.id, 0);
  assert.equal(farm.avatar.saved.charge, 0);
  assert.equal(farm.avatar.active(), false);
  step(300);
  assert.equal(farm.avatar.active(), true);
  assert.ok(
    Math.abs(farm.character.derived.attackCooldown - 1 / (1.3 * 1.5)) < 1e-10,
  );
  assert.equal(farm.character.derived.atk, base);
  assert.equal(farm.activeBuffs().length, 2);
  step(300);
  client.hunt.nextAttack = 0;
  const m = place(0, 60);
  const basic = farm.basic(client, m.id);
  assert.equal(basic.events.moves[0].durationMs, Math.round(400 / (1.3 * 1.5)));
  assert.match(basic.events.moves[0].move, /^orc-/);
  farm.stop(client);
  assert.equal(farm.avatar.active(), false);
  assert.equal(farm.warCryUntil, 0);
  assert.equal(farm.character.derived.attackCooldown, 1);
  assert.deepEqual(farm.activeBuffs(), []);
});
test("Orc buff expires independently and real basic hits/received damage charge its ultimate", () => {
  const { farm, client, place, step } = fixture();
  farm.avatar.saved.charge = 0;
  farm.cast(client, BERSERKER_CRY.id, 0);
  step(600);
  client.hunt.nextAttack = 0;
  const m = place(0, 55);
  farm.basic(client, m.id);
  step(116);
  assert.ok(farm.avatar.saved.charge > 0);
  assert.equal(farm.character.derived.atk, 17);
  for (const m of client.hunt.monsters) m.hp = 0;
  const output = step(30000);
  assert.ok(
    output.events.buffs.some((b) => b.buffId === BERSERKER_CRY.id && b.removed),
  );
  assert.equal(farm.character.derived.attackCooldown, 1);
});
test("class switching preserves earned data and independent skill preferences, returns male Orc identity, and stays city-only", () => {
  const { farm, client, account } = fixture();
  assert.throws(() => farm.changeClass(client, "guerreiro"), /city_only/);
  farm.stop(client);
  account.character.automation.skillOrder = ["corte-selvagem"];
  const inventory = JSON.stringify({
    bag: account.bag,
    warehouse: account.warehouse,
    equipment: account.character.equipment,
    wallet: account.character.wallet,
    progress: account.character.progress.xp,
  });
  farm.changeClass(client, "guerreiro");
  account.character.automation.skillOrder = ["impacto-de-luz"];
  farm.changeClass(client, "arqueira");
  farm.changeClass(client, "pistoleira");
  farm.changeClass(client, "berserker");
  assert.deepEqual(account.character.automation.skillOrder, ["corte-selvagem"]);
  assert.equal(account.character.identity.skinId, "orc-berserker");
  assert.equal(account.character.identity.gender, 1);
  assert.equal(
    JSON.stringify({
      bag: account.bag,
      warehouse: account.warehouse,
      equipment: account.character.equipment,
      wallet: account.character.wallet,
      progress: account.character.progress.xp,
    }),
    inventory,
  );
});
test("Orc inherits approved warrior action mechanics, has fixed 30 percent larger scale and a red universal Dash", () => {
  const warrior = warriorRig({ moves: {}, basic: {}, skills: {} }),
    before = structuredClone(warrior),
    rig = berserkerRig(warrior);
  assert.deepEqual(warrior, before);
  for (const [id, action] of Object.entries(BERSERKER_ACTIONS)) {
    const move = rig.moves[action.move];
    assert.equal(move.frames.length * 50, action.duration);
    assert.deepEqual(move.impacts, [action.impact]);
  }
  assert.deepEqual(
    rig.moves["orc-ruptura"].motion.jump,
    warrior.moves["humano-impacto-luz"].motion.jump,
  );
  assert.equal(rig.moves["orc-esquiva"].motion?.trail, undefined);
  for (const native of [
    { scaleX: 2, scaleY: 2 },
    { scaleX: 1.8, scaleY: 2.2 },
  ])
    assert.deepEqual(characterDisplayScale("berserker", native), {
      x: 0.65,
      y: 0.65,
    });
  assert.equal(classVisuals("berserker").trailColor, 0xff5148);
  assert.equal(classVisuals("berserker").dashMove, "orc-esquiva");
});

test("Orc whole-figure atlases have full crowns/boots, transparent margins and shared neutral poses", async () => {
  const { readFileSync } = await import("node:fs"),
    { decodeRgba } = await import("../png.mjs");
  const read = (name) =>
      decodeRgba(
        readFileSync(
          new URL(`../art/berserker/hd/${name}.png`, import.meta.url),
        ),
      ),
    idle = read("idle");
  const frame = (im, row, col) => {
    const data = Buffer.alloc(384 * 384 * 4);
    for (let y = 0; y < 384; y++)
      Buffer.from(
        im.pixels.buffer,
        im.pixels.byteOffset + ((row * 384 + y) * im.width + col * 384) * 4,
        384 * 4,
      ).copy(data, y * 384 * 4);
    return data;
  };
  for (const [name, cols] of [
    ["idle", 4],
    ["walk", 8],
    ["run1", 8],
    ["weapon", 6],
    ["axeheavy", 8],
    ["special", 6],
  ]) {
    const im = read(name);
    assert.equal(im.width, cols * 384);
    assert.equal(im.height, 1536);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < cols; col++) {
        const pixels = frame(im, row, col);
        let ink = 0,
          minX = 384,
          maxX = 0,
          minY = 384,
          maxY = 0;
        for (let y = 0; y < 384; y++)
          for (let x = 0; x < 384; x++)
            if (pixels[(y * 384 + x) * 4 + 3] > 80) {
              ink++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
        assert.ok(ink > 3000, `${name}/${row}/${col} whole character`);
        assert.ok(
          minX > 2 && maxX < 381 && minY > 2 && maxY < 381,
          `${name}/${row}/${col} uncropped crown/boots/axe`,
        );
        if (
          name === "idle" ||
          (name === "weapon" && [0, 5].includes(col)) ||
          (name === "special" && [0, 1, 3].includes(col)) ||
          (name === "axeheavy" && [0, 5, 6, 7].includes(col))
        )
          assert.deepEqual(
            pixels,
            frame(idle, row, 0),
            "exact same neutral model",
          );
      }
  }
});
test("Orc effects have sixteen distinct red frames and transparent padding; masks match the larger displayed model", async () => {
  const { readFileSync } = await import("node:fs"),
    { decodeRgba } = await import("../png.mjs"),
    { createHash } = await import("node:crypto");
  for (const name of ["cleave", "quake"]) {
    const im = decodeRgba(
      readFileSync(
        new URL(`../art/berserker/vfx/${name}.png`, import.meta.url),
      ),
    );
    assert.equal(im.width, 640);
    assert.equal(im.height, 640);
    const hashes = [];
    let red = 0,
      ink = 0;
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const buffer = Buffer.alloc(160 * 160 * 4);
        for (let y = 0; y < 160; y++)
          for (let x = 0; x < 160; x++) {
            const i = ((row * 160 + y) * 640 + col * 160 + x) * 4,
              j = (y * 160 + x) * 4;
            for (let c = 0; c < 4; c++) buffer[j + c] = im.pixels[i + c];
            if (x < 16 || x >= 144 || y < 16 || y >= 144)
              assert.equal(im.pixels[i + 3], 0);
            const [r, g, b, a] = im.pixels.subarray(i, i + 4);
            if (a > 80) {
              ink++;
              if (r > g * 1.5 && r > b * 1.3) red++;
            }
          }
        hashes.push(createHash("sha256").update(buffer).digest("hex"));
      }
    assert.equal(new Set(hashes).size, 16);
    assert.ok(red > ink * 0.6, "red is the predominant class energy");
  }
  for (const sheet of [
    "idle",
    "walk",
    "run1",
    "weapon",
    "axeheavy",
    "special",
  ]) {
    const base = decodeRgba(
        readFileSync(
          new URL(`../art/berserker/hd/${sheet}.png`, import.meta.url),
        ),
      ),
      surface = decodeRgba(
        readFileSync(
          new URL(
            `../art/energy/berserker/${sheet}-surface.png`,
            import.meta.url,
          ),
        ),
      ),
      contour = decodeRgba(
        readFileSync(
          new URL(
            `../art/energy/berserker/${sheet}-contour.png`,
            import.meta.url,
          ),
        ),
      );
    assert.equal(surface.width, base.width);
    assert.equal(surface.height, base.height);
    assert.equal(contour.width, base.width);
    for (let i = 3; i < base.pixels.length; i += 4)
      assert.ok(surface.pixels[i] <= base.pixels[i]);
  }
});
