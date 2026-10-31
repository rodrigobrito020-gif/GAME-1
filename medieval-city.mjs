import { readFileSync } from "node:fs";
export const MEDIEVAL_CITY_ID = "praca-da-coroa";
export const MEDIEVAL_CITY_NAME = "Praça da Coroa";
export const MEDIEVAL_CITY_WIDTH = 1920;
export const MEDIEVAL_CITY_HEIGHT = 1536;
// Original architecture generated for this project. The browser composes the
// atlas without changing the supplied client's executable or its other maps.
export function createMedievalCity() {
  const width = 60,
    height = 48,
    collisions = Array(width * height).fill(0);
  const block = (x, y, w, h) => {
    for (let r = Math.floor(y / 32); r < Math.ceil((y + h) / 32); r++)
      for (let c = Math.floor(x / 32); c < Math.ceil((x + w) / 32); c++)
        if (r >= 0 && r < height && c >= 0 && c < width)
          collisions[r * width + c] = 1;
  };
  block(0, 0, 1920, 96);
  block(0, 0, 96, 1536);
  block(1824, 0, 96, 1536);
  block(0, 1440, 832, 96);
  block(1088, 1440, 832, 96);
  block(576, 32, 768, 512); // Palace and towers.
  block(416, 384, 416, 288);
  block(1056, 384, 416, 288); // Merchant hall and treasury.
  block(864, 896, 192, 192); // Fountain; the plaza remains walkable around it.
  block(192, 832, 352, 256);
  block(1376, 832, 352, 256); // Raised gardens.
  block(576, 960, 96, 32);
  block(1280, 960, 96, 32);
  block(576, 1312, 96, 32);
  block(1248, 1312, 96, 32);
  block(160, 1152, 352, 256);
  block(1408, 1152, 352, 256); // Southern houses.
  const map = {
    format: "atlas-map",
    version: 1,
    name: MEDIEVAL_CITY_NAME,
    tileSize: 32,
    width,
    height,
    tilesets: [
      {
        id: "coroa",
        name: "Cidade medieval — marfim e ouro",
        src: "tilesets/coroa.svg",
        width: 1920,
        height: 1536,
        tileSize: 32,
        columns: 60,
        rows: 48,
      },
    ],
    layers: [
      {
        id: "ground",
        name: "Cidade",
        kind: "ground",
        visible: true,
        opacity: 1,
        data: Array.from({ length: width * height }, (_, index) => ({
          tileset: "coroa",
          x: index % width,
          y: Math.floor(index / width),
          flipX: false,
          flipY: false,
        })),
      },
    ],
    collisions,
    spawn: { x: 29, y: 22 },
    animations: [],
    properties: {
      backgroundColor: "#687c53",
      music: "",
      notes:
        "Cidade própria: pedra marfim, telhados dourados, palácio, comércio, cofre e fonte.",
    },
    effects: {
      sun: { enabled: true, intensity: 0.1 },
      fog: { enabled: false, intensity: 0 },
      rain: { enabled: false },
      snow: { enabled: false },
      lighting: { period: "day", intensity: 0.08 },
      particles: {
        leaves: { enabled: true, intensity: 0.025 },
        fireflies: { enabled: false },
        embers: { enabled: false },
      },
      emitters: [
        {
          id: "gold-entry",
          type: "sparkle",
          x: 29.5,
          y: 19.2,
          intensity: 0.15,
          radius: 30,
          color: "#e8c36b",
          speed: 0.45,
        },
        ...[
          [20, 21],
          [39, 21],
          [23, 37],
          [36, 37],
        ].map(([x, y], i) => ({
          id: "candle-" + i,
          type: "pointLight",
          x,
          y,
          intensity: 0.22,
          radius: 65,
          color: "#ffe3a5",
          speed: 0.45,
          pulse: true,
        })),
      ],
    },
  };
  let svg;
  const texture = () => {
    if (svg) return svg;
    const atlas = readFileSync(
      new URL("./art/medieval-ivory-gold.png", import.meta.url),
    ).toString("base64");
    const rect = (x, y, w, h, fill, extra = "") =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
    const circle = (x, y, r, fill, extra = "") =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
    const path = (d, fill, extra = "") =>
      `<path d="${d}" fill="${fill}" ${extra}/>`;
    const art = (name, x, y, w, h) => {
      const areas = {
        palace: [0, 0, 695, 640],
        shop: [700, 0, 554, 640],
        vault: [0, 640, 695, 614],
        fountain: [700, 640, 554, 614],
      };
      const [sx, sy, sw, sh] = areas[name];
      return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none" overflow="hidden"><use href="#royal-atlas"/></svg>`;
    };
    const tree = (x, y, s = 1) =>
      `<g transform="translate(${x} ${y}) scale(${s})">${path("M-30 8Q0-5 42 12L30 25-28 22Z", "#233f2b", 'opacity=".24"')}${rect(-5, -20, 10, 45, "#795734")}${path("M-35-6 0-69 35-6 23-8 36 9H-36L-24-9Z", "#365740")}${path("M-31-7 0-69 0 9H-36L-24-9Z", "#577952")}${path("M-20-10 0-49 20-10 11-12 25 2H-25Z", "#7c9b66")}</g>`;
    const bench = (x, y) =>
      `<g transform="translate(${x} ${y})">${rect(-35, 4, 80, 22, "#a59675", 'opacity=".25"')}${rect(-34, -8, 68, 17, "#a87936", 'rx="2"')}${rect(-34, -5, 68, 3, "#d7b569")}${rect(-34, 2, 68, 3, "#6e4e27")}${rect(-38, -17, 76, 9, "#bd9149")}${rect(-28, 8, 6, 13, "#655136")}${rect(22, 8, 6, 13, "#655136")}</g>`;
    const torch = (x, y) =>
      `<g transform="translate(${x} ${y})">${rect(-14, 2, 35, 13, "#8f7d55", 'opacity=".2"')}${rect(-11, 0, 22, 8, "#d0c2a4")}${rect(-8, -5, 16, 5, "#fdf6dc")}${rect(-4, -42, 8, 37, "#9b7132")}${path("M-12-43H12L7-31H-7Z", "#c39a4e")}${path("M0-65Q-16-50-3-42Q13-45 0-65Z", "#efa94d")}${path("M0-57Q-7-47 0-43Q6-47 0-57Z", "#fff4b8")}</g>`;
    const banner = (x, y, flip = 1) =>
      `<g transform="translate(${x} ${y}) scale(${flip} 1)">${rect(-3, -80, 6, 98, "#98723b")}${circle(0, -84, 5, "#edce7e")}${rect(3, -77, 53, 4, "#b58d44")}${path("M7-71H49V-15L28-25 7-15Z", "#fff9e6", 'stroke="#b88c40" stroke-width="3"')}${path("M28-62 38-48 28-35 18-48Z", "#caa34d")}${path("M28-57 33-48 28-40 23-48Z", "#fff2b9")}</g>`;
    const garden = (x, y, w, h) => {
      let s =
        rect(x + 10, y + 12, w, h, "#7e8c66", 'opacity=".25"') +
        rect(x, y, w, h, "#cdbf9d", 'rx="14"') +
        rect(x + 5, y + 5, w - 10, h - 10, "#faf2d9", 'rx="11"') +
        rect(x + 13, y + 13, w - 26, h - 26, "url(#grass)", 'rx="6"');
      for (let cx = x + 30; cx < x + w - 12; cx += 32)
        for (const yy of [y + 30, y + h - 30])
          s +=
            circle(cx, yy, 20, "#567447") +
            circle(cx - 4, yy - 5, 14, "#86a56d") +
            circle(cx + 7, yy + 5, 3, "#ddd8b4");
      for (let cy = y + 62; cy < y + h - 30; cy += 32)
        for (const xx of [x + 30, x + w - 30])
          s +=
            circle(xx, cy, 20, "#567447") +
            circle(xx - 4, cy - 5, 14, "#86a56d");
      for (let i = 0; i < 7; i++) {
        const xx = x + 62 + ((i * 37) % (w - 124)),
          yy = y + 63 + ((i * 31) % (h - 126));
        s +=
          circle(xx, yy, 3, "#fff8e4") + circle(xx + 4, yy + 3, 2, "#d9b454");
      }
      return s;
    };
    const pieces = [
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1536" viewBox="0 0 1920 1536"><defs><image id="royal-atlas" href="data:image/png;base64,${atlas}" width="1254" height="1254"/><pattern id="stone" width="96" height="64" patternUnits="userSpaceOnUse"><rect width="96" height="64" fill="#d5cbb1"/><path d="M1 1H95V31H1ZM-47 33H47V63H-47ZM49 33H143V63H49Z" fill="#f0e8d3" stroke="#c5b99c" stroke-width="1"/><path d="M3 3H92M3 35H44M51 35H92" stroke="#fff9e9" stroke-width="2"/><path d="M9 15H15M73 48H79M37 23H40" stroke="#c8bda5" opacity=".4"/></pattern><pattern id="grass" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#8ca471"/><path d="M3 17 5 12 7 17M21 8 24 3 26 8M17 29 20 24 21 29" fill="none" stroke="#afbd87" stroke-width="1.5"/><path d="M9 25 12 20M29 22 27 18" stroke="#718b5c"/></pattern><pattern id="wall" width="64" height="48" patternUnits="userSpaceOnUse"><rect width="64" height="48" fill="#d4c6a5"/><path d="M0 0H64V22H0ZM0 24H30V46H0ZM32 24H64V46H32Z" fill="#f1e7cd"/><path d="M2 2H60M2 26H27M34 26H60" stroke="#fffbee" stroke-width="2"/></pattern></defs>`,
    ];
    pieces.push(rect(0, 0, 1920, 1536, "url(#grass)"));
    // Ivory streets, gold inlay and a wide uncluttered plaza.
    pieces.push(
      rect(96, 640, 1728, 800, "#aa9567"),
      rect(104, 648, 1712, 784, "url(#stone)"),
    );
    pieces.push(
      rect(816, 96, 256, 1440, "#b88e42"),
      rect(824, 96, 240, 1440, "url(#stone)"),
    );
    pieces.push(
      rect(96, 696, 1728, 8, "#c6a253"),
      rect(96, 704, 1728, 4, "#fff5d7"),
    );
    pieces.push(
      rect(96, 1264, 1728, 6, "#c6a253"),
      rect(96, 1270, 1728, 4, "#fff5d7"),
    );
    pieces.push(
      circle(960, 992, 222, "#c9ac68"),
      circle(960, 992, 215, "#f6eedb"),
      circle(960, 992, 194, "none", 'stroke="#c5a560" stroke-width="3"'),
      circle(960, 992, 176, "url(#stone)"),
    );
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const x = 960 + Math.cos(a) * 199,
        y = 992 + Math.sin(a) * 199;
      pieces.push(
        `<g transform="translate(${x} ${y}) rotate(${i * 45})">${path("M-8 0 0-14 8 0 0 14Z", "#b99043")}</g>`,
      );
    }
    pieces.push(garden(160, 800, 416, 320), garden(1344, 800, 416, 320));
    // Original palace, merchant hall, treasury and fountain art.
    pieces.push(art("palace", 560, -8, 800, 592));
    pieces.push(
      art("shop", 416, 332, 416, 340),
      art("vault", 1056, 332, 416, 340),
    );
    pieces.push(rect(800, 576, 320, 112, "#baa779"));
    for (let y = 576; y < 688; y += 16)
      pieces.push(
        rect(800, y, 320, 13, "#f8efd8"),
        rect(800, y + 13, 320, 3, "#a79164"),
        rect(804, y + 1, 312, 2, "#fffbed"),
      );
    pieces.push(art("fountain", 848, 864, 224, 224));
    pieces.push(
      art("shop", 128, 1096, 416, 312),
      art("vault", 1376, 1096, 416, 312),
    );
    pieces.push(
      bench(624, 1328),
      bench(1296, 1328),
      bench(608, 976),
      bench(1312, 976),
    );
    pieces.push(
      banner(704, 760),
      banner(1216, 760, -1),
      banner(736, 1328),
      banner(1184, 1328, -1),
    );
    for (const [x, y] of [
      [656, 704],
      [1264, 704],
      [752, 1216],
      [1168, 1216],
    ])
      pieces.push(torch(x, y));
    for (const [x, y] of [
      [224, 958],
      [512, 958],
      [1408, 958],
      [1696, 958],
    ])
      pieces.push(tree(x, y, 0.95));
    // Enclosing medieval curtain walls; a southern passage remains open.
    pieces.push(
      rect(64, 32, 1792, 112, "#4c5d42", 'opacity=".22"'),
      rect(64, 32, 1792, 96, "url(#wall)"),
      rect(64, 32, 1792, 10, "#ba934c"),
      rect(64, 42, 1792, 4, "#fff5d5"),
    );
    pieces.push(
      rect(32, 32, 64, 1472, "url(#wall)"),
      rect(1824, 32, 64, 1472, "url(#wall)"),
    );
    pieces.push(
      rect(64, 1440, 768, 64, "url(#wall)"),
      rect(1088, 1440, 768, 64, "url(#wall)"),
    );
    for (let x = 64; x < 1856; x += 64)
      pieces.push(
        rect(x, 16, 40, 32, "#fcf3dc"),
        rect(x, 16, 40, 5, "#bd9449"),
      );
    for (let y = 64; y < 1504; y += 64)
      for (const x of [16, 1856])
        pieces.push(
          rect(x, y, 48, 40, "#f4e9cf"),
          rect(x, y, 48, 5, "#bc9245"),
        );
    for (const x of [752, 1088])
      pieces.push(
        rect(x, 1376, 80, 128, "url(#wall)"),
        rect(x - 4, 1372, 88, 14, "#c39b51"),
        banner(x + 40, 1360),
      );
    for (let x = 144; x < 1776; x += 96)
      if (x < 512 || x > 1408) pieces.push(tree(x, 232, 0.85));
    pieces.push("</svg>");
    svg = Buffer.from(pieces.join(""));
    return svg;
  };
  return { id: MEDIEVAL_CITY_ID, name: MEDIEVAL_CITY_NAME, map, texture };
}
