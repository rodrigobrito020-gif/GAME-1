import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LocalFarm } from "../farm.mjs";
import {
  GUNSLINGER_CLASS,
  GUNSLINGER_SKIN,
  GUNSLINGER_SKILLS,
  GUNSLINGER_ACTIONS,
  NIGHT_INSTINCT,
  ECLIPSE,
  gunslingerRig,
} from "../gunslinger.mjs";
import { gunslingerFxState } from "../gunslinger-combat.mjs";
import { decodeRgba } from "../png.mjs";
function setup() {
  let clock = 10000;
  const account = {
    farmVersion: 1,
    skillReviewVersion: 4,
    avatarAutomationVersion: 1,
    bag: [{ uid: "kept", qty: 3 }],
    warehouse: [{ uid: "stored", qty: 2 }],
    character: {
      identity: { classId: GUNSLINGER_CLASS, skinId: GUNSLINGER_SKIN },
      progress: { level: 1, xp: 0, hp: 230, mana: 110 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: { skillOrder: [] },
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => clock, random: () => 0.9 }),
    client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (const m of client.hunt.monsters)
    Object.assign(m, {
      hp: 0,
      respawnAt: Infinity,
      nextAttack: Infinity,
      nextSkill: Infinity,
    });
  client.hunt.nextAttack = Infinity;
  client.hunt.nextRegen = Infinity;
  return {
    account,
    farm,
    client,
    step(ms) {
      clock += ms;
      return farm.step(client, { free: () => false });
    },
    alive(i, dx, dy = 0) {
      const m = client.hunt.monsters[i];
      Object.assign(m, {
        hp: 1000,
        maxHp: 1000,
        x: client.x + dx,
        y: client.y + dy,
        home: { x: client.x + dx, y: client.y + dy },
      });
      return m;
    },
  };
}
test("gunslinger alternates two hands and delivers the normal total attack only on the two bullet arrivals", () => {
  const s = setup(),
    { farm, client } = s,
    m = s.alive(0, 200);
  client.hunt.nextAttack = 0;
  const cast = farm.basic(client, m.id);
  assert.equal(cast.events.moves[0].move, "dark-elf-tiros");
  const fx = gunslingerFxState(client, 10000);
  assert.equal(fx.length, 2);
  assert.deepEqual(
    fx.map((f) => f.hand),
    [0, 1],
  );
  assert.deepEqual(
    fx.map((f) => f.releaseMs),
    [150, 350],
  );
  assert.equal(fx[0].x, client.x + 45);
  assert.equal(fx[0].y, client.y - 95);
  assert.equal(fx[1].y, client.y - 95);
  assert.equal(m.hp, 1000);
  client.hunt.nextAttack = Infinity;
  s.step(259);
  assert.equal(m.hp, 1000);
  s.step(71);
  assert.equal(m.hp, 994);
  s.step(220);
  assert.equal(m.hp, 987);
  assert.equal(farm.character.derived.atk, 13);
});
test("piercing shot hits aligned enemies once each, rejects wrong range and does not hit a side bystander", () => {
  const s = setup(),
    { farm, client } = s,
    a = s.alive(0, 150),
    b = s.alive(1, 300),
    side = s.alive(2, 250, 70);
  farm.cast(client, "disparo-sombrio", a.id);
  assert.equal(farm.character.progress.mana, 102);
  assert.equal(gunslingerFxState(client, 10000).length, 1);
  const hit = s.step(500).events.damage;
  assert.deepEqual(
    hit.map((d) => d.target),
    [a.id, b.id],
  );
  assert.equal(a.hp, 971);
  assert.equal(b.hp, 971);
  assert.equal(side.hp, 1000);
  assert.throws(() => farm.cast(client, "disparo-sombrio", a.id), /cooldown/);
  s.step(5000);
  a.x = client.x + 500;
  assert.throws(
    () => farm.cast(client, "disparo-sombrio", a.id),
    /invalid_target/,
  );
});
test("six-shot area burst retains the area after the original target dies and respects enemies leaving the radius", () => {
  const s = setup(),
    { farm, client } = s,
    a = s.alive(0, 150),
    b = s.alive(1, 160),
    out = s.alive(2, 400);
  farm.cast(client, "rajada-do-crepusculo", a.id);
  const fx = gunslingerFxState(client, 10000);
  assert.equal(fx.length, 6);
  assert.deepEqual(
    fx.map((f) => f.hand),
    [0, 1, 0, 1, 0, 1],
  );
  a.hp = 0;
  const hit = s.step(1100).events.damage;
  assert.equal(hit.filter((d) => d.target === b.id).length, 6);
  assert.equal(b.hp, 958);
  assert.equal(out.hp, 1000);
  assert.equal(farm.character.progress.mana, 92);
});
test("Instinct changes actual critical probability and flags, never attack or stacked stats", () => {
  const s = setup(),
    { farm, client } = s,
    m = s.alive(0, 100);
  farm.random = () => 0.2;
  let e = farm.events();
  farm.hit(client.hunt, m, 10, "", e, []);
  assert.equal(e.damage[0].amount, 10);
  assert.equal(e.damage[0].flags, undefined);
  farm.cast(client, NIGHT_INSTINCT.id, 0);
  s.step(300);
  assert.equal(farm.character.derived.crit, 0.3);
  assert.equal(farm.character.derived.atk, 13);
  e = farm.events();
  farm.hit(client.hunt, m, 10, "", e, []);
  assert.equal(e.damage[0].amount, 15);
  assert.equal(e.damage[0].flags, 1);
  s.step(120000);
  assert.throws(() => farm.cast(client, NIGHT_INSTINCT.id, 0), /buff_active/);
  assert.equal(farm.character.derived.crit, 0.3);
  s.step(180001);
  assert.equal(farm.character.derived.crit, 0.05);
});
test("Eclipse and Instinct coexist, use independent timers, speed up actual dual shots and clear on exit", () => {
  const s = setup(),
    { farm, client } = s,
    m = s.alive(0, 200);
  farm.cast(client, NIGHT_INSTINCT.id, 0);
  s.step(650);
  farm.avatar.saved.charge = 100;
  farm.cast(client, ECLIPSE.id, 0);
  s.step(300);
  assert.equal(farm.character.derived.atk, 13);
  assert.equal(farm.character.derived.attackCooldown, 1 / 1.75);
  assert.deepEqual(
    farm.activeBuffs().map((b) => b.id),
    [NIGHT_INSTINCT.id, ECLIPSE.id],
  );
  s.step(300);
  client.hunt.nextAttack = 0;
  farm.basic(client, m.id);
  assert.ok(Math.abs(client.hunt.nextAttack - (11250 + 1000 / 1.75)) < 0.001);
  client.hunt.nextAttack = Infinity;
  s.step(45000);
  assert.equal(farm.character.derived.attackCooldown, 1);
  assert.deepEqual(
    farm.activeBuffs().map((b) => b.id),
    [NIGHT_INSTINCT.id],
  );
  farm.stop(client);
  assert.equal(farm.activeBuffs().length, 0);
  assert.equal(farm.character.derived.crit, 0.05);
  assert.equal(gunslingerFxState(client, 99999).length, 0);
});
test("class switches preserve progress, items, potions and independent manual/automatic selections for all three classes", () => {
  const { account, farm, client } = setup();
  assert.throws(() => farm.changeClass(client, "guerreiro"), /city_only/);
  farm.stop(client);
  const kept = structuredClone({
    bag: account.bag,
    warehouse: account.warehouse,
    wallet: account.character.wallet,
  });
  farm.character.automation.skillOrder = ["disparo-sombrio", "dash"];
  farm.changeClass(client, "arqueira");
  assert.equal(farm.skills[0].id, "tiro-perfurante");
  farm.character.automation.skillOrder = ["olhos-da-floresta"];
  farm.changeClass(client, "guerreiro");
  assert.equal(farm.character.identity.skinId, "humano-guerreiro");
  farm.changeClass(client, GUNSLINGER_CLASS);
  assert.deepEqual(farm.character.automation.skillOrder, [
    "disparo-sombrio",
    "dash",
  ]);
  assert.equal(farm.character.identity.skinId, GUNSLINGER_SKIN);
  assert.deepEqual(
    {
      bag: account.bag,
      warehouse: account.warehouse,
      wallet: account.character.wallet,
    },
    kept,
  );
  assert.equal(farm.skills.length, 5);
  assert.ok(farm.skills.at(-1).icon.includes("royal-gunslinger"));
});
test("gunslinger timing exposes the correct authored firing poses and separate six-shot burst releases", () => {
  const rig = gunslingerRig({ moves: {}, basic: {}, skills: {} });
  for (const a of Object.values(GUNSLINGER_ACTIONS)) {
    const m = rig.moves[a.move];
    assert.equal(m.frames.length * 50, a.durationMs);
    assert.deepEqual(m.impacts, a.releasesMs);
    for (const t of a.releasesMs)
      assert.ok([2, 4].includes(m.frames[t / 50][1]));
  }
  assert.equal(GUNSLINGER_SKILLS.length, 4);
  assert.equal(rig.skills.eclipse.move, "dark-elf-eclipse");
});
test("gunslinger exports whole figures and all native/HD sheets with matching anchors and transparent gutters", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../art/gunslinger/manifest.json", import.meta.url)),
  );
  assert.deepEqual(manifest.feet, [192, 352]);
  assert.equal(manifest.bodyHeight, 224);
  for (const [name, cols] of Object.entries({
    idle: 4,
    walk: 8,
    run1: 8,
    weapon: 6,
    special: 6,
    axeheavy: 8,
  })) {
    const hd = decodeRgba(
      readFileSync(
        new URL(`../art/gunslinger/hd/${name}.png`, import.meta.url),
      ),
    );
    assert.equal(hd.width, cols * 384);
    assert.equal(hd.height, 1536);
    for (const p of manifest.sources[name]) {
      assert.ok(
        p.bounds[0] > 0 &&
          p.bounds[1] > 0 &&
          p.bounds[2] < 384 &&
          p.bounds[3] < 384,
        "no visible figure clipping",
      );
      assert.equal(p.scale, p.sourceScale);
    }
    const native = decodeRgba(
      readFileSync(new URL(`../art/gunslinger/${name}.png`, import.meta.url)),
    );
    assert.equal(
      native.width,
      (name === "walk" || name === "run1" ? 4 : cols) * 64,
    );
    assert.equal(native.height, 256);
  }
  for (const name of [
    "disparo-sombrio",
    "rajada-do-crepusculo",
    "instinto-noturno",
    "eclipse",
    "dash",
  ]) {
    const im = decodeRgba(
      readFileSync(
        new URL(`../art/gunslinger/icons/${name}.png`, import.meta.url),
      ),
    );
    assert.equal(im.width, 256);
    assert.equal(im.height, 256);
  }
});
