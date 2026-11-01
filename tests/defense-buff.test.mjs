import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { decodeRgba } from "../png.mjs";
import { vfxDefinition } from "../warrior-vfx.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIGHT_AEGIS as AEGIS, TeamDefenseBuff } from "../defense-buff.mjs";
import { LocalFarm } from "../farm.mjs";

function team() {
  let now = 10000;
  const buffs = new TeamDefenseBuff({ now: () => now });
  const make = (
    entity,
    kind = "player",
    partyId = "party-a",
    instanceId = "room-a",
    base = 10,
  ) => {
    const character = { progress: { hp: 100 }, derived: { def: base } };
    const member = {
      entity,
      kind,
      partyId,
      instanceId,
      character,
      isAlive: () => character.progress.hp > 0,
      isPresent: () => member.instanceId === instanceId,
      refresh: () => {
        character.derived.def = buffs.defense(character, base);
      },
    };
    return member;
  };
  return {
    buffs,
    make,
    advance(ms) {
      now += ms;
      return buffs.expire();
    },
  };
}
function solo({ order = [] } = {}) {
  let now = 10000;
  const account = {
    farmVersion: 1,
    skillReviewVersion: 4,
    character: {
      progress: { hp: 250, mana: 100, level: 1, xp: 0 },
      derived: {},
      equipment: { slots: [] },
      wallet: { gold: 1234 },
      inventory: {},
      automation: { skillOrder: order },
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
  for (const m of client.hunt.monsters)
    Object.assign(m, { hp: 0, respawnAt: Infinity });
  return {
    account,
    farm,
    client,
    step(ms) {
      now += ms;
      return farm.step(client, { free: () => false });
    },
  };
}

test("aegis protects self, distant party players and companions in the same instance, excluding enemies, strangers and dead allies", () => {
  const { buffs, make } = team(),
    caster = make(1),
    player = make(2),
    companion = make(3, "companion");
  const others = [
    make(4, "enemy"),
    make(5, "player", "party-b"),
    make(6, "player", "party-a", "room-b"),
    make(7),
    make(8),
  ];
  others[3].character.progress.hp = 0;
  others[4].instanceId = "room-c";
  const events = buffs.apply(caster, [
    caster,
    player,
    companion,
    player,
    ...others,
  ]);
  assert.deepEqual(
    events.map((e) => e.entity),
    [1, 2, 3],
  );
  assert.ok(
    events.every(
      (e) => e.buffId === AEGIS.id && e.durationMs === 12000 && !e.removed,
    ),
  );
  for (const m of [caster, player, companion])
    assert.equal(m.character.derived.def, 13);
  for (const m of others) assert.equal(m.character.derived.def, 10);
  caster.partyId = null;
  assert.deepEqual(
    buffs.apply(caster, [player]).map((e) => e.entity),
    [1],
    "unassigned players do not form an implicit party",
  );
});

test("simultaneous aegis sources refresh a single bonus, expire once and never make the temporary bonus part of permanent stats", () => {
  const { buffs, make, advance } = team(),
    a = make(1),
    b = make(2, "companion", "party-a", "room-a", 0);
  buffs.apply(a, [b]);
  assert.equal(b.character.derived.def, 2);
  advance(3000);
  buffs.apply(b, [a]);
  assert.equal(a.character.derived.def, 13);
  assert.equal(b.character.derived.def, 2);
  assert.deepEqual(advance(11999), []);
  const expired = advance(1);
  assert.deepEqual(expired.map((e) => e.entity).sort(), [1, 2]);
  assert.ok(expired.every((e) => e.removed));
  assert.equal(a.character.derived.def, 10);
  assert.equal(b.character.derived.def, 0);
  assert.deepEqual(advance(1), []);
});

test("death or leaving the instance removes only that recipient protection; caster death does not strip living allies", () => {
  const { buffs, make, advance } = team(),
    a = make(1),
    b = make(2, "companion"),
    c = make(3);
  buffs.apply(a, [b, c]);
  a.character.progress.hp = 0;
  c.instanceId = "elsewhere";
  assert.deepEqual(
    advance(1)
      .map((e) => e.entity)
      .sort(),
    [1, 3],
  );
  assert.equal(b.character.derived.def, 13);
  assert.equal(a.character.derived.def, 10);
  assert.equal(c.character.derived.def, 10);
});

test("aegis needs no enemy target, applies at the guard pose and actually reduces incoming monster damage", () => {
  const { farm, client, step } = solo();
  const enemy = client.hunt.monsters[0];
  Object.assign(enemy, {
    x: client.x + 20,
    y: client.y,
    hp: 1000,
    maxHp: 1000,
    home: { x: client.x + 20, y: client.y },
    nextAttack: 0,
  });
  const cast = farm.cast(client, AEGIS.id, 999999);
  assert.equal(cast.events.casts[0].target, 1);
  assert.equal(cast.events.damage.length, 0);
  assert.equal(farm.character.progress.mana, 90);
  assert.equal(client.hunt.actionUntil, 10650);
  assert.equal(
    step(299).events.damage.find((e) => e.source === enemy.id).amount,
    4,
  );
  enemy.nextAttack = 0;
  const output = step(1);
  assert.equal(output.events.buffs.length, 1);
  assert.equal(farm.character.derived.def, 2);
  assert.equal(
    output.events.damage.find((e) => e.source === enemy.id).amount,
    2,
  );
  assert.ok(
    !output.events.damage.some((e) => e.skillId === AEGIS.id),
    "defensive skill causes no damage",
  );
  enemy.nextAttack = Infinity;
  const expired = step(12000);
  assert.ok(expired.events.buffs.some((e) => e.removed));
  assert.equal(farm.character.derived.def, 0);
});

test("cancelled cast never grants defense, and exit clears active defense with a removal event", () => {
  const a = solo();
  a.farm.cast(a.client, AEGIS.id, 0);
  a.farm.stop(a.client);
  assert.deepEqual(a.step(500).events.buffs, []);
  const b = solo();
  b.farm.cast(b.client, AEGIS.id, 0);
  b.step(300);
  assert.equal(b.farm.stop(b.client).buffs[0].removed, true);
  assert.equal(b.farm.character.derived.def, 0);
  const c = solo();
  c.farm.cast(c.client, AEGIS.id, 0);
  c.client.hunt.deadAt = 10001;
  c.farm.character.progress.hp = 0;
  assert.deepEqual(c.step(300).events.buffs, []);
  assert.equal(c.farm.character.derived.def, 0);
});

test("server-resolved team receives the buff through the real cast/impact path", () => {
  const a = solo(),
    allyCharacter = { progress: { hp: 100 }, derived: { def: 10 } };
  const ally = {
    entity: 2,
    kind: "companion",
    partyId: "group",
    instanceId: "shared",
    character: allyCharacter,
    isAlive: () => true,
    isPresent: () => true,
    refresh: () => {
      allyCharacter.derived.def = a.farm.defenseBuffs.defense(
        allyCharacter,
        10,
      );
    },
  };
  a.client.partyId = "group";
  a.client.instanceId = "shared";
  const playerCharacter = { progress: { hp: 100 }, derived: { def: 20 } };
  const player = {
    ...ally,
    entity: 3,
    kind: "player",
    character: playerCharacter,
    refresh: () => {
      playerCharacter.derived.def = a.farm.defenseBuffs.defense(
        playerCharacter,
        20,
      );
    },
  };
  a.farm.resolveTeam = () => [ally, player];
  a.farm.cast(a.client, AEGIS.id, 0);
  assert.equal(allyCharacter.derived.def, 10);
  assert.deepEqual(
    a.step(300).events.buffs.map((e) => e.entity),
    [1, 2, 3],
  );
  assert.equal(allyCharacter.derived.def, 13);
  assert.equal(playerCharacter.derived.def, 26);
});

test("automatic defense activates before approach, avoids wasting recasts and resumes ordinary fighting", () => {
  const a = solo({ order: [AEGIS.id, "avanco-de-luz", "impacto-de-luz"] });
  Object.assign(a.client.hunt.monsters[0], {
    hp: 1000,
    maxHp: 1000,
    x: a.client.x + 250,
    y: a.client.y,
    home: { x: a.client.x + 250, y: a.client.y },
    nextAttack: Infinity,
  });
  const initial = a.step(50);
  assert.equal(initial.events.casts[0].skillId, AEGIS.id);
  assert.equal(a.step(300).events.buffs[0].removed, false);
  assert.deepEqual(a.step(650).events.casts, []);
  const before = a.farm.character.progress.mana;
  assert.throws(() => a.farm.cast(a.client, AEGIS.id, 0), /cooldown/);
  assert.equal(a.farm.character.progress.mana, before);
  a.step(20000); // Cooldown expires while the automated refresh starts another cast.
  a.step(300);
  assert.ok(a.farm.defenseBuffs.state(a.farm.character));
});

test("no mana and dead caster reject the buff without cooldown, and reloading a save does not persist a temporary bonus", () => {
  const a = solo();
  a.farm.character.progress.mana = 9;
  assert.throws(() => a.farm.cast(a.client, AEGIS.id, 0), /no_mana/);
  assert.deepEqual(a.client.hunt.cooldowns, {});
  a.farm.character.progress.mana = 100;
  a.farm.cast(a.client, AEGIS.id, 0);
  a.step(300);
  assert.equal(a.farm.character.derived.def, 2);
  const reloaded = new LocalFarm(JSON.parse(JSON.stringify(a.account)));
  assert.equal(reloaded.character.derived.def, 0);
  assert.equal(reloaded.character.wallet.gold, 1234);
});

test("aegis orbit keeps visible painted content throughout a moving, seamless ground loop", () => {
  const def = vfxDefinition("guerreiro-egide-aura");
  assert.equal(def.loop, true);
  assert.equal(def.camada, "chao");
  const image = decodeRgba(
    readFileSync(
      new URL("../art/warrior/vfx/guerreiro-egide-aura.png", import.meta.url),
    ),
  );
  const masses = [],
    hashes = new Set();
  for (let frame = 0; frame < def.frames; frame++) {
    const data = Buffer.alloc(128 * 128 * 4);
    let alpha = 0;
    for (let y = 0; y < 128; y++) {
      const at = (y * image.width + frame * 128) * 4;
      image.pixels.copy(data, y * 128 * 4, at, at + 128 * 4);
    }
    for (let at = 3; at < data.length; at += 4) alpha += data[at];
    masses.push(alpha);
    hashes.add(createHash("sha256").update(data).digest("hex"));
  }
  assert.ok(
    Math.min(...masses) > 150000,
    "visible ring in every frame, including the last frame",
  );
  assert.ok(
    Math.min(...masses) > Math.max(...masses) * 0.75,
    "active aura must not fade like the cast effect",
  );
  assert.ok(hashes.size > 24, "moving orbit rather than a still frame");
});
