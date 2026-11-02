import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localAssets } from "../assets.mjs";

test("warrior HTTP assets deliver the approved body, armor and matching Ki family together", () => {
  const json = (value) => [{ read: () => Buffer.from(JSON.stringify(value)) }];
  const assets = localAssets(
    new Map([
      ["paperdoll-looks.json", json({ entities: {}, looks: {} })],
      ["errors.json", json({})],
    ]),
    {},
  );
  const matches = (url, file) => {
    const response = assets(url);
    assert.ok(response, url);
    assert.deepEqual(
      response.bytes,
      readFileSync(new URL("../art/" + file, import.meta.url)),
      url + ": the runtime must serve the same approved family tested on disk",
    );
  };
  for (const sheet of ["idle", "walk", "run1", "weapon", "axeheavy", "special"]) {
    for (const look of ["base", "training"])
      matches(
        `/assets/fx/royal-warrior/hd/${look}/${sheet}.png`,
        `warrior/hd/${look === "training" ? "training/" : ""}${sheet}.png`,
      );
    matches(
      `/assets/fx/royal-warrior/avatar-weapons-hd/${sheet}.png`,
      `warrior/hd/${sheet}-mask.png`,
    );
    for (const look of ["warrior", "warrior-training"])
      for (const kind of ["surface", "contour"])
        matches(
          `/assets/fx/royal-energy/${look}/${sheet}-${kind}.png`,
          `energy/${look}/${sheet}-${kind}.png`,
        );
  }
  for (const look of ["warrior", "warrior-training"])
    matches(
      `/assets/fx/royal-energy/${look}/emitters.json`,
      `energy/${look}/emitters.json`,
    );
});
