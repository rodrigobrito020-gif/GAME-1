// Pack the new authored elf artwork into the same feet/scale contract as the
// approved warrior. Walking uses the shared alternating planted-leg rig.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WALK_PARTS, renderWarriorWalkFrame } from "../warrior-walk-rig.mjs";
import { isolateParts } from "./sprite-cutout.mjs";
const root = new URL("../art/archer/", import.meta.url),
  read = (name) => decodeRgba(readFileSync(new URL("source/" + name, root)));
mkdirSync(new URL("hd/", root), { recursive: true });
const definitions = structuredClone(WALK_PARTS);
definitions[0].body = {
  rect: [10, 0, 435, 348],
  hip: [220, 238],
  scale: 0.126,
};
definitions[1].body = {
  rect: [10, 325, 435, 675],
  hip: [230, 565],
  scale: 0.126,
  mirror: true,
};
definitions[2].body = {
  rect: [10, 650, 440, 1023],
  hip: [220, 883],
  scale: 0.126,
};
const parts = isolateParts(
  read("walk-parts.png"),
  definitions.flatMap((p) => [p.body.rect, ...p.thighs, ...p.shins]),
);
function write(name, cols, pixels) {
  writeFileSync(
    new URL("hd/" + name + ".png", root),
    encodeRgba(cols * 128, 512, pixels),
  );
  const small = Buffer.alloc(cols * 64 * 256 * 4);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < cols * 64; x++) {
      const a = (y * 2 * cols * 128 + x * 2) * 4,
        b = (y * cols * 64 + x) * 4;
      pixels.copy(small, b, a, a + 4);
    }
  writeFileSync(
    new URL(name + ".png", root),
    encodeRgba(cols * 64, 256, small),
  );
}
for (const name of ["idle", "walk"]) {
  const out = Buffer.alloc(512 * 512 * 4);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const frame = renderWarriorWalkFrame(
        parts,
        row,
        col,
        name === "idle",
        2,
        definitions,
      );
      for (let y = 0; y < 128; y++)
        frame.copy(
          out,
          ((row * 128 + y) * 512 + col * 128) * 4,
          y * 512,
          (y + 1) * 512,
        );
    }
  write(name, 4, out);
}
for (const dir of ["", "hd/"])
  writeFileSync(
    new URL(dir + "run1.png", root),
    readFileSync(new URL(dir + "walk.png", root)),
  );
const shoot = read("shoot.png"),
  vertical = read("shoot-vertical.png"),
  reactions = read("reactions.png");
function cut(image, row, col, rows, cols) {
  const x0 = Math.floor((col * image.width) / cols),
    x1 = Math.floor(((col + 1) * image.width) / cols) - 1,
    y0 = Math.floor((row * image.height) / rows),
    y1 = Math.floor(((row + 1) * image.height) / rows) - 1;
  let top = y1,
    bottom = y0,
    left = x1,
    right = x0;
  const mask = new Set();
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = (y * image.width + x) * 4;
      if (image.pixels[i + 3] < 220) continue;
      mask.add(y * image.width + x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  // Keep the connected actor, excluding isolated bow fragments from adjoining
  // cells and export speckles that would otherwise move the ground anchor.
  const pending = new Set(mask),
    components = [];
  while (pending.size) {
    const seed = pending.values().next().value,
      points = [seed];
    pending.delete(seed);
    for (let q = 0; q < points.length; q++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = (points[q] % image.width) + dx,
            y = Math.floor(points[q] / image.width) + dy,
            n = y * image.width + x;
          if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && pending.has(n)) {
            pending.delete(n);
            points.push(n);
          }
        }
    components.push(points);
  }
  const actor = components.sort((a, b) => b.length - a.length)[0];
  mask.clear();
  top = y1;
  bottom = y0;
  left = x1;
  right = x0;
  for (const n of actor)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = (n % image.width) + dx,
          y = Math.floor(n / image.width) + dy;
        if (
          x < x0 ||
          x > x1 ||
          y < y0 ||
          y > y1 ||
          image.pixels[(y * image.width + x) * 4 + 3] < 100
        )
          continue;
        mask.add(y * image.width + x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  const xs = [];
  for (
    let y = Math.round(top + (bottom - top) * 0.55);
    y <= top + (bottom - top) * 0.8;
    y++
  )
    for (let x = left; x <= right; x++) {
      const i = (y * image.width + x) * 4,
        [r, g, b, a] = image.pixels.subarray(i, i + 4);
      if (a > 240 && r < 140 && g < 105 && b < 90) xs.push(x);
    }
  xs.sort((a, b) => a - b);
  return {
    image,
    mask,
    top,
    bottom,
    left,
    right,
    center: xs.length ? xs[Math.floor(xs.length / 2)] : (left + right) / 2,
  };
}
function put(out, cols, row, col, part, scale, mirror = false, dead = false) {
  const im = part.image,
    center = dead ? (part.left + part.right) / 2 : part.center;
  scale = Math.min(
    scale,
    116 / (part.bottom - part.top + 1),
    60 / Math.max(center - part.left + 1, part.right - center + 1),
  );
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const sx = Math.floor(
          center + ((mirror ? 127 - x : x) - 64 + 0.5) / scale,
        ),
        sy = Math.floor(part.bottom + (y - 119 + 0.5) / scale);
      if (
        sx < part.left ||
        sx > part.right ||
        sy < part.top ||
        sy > part.bottom ||
        !part.mask.has(sy * im.width + sx)
      )
        continue;
      const a = (sy * im.width + sx) * 4,
        b = ((row * 128 + y) * cols * 128 + col * 128 + x) * 4;
      im.pixels.copy(out, b, a, a + 4);
    }
}
const manifest = {
  character: "Arqueira Elfa",
  frame: [128, 128],
  feet: [64, 120],
  rows: ["south", "west", "east", "north"],
  poses: [],
};
for (const name of ["weapon", "special"]) {
  const out = Buffer.alloc(768 * 512 * 4);
  for (let row = 0; row < 4; row++) {
    const im =
      name === "weapon"
        ? row === 0 || row === 3
          ? vertical
          : shoot
        : reactions;
    const rows = name === "weapon" ? (im === vertical ? 2 : 4) : 4,
      srcRow =
        name === "weapon"
          ? row === 0
            ? 0
            : row === 3
              ? 1
              : 1
          : row === 0
            ? 0
            : row === 3
              ? 3
              : 1,
      srcCols = name === "weapon" ? 6 : 4,
      neutral = cut(im, srcRow, 0, rows, srcCols),
      scale = 108 / (neutral.bottom - neutral.top + 1);
    for (let col = 0; col < 6; col++) {
      const srcCol =
          name === "weapon"
            ? col
            : col === 2
              ? 1
              : col === 4
                ? 2
                : col === 5
                  ? 3
                  : 0,
        part = cut(im, srcRow, srcCol, rows, srcCols);
      put(
        out,
        6,
        row,
        col,
        part,
        scale,
        row === 1,
        name === "special" && col === 5,
      );
      manifest.poses.push({
        sheet: name,
        row,
        col,
        sourceRow: srcRow,
        sourceCol: srcCol,
        scale,
      });
    }
  }
  write(name, 6, out);
}
const portrait = decodeRgba(readFileSync(new URL("hd/idle.png", root))),
  face = Buffer.alloc(128 * 128 * 4);
for (let y = 0; y < 128; y++)
  portrait.pixels.copy(
    face,
    y * 128 * 4,
    y * portrait.width * 4,
    y * portrait.width * 4 + 128 * 4,
  );
writeFileSync(new URL("portrait.png", root), encodeRgba(128, 128, face));
mkdirSync(new URL("../classes/", root), { recursive: true });
const warrior = decodeRgba(
  readFileSync(new URL("../warrior/hd/idle.png", root)),
);
for (let y = 0; y < 128; y++)
  warrior.pixels.copy(
    face,
    y * 128 * 4,
    y * warrior.width * 4,
    y * warrior.width * 4 + 128 * 4,
  );
writeFileSync(
  new URL("../classes/warrior.png", root),
  encodeRgba(128, 128, face),
);
writeFileSync(
  new URL("manifest.json", root),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Arqueira elfa: poses e caminhada em 128px, contrato nativo de 64px, sem alterar o guerreiro.",
);
