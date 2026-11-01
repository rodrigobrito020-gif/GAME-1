import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoyalHunt } from "../royal-hunt.mjs";
import { LocalFarm, MONSTER_HOMES, RESPAWN_DELAY_MS } from "../farm.mjs";

test("royal hunt has an original atlas, an enclosed connected floor, and clear player/monster spawn positions", () => {
  const { map, texture } = createRoyalHunt();
  assert.equal(map.width * map.height, map.collisions.length);
  assert.equal(map.layers[0].data.length, map.collisions.length);
  assert.equal(map.tilesets[0].src, "tilesets/patio.svg");
  const origin = 31 * 60 + 29,
    reached = new Set([origin]),
    queue = [origin];
  for (let n = 0; n < queue.length; n++)
    for (const d of [-1, 1, -60, 60]) {
      const i = queue[n] + d;
      if (
        i < 0 ||
        i >= map.collisions.length ||
        Math.abs((i % 60) - (queue[n] % 60)) > 1 ||
        map.collisions[i] ||
        reached.has(i)
      )
        continue;
      reached.add(i);
      queue.push(i);
    }
  for (const [x, y] of [
    [944, 1008],
    ...MONSTER_HOMES.map((p) => [p.x, p.y]),
    [960, 768],
  ])
    assert.ok(reached.has(Math.floor(y / 32) * 60 + Math.floor(x / 32)));
  for (let x = 0; x < 60; x++) {
    assert.equal(map.collisions[x], 1);
    assert.equal(map.collisions[47 * 60 + x], 1);
  }
  assert.match(texture(), /data:image\/png;base64,/);
  assert.doesNotMatch(texture(), /praca-local|halloween|metro_/);
});

test("successive monster lives always get fresh IDs so delayed death/fade effects cannot hide revived enemies", () => {
  let now = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
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
  client.x = -1000;
  client.y = -1000;
  farm.character.automation.skillOrder = [];
  const seen = new Set(client.hunt.monsters.map((m) => m.id));
  for (let cycle = 0; cycle < 50; cycle++) {
    const old = client.hunt.monsters.map((m) => m.id);
    for (const m of client.hunt.monsters)
      farm.hit(client.hunt, m, 9999, "", farm.events(), []);
    now += RESPAWN_DELAY_MS - 1;
    assert.equal(
      farm.step(client, { free: () => false }).spawned.length,
      0,
      "must respect the respawn delay",
    );
    now += 8001;
    const update = farm.step(client, { free: () => false });
    assert.deepEqual(update.despawned, old);
    assert.equal(update.spawned.length, MONSTER_HOMES.length);
    for (const m of update.spawned) {
      assert.ok(
        !seen.has(m.id),
        "an old animation must not refer to a new life",
      );
      assert.equal(m.hp, m.maxHp);
      assert.equal(m.anim, 0);
      seen.add(m.id);
    }
    assert.equal(
      new Set(client.hunt.monsters.map((m) => m.id)).size,
      MONSTER_HOMES.length,
    );
  }
  assert.equal(seen.size, 51 * MONSTER_HOMES.length);
  assert.equal(client.hunt.session.kills, 50 * MONSTER_HOMES.length);
  const kills = client.hunt.session.kills;
  farm.stop(client);
  now += 60000;
  assert.equal(farm.step(client, { free: () => false }).spawned.length, 0);
  assert.equal(kills, 50 * MONSTER_HOMES.length);
});

test("hunt seeks the nearest living enemy between actions and keeps distant monsters in their regions", () => {
  let now = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: {},
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now }),
    client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  farm.character.automation.skillOrder = []; // Test ordinary approach without a committed gap closer.
  const distance = (m) => Math.hypot(m.x - client.x, m.y - client.y);
  const expected = [...client.hunt.monsters].sort(
    (a, b) => distance(a) - distance(b),
  )[0];
  farm.step(client);
  assert.equal(client.hunt.target, expected.id);
  const nearer = client.hunt.monsters.find((m) => m.id !== expected.id);
  nearer.x = client.x + 80;
  nearer.y = client.y;
  now += 50;
  farm.step(client);
  assert.equal(
    client.hunt.target,
    nearer.id,
    "reconsider proximity while approaching, before committing a strike",
  );
  const remote = client.hunt.monsters[3],
    home = { ...remote.home };
  assert.deepEqual(
    { x: remote.x, y: remote.y },
    home,
    "distant enemies must not all chase the spawn",
  );
});

test("a full minute of automatic hunting travels across the courtyard instead of fighting only at the center", () => {
  let now = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: {},
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now, random: () => 0 }),
    client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  const { map } = createRoyalHunt(),
    free = (x, y) =>
      map.collisions[Math.floor(y / 32) * map.width + Math.floor(x / 32)] === 0;
  let minX = client.x,
    maxX = client.x,
    minY = client.y,
    maxY = client.y;
  for (let n = 0; n < 1200; n++) {
    now += 50;
    const out = farm.step(client, { free });
    assert.ok(!out.died);
    minX = Math.min(minX, client.x);
    maxX = Math.max(maxX, client.x);
    minY = Math.min(minY, client.y);
    maxY = Math.max(maxY, client.y);
    assert.ok(free(client.x, client.y));
    for (const m of client.hunt.monsters)
      assert.ok(
        Math.hypot(m.x - m.home.x, m.y - m.home.y) <= 224,
        "home leash prevents gathering every monster at the center",
      );
  }
  assert.ok(
    maxX - minX > 1000 && maxY - minY > 500,
    "combat must reach different map regions",
  );
  assert.ok(client.hunt.session.kills >= 10);
});

test("empty hunt patrols and respects the longer staggered respawn instead of instantly restoring the enemies", () => {
  let now = 10000;
  const account = {
    character: {
      progress: { level: 1, xp: 0, hp: 250, mana: 100 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1000 },
      inventory: {},
      automation: {},
      consumables: {},
      hunt: {},
    },
  };
  const farm = new LocalFarm(account, { now: () => now }),
    client = {};
  farm.start(client, {
    gateId: "treino-local",
    tierMin: 1,
    difficulty: "normal",
  });
  for (const monster of client.hunt.monsters)
    farm.hit(client.hunt, monster, 99999, "", farm.events(), []);
  const start = { x: client.x, y: client.y };
  now += 50;
  assert.equal(farm.step(client).spawned.length, 0);
  assert.equal(client.hunt.target, 0);
  assert.equal(client.moving, true);
  assert.ok(Math.hypot(client.x - start.x, client.y - start.y) > 0);
  now = 29999;
  assert.equal(farm.step(client).spawned.length, 0);
  now = 30000;
  const first = farm.step(client).spawned;
  assert.equal(
    first.length,
    3,
    "only the first staggered homes respawn at twenty seconds",
  );
  now = 32000;
  assert.equal(farm.step(client).spawned.length, 3);
});
