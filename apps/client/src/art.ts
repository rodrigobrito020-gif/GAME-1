import Phaser from "phaser";
import type { Archetype, Race } from "@idle/shared";
import { CITY, RACES } from "@idle/shared";

// Original, local art. Texture generation runs once; combat never generates images.
// These are visual palettes and poses, not new species/classes or balance rules.
export type Direction = "front" | "back" | "side";
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];
const ink = "#181a29";
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
function poly(
  c: Ctx,
  points: Point[],
  fill: string,
  stroke = ink,
  width = 1.3,
) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function oval(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke = "",
) {
  c.beginPath();
  c.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.3;
    c.stroke();
  }
}
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function line(c: Ctx, points: Point[], color: string, width = 1) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.stroke();
}
function metal(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  light: string,
  dark: string,
) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, light);
  g.addColorStop(0.5, dark);
  g.addColorStop(1, "#252a3c");
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}
function texture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  paint: (c: Ctx) => void,
) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  paint(tex.context);
  tex.refresh();
}

export function paintHero(
  c: Ctx,
  race: Race,
  kind: Archetype,
  pose = 0,
  direction: Direction = "front",
) {
  const dwarf = race === "dwarf",
    orc = race === "orc",
    elf = race === "elf" || race === "darkelf";
  const mystic = kind === "mystic",
    back = direction === "back",
    side = direction === "side";
  const skin =
    race === "orc"
      ? "#8d9b67"
      : race === "darkelf"
        ? "#b2a4c7"
        : race === "elf"
          ? "#e1c9b0"
          : "#d9b18f";
  const shade =
    race === "orc" ? "#515f43" : race === "darkelf" ? "#756586" : "#966c5d";
  const hair =
    race === "elf"
      ? "#c7bd96"
      : race === "darkelf"
        ? "#c9c9dc"
        : race === "orc"
          ? "#383a37"
          : dwarf
            ? "#a98868"
            : "#655045";
  const top = dwarf ? 23 : elf ? 6 : 9,
    headY = top + 17;
  const bodyW = orc ? 33 : dwarf ? 29 : elf ? 23 : 27;
  const left = 48 - bodyW / 2,
    right = 48 + bodyW / 2,
    shoulder = top + 35;
  const foot = 100,
    belt = dwarf ? 79 : 74;
  const step = pose === 1 ? -3 : pose === 2 ? 3 : 0;
  c.save();
  if (side) {
    c.translate(8, 0);
    c.scale(0.85, 1);
  }
  // Cloth silhouette, separate limbs and plate edges give a readable RPG outline.
  poly(
    c,
    [
      [left + 2, shoulder],
      [right - 2, shoulder],
      [right + 7, 91],
      [48, 96],
      [left - 6, 91],
    ],
    mystic ? "#37364f" : "#573d48",
  );
  line(
    c,
    [
      [left, shoulder + 5],
      [left + 3, 87],
      [46, 92],
    ],
    mystic ? "#726186" : "#97606b",
    2,
  );
  for (const sign of [-1, 1]) {
    const x = 48 + sign * 8,
      offset = sign * step;
    poly(
      c,
      [
        [x - 5, belt],
        [x + 5, belt],
        [x + 6, foot - 5 + offset],
        [x - 5, foot - 5 + offset],
      ],
      "#333442",
    );
    poly(
      c,
      [
        [x - 6, foot - 17 + offset],
        [x + 5, foot - 17 + offset],
        [x + 7, foot + offset],
        [x - 8, foot + offset],
        [x - 8, foot - 5 + offset],
      ],
      "#4a4849",
    );
    line(
      c,
      [
        [x - 4, foot - 15 + offset],
        [x - 3, foot - 6 + offset],
        [x + 3, foot - 6 + offset],
      ],
      "#96907e",
      1.5,
    );
    line(
      c,
      [
        [x - 6, foot - 1 + offset],
        [x + 5, foot - 1 + offset],
      ],
      "#151927",
      2,
    );
  }
  poly(
    c,
    [
      [left, shoulder],
      [48, shoulder - 4],
      [right, shoulder],
      [right - 3, belt + 5],
      [48, belt + 9],
      [left + 3, belt + 5],
    ],
    mystic ? "#64577a" : "#71818b",
  );
  poly(
    c,
    [
      [48, shoulder],
      [right - 3, shoulder + 4],
      [right - 4, belt],
      [48, belt + 3],
    ],
    mystic ? "#3e3c5d" : "#414d61",
    "",
  );
  if (mystic) {
    poly(
      c,
      [
        [left + 3, belt - 3],
        [right - 3, belt - 3],
        [right + 5, 95],
        [48, 98],
        [left - 5, 95],
      ],
      "#4c4266",
    );
    line(
      c,
      [
        [left + 2, shoulder + 4],
        [45, belt],
        [41, 94],
      ],
      "#beaa77",
      2,
    );
    line(
      c,
      [
        [right - 2, shoulder + 4],
        [51, belt],
        [56, 94],
      ],
      "#beaa77",
      2,
    );
    line(
      c,
      [
        [48, belt + 5],
        [48, 95],
      ],
      "#9b8baf",
      1,
    );
  } else {
    poly(
      c,
      [
        [left + 3, belt - 3],
        [right - 3, belt - 3],
        [right + 1, belt + 10],
        [49, belt + 13],
        [left - 1, belt + 10],
      ],
      "#485360",
    );
    line(
      c,
      [
        [left + 3, shoulder + 7],
        [48, shoulder + 12],
        [right - 3, shoulder + 7],
      ],
      "#c1c5c0",
      1.5,
    );
    line(
      c,
      [
        [48, shoulder + 14],
        [48, belt - 4],
      ],
      "#bec5c5",
      1,
    );
    line(
      c,
      [
        [left + 4, belt + 5],
        [right - 3, belt + 5],
      ],
      "#ac9469",
      1.5,
    );
  }
  rect(c, left + 1, belt - 2, bodyW - 2, 5, "#2b2933");
  rect(c, 44, belt - 2, 8, 6, "#b59c68");
  rect(c, 46, belt, 4, 2, "#413b39");
  for (const sign of [-1, 1]) {
    const x = sign === -1 ? left - 1 : right + 1,
      swing = (sign * step) / 2;
    poly(
      c,
      [
        [x - 4, shoulder + 1],
        [x + 5, shoulder + 2],
        [x + 7, shoulder + 19 + swing],
        [x + 3, shoulder + 31 + swing],
        [x - 4, shoulder + 29 + swing],
        [x - 5, shoulder + 17],
      ],
      mystic ? "#5b5373" : "#6e7a83",
    );
    poly(
      c,
      [
        [x - 6, shoulder],
        [x, shoulder - 4],
        [x + 7, shoulder],
        [x + 7, shoulder + 8],
        [x, shoulder + 11],
        [x - 6, shoulder + 7],
      ],
      mystic ? "#7c7195" : "#9ba5aa",
    );
    line(
      c,
      [
        [x - 4, shoulder + 1],
        [x + 1, shoulder - 1],
        [x + 5, shoulder + 2],
      ],
      "#d7cfb4",
      1.5,
    );
    oval(c, x + 1, shoulder + 30 + swing, 8, 10, back ? shade : skin, ink);
    line(
      c,
      [
        [x - 3, shoulder + 19 + swing],
        [x + 5, shoulder + 20 + swing],
      ],
      "#bcab80",
      2,
    );
  }
  if (back) {
    poly(
      c,
      [
        [left + 3, shoulder + 2],
        [right - 3, shoulder + 2],
        [right + 3, 88],
        [49, 94],
        [left - 3, 88],
      ],
      mystic ? "#514366" : "#5b3e51",
    );
    line(
      c,
      [
        [left + 5, shoulder + 4],
        [48, shoulder + 10],
        [right - 5, shoulder + 4],
      ],
      "#b6a578",
      2,
    );
    line(
      c,
      [
        [48, shoulder + 12],
        [48, 88],
      ],
      "#896676",
      1,
    );
  }
  // Rounded face, hair strands, eyebrows and neck instead of a square head.
  rect(c, 44, headY + 15, 8, 9, shade);
  oval(c, 48, headY, orc ? 29 : dwarf ? 27 : 24, dwarf ? 28 : 30, hair, ink);
  if (elf) {
    poly(
      c,
      [
        [36, headY - 2],
        [25, headY - 8],
        [34, headY + 7],
        [39, headY + 6],
      ],
      shade,
    );
    poly(
      c,
      [
        [60, headY - 2],
        [71, headY - 8],
        [62, headY + 7],
        [57, headY + 6],
      ],
      skin,
    );
  }
  if (!back) {
    oval(c, 48 + (side ? 3 : 0), headY + 3, orc ? 25 : 21, 25, skin, shade);
    poly(
      c,
      [
        [37, headY - 8],
        [43, headY - 14],
        [54, headY - 13],
        [61, headY - 6],
        [58, headY + 6],
        [54, headY - 2],
        [50, headY - 7],
        [42, headY - 1],
        [36, headY + 7],
      ],
      hair,
    );
    line(
      c,
      [
        [40, headY - 9],
        [48, headY - 12],
        [55, headY - 8],
      ],
      race === "darkelf" ? "#eee8ed" : "#b09977",
      1.3,
    );
    const eyes = side ? [52] : [42, 54];
    for (const x of eyes) {
      line(
        c,
        [
          [x - 2, headY + 2],
          [x + 2, headY + 1],
        ],
        "#453b3c",
        1.4,
      );
      rect(c, x - 1, headY + 5, 3, 2, "#e1d8bb");
      rect(c, x, headY + 5, 2, 3, race === "elf" ? "#4e6d6b" : "#313343");
    }
    line(
      c,
      [
        [48, headY + 7],
        [47, headY + 11],
        [50, headY + 11],
      ],
      shade,
      1,
    );
    line(
      c,
      [
        [45, headY + 14],
        [51, headY + 14],
      ],
      shade,
      1,
    );
    if (dwarf) {
      poly(
        c,
        [
          [37, headY + 7],
          [45, headY + 11],
          [49, headY + 10],
          [58, headY + 7],
          [57, headY + 22],
          [49, headY + 28],
          [39, headY + 22],
        ],
        hair,
      );
      for (let i = 0; i < 4; i++)
        line(
          c,
          [
            [42 + i * 4, headY + 15],
            [44 + i * 3, headY + 24],
          ],
          "#d1b492",
          1,
        );
    }
    if (orc)
      for (const x of [41, 54])
        poly(
          c,
          [
            [x, headY + 16],
            [x + 1, headY + 10],
            [x + 4, headY + 16],
          ],
          "#e0d9ba",
          shade,
          0.8,
        );
  } else {
    oval(c, 48, headY, 25, 29, hair, ink);
    for (let i = 0; i < 5; i++)
      line(
        c,
        [
          [39 + i * 4, headY - 8],
          [40 + i * 4, headY + 12],
        ],
        i % 2 ? "#88818b" : "#4b424a",
        0.8,
      );
    if (mystic || elf)
      poly(
        c,
        [
          [42, headY + 10],
          [55, headY + 10],
          [57, shoulder + 10],
          [48, shoulder + 15],
          [40, shoulder + 8],
        ],
        hair,
      );
  }
  c.restore();
}

function paintCreature(c: Ctx, kind: string, variant: number, pose: number) {
  const walk = pose === 1 ? -3 : pose === 2 ? 3 : 0;
  if (kind === "summon") {
    const cannon = variant > 0;
    for (const sign of [-1, 1]) {
      const x = 48 + sign * 12;
      if (cannon) {
        oval(c, x, 88, 17, 21, "#303545", ink);
        oval(c, x, 88, 9, 12, "#867c66", ink);
      } else {
        poly(
          c,
          [
            [x - 7, 65],
            [x + 7, 65],
            [x + 10, 96 + sign * walk],
            [x - 10, 96 + sign * walk],
          ],
          "#5d626a",
        );
        line(
          c,
          [
            [x - 7, 83],
            [x + 7, 83],
          ],
          "#b3b5ab",
          2,
        );
      }
    }
    poly(
      c,
      [
        [27, 39],
        [48, 30],
        [69, 39],
        [72, 71],
        [48, 84],
        [24, 71],
      ],
      "#777769",
    );
    poly(
      c,
      [
        [48, 34],
        [67, 42],
        [68, 69],
        [48, 77],
      ],
      "#474e58",
      "",
    );
    for (const x of [30, 64]) {
      oval(c, x, 49, 17, 22, "#a79a75", ink);
      rect(c, x - 5, 61, 10, 18, "#646a71");
    }
    oval(c, 48, 53, 18, 19, "#303849", "#b8ab77");
    oval(c, 48, 53, 8, 10, "#86d6d2");
    oval(c, 47, 51, 3, 4, "#e3fff0");
    poly(
      c,
      [
        [36, 24],
        [48, 18],
        [60, 24],
        [59, 38],
        [48, 43],
        [36, 37],
      ],
      "#939383",
    );
    rect(c, 39, 30, 17, 4, "#2a3342");
    rect(c, 41, 31, 5, 2, "#b4f0dd");
    rect(c, 50, 31, 5, 2, "#b4f0dd");
    if (cannon) {
      poly(
        c,
        [
          [44, 28],
          [56, 24],
          [77, 42],
          [68, 50],
        ],
        "#373c4c",
      );
      oval(c, 74, 44, 17, 18, "#777c83", ink);
      oval(c, 75, 44, 9, 11, "#161f30", "#b4ad8c");
      if (variant === 2)
        poly(
          c,
          [
            [25, 45],
            [4, 35],
            [16, 59],
            [28, 61],
          ],
          "#afa37d",
        );
    }
    line(
      c,
      [
        [29, 40],
        [48, 33],
        [67, 40],
      ],
      "#d6c596",
      2,
    );
    return;
  }
  const magic = kind === "magic",
    bone = variant === 1,
    beast = variant === 2;
  const hide = magic
    ? ["#666285", "#796b8a", "#556a87"][variant]
    : ["#718264", "#9b8c7c", "#8c6c5a"][variant];
  if (beast) {
    poly(
      c,
      [
        [22, 52],
        [30, 34],
        [64, 35],
        [79, 56],
        [66, 80],
        [27, 80],
      ],
      hide,
    );
    for (const x of [30, 65])
      poly(
        c,
        [
          [x - 5, 67],
          [x + 7, 66],
          [x + 5, 94 + walk],
          [x - 10, 96 + walk],
        ],
        "#514d50",
      );
    poly(
      c,
      [
        [29, 31],
        [22, 8],
        [41, 23],
        [59, 23],
        [75, 8],
        [67, 34],
        [68, 54],
        [49, 67],
        [28, 53],
      ],
      hide,
    );
    poly(
      c,
      [
        [34, 44],
        [49, 40],
        [62, 45],
        [55, 62],
        [44, 63],
      ],
      "#bdab87",
    );
    oval(c, 49, 48, 12, 9, "#242737");
    for (const x of [34, 58]) {
      line(
        c,
        [
          [x - 3, 34],
          [x + 4, 37],
        ],
        "#e5c677",
        3,
      );
      rect(c, x, 36, 2, 3, "#151c29");
    }
    for (const x of [39, 53])
      poly(
        c,
        [
          [x, 54],
          [x + 4, 54],
          [x + 2, 62],
        ],
        "#e9dac3",
      );
  } else {
    for (const sign of [-1, 1]) {
      const x = 48 + sign * 10;
      poly(
        c,
        [
          [x - 5, 66],
          [x + 5, 66],
          [x + 5, 94 + sign * walk],
          [x - 9, 94 + sign * walk],
        ],
        bone ? "#a19888" : "#42454c",
      );
      poly(
        c,
        [
          [x - 7, 86 + sign * walk],
          [x + 5, 85 + sign * walk],
          [x + 7, 96 + sign * walk],
          [x - 9, 96 + sign * walk],
        ],
        "#39343b",
      );
    }
    poly(
      c,
      [
        [29, 39],
        [48, 33],
        [67, 39],
        [65, 70],
        [48, 78],
        [31, 70],
      ],
      magic ? "#423852" : "#655447",
    );
    for (const x of [24, 68]) {
      poly(
        c,
        [
          [x, 40],
          [x + 8, 42],
          [x + 5, 75 + walk],
          [x - 3, 73 + walk],
        ],
        hide,
      );
      oval(c, x + 1, 75 + walk, 10, 11, hide, ink);
    }
    oval(c, 48, 30, bone ? 30 : 32, 34, hide, ink);
    if (!bone) {
      poly(
        c,
        [
          [33, 25],
          [17, 14],
          [25, 38],
          [35, 37],
        ],
        hide,
      );
      poly(
        c,
        [
          [62, 25],
          [79, 14],
          [70, 38],
          [59, 37],
        ],
        hide,
      );
      poly(
        c,
        [
          [36, 16],
          [45, 10],
          [59, 14],
          [61, 24],
          [50, 19],
          [34, 25],
        ],
        "#3a3c43",
      );
    }
    for (const x of [40, 56]) {
      oval(c, x, 31, bone ? 8 : 7, bone ? 9 : 5, "#252937");
      rect(c, x - 2, 30, 4, 2, magic ? "#b4a1f3" : "#d6c685");
    }
    poly(
      c,
      [
        [45, 35],
        [51, 35],
        [49, 42],
        [44, 41],
      ],
      bone ? "#37333b" : "#45513f",
      "",
    );
    line(
      c,
      [
        [39, 45],
        [57, 45],
      ],
      "#272937",
      2,
    );
    for (const x of [41, 52])
      line(
        c,
        [
          [x, 44],
          [x + 1, 49],
        ],
        "#d9ccb0",
        2,
      );
    rect(c, 32, 63, 32, 4, "#252b37");
    rect(c, 45, 62, 7, 6, "#a48d59");
    if (magic) {
      poly(
        c,
        [
          [28, 24],
          [48, 6],
          [68, 24],
          [66, 45],
          [60, 26],
          [48, 20],
          [35, 27],
          [30, 46],
        ],
        "#5c4c76",
      );
      line(
        c,
        [
          [29, 24],
          [48, 7],
          [67, 24],
        ],
        "#a49cc2",
        1.4,
      );
      line(
        c,
        [
          [76, 76],
          [79, 20],
        ],
        "#776456",
        4,
      );
      oval(c, 79, 20, 11, 14, "#c3a5ee", ink);
    } else {
      line(
        c,
        [
          [24, 72],
          [13, 38],
        ],
        "#8c7754",
        4,
      );
      poly(
        c,
        [
          [6, 27],
          [17, 24],
          [23, 42],
          [11, 47],
        ],
        "#7d8386",
      );
      line(
        c,
        [
          [9, 28],
          [18, 26],
          [21, 39],
        ],
        "#c4c4b7",
        1,
      );
    }
  }
}

function paintTree(c: Ctx, pine: boolean) {
  oval(c, 70, 142, 104, 30, "#10182470");
  poly(
    c,
    [
      [61, 91],
      [78, 91],
      [81, 145],
      [92, 151],
      [71, 150],
      [56, 153],
      [60, 141],
    ],
    "#5c4945",
  );
  line(
    c,
    [
      [66, 108],
      [65, 141],
    ],
    "#9b7a5b",
    2,
  );
  if (pine) {
    for (let i = 0; i < 4; i++) {
      const y = 16 + i * 23,
        w = 24 + i * 12;
      poly(
        c,
        [
          [69, y],
          [69 + w, y + 52],
          [80, y + 47],
          [70, y + 55],
          [50, y + 47],
          [69 - w, y + 52],
        ],
        ["#345750", "#34514c", "#294740", "#243f3b"][i],
      );
      line(
        c,
        [
          [68, y + 4],
          [49 - i * 6, y + 38],
          [60, y + 35],
        ],
        "#568071",
        2,
      );
      line(
        c,
        [
          [69, y + 20],
          [80 + i * 5, y + 42],
        ],
        "#3f6257",
        1,
      );
    }
  } else {
    const random = rng(504);
    const blobs: Point[] = [
      [40, 80],
      [89, 77],
      [30, 56],
      [105, 53],
      [72, 38],
      [49, 35],
      [77, 70],
      [57, 65],
    ];
    for (const [x, y] of blobs) {
      oval(c, x, y, 52, 52, "#263f3c", ink);
      oval(c, x - 4, y - 5, 44, 40, "#36594b");
      for (let i = 0; i < 19; i++) {
        const xx = x - 19 + random() * 35,
          yy = y - 20 + random() * 28;
        line(
          c,
          [
            [xx, yy + 2],
            [xx + 3, yy],
            [xx + 6, yy + 2],
          ],
          i % 3 ? "#537350" : "#6b865c",
          2,
        );
      }
    }
  }
}

function paintBuilding(c: Ctx, width: number, height: number, variant: number) {
  const w = width - 24,
    h = height - 38,
    x = 12,
    y = 18;
  const wall = c.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, "#8a8b93");
  wall.addColorStop(1, "#505563");
  oval(c, width / 2 + 9, height - 19, width - 10, 26, "#14192788");
  c.fillStyle = wall;
  c.fillRect(x, y + 70, w, h - 55);
  for (let yy = y + 77; yy < height - 18; yy += 18) {
    line(
      c,
      [
        [x + 2, yy],
        [x + w - 2, yy],
      ],
      "#3e4555",
      1,
    );
    for (let xx = x + (yy % 36 ? 0 : 21); xx < x + w; xx += 42)
      line(
        c,
        [
          [xx, yy],
          [xx, yy + 16],
        ],
        "#434958",
        1,
      );
  }
  for (const xx of [x + 3, x + w - 14]) {
    rect(c, xx, y + 60, 12, h - 45, "#696e7a");
    line(
      c,
      [
        [xx, y + 62],
        [xx, height - 20],
      ],
      "#a3a29c",
      2,
    );
  }
  const roof = variant % 2 ? "#514966" : "#4b536d";
  poly(
    c,
    [
      [x - 8, y + 79],
      [x + 28, y + 8],
      [x + w - 29, y + 8],
      [x + w + 8, y + 79],
    ],
    roof,
  );
  for (let row = 0; row < 6; row++) {
    const yy = y + 18 + row * 10,
      inset = 27 - row * 5;
    line(
      c,
      [
        [x + inset, yy],
        [x + w - inset, yy],
      ],
      row % 2 ? "#6c6c84" : "#393e56",
      2,
    );
    for (let xx = x + inset + (row % 2) * 11; xx < x + w - inset; xx += 23)
      line(
        c,
        [
          [xx, yy - 8],
          [xx + 2, yy],
        ],
        "#33384d",
        1,
      );
  }
  line(
    c,
    [
      [x - 8, y + 79],
      [x + w + 8, y + 79],
    ],
    "#969590",
    3,
  );
  line(
    c,
    [
      [x + 28, y + 8],
      [x + w - 29, y + 8],
    ],
    "#a0a09a",
    4,
  );
  const doorX = width / 2;
  c.beginPath();
  c.moveTo(doorX - 19, height - 23);
  c.lineTo(doorX - 19, height - 66);
  c.quadraticCurveTo(doorX, height - 94, doorX + 19, height - 66);
  c.lineTo(doorX + 19, height - 23);
  c.closePath();
  c.fillStyle = "#262c3e";
  c.fill();
  c.strokeStyle = "#b3a58b";
  c.lineWidth = 4;
  c.stroke();
  line(
    c,
    [
      [doorX, height - 78],
      [doorX, height - 24],
    ],
    "#6b6059",
    1,
  );
  oval(c, doorX + 9, height - 46, 3, 4, "#d4b77c");
  rect(c, doorX - 26, height - 22, 52, 7, "#91918d");
  rect(c, doorX - 31, height - 15, 62, 6, "#626b77");
  for (const xx of [x + 34, x + w - 60]) {
    rect(c, xx - 4, height - 88, 30, 42, "#a4a394");
    metal(c, xx, height - 84, 22, 34, "#acb4be", "#465a70");
    rect(c, xx + 10, height - 84, 2, 34, "#b6b1a0");
    rect(c, xx, height - 69, 22, 2, "#b6b1a0");
    line(
      c,
      [
        [xx + 3, height - 81],
        [xx + 8, height - 77],
      ],
      "#e1c596",
      2,
    );
  }
  for (const xx of [doorX - 35, doorX + 34]) {
    oval(c, xx, height - 69, 15, 20, "#efba6030");
    rect(c, xx - 3, height - 75, 6, 11, "#efc27c");
    line(
      c,
      [
        [xx - 4, height - 76],
        [xx + 4, height - 76],
      ],
      "#222b3a",
      2,
    );
  }
}

function paintProp(c: Ctx, kind: string) {
  if (kind === "bench") {
    oval(c, 64, 57, 113, 21, "#111a2670");
    for (const x of [21, 99]) {
      rect(c, x, 21, 6, 39, "#272e3c");
      rect(c, x - 3, 56, 11, 4, "#555c67");
    }
    for (let y = 16; y < 42; y += 8) {
      rect(c, 18, y, 91, 6, "#6e5b50");
      rect(c, 18, y, 91, 1, "#b09a77");
    }
    poly(
      c,
      [
        [15, 43],
        [106, 43],
        [114, 51],
        [10, 51],
      ],
      "#8c7361",
    );
    rect(c, 10, 51, 105, 3, "#37333a");
  } else if (kind === "lamp") {
    oval(c, 40, 127, 35, 12, "#13192788");
    poly(
      c,
      [
        [31, 127],
        [33, 118],
        [47, 118],
        [50, 127],
      ],
      "#3c4353",
    );
    metal(c, 37, 35, 6, 86, "#929389", "#343e50");
    poly(
      c,
      [
        [27, 17],
        [40, 9],
        [53, 17],
        [49, 40],
        [31, 40],
      ],
      "#272e40",
    );
    rect(c, 32, 20, 16, 16, "#cda96a");
    rect(c, 35, 20, 7, 16, "#f2d9a0");
    line(
      c,
      [
        [39, 19],
        [39, 37],
      ],
      "#53505a",
      2,
    );
    poly(
      c,
      [
        [25, 18],
        [40, 6],
        [55, 18],
      ],
      "#5b6170",
    );
    oval(c, 40, 3, 5, 5, "#b19a70");
  } else if (kind === "rock") {
    oval(c, 50, 57, 85, 20, "#111a2666");
    poly(
      c,
      [
        [8, 49],
        [20, 25],
        [46, 14],
        [74, 22],
        [91, 45],
        [80, 58],
        [29, 61],
      ],
      "#606575",
    );
    poly(
      c,
      [
        [20, 25],
        [47, 18],
        [57, 37],
        [30, 43],
        [8, 49],
      ],
      "#7c8288",
      "",
    );
    poly(
      c,
      [
        [57, 37],
        [74, 22],
        [91, 45],
        [80, 58],
      ],
      "#414c5d",
      "",
    );
    line(
      c,
      [
        [30, 29],
        [40, 35],
        [37, 48],
      ],
      "#a0a28d",
      1,
    );
    line(
      c,
      [
        [71, 43],
        [67, 52],
        [55, 57],
      ],
      "#8d9679",
      2,
    );
  } else if (kind === "planter") {
    poly(
      c,
      [
        [18, 64],
        [60, 64],
        [55, 89],
        [23, 89],
      ],
      "#5c5a60",
    );
    rect(c, 15, 61, 49, 7, "#949187");
    for (const [x, y, w] of [
      [28, 48, 24],
      [46, 43, 31],
      [37, 27, 30],
      [52, 25, 17],
      [26, 30, 20],
    ]) {
      oval(c, x, y, w, w, "#344e45", ink);
      oval(c, x - 3, y - 4, w * 0.7, w * 0.65, "#58735a");
    }
  } else if (kind === "portal") {
    oval(c, 80, 148, 123, 42, "#11192799");
    poly(
      c,
      [
        [13, 143],
        [36, 129],
        [126, 129],
        [148, 144],
        [136, 158],
        [25, 158],
      ],
      "#697084",
    );
    oval(c, 80, 145, 103, 28, "#29364c", "#9a9eb2");
    c.beginPath();
    c.ellipse(80, 80, 41, 66, 0, Math.PI, 0);
    c.lineTo(121, 142);
    c.lineTo(39, 142);
    c.closePath();
    c.fillStyle = "#242e49";
    c.fill();
    const portal = c.createRadialGradient(77, 77, 4, 80, 80, 67);
    portal.addColorStop(0, "#78d0e7");
    portal.addColorStop(0.45, "#3f779d");
    portal.addColorStop(1, "#292544");
    c.fillStyle = portal;
    c.beginPath();
    c.ellipse(80, 80, 33, 57, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const x = 80 + Math.cos(a) * 43,
        y = 80 + Math.sin(a) * 65;
      poly(
        c,
        [
          [x - 10, y - 9],
          [x + 10, y - 9],
          [x + 9, y + 9],
          [x - 9, y + 9],
        ],
        i % 2 ? "#84889b" : "#69758b",
      );
    }
    for (const x of [31, 117]) {
      metal(c, x, 71, 13, 72, "#9b9da2", "#4d5c74");
      for (let y = 88; y < 132; y += 18) rect(c, x, y, 13, 2, "#303b50");
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      oval(c, 80 + Math.cos(a) * 23, 80 + Math.sin(a) * 46, 4, 5, "#c1eef4");
    }
  } else if (kind === "fountain") {
    oval(c, 110, 120, 209, 78, "#151b2b66");
    oval(c, 110, 110, 188, 83, "#4c596e", ink);
    oval(c, 110, 98, 188, 75, "#979b9e", ink);
    oval(c, 110, 95, 164, 58, "#3d6478", "#c1bba7");
    oval(c, 109, 90, 151, 50, "#4b8193");
    for (const offset of [0, 12, 23]) {
      c.beginPath();
      c.ellipse(110, 93, 60 - offset, 19 - offset / 4, 0, 0.3, Math.PI * 1.7);
      c.strokeStyle = "#b1d5d255";
      c.lineWidth = 1.5;
      c.stroke();
    }
    metal(c, 99, 51, 22, 46, "#b4b6ae", "#636f7f");
    oval(c, 110, 49, 70, 26, "#8c9da8", ink);
    oval(c, 110, 45, 63, 20, "#7598a2", "#d2d0b4");
    metal(c, 105, 23, 10, 23, "#c4b79b", "#717e89");
    oval(c, 110, 22, 18, 18, "#bebca5", ink);
    for (const sign of [-1, 1]) {
      c.beginPath();
      c.moveTo(110 + sign * 19, 49);
      c.quadraticCurveTo(110 + sign * 47, 48, 110 + sign * 51, 91);
      c.strokeStyle = "#afd9ddbb";
      c.lineWidth = 3;
      c.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI;
      line(
        c,
        [
          [22 + i * 21, 117 + Math.sin(a) * 20],
          [22 + i * 21, 108 + Math.sin(a) * 20],
        ],
        "#b0b1a744",
        1,
      );
    }
  } else if (kind === "forge") {
    oval(c, 75, 99, 131, 26, "#14192788");
    poly(
      c,
      [
        [24, 22],
        [91, 22],
        [112, 80],
        [92, 93],
        [14, 80],
      ],
      "#53566a",
    );
    poly(
      c,
      [
        [28, 37],
        [86, 37],
        [99, 74],
        [26, 74],
      ],
      "#26293a",
    );
    const glow = c.createRadialGradient(61, 66, 5, 61, 66, 36);
    glow.addColorStop(0, "#ffdf8b");
    glow.addColorStop(0.4, "#df864b");
    glow.addColorStop(1, "#a0443922");
    c.fillStyle = glow;
    c.fillRect(27, 38, 69, 39);
    for (let i = 0; i < 5; i++)
      poly(
        c,
        [
          [34 + i * 12, 73],
          [38 + i * 12, 47 - (i % 3) * 4],
          [45 + i * 12, 73],
        ],
        i % 2 ? "#e57d39" : "#f3bd62",
        "",
      );
    for (const y of [24, 35, 80])
      line(
        c,
        [
          [23, y],
          [91, y],
        ],
        "#8a8390",
        3,
      );
    rect(c, 101, 74, 24, 22, "#5f4b42");
    poly(
      c,
      [
        [90, 60],
        [130, 60],
        [137, 67],
        [117, 72],
        [117, 80],
        [101, 80],
        [101, 70],
      ],
      "#9b9c9e",
    );
  } else if (kind === "market") {
    oval(c, 80, 107, 150, 25, "#12192566");
    for (const x of [20, 132]) {
      rect(c, x, 30, 6, 71, "#6b594a");
      rect(c, x + 1, 30, 2, 70, "#b59a70");
    }
    poly(
      c,
      [
        [11, 47],
        [31, 17],
        [125, 17],
        [149, 47],
      ],
      "#494864",
    );
    for (let x = 16; x < 145; x += 26)
      poly(
        c,
        [
          [x, 47],
          [x + 17, 17],
          [x + 28, 17],
          [x + 26, 47],
        ],
        "#968e9c",
        "",
      );
    rect(c, 10, 47, 140, 7, "#b9a487");
    rect(c, 22, 82, 112, 23, "#68554c");
    rect(c, 18, 77, 120, 8, "#a58c6a");
    for (const x of [32, 55, 80, 105]) {
      oval(c, x, 73, 13, 13, x % 2 ? "#84796c" : "#946d6b", ink);
      line(
        c,
        [
          [x - 3, 68],
          [x, 65],
          [x + 3, 68],
        ],
        "#c8b481",
        2,
      );
    }
    for (let x = 27; x < 133; x += 16) rect(c, x, 87, 1, 17, "#372f32");
  }
}

export function createFloor(scene: Phaser.Scene, city: boolean, theme: number) {
  const key = city ? "floor-city-v2" : `floor-hunt-v2-${theme}`;
  texture(scene, key, city ? 1600 : 1536, city ? 1152 : 1088, (c) => {
    const random = rng(713 + theme * 37),
      w = c.canvas.width,
      h = c.canvas.height;
    const grass = ["#303f3a", "#343c47", "#434336"][theme];
    rect(c, 0, 0, w, h, grass);
    // Uneven broad patches and thin blades, not a repeating dotted tile.
    for (let i = 0; i < 550; i++)
      oval(
        c,
        random() * w,
        random() * h,
        15 + random() * 115,
        10 + random() * 53,
        i % 2 ? "#56604a12" : "#171f2b18",
      );
    for (let i = 0; i < 9500; i++) {
      const x = random() * w,
        y = random() * h;
      line(
        c,
        [
          [x, y],
          [x - 1, y - 2 - random() * 3],
        ],
        i % 3 ? "#78907318" : "#0f172821",
        0.8,
      );
    }
    if (!city) {
      for (let i = 0; i < 5; i++) {
        const x = [380, 1020, 1210, 650, 250][i],
          y = [330, 300, 820, 880, 720][i];
        oval(c, x, y, 220, 140, "#7f73591a");
      }
      for (let i = 0; i < 300; i++) {
        const x = random() * w,
          y = random() * h;
        oval(
          c,
          x,
          y,
          2 + random() * 5,
          1 + random() * 2,
          i % 2 ? "#a5a08b33" : "#1d293744",
        );
      }
      return;
    }
    rect(c, 90, 100, 1420, 930, "#343c4e");
    for (let y = 100; y < 1030; y += 22)
      for (let x = 90 - (y % 44 ? 0 : 20); x < 1510; x += 42) {
        const value = Math.floor(random() * 14);
        rect(
          c,
          x + 1,
          y + 1,
          40,
          20,
          `rgb(${74 + value},${80 + value},${97 + value})`,
        );
        line(
          c,
          [
            [x + 2, y + 2],
            [x + 39, y + 2],
          ],
          "#a2a5b02a",
        );
        line(
          c,
          [
            [x + 2, y + 20],
            [x + 39, y + 20],
          ],
          "#1d263c77",
        );
        if (random() < 0.07)
          line(
            c,
            [
              [x + 14, y + 2],
              [x + 20, y + 9],
              [x + 17, y + 14],
            ],
            "#29324677",
          );
      }
    // Usable broad stairs and plaza inlays: all paths use canonical server coords.
    for (let i = 0; i < 11; i++) {
      const y = 139 + i * 15;
      rect(c, 590, y, 395, 13, i % 2 ? "#666a80" : "#5b6278");
      rect(c, 590, y, 395, 2, "#a0a1b17a");
      rect(c, 590, y + 12, 395, 2, "#252c41");
    }
    for (const x of [578, 985]) {
      rect(c, x, 125, 12, 190, "#434c64");
      rect(c, x, 125, 4, 190, "#9596a3");
    }
    oval(c, 800, 455, 280, 167, "#41495b", "#959187");
    oval(c, 800, 455, 260, 150, "#5f6777", "#b0a79855");
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      line(
        c,
        [
          [800 + Math.cos(a) * 96, 455 + Math.sin(a) * 50],
          [800 + Math.cos(a) * 130, 455 + Math.sin(a) * 75],
        ],
        "#3e465c",
        2,
      );
    }
    poly(
      c,
      [
        [800, 555],
        [864, 620],
        [800, 685],
        [736, 620],
      ],
      "#596377",
      "#b1a68b",
      2,
    );
    poly(
      c,
      [
        [800, 575],
        [845, 620],
        [800, 665],
        [755, 620],
      ],
      "#424b61",
      "#8a8e97",
      1,
    );
    for (const bed of [
      { x: 120, y: 385, w: 230, h: 280 },
      { x: 1270, y: 370, w: 190, h: 290 },
    ]) {
      rect(c, bed.x - 8, bed.y - 8, bed.w + 16, bed.h + 16, "#9a9b9d");
      rect(c, bed.x - 3, bed.y - 3, bed.w + 6, bed.h + 6, "#313a4a");
      rect(c, bed.x, bed.y, bed.w, bed.h, "#2b413b");
      for (let i = 0; i < 360; i++) {
        const x = bed.x + random() * bed.w,
          y = bed.y + random() * bed.h;
        line(
          c,
          [
            [x, y],
            [x - 1, y - 3],
          ],
          i % 2 ? "#68806a77" : "#132a3077",
        );
      }
    }
    for (const x of [90, 1498]) {
      rect(c, x, 100, 12, 930, "#8b8e96");
      rect(c, x + 2, 100, 2, 930, "#b9b5a2");
    }
  });
  return key;
}

export function createArt(scene: Phaser.Scene) {
  for (const race of Object.keys(RACES) as Race[])
    for (const kind of ["fighter", "mystic"] as Archetype[])
      for (const direction of ["front", "back", "side"] as Direction[])
        for (let frame = 0; frame < 3; frame++)
          texture(
            scene,
            `hero-${race}-${kind}-${direction}-${frame}`,
            96,
            112,
            (c) => paintHero(c, race, kind, frame, direction),
          );
  for (const kind of ["physical", "magic", "summon"])
    for (let variant = 0; variant < 3; variant++)
      for (let frame = 0; frame < 3; frame++)
        texture(scene, `creature-${kind}-${variant}-${frame}`, 96, 112, (c) =>
          paintCreature(c, kind, variant, frame),
        );
  for (const pine of [true, false])
    texture(scene, pine ? "tree-pine" : "tree-oak", 140, 164, (c) =>
      paintTree(c, pine),
    );
  const sizes: Record<string, [number, number]> = {
    bench: [128, 68],
    lamp: [80, 138],
    rock: [100, 70],
    planter: [80, 100],
    portal: [160, 172],
    fountain: [220, 160],
    forge: [150, 110],
    market: [160, 120],
  };
  for (const [kind, [w, h]] of Object.entries(sizes))
    texture(scene, `prop-${kind}`, w, h, (c) => paintProp(c, kind));
  for (const [i, b] of CITY.blocks.entries())
    texture(scene, `building-${i}`, b.w, b.h + 35, (c) =>
      paintBuilding(c, b.w, b.h + 35, i),
    );
}

const portraits = new Map<string, string>();
export function portraitFor(race: Race, kind: Archetype) {
  const key = `${race}-${kind}`;
  if (!portraits.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const c = canvas.getContext("2d")!;
    const gradient = c.createLinearGradient(0, 0, 96, 96);
    gradient.addColorStop(0, "#514858");
    gradient.addColorStop(1, "#1d2739");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 96, 96);
    c.translate(-27, -6);
    c.scale(1.6, 1.6);
    paintHero(c, race, kind);
    portraits.set(key, canvas.toDataURL());
  }
  return portraits.get(key)!;
}

const fullBodies = new Map<string, string>();
export function fullBodyFor(race: Race, kind: Archetype) {
  const key = `${race}-${kind}`;
  if (!fullBodies.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 112;
    paintHero(canvas.getContext("2d")!, race, kind);
    fullBodies.set(key, canvas.toDataURL());
  }
  return fullBodies.get(key)!;
}
