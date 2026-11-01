import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoyalHunt } from "../royal-hunt.mjs";
import { LocalFarm } from "../farm.mjs";

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
    [848, 976],
    [1040, 976],
    [944, 1072],
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
  client.x = 208;
  client.y = 400;
  farm.character.automation.skillOrder = [];
  const seen = new Set(client.hunt.monsters.map((m) => m.id));
  for (let cycle = 0; cycle < 50; cycle++) {
    const old = client.hunt.monsters.map((m) => m.id);
    for (const m of client.hunt.monsters)
      farm.hit(client.hunt, m, 9999, "", farm.events(), []);
    now += 2999;
    assert.equal(
      farm.step(client).spawned.length,
      0,
      "must respect the respawn delay",
    );
    now++;
    const update = farm.step(client);
    assert.deepEqual(update.despawned, old);
    assert.equal(update.spawned.length, 3);
    for (const m of update.spawned) {
      assert.ok(
        !seen.has(m.id),
        "an old animation must not refer to a new life",
      );
      assert.equal(m.hp, m.maxHp);
      assert.equal(m.anim, 0);
      seen.add(m.id);
    }
    assert.equal(new Set(client.hunt.monsters.map((m) => m.id)).size, 3);
  }
  assert.equal(seen.size, 153);
  assert.equal(client.hunt.session.kills, 150);
  const kills = client.hunt.session.kills;
  farm.stop(client);
  now += 60000;
  assert.equal(farm.step(client).spawned.length, 0);
  assert.equal(kills, 150);
});
