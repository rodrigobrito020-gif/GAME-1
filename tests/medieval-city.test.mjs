import { test } from "node:test";
import assert from "node:assert/strict";
import { createMedievalCity } from "../medieval-city.mjs";
test("medieval city keeps services and both sides of the fountain connected while blocking solid architecture", () => {
  const { map } = createMedievalCity(),
    { width, height } = map;
  const free = (c, r) =>
    c >= 0 &&
    r >= 0 &&
    c < width &&
    r < height &&
    !map.collisions[r * width + c];
  const origin = map.spawn.y * width + map.spawn.x,
    visited = new Set([origin]),
    queue = [origin];
  for (let i = 0; i < queue.length; i++)
    for (const d of [-1, 1, -width, width]) {
      const next = queue[i] + d,
        c = next % width,
        r = Math.floor(next / width);
      if (
        Math.abs(c - (queue[i] % width)) > 1 ||
        !free(c, r) ||
        visited.has(next)
      )
        continue;
      visited.add(next);
      queue.push(next);
    }
  for (const [x, y] of [
    [944, 720],
    [848, 720],
    [1040, 720],
    [944, 624],
    [816, 992],
    [1104, 992],
    [944, 1488],
  ])
    assert.ok(
      visited.has(Math.floor(y / 32) * width + Math.floor(x / 32)),
      `must reach ${x},${y}`,
    );
  for (const [x, y] of [
    [944, 320],
    [640, 480],
    [1248, 480],
    [960, 992],
    [16, 16],
  ])
    assert.equal(
      free(Math.floor(x / 32), Math.floor(y / 32)),
      false,
      `solid scenery at ${x},${y}`,
    );
  assert.equal(map.effects.lighting.period, "day");
  assert.equal(map.effects.fog.enabled, false);
});
