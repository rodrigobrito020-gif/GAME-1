import { test } from "node:test";
import assert from "node:assert/strict";
import { localAssets } from "../assets.mjs";

test("monster origin keeps the sprite next to its world position instead of off-screen", () => {
  const json = (value) => [{ read: () => Buffer.from(JSON.stringify(value)) }];
  const assets = localAssets(
    new Map([
      ["paperdoll-looks.json", json({ entities: {}, looks: {} })],
      ["errors.json", json({})],
    ]),
    {},
  );
  const response = assets("/assets/monsters/local-treino/anim.json");
  const { quadro, pivo, estados } = JSON.parse(response.bytes);
  assert.ok(pivo.x >= 0 && pivo.x <= 1, "horizontal origin must be normalized");
  assert.ok(pivo.y >= 0 && pivo.y <= 1, "vertical origin must be normalized");
  // Same placement contract as the renderer: setOrigin(x,y), then scale
  // a frame to the catalog's 64px display height.
  const scale = 64 / quadro.h;
  for (const position of [
    { x: 848, y: 976 },
    { x: 1040, y: 976 },
    { x: 944, y: 1072 },
  ]) {
    const left = position.x - quadro.w * pivo.x * scale;
    const top = position.y - quadro.h * pivo.y * scale;
    assert.ok(left > position.x - 64 && left < position.x);
    assert.ok(top > position.y - 80 && top < position.y);
    assert.ok(left + quadro.w * scale > position.x);
    assert.ok(top + quadro.h * scale >= position.y);
  }
  assert.ok(estados.idle && estados.attack && estados.death);
});
