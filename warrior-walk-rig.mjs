// A real alternating leg cycle, assembled from the original cutout artwork.
// The pelvis is the anchor. A moving toe must never re-center the torso.
export const WALK_STRIDE = 96;
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
  const d = Math.min(25.99, Math.max(0.01, Math.hypot(dx, dy)));
  const along = (10 * 10 - 16 * 16 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, 100 - along * along));
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
  const pelvis = [32, 37 + bodyBob];
  const hips = side
    ? [
        [31.5, pelvis[1]],
        [32.5, pelvis[1]],
      ]
    : [
        [28.5, pelvis[1]],
        [35.5, pelvis[1]],
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
        [20, 59],
        [44, 57],
      ],
      [
        [32, 59],
        [32, 51],
      ],
      [
        [44, 57],
        [20, 59],
      ],
      [
        [32, 51],
        [32, 59],
      ],
    ][phase];
  else
    feet = [
      [
        [28, 59],
        [36, 54],
      ],
      [
        [28.5, 59],
        [35.5, 52],
      ],
      [
        [28, 54],
        [36, 59],
      ],
      [
        [28.5, 52],
        [35.5, 59],
      ],
    ][phase];
  const legs = hips.map((hip, i) => ({
    hip,
    knee: side
      ? knee(hip, feet[i])
      : [
          hip[0] + (i ? 0.5 : -0.5),
          idle ? 46 : [46, 43, 44, 42][(phase + i * 2) % 4] + bodyBob,
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
function layer(target, source, rect, matrix, shade = 1) {
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
function bone(target, source, rect, from, to, length, shade) {
  const x = (rect[0] + rect[2]) / 2,
    top = rect[1] + (rect[3] - rect[1]) * 0.1;
  const bottom = rect[3],
    original = bottom - top;
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    distance = Math.hypot(dx, dy) || 1;
  const sy = distance / original,
    sx = length / original;
  const a = (dy / distance) * sx,
    b = (-dx / distance) * sx,
    c = (dx / distance) * sy,
    d = (dy / distance) * sy;
  layer(
    target,
    source,
    rect,
    [a, b, c, d, from[0] - a * x - c * top, from[1] - b * x - d * top],
    shade,
  );
}
export function renderWarriorWalkFrame(
  source,
  row,
  phase,
  idle = false,
  factor = 1,
) {
  const size = 64 * factor;
  const pose = warriorWalkPose(row, phase, idle),
    def = WALK_PARTS[pose.source],
    pixels = Buffer.alloc(size * size * 4);
  const order = row === 3 ? [0, 1] : [1, 0];
  for (const i of order) {
    const leg = pose.legs[i],
      shade = pose.source === 1 && i === 1 ? 0.82 : 1;
    bone(pixels, source, def.thighs[i], leg.hip, leg.knee, 10, shade);
    bone(pixels, source, def.shins[i], leg.knee, leg.foot, 16, shade);
  }
  const scale = def.body.scale,
    flip = def.body.mirror ? -1 : 1;
  layer(pixels, source, def.body.rect, [
    flip * scale,
    0,
    0,
    scale,
    pose.pelvis[0] - flip * scale * def.body.hip[0],
    pose.pelvis[1] - scale * def.body.hip[1],
  ]);
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
