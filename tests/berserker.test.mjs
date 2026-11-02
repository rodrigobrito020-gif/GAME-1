import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalFarm } from "../farm.mjs";
import {
  BERSERKER_ACTIONS,
  BERSERKER_ADVANCE,
  BERSERKER_CRY,
  BERSERKER_SPIN,
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
    step(ms, options = { free: () => false }) {
      now += ms;
      return farm.step(client, options);
    },
  };
}
test("Orc first-slot advance travels in eight directions and hits only its target on arrival", () => {
  for (const [dx, dy] of [
    [260, 0],
    [-260, 0],
    [0, 260],
    [0, -260],
    [180, 180],
    [-180, 180],
    [180, -180],
    [-180, -180],
  ]) {
    const { farm, client, place, step } = fixture(),
      target = place(0, dx, dy),
      side = place(1, 70, 20),
      from = { x: client.x, y: client.y },
      distance = Math.hypot(dx, dy);
    const result = farm.cast(client, BERSERKER_ADVANCE.id, target.id);
    assert.equal(result.events.damage.length, 0);
    assert.equal(client.x, from.x);
    const hits = [];
    for (let i = 0; i < 6; i++) {
      const out = step(50, { free: () => true });
      hits.push(
        ...out.events.damage.filter((d) => d.skillId === BERSERKER_ADVANCE.id),
      );
      if (i < 5) assert.equal(hits.length, 0);
      if (i === 2)
        assert.ok(Math.hypot(client.x - from.x, client.y - from.y) > 5);
    }
    assert.ok(
      Math.abs(
        client.x -
          from.x -
          (dx / distance) * (distance - BERSERKER_ADVANCE.stopDistance),
      ) < 1e-6,
    );
    assert.ok(
      Math.abs(
        client.y -
          from.y -
          (dy / distance) * (distance - BERSERKER_ADVANCE.stopDistance),
      ) < 1e-6,
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0].target, target.id);
    assert.equal(hits[0].amount, Math.round(farm.character.derived.atk * 2.2));
    assert.equal(side.hp, 10000);
    assert.equal(client.hunt.dash, null);
  }
});
test("spin pulses resolve live occupants around the actual Orc, not a saved cast area", () => {
  const { farm, client, place, step } = fixture(),
    near = place(0, 60),
    back = place(1, -109),
    outside = place(2, 111),
    enter = place(3, 180),
    leave = place(4, 80);
  farm.cast(client, BERSERKER_SPIN.id, near.id);
  assert.equal(step(399).events.damage.length, 0);
  enter.x = client.x + 100;
  leave.x = client.x + 170;
  const hits = step(1).events.damage.filter(
    (d) => d.skillId === BERSERKER_SPIN.id,
  );
  assert.deepEqual(
    hits.map((d) => d.target).sort((a, b) => a - b),
    [near.id, back.id, enter.id].sort((a, b) => a - b),
  );
  assert.equal(outside.hp, 10000);
  assert.equal(leave.hp, 10000);
  // Move the real authoritative body between pulses: old occupants leave area.
  client.x += 300;
  enter.x = client.x + 70;
  const next = step(400).events.damage.filter(
    (d) => d.skillId === BERSERKER_SPIN.id,
  );
  assert.deepEqual(
    next.map((d) => d.target),
    [enter.id],
  );
  const all = [...hits, ...next];
  for (let i = 0; i < 3; i++)
    all.push(
      ...step(400).events.damage.filter((d) => d.skillId === BERSERKER_SPIN.id),
    );
  assert.equal(all.filter((d) => d.target === enter.id).length, 5);
  assert.equal(all.filter((d) => d.target === near.id).length, 1);
  assert.ok(
    all.every((d) => d.amount === Math.round(farm.character.derived.atk * 0.5)),
  );
});
test("spin pursues, retargets, stops before the enemy, respects walls and ends without residual damage", () => {
  const { farm, client, place, step } = fixture(),
    first = place(0, 290),
    second = place(1, 0, 250),
    from = { x: client.x, y: client.y };
  farm.cast(client, BERSERKER_SPIN.id, first.id);
  const free = (x, y) => x < from.x + 60;
  for (let i = 0; i < 12; i++) step(50, { free });
  assert.ok(client.x > from.x + 30 && client.x < from.x + 60);
  first.hp = 0;
  for (let i = 0; i < 8; i++) step(50, { free });
  assert.equal(client.hunt.spin.target, second.id);
  assert.ok(client.y > from.y + 20);
  for (let i = 0; i < 28; i++) step(50, { free });
  assert.equal(client.hunt.spin, null);
  assert.equal(
    client.hunt.impacts.some((p) => p.spin),
    false,
  );
  assert.equal(
    client.hunt.berserkerFx.some((f) => f.kind === "spin"),
    false,
  );
  assert.equal(
    farm.skills.find((s) => s.id === BERSERKER_SPIN.id).cooldownMs,
    8000,
  );
});
test("automatic spin starts from range and leaving or dying cancels its pending pulses", () => {
  for (const mode of ["exit", "death"]) {
    const { farm, client, place, step } = fixture(),
      m = place(0, 260);
    farm.character.automation.skillOrder = [BERSERKER_SPIN.id];
    const cast = step(50, { free: () => true });
    assert.ok(cast.events.casts.some((c) => c.skillId === BERSERKER_SPIN.id));
    assert.ok(client.hunt.spin);
    if (mode === "exit") farm.stop(client);
    else {
      farm.character.progress.hp = 1;
      m.x = client.x + 40;
      m.y = client.y;
      m.nextAttack = 0;
      assert.equal(step(50).died, true);
      assert.equal(client.hunt.spin, null);
      assert.equal(client.hunt.impacts.length, 0);
    }
    for (let i = 0; i < 50; i++)
      assert.equal(
        step(50).events.damage.some((d) => d.skillId === BERSERKER_SPIN.id),
        false,
      );
    assert.equal(m.hp, 10000);
  }
});
test("War cry only speeds attacks; fury adds attack and speed independently and clears on exit", () => {
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
  assert.equal(farm.character.derived.atk, Math.round(base * 1.3));
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
  assert.equal(farm.character.derived.atk, base);
  assert.equal(farm.character.derived.moveSpeed, 160);
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
    assert.deepEqual(
      move.impacts,
      id === BERSERKER_SPIN.id ? [400, 800, 1200, 1600, 2000] : [action.impact],
    );
  }
  assert.deepEqual(rig.moves["orc-machado"].frames[3], ["weapon", 2]);
  assert.deepEqual(rig.moves["orc-retorno"].frames[3], ["weapon", 4]);
  assert.deepEqual(rig.moves["orc-avanco"].frames[6], ["weapon", 2]);
  assert.equal(rig.moves["orc-ruptura"].motion.jump, undefined);
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
          (name === "special" && [0, 1, 3].includes(col))
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

test("advance rejects close/far/blocked targets without spending resources; dynamic walls and target death cancel damage", () => {
  for (const d of [159, 301]) {
    const { farm, client, place } = fixture(),
      m = place(0, d),
      mana = farm.character.progress.mana;
    assert.throws(
      () => farm.cast(client, BERSERKER_ADVANCE.id, m.id),
      /target_too_close|invalid_target/,
    );
    assert.equal(farm.character.progress.mana, mana);
    assert.equal(client.hunt.cooldowns[BERSERKER_ADVANCE.id], undefined);
  }
  {
    const { farm, client, place } = fixture(),
      m = place(0, 260),
      mana = farm.character.progress.mana;
    assert.throws(
      () =>
        farm.cast(client, BERSERKER_ADVANCE.id, m.id, undefined, undefined, {
          free: (x) => x < client.x + 80,
        }),
      /invalid_target/,
    );
    assert.equal(farm.character.progress.mana, mana);
    assert.equal(client.hunt.dash, undefined);
  }
  for (const cancel of ["wall", "death", "exit"]) {
    const { farm, client, place, step } = fixture(),
      m = place(0, 260),
      start = client.x;
    farm.cast(client, BERSERKER_ADVANCE.id, m.id);
    step(100, { free: () => true });
    if (cancel === "death") m.hp = 0;
    if (cancel === "exit") farm.stop(client);
    const out = step(200, { free: (x) => cancel !== "wall" || x < start + 90 });
    assert.equal(
      out.events.damage.filter((d) => d.skillId === BERSERKER_ADVANCE.id)
        .length,
      0,
    );
    if (cancel === "wall") assert.ok(client.x < start + 90);
  }
});
test("automatic melee opener advances at range and never stalls basic attacks nearby", () => {
  const { farm, client, place, step } = fixture(),
    m = place(0, 260);
  farm.character.automation.skillOrder = [BERSERKER_ADVANCE.id];
  const out = step(50, { free: () => true });
  assert.ok(out.events.casts.some((c) => c.skillId === BERSERKER_ADVANCE.id));
  assert.ok(client.hunt.dash);
  step(550, { free: () => true });
  const near = step(1000, { free: () => true });
  assert.ok(!near.events.casts.some((c) => c.skillId === BERSERKER_ADVANCE.id));
  assert.ok(
    near.events.moves.some((c) => /^orc-(machado|retorno)$/.test(c.move)),
  );
  assert.ok(m.hp < 10000);
});
test("fury lasts exactly one minute and the three-minute cooldown survives restart", () => {
  const { farm, client, account, step } = fixture(),
    start = farm.now();
  farm.cast(client, BERSERKER_ULTIMATE.id, 0);
  assert.equal(farm.avatar.saved.readyAt, start + 180000);
  step(300);
  assert.equal(farm.avatar.state(client).activeMs, 60000);
  assert.equal(farm.character.derived.moveSpeed, 300);
  assert.ok(Math.abs(farm.character.derived.hpRegen - 5.6) < 1e-10);
  assert.equal(farm.character.derived.atk, 22);
  step(59999);
  assert.equal(farm.avatar.active(), true);
  const end = step(1);
  assert.ok(
    end.events.buffs.some(
      (b) => b.buffId === BERSERKER_ULTIMATE.id && b.removed,
    ),
  );
  assert.equal(farm.character.derived.atk, 17);
  assert.equal(farm.character.derived.moveSpeed, 160);
  assert.equal(farm.character.derived.hpRegen, 0);
  assert.equal(farm.character.derived.attackCooldown, 1);
  farm.avatar.gain(100);
  assert.throws(() => farm.cast(client, BERSERKER_ULTIMATE.id, 0), /cooldown/);
  const reloaded = new LocalFarm(account, { now: farm.now });
  assert.equal(reloaded.avatar.saved.readyAt, start + 180000);
  step(119699);
  assert.throws(() => farm.cast(client, BERSERKER_ULTIMATE.id, 0), /cooldown/);
  step(1);
  assert.equal(farm.avatar.state(client).cooldownMs, 0);
});
test("fury regeneration starts on a real one-second tick, carries fractions, caps at max and never banks full-health healing", () => {
  const { farm, client, step } = fixture();
  farm.character.progress.hp = 1;
  farm.cast(client, BERSERKER_ULTIMATE.id, 0);
  step(300);
  assert.equal(step(999).events.heals.length, 0);
  const first = step(1);
  assert.equal(first.events.heals[0].amount, 5);
  assert.equal(farm.character.progress.hp, 6);
  const delayed = step(4000);
  assert.equal(delayed.events.heals[0].amount, 23);
  assert.equal(farm.character.progress.hp, 29);
  farm.character.progress.hp = 279;
  assert.equal(step(1000).events.heals[0].amount, 1);
  assert.equal(farm.character.progress.hp, 280);
  assert.equal(step(10000).events.heals.length, 0);
  farm.character.progress.hp = 10;
  const one = step(1000);
  assert.ok(one.events.heals[0].amount <= 6);
  assert.ok(farm.character.progress.hp <= 16);
  step(43000);
  assert.equal(farm.avatar.active(), false);
  farm.character.progress.hp = 10;
  assert.equal(step(1000).events.heals.length, 0);
  assert.equal(farm.character.progress.hp, 10);
});
test("fury regeneration cannot revive a dead Orc or continue after leaving hunt or changing class", () => {
  for (const mode of ["death", "exit", "class"]) {
    const { farm, client, step } = fixture();
    farm.character.progress.hp = 10;
    farm.cast(client, BERSERKER_ULTIMATE.id, 0);
    step(300);
    if (mode === "death") {
      farm.character.progress.hp = 0;
      client.hunt.deadAt = farm.now();
    } else {
      farm.stop(client);
      if (mode === "class") farm.changeClass(client, "guerreiro");
    }
    const hp = farm.character.progress.hp,
      out = step(5000);
    assert.equal(out.events.heals.length, 0);
    assert.equal(farm.character.progress.hp, hp);
  }
});
test("fury chases a distant target at a real running speed, ordinary pursuit retains the approved walk", () => {
  for (const fury of [false, true]) {
    const { farm, client, place, step } = fixture();
    if (fury) {
      farm.cast(client, BERSERKER_ULTIMATE.id, 0);
      step(600);
    }
    place(0, 400);
    const start = client.x;
    step(50, { free: () => true });
    assert.ok(Math.abs(client.x - start - (fury ? 15 : 8)) < 0.001);
    assert.equal(farm.character.derived.moveSpeed, fury ? 300 : 160);
  }
});

test("running uses eight distinct whole-body poses per direction with one standing calibration and preserves fixed scale", async () => {
  const { readFileSync } = await import("node:fs"),
    { createHash } = await import("node:crypto"),
    { decodeRgba } = await import("../png.mjs");
  const run = decodeRgba(
      readFileSync(new URL("../art/berserker/hd/run1.png", import.meta.url)),
    ),
    walk = readFileSync(
      new URL("../art/berserker/hd/walk.png", import.meta.url),
    ),
    meta = JSON.parse(
      readFileSync(new URL("../art/berserker/manifest.json", import.meta.url)),
    );
  assert.notDeepEqual(
    readFileSync(new URL("../art/berserker/hd/run1.png", import.meta.url)),
    walk,
    "running is not the walking sheet at another speed",
  );
  for (let row = 0; row < 4; row++) {
    const frames = [];
    for (let col = 0; col < 8; col++) {
      const bytes = Buffer.alloc(384 * 384 * 4);
      for (let y = 0; y < 384; y++)
        Buffer.from(
          run.pixels.buffer,
          run.pixels.byteOffset + ((row * 384 + y) * run.width + col * 384) * 4,
          384 * 4,
        ).copy(bytes, y * 384 * 4);
      frames.push(createHash("sha256").update(bytes).digest("hex"));
    }
    assert.equal(new Set(frames).size, 8);
    const poses = meta.sources.run1.filter((p) => p.row === row);
    assert.equal(new Set(poses.map((p) => p.sourceScale)).size, 1);
    assert.equal(new Set(poses.map((p) => p.sourceBodyHeight)).size, 1);
    assert.ok(poses.every((p) => p.source.startsWith("run-")));
  }
  assert.equal(meta.fixedDisplayScale, 0.65);
  assert.equal(meta.sizeRelativeToWarrior, 1.3);
});
