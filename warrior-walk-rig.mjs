// A real alternating leg cycle, assembled from the original cutout artwork.
// The pelvis is the anchor. A moving toe must never re-center the torso.
export const WALK_STRIDE = 80;
export const WALK_PARTS = [
  {
    body: { rect: [28, 0, 400, 370], hip: [216, 211], scale: 0.126 },
    thighs: [
      [505, 87, 617, 272],
      [1012, 87, 1112, 272],
    ],
    shins: [
      [769, 87, 855, 318],
      [1283, 86, 1369, 318],
    ],
  },
  {
    body: {
      rect: [30, 325, 390, 700],
      hip: [230, 532],
      scale: 0.126,
      mirror: true,
    },
    thighs: [
      [511, 405, 614, 599],
      [1026, 405, 1128, 602],
    ],
    shins: [
      [737, 404, 864, 629],
      [1259, 404, 1390, 630],
    ],
  },
  {
    body: { rect: [48, 650, 425, 1023], hip: [220, 855], scale: 0.126 },
    thighs: [
      [519, 737, 631, 922],
      [1004, 736, 1116, 922],
    ],
    shins: [
      [771, 736, 860, 965],
      [1284, 734, 1375, 961],
    ],
  },
];
function knee(hip, ankle, bend = -1) {
  const dx = ankle[0] - hip[0],
    dy = ankle[1] - hip[1];
  const d = Math.min(28.99, Math.max(0.01, Math.hypot(dx, dy)));
  const along = (14.5 * 14.5 - 14.5 * 14.5 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, 210.25 - along * along));
  return [
    hip[0] + (dx / d) * along + (dy / d) * h * bend,
    hip[1] + (dy / d) * along - (dx / d) * h * bend,
  ];
}
export function warriorWalkPose(row, phase = 0, idle = false) {
  if (![0, 1, 2, 3].includes(row) || ![0, 1, 2, 3].includes(phase))
    throw Error("Invalid walking pose");
  const side = row === 1 || row === 2;
  const bodyBob = idle ? [0, -0.15, 0, 0.15][phase] : [0, -0.7, 0, -0.7][phase];
  const pelvis = [32, 32 + bodyBob];
  const hips = side
    ? [
        [31.5, pelvis[1]],
        [32.5, pelvis[1]],
      ]
    : [
        [27.5, pelvis[1]],
        [36.5, pelvis[1]],
      ];
  let feet;
  if (idle)
    feet = side
      ? [
          [28, 58],
          [36, 58],
        ]
      : [
          [28, 59],
          [36, 59],
        ];
  else if (side)
    feet = [
      [
        [22, 59],
        [42, 57],
      ],
      [
        [32, 59],
        [32, 55],
      ],
      [
        [42, 57],
        [22, 59],
      ],
      [
        [32, 55],
        [32, 59],
      ],
    ][phase];
  else
    feet = [
      [
        [28, 59],
        [36, 56],
      ],
      [
        [28.5, 59],
        [35.5, 55],
      ],
      [
        [28, 56],
        [36, 59],
      ],
      [
        [28.5, 55],
        [35.5, 59],
      ],
    ][phase];
  const legs = hips.map((hip, i) => ({
    hip,
    knee: side
      ? idle
        ? [hip[0] + (feet[i][0] - hip[0]) * 0.5, (hip[1] + feet[i][1]) * 0.5]
        : knee(hip, feet[i])
      : [
          hip[0] + (i ? 0.5 : -0.5),
          idle ? 45.5 : [45.5, 44.5, 45, 44][(phase + i * 2) % 4] + bodyBob,
        ],
    foot: feet[i],
    planted: idle || (i === 0 ? phase < 2 : phase >= 2),
  }));
  return {
    row,
    source: side ? 1 : row === 3 ? 2 : 0,
    mirror: row === 2,
    pelvis,
    legs,
    torso: {
      scale: WALK_PARTS[side ? 1 : row === 3 ? 2 : 0].body.scale,
      bob: bodyBob,
    },
  };
}

// Rasterize affine sprite parts into the fixed 64px renderer contract.
// This is an asset build step; the game only loads the resulting PNG sheets.
function layer(target, source, rect, matrix, shade = 1, trim) {
  const size = Math.sqrt(target.length / 4),
    factor = size / 64;
  const [a, b, c, d, tx, ty] = matrix,
    det = a * d - b * c;
  const [x0, y0, x1, y1] = rect;
  const mask = source.partMasks?.get(rect.join(","));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let alpha = 0,
        red = 0,
        green = 0,
        blue = 0;
      {
        const dx = (x + 0.5) / factor - tx,
          dy = (y + 0.5) / factor - ty;
        const sx = Math.floor((d * dx - c * dy) / det),
          sy = Math.floor((-b * dx + a * dy) / det);
        if (sx < x0 || sx > x1 || sy < y0 || sy > y1) continue;
        if (mask && !mask.has(sy * source.width + sx)) continue;
        if (trim?.start !== undefined && sy < trim.start) continue;
        if (
          trim &&
          sy > trim.top &&
          sx >= trim.left &&
          sx <= trim.right &&
          !trim.protected.has(sy * source.width + sx)
        )
          continue;
        const i = (sy * source.width + sx) * 4,
          opacity = source.pixels[i + 3];
        if (opacity < 8) continue;
        alpha += opacity;
        red += source.pixels[i] * opacity;
        green += source.pixels[i + 1] * opacity;
        blue += source.pixels[i + 2] * opacity;
      }
      if (!alpha) continue;
      const i = (y * size + x) * 4,
        sa = alpha / 255,
        da = target[i + 3] / 255;
      const out = sa + da * (1 - sa);
      for (const [ch, sum] of [
        [0, red],
        [1, green],
        [2, blue],
      ])
        target[i + ch] = Math.round(
          ((sum / alpha) * shade * sa + target[i + ch] * da * (1 - sa)) / out,
        );
      target[i + 3] = Math.round(out * 255);
    }
}
function bone(target, source, rect, from, to, shade) {
  const x = (rect[0] + rect[2]) / 2,
    top = rect[1] + (rect[3] - rect[1]) * 0.16;
  source.boneFloors ??= new Map();
  const key = rect.join(",");
  if (!source.boneFloors.has(key)) {
    let floor = rect[1];
    for (const i of source.partMasks.get(key))
      if (source.pixels[i * 4 + 3] > 200)
        floor = Math.max(floor, Math.floor(i / source.width));
    source.boneFloors.set(key, floor + 1);
  }
  const original = source.boneFloors.get(key) - top;
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    distance = Math.hypot(dx, dy) || 1;
  // Keep the painted limb thickness independent of its projected bone length.
  // A small overlap hides cutout edges at hips/knees without moving the soles.
  const sy = (distance + 1.5) / original,
    sx = 0.095;
  const a = (dy / distance) * sx,
    b = (-dx / distance) * sx,
    c = (dx / distance) * sy,
    d = (dy / distance) * sy;
  layer(
    target,
    source,
    rect,
    [
      a,
      b,
      c,
      d,
      from[0] - a * x - c * top - (dx / distance) * 1.5,
      from[1] - b * x - d * top - (dy / distance) * 1.5,
    ],
    shade,
    { start: top },
  );
}
// Remove only the static trouser stubs. Preserve hands, the blade, bow and
// shield (including their outlines) where they pass in front of the hip.
function trimTrousers(source, body) {
  source.trouserTrims ??= new Map();
  const key = body.rect.join(",");
  if (source.trouserTrims.has(key)) return source.trouserTrims.get(key);
  const trim = {
    top: body.hip[1] + 30,
    left: body.hip[0] - 95,
    right: body.hip[0] + 80,
    protected: new Set(),
  };
  for (let y = trim.top - 3; y <= body.rect[3]; y++)
    for (let x = trim.left - 3; x <= trim.right + 3; x++) {
      const i = (y * source.width + x) * 4,
        [r, g, b, a] = source.pixels.subarray(i, i + 4);
      if (a < 100) continue;
      const steel = b >= g * 0.98 && g >= r * 0.95 && r > 65;
      const warm = r > 140 && r - g > 20 && g - b > 8;
      if (steel || warm)
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            trim.protected.add((y + dy) * source.width + x + dx);
    }
  source.trouserTrims.set(key, trim);
  return trim;
}
export function renderWarriorWalkFrame(
  source,
  row,
  phase,
  idle = false,
  factor = 1,
  definitions = WALK_PARTS,
) {
  const size = 64 * factor;
  const pose = warriorWalkPose(row, phase, idle),
    def = definitions[pose.source],
    pixels = Buffer.alloc(size * size * 4);
  const order = row === 3 ? [0, 1] : [1, 0];
  for (const i of order) {
    const leg = pose.legs[i],
      shade = pose.source === 1 && i === 1 ? 0.82 : 1;
    bone(pixels, source, def.thighs[i], leg.hip, leg.knee, shade);
    bone(pixels, source, def.shins[i], leg.knee, leg.foot, shade);
  }
  const scale = def.body.scale,
    flip = def.body.mirror ? -1 : 1;
  layer(
    pixels,
    source,
    def.body.rect,
    [
      flip * scale,
      0,
      0,
      scale,
      pose.pelvis[0] - flip * scale * def.body.hip[0],
      pose.pelvis[1] - scale * def.body.hip[1],
    ],
    1,
    trimTrousers(source, def.body),
  );
  if (!pose.mirror) return pixels;
  const mirrored = Buffer.alloc(pixels.length);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      pixels.copy(
        mirrored,
        (y * size + size - 1 - x) * 4,
        (y * size + x) * 4,
        (y * size + x + 1) * 4,
      );
  return mirrored;
}
