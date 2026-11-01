import { CHARACTER_ART as ART } from "../character-art.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LocalFarm } from "../farm.mjs";
import { ARCHER_SKILLS, ARCHER_EYES, ARCHER_SPIRIT } from "../archer.mjs";
import { archerFxState } from "../archer-combat.mjs";
import { decodeRgba } from "../png.mjs";
function setup(classId = "arqueira") {
  let clock = 10000;
  const account = {
    farmVersion: 1,
    skillReviewVersion: 4,
    avatarAutomationVersion: 1,
    bag: [{ uid: "kept", defId: "fragmento-local", qty: 3 }],
    warehouse: [{ uid: "stored", defId: "fragmento-local", qty: 8 }],
    character: {
      identity: {
        classId,
        skinId: classId === "arqueira" ? "elfa-arqueira" : "humano-guerreiro",
      },
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: { skillOrder: [] },
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => clock, random: () => 0 }),
    client = {};
  function start() {
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
  }
  start();
  return {
    account,
    farm,
    client,
    start,
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
test("elf class switch is city-only, keeps earned UIDs, equipment, warehouse, currency and XP, and remembers independent skill choices", () => {
  const s = setup("guerreiro"),
    { farm, client, account } = s;
  assert.throws(() => farm.changeClass(client, "arqueira"), /city_only/);
  farm.stop(client);
  farm.character.automation.skillOrder = ["egide-de-luz", "dash"];
  const kept = structuredClone({
    bag: account.bag,
    warehouse: account.warehouse,
    equipment: farm.character.equipment,
    wallet: farm.character.wallet,
    xp: farm.character.progress.xp,
  });
  farm.changeClass(client, "arqueira");
  assert.equal(farm.character.identity.skinId, "elfa-arqueira");
  assert.equal(farm.character.derived.attackRange, 320);
  assert.deepEqual(
    farm.skills.map((s) => s.id),
    [...ARCHER_SKILLS.map((s) => s.id), "dash"],
  );
  farm.automation({ skillOrder: ["tiro-perfurante", "dash"] });
  farm.changeClass(client, "guerreiro");
  assert.deepEqual(farm.character.automation.skillOrder, [
    "egide-de-luz",
    "dash",
  ]);
  farm.changeClass(client, "arqueira");
  assert.deepEqual(farm.character.automation.skillOrder, [
    "tiro-perfurante",
    "dash",
  ]);
  assert.deepEqual(
    {
      bag: account.bag,
      warehouse: account.warehouse,
      equipment: farm.character.equipment,
      wallet: farm.character.wallet,
      xp: farm.character.progress.xp,
    },
    kept,
  );
  const restored = new LocalFarm(JSON.parse(JSON.stringify(account)));
  assert.equal(restored.character.identity.classId, "arqueira");
  assert.deepEqual(restored.character.automation.skillOrder, [
    "tiro-perfurante",
    "dash",
  ]);
});
test("elf basic attack releases an authored arrow, damages only on arrival, and a dead target or scene exit cancels pending damage", () => {
  const s = setup(),
    { farm, client } = s,
    m = s.alive(0, 300);
  client.hunt.nextAttack = 0;
  const cast = farm.basic(client, m.id);
  assert.equal(cast.events.moves[0].move, "elfa-flecha");
  assert.equal(m.hp, 1000);
  assert.equal(client.facing, 2);
  client.hunt.nextAttack = Infinity;
  const due = client.hunt.impacts[0].at - 10000;
  s.step(due - 1);
  assert.equal(m.hp, 1000);
  assert.equal(archerFxState(client, 10000 + due - 1).length, 1);
  s.step(1);
  assert.equal(m.hp, 986);
  assert.equal(farm.avatar.saved.charge, 4);
  s.step(1001);
  client.hunt.nextAttack = 0;
  farm.basic(client, m.id);
  client.hunt.nextAttack = Infinity;
  m.hp = 0;
  assert.equal(s.step(1000).events.damage.length, 0);
  m.hp = 1000;
  s.step(1001);
  client.hunt.nextAttack = 0;
  farm.basic(client, m.id);
  farm.stop(client);
  assert.equal(s.step(1000).events.damage.length, 0);
  assert.equal(archerFxState(client, 99999).length, 0);
});
test("piercing arrow hits each living enemy in its fixed corridor once and excludes enemies outside width/range", () => {
  const s = setup(),
    { farm, client } = s,
    a = s.alive(0, 200),
    b = s.alive(1, 350),
    side = s.alive(2, 200, 55),
    far = s.alive(3, 450);
  const out = farm.cast(client, "tiro-perfurante", a.id);
  assert.equal(out.events.damage.length, 0);
  assert.equal(farm.character.progress.mana, 92);
  const due = client.hunt.impacts[0].at - 10000;
  assert.equal(archerFxState(client, 10000)[0].target, 0);
  s.step(due - 1);
  assert.equal(a.hp, 1000);
  const hits = s.step(1).events.damage.filter((d) => d.source === 1);
  assert.deepEqual(
    hits.map((d) => d.target),
    [a.id, b.id],
  );
  assert.ok(hits.every((d) => d.amount === 28));
  assert.equal(side.hp, 1000);
  assert.equal(far.hp, 1000);
  assert.equal(
    s.step(50).events.damage.filter((d) => d.source === 1).length,
    0,
  );
  assert.throws(
    () => farm.cast(client, "impacto-de-luz", a.id),
    /invalid_skill/,
  );
});
test("rain persists for three authoritative area impacts after the original target dies, catches arrivals and excludes departures", () => {
  const s = setup(),
    { farm, client } = s,
    a = s.alive(0, 200),
    b = s.alive(1, 250),
    out = s.alive(2, 400);
  farm.cast(client, "chuva-de-flechas", a.id);
  a.hp = 0;
  s.step(599);
  assert.equal(b.hp, 1000);
  let hits = s.step(1).events.damage.filter((d) => d.source === 1);
  assert.deepEqual(
    hits.map((d) => d.target),
    [b.id],
  );
  b.x = client.x + 500;
  out.x = client.x + 220;
  s.step(550);
  assert.equal(b.hp, 990);
  assert.equal(out.hp, 990);
  s.step(550);
  assert.equal(out.hp, 980);
  assert.equal(farm.character.progress.mana, 85);
});
test("Eyes and Spirit coexist with independent remaining durations, boost actual attack, expire separately and clear on exit", () => {
  const s = setup(),
    { farm, client } = s;
  farm.cast(client, ARCHER_EYES.id, 0);
  s.step(300);
  assert.equal(farm.character.derived.atk, 17);
  s.step(350);
  farm.avatar.saved.charge = 100;
  farm.cast(client, ARCHER_SPIRIT.id, 0);
  s.step(300);
  assert.equal(farm.character.derived.atk, 23);
  assert.deepEqual(
    farm.activeBuffs().map((b) => b.id),
    [ARCHER_EYES.id, ARCHER_SPIRIT.id],
  );
  assert.equal(farm.avatar.saved.charge, 0);
  assert.equal(farm.activeBuffs()[1].remainingMs, 45000);
  s.step(45000);
  assert.deepEqual(
    farm.activeBuffs().map((b) => b.id),
    [ARCHER_EYES.id],
  );
  assert.equal(farm.character.derived.atk, 17);
  assert.throws(
    () => farm.cast(client, ARCHER_EYES.id, 0),
    /cooldown|buff_active/,
  );
  farm.stop(client);
  assert.equal(farm.activeBuffs().length, 0);
  assert.equal(farm.character.derived.atk, 14);
  assert.equal(farm.avatar.saved.readyAt, 10650 + 60000);
});
test("warrior Aegis and Avatar coexist above the head and removing Avatar leaves Aegis intact", () => {
  const s = setup("guerreiro"),
    { farm, client } = s;
  farm.cast(client, "egide-de-luz", 0);
  s.step(300);
  s.step(350);
  farm.avatar.saved.charge = 100;
  farm.cast(client, "avatar-da-luz", 0);
  s.step(300);
  const buffs = farm.activeBuffs();
  assert.deepEqual(
    buffs.map((b) => b.id),
    ["egide-de-luz", "avatar-da-luz"],
  );
  assert.ok(buffs.every((b) => b.icon && b.name && b.remainingMs > 0));
  s.step(45000);
  assert.deepEqual(
    farm.activeBuffs().map((b) => b.id),
    ["egide-de-luz"],
  );
});
test("elf sheets provide all four directions in native and HD sizes, transparent gutters and distinct aiming poses", () => {
  for (const [name, cols] of [
    ["idle", 4],
    ["walk", 4],
    ["run1", 4],
    ["weapon", 6],
    ["special", 6],
  ])
    for (const [folder, size] of [
      ["", 64],
      ["hd/", ART.frame],
    ]) {
      const im = decodeRgba(
        readFileSync(
          new URL(`../art/archer/${folder}${name}.png`, import.meta.url),
        ),
      );
      assert.equal(
        im.width,
        cols * size * (folder && ["walk", "run1"].includes(name) ? 2 : 1),
      );
      assert.equal(im.height, 4 * size);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < cols; col++) {
          let opaque = 0;
          for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
              const alpha =
                im.pixels[
                  ((row * size + y) * im.width + col * size + x) * 4 + 3
                ];
              opaque += alpha > 0;
              if (y === 0 || x === 0 || x === size - 1)
                assert.equal(alpha, 0, `${name} ${row}:${col} gutter`);
            }
          assert.ok(opaque > 300);
        }
    }
});

test("Spirit speeds up authoritative basic shots, reduces incoming damage, and death clears all elf buffs and pending projectiles", () => {
  const s = setup(),
    { farm, client } = s;
  farm.avatar.saved.charge = 100;
  farm.cast(client, ARCHER_SPIRIT.id, 0);
  s.step(650);
  const m = s.alive(0, 0, 30);
  m.aggro = true;
  m.nextAttack = 0;
  m.role = "melee";
  client.hunt.area = { ...client.hunt.area, damage: 100 };
  const out = s.step(1);
  assert.equal(out.events.damage.find((d) => d.target === 1).amount, 85);
  m.nextAttack = Infinity;
  s.step(200);
  client.hunt.nextAttack = 0;
  farm.basic(client, m.id);
  assert.equal(client.hunt.nextAttack, 10000 + 651 + 200 + 700);
  farm.character.progress.hp = 1;
  m.nextAttack = 0;
  const death = s.step(1);
  assert.equal(death.died, true);
  assert.equal(farm.activeBuffs().length, 0);
  assert.equal(client.hunt.impacts.length, 0);
  assert.equal(client.hunt.archerFx.length, 0);
  assert.equal(farm.avatar.saved.charge, 0);
});
