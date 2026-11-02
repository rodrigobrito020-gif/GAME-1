import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function fixture() {
  const frames = [],
    idle = [],
    window = {
      requestIdleCallback(fn) {
        idle.push(fn);
      },
    };
  vm.runInNewContext(
    readFileSync(new URL("../ui-frame.js", import.meta.url), "utf8"),
    {
      window,
      requestAnimationFrame(fn) {
        frames.push(fn);
        return frames.length;
      },
      setTimeout(fn) {
        idle.push(fn);
      },
    },
  );
  return { ui: window.__royalUiFrame, frames, idle };
}
test("HUD snapshots coalesce to the latest state and all layout reads happen before DOM writes", () => {
  const { ui, frames } = fixture(),
    calls = [];
  ui.schedule(
    "skills",
    () => {
      calls.push("old");
      return 0;
    },
    () => calls.push("stale write"),
  );
  ui.schedule(
    "skills",
    () => {
      calls.push("skills read");
      return 2;
    },
    (n) => calls.push("skills write " + n),
  );
  ui.schedule(
    "potions",
    () => {
      calls.push("potions read");
      return 3;
    },
    (n) => calls.push("potions write " + n),
  );
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.deepEqual(calls, [
    "skills read",
    "potions read",
    "skills write 2",
    "potions write 3",
  ]);
  ui.schedule(
    "skills",
    () => 1,
    () =>
      ui.schedule(
        "next",
        () => 2,
        () => calls.push("next frame"),
      ),
  );
  frames.shift()();
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(calls.at(-1), "next frame");
});
test("warming batches each texture once outside rendering and continues across idle callbacks", () => {
  const { ui, idle } = fixture(),
    calls = [];
  ui.warm("texture:a", () => calls.push("a"));
  ui.warm("texture:a", () => calls.push("duplicate"));
  ui.warm("texture:b", () => calls.push("b"));
  assert.equal(idle.length, 1);
  idle.shift()();
  assert.deepEqual(calls, ["a"]);
  assert.equal(idle.length, 1);
  idle.shift()();
  assert.deepEqual(calls, ["a", "b"]);
  assert.equal(idle.length, 0);
});
