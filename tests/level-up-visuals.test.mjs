import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function setup() {
  let now = 0,
    callback,
    sound = 0;
  const objects = [],
    events = new Map(),
    listeners = new Map();
  const create = () => {
    const o = { destroyed: false };
    let proxy;
    proxy = new Proxy(o, {
      get(t, k) {
        if (k in t) return t[k];
        if (k === "destroy") return () => (t.destroyed = true);
        if (k === "setText") return (v) => ((t.text = v), proxy);
        return () => proxy;
      },
    });
    objects.push(o);
    return proxy;
  };
  const scene = {
    add: { graphics: create, text: create, image: create },
    textures: {
      keys: new Set(),
      exists(k) {
        return this.keys.has(k);
      },
      addImage(k) {
        this.keys.add(k);
      },
      createCanvas(k) {
        this.keys.add(k);
        return {
          getContext: () => new Proxy({}, { get: () => () => {} }),
          refresh() {},
        };
      },
      remove(k) {
        this.keys.delete(k);
      },
    },
    events: {
      on: (k, v) => {
        events.set(k, v);
        if (k === "postupdate") callback = v;
      },
      once: (k, v) => events.set(k, v),
      off: (k) => events.delete(k),
    },
  };
  const actor = {
    x: 50,
    y: 60,
    height: 100,
    alive: true,
    root: { active: true, visible: true, depth: 2, scene },
  };
  const window = { addEventListener: (k, v) => listeners.set(k, v) };
  vm.runInNewContext(
    readFileSync(new URL("../level-up-visuals.js", import.meta.url), "utf8"),
    {
      window,
      performance: { now: () => now },
      Math,
      Number,
      Map,
      Image: class {
        decode() {
          return {
            then: (fn) => {
              fn();
              return { catch() {} };
            },
          };
        }
      },
    },
  );
  return {
    actor,
    objects,
    scene,
    window,
    events,
    listeners,
    apply: (level) => window.__royalLevelUp.apply(actor, level, () => sound++),
    sound: () => sound,
    tick: (t) => {
      now = t;
      callback?.();
    },
  };
}
test("level-up only starts on an explicit valid event and merges a multi-level reward into one celebration and sound", () => {
  const s = setup();
  assert.equal(s.objects.length, 0);
  assert.equal(s.apply(1), false);
  assert.equal(s.apply(301), false);
  assert.equal(s.apply(2), true);
  const count = s.objects.length;
  assert.ok(count > 5, "textured VFX is created alongside procedural layers");
  assert.equal(s.sound(), 1);
  s.apply(3);
  assert.equal(s.objects.length, count);
  assert.equal(s.sound(), 1);
  assert.ok(s.objects.some((o) => o.text === "NÍVEL 3"));
  s.tick(900);
  assert.ok(s.objects.every((o) => !o.destroyed));
  s.tick(2201);
  assert.ok(s.objects.every((o) => o.destroyed));
  assert.equal([...s.scene.textures.keys].filter(k=>k.startsWith('royal-level-ring:')).length,0);
});
test("level-up releases every object on scene reset, shutdown or death and accepts a later genuine event", () => {
  for (const reason of ["reset", "shutdown", "death"]) {
    const s = setup();
    s.apply(2);
    if (reason === "reset") s.listeners.get("royal-skill-scene-reset")();
    else if (reason === "shutdown") s.events.get("shutdown")();
    else {
      s.actor.alive = false;
      s.tick(200);
    }
    assert.ok(
      s.objects.every((o) => o.destroyed),
      reason,
    );
  }
  const s = setup();
  s.apply(2);
  const count = s.objects.length;
  s.tick(2300);
  s.apply(3);
  assert.equal(s.sound(), 2);
  assert.equal(s.objects.length, count * 2);
});
