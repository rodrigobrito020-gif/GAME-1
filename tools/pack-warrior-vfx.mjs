// Assemble original painted VFX into deterministic animated PNG flipbooks.
// No browser, external art service or runtime rasterization is required to play.
import { readFileSync, writeFileSync } from "node:fs";
import { decodeRgba, encodeRgba } from "../png.mjs";
import { WARRIOR_ACTIONS } from "../warrior.mjs";
import { WARRIOR_VFX } from "../warrior-vfx.mjs";
const source = decodeRgba(
  readFileSync(
    new URL("../art/warrior/source/skills-vfx.png", import.meta.url),
  ),
);
const aegisSource = decodeRgba(
  readFileSync(new URL("../art/warrior/source/aegis-vfx.png", import.meta.url)),
);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
function blend(pixels, x, y, r, g, b, alpha) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 1 || y < 1 || x > 126 || y > 126 || alpha <= 0) return;
  const at = (y * 128 + x) * 4,
    old = pixels[at + 3] / 255,
    a = clamp(alpha),
    total = a + old * (1 - a);
  for (const [i, value] of [
    [0, r],
    [1, g],
    [2, b],
  ])
    pixels[at + i] = Math.round(
      (value * a + pixels[at + i] * old * (1 - a)) / total,
    );
  pixels[at + 3] = Math.round(total * 255);
}
function glint(pixels, x, y, size, alpha, blue = false) {
  for (let dy = -size * 2; dy <= size * 2; dy++)
    for (let dx = -size * 2; dx <= size * 2; dx++) {
      const ray = Math.max(
        Math.exp(-((dx * dx) / 1.1 + (dy * dy) / (size * size))),
        Math.exp(-((dy * dy) / 1.1 + (dx * dx) / (size * size))),
      );
      if (ray < 0.04) continue;
      blend(
        pixels,
        x + dx,
        y + dy,
        blue ? 142 : 255,
        blue ? 204 : 218,
        blue ? 255 : 136,
        ray * alpha * 0.7,
      );
      if (Math.abs(dx) + Math.abs(dy) < 1.1)
        blend(pixels, x + dx, y + dy, 255, 250, 232, alpha);
    }
}
function paint(
  pixels,
  fx,
  {
    scaleX,
    scaleY = scaleX,
    angle = 0,
    alpha = 1,
    cx = 64,
    cy = 64,
    phase = 0,
    shimmer = false,
  },
) {
  if (alpha <= 0) return;
  const art = fx.source === "aegis" ? aegisSource : source;
  const halfW = art.width / 2,
    halfH = art.height / 2,
    ox = (fx.cell % 2) * halfW,
    oy = Math.floor(fx.cell / 2) * halfH,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  for (let y = 1; y < 127; y++)
    for (let x = 1; x < 127; x++) {
      let a = 0,
        red = 0,
        green = 0,
        blue = 0;
      for (let yy = 0; yy < 2; yy++)
        for (let xx = 0; xx < 2; xx++) {
          const dx = x + (xx + 0.5) / 2 - cx,
            dy = y + (yy + 0.5) / 2 - cy;
          let ux = (dx * cos + dy * sin) / scaleX,
            uy = (-dx * sin + dy * cos) / scaleY;
          if (shimmer) ux += Math.sin(uy * 0.22 + phase * Math.PI * 2) * 0.9;
          const sx = (ux / 94 + 0.5) * halfW,
            sy = (uy / 94 + 0.5) * halfH;
          if (sx < 0 || sy < 0 || sx >= halfW || sy >= halfH) continue;
          const index =
            (Math.floor(oy + sy) * art.width + Math.floor(ox + sx)) * 4;
          const edge = clamp(Math.min(sx, sy, halfW - sx, halfH - sy) / 10);
          const opacity = art.pixels[index + 3] * edge;
          if (opacity < 8) continue;
          a += opacity;
          red += art.pixels[index] * opacity;
          green += art.pixels[index + 1] * opacity;
          blue += art.pixels[index + 2] * opacity;
        }
      if (a)
        blend(
          pixels,
          x,
          y,
          red / a,
          green / a,
          blue / a,
          (a / (4 * 255)) * alpha,
        );
    }
}
function ring(pixels, radius, alpha, cy = 96) {
  for (let y = 1; y < 127; y++)
    for (let x = 1; x < 127; x++) {
      const d = Math.hypot(x - 64, (y - cy) / 0.43);
      const glow = Math.exp(-Math.pow((d - radius) / 1.25, 2));
      if (glow > 0.02) blend(pixels, x, y, 101, 171, 212, glow * alpha);
    }
}
function shieldFrame() {
  const w = aegisSource.width / 2,
    h = aegisSource.height / 2;
  const seen = new Uint8Array(w * h);
  let largest = null;
  for (let start = 0; start < seen.length; start++) {
    const sx = start % w,
      sy = Math.floor(start / w);
    if (
      seen[start] ||
      aegisSource.pixels[(sy * aegisSource.width + sx) * 4 + 3] < 220
    )
      continue;
    const queue = [start];
    seen[start] = 1;
    let x0 = sx,
      y0 = sy,
      x1 = sx,
      y1 = sy;
    for (let n = 0; n < queue.length; n++) {
      const at = queue[n],
        x = at % w,
        y = Math.floor(at / w);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const next of [at - 1, at + 1, at - w, at + w]) {
        const nx = next % w,
          ny = Math.floor(next / w);
        if (
          next < 0 ||
          next >= seen.length ||
          seen[next] ||
          Math.abs(nx - x) > 1 ||
          aegisSource.pixels[(ny * aegisSource.width + nx) * 4 + 3] < 220
        )
          continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    if (!largest || queue.length > largest.count)
      largest = { x0, y0, x1, y1, count: queue.length };
  }
  if (!largest) throw Error("Escudo da Égide sem silhueta opaca.");
  const { x0, y0, x1, y1 } = largest,
    scale = Math.min(104 / (x1 - x0 + 1), 116 / (y1 - y0 + 1));
  const pixels = Buffer.alloc(128 * 128 * 4);
  for (let y = 1; y < 127; y++)
    for (let x = 1; x < 127; x++) {
      const sx = Math.floor((x - 64) / scale + (x0 + x1) / 2),
        sy = Math.floor((y - 64) / scale + (y0 + y1) / 2);
      if (sx < x0 - 1 || sx > x1 + 1 || sy < y0 - 1 || sy > y1 + 1) continue;
      const at = (sy * aegisSource.width + sx) * 4;
      aegisSource.pixels.copy(pixels, (y * 128 + x) * 4, at, at + 4);
    }
  return pixels;
}
function frame(fx, index) {
  if (fx.kind === "aegis-shield") return shieldFrame();
  const pixels = Buffer.alloc(128 * 128 * 4),
    ms = (index * 1000) / fx.fps,
    t = index / (fx.frames - 1),
    impact = WARRIOR_ACTIONS[fx.skill]?.impact ?? 90,
    before = smooth(
      (ms - (fx.start ?? 0)) / Math.max(1, impact - (fx.start ?? 0)),
    ),
    after = clamp((ms - impact) / Math.max(1, fx.end - impact)),
    fade = 1 - smooth((after - 0.15) / 0.85);
  if (fx.cast && ms < fx.start) return pixels;
  if (fx.kind.startsWith("aegis")) {
    const loop = fx.kind === "aegis-loop",
      finish = fx.kind === "aegis-fade";
    if (fx.kind === "aegis-shield") {
      // Full painted crest for the three independent orbiting sprites.
      paint(pixels, fx, { scaleX: 0.98, scaleY: 0.98, cy: 64, alpha: 1 });
    } else if (loop) {
      // Keep a readable gold ring at the feet, with three moving light motes.
      // A full turn uses exactly one flipbook cycle; do not fade the loop away.
      paint(pixels, fx, {
        scaleX: 1.08,
        scaleY: 0.84,
        cy: 92,
        alpha: 0.87 + 0.06 * Math.sin(t * Math.PI * 2),
        phase: t,
      });
      // A bronze edge remains readable on the courtyard's pale stone.
      for (let y = 69; y < 115; y++)
        for (let x = 12; x < 117; x++) {
          const d = Math.hypot(x - 64, (y - 92) / 0.375);
          const alpha = Math.exp(-Math.pow((d - 49) / 0.7, 2)) * 0.65;
          if (alpha > 0.03) blend(pixels, x, y, 119, 76, 21, alpha);
        }
      for (let i = 0; i < 3; i++) {
        const angle = (index / fx.frames) * Math.PI * 2 + (i * Math.PI * 2) / 3;
        for (let tail = 6; tail >= 0; tail--) {
          const angle =
            (index / fx.frames) * Math.PI * 2 +
            (i * Math.PI * 2) / 3 -
            tail * 0.065;
          glint(
            pixels,
            64 + Math.cos(angle) * 48,
            92 + Math.sin(angle) * 18,
            tail === 0 ? 2.6 : 1.3,
            tail === 0 ? 0.98 : 0.42 * (1 - tail / 7),
          );
        }
      }
    } else {
      const alpha = finish ? (1 - smooth(t)) * 0.55 : before * fade * 0.9;
      const scale = finish
        ? 0.9 + t * 0.18
        : 0.72 + before * 0.24 + after * 0.06;
      paint(pixels, fx, {
        scaleX: scale,
        scaleY: scale,
        cy: 61,
        alpha,
        phase: t,
      });
      for (let i = 0; i < 6; i++)
        glint(
          pixels,
          64 + Math.sin(i * 2.4 + t * 2) * 35,
          105 - ((t + i / 6) % 1) * 70,
          1.2,
          alpha * 0.55,
        );
    }
  } else if (fx.kind === "light-dash") {
    // A low ribbon of white/gold wind, followed by sparse light motes. It
    // spans the path at cast time and fades independently after landing.
    const dashTime = Math.max(0, Math.min(1, (ms - 50) / 250));
    paint(pixels, fx, {
      scaleX: 0.6 + dashTime * 0.5,
      scaleY: 0.55,
      cx: 56 + dashTime * 8,
      cy: 66,
      alpha: before * fade * 0.88,
      phase: t,
      shimmer: true,
    });
    for (let i = 0; i < 9; i++) {
      const x = 23 + i * 9 + dashTime * 10;
      glint(
        pixels,
        x,
        66 + Math.sin(i * 2.4 + t * 5) * 13,
        1.4 + (i % 2),
        before * fade * 0.7,
        false,
      );
    }
  } else if (fx.kind === "slash") {
    const size = ms < impact ? 0.55 + 0.32 * before : 0.87 + 0.08 * after;
    paint(pixels, fx, {
      scaleX: size,
      angle: -0.42 + before * 0.55 + after * 0.12,
      alpha: before * fade,
      phase: t,
      shimmer: true,
    });
  } else if (fx.kind === "rush") {
    paint(pixels, fx, {
      scaleX: 0.7 + 0.37 * before,
      scaleY: 0.8,
      cx: 54 + before * 13 + after * 4,
      cy: 61,
      alpha: before * fade,
      phase: t,
      shimmer: true,
    });
  } else if (fx.kind === "quake") {
    if (ms < impact) ring(pixels, 24 + before * 18, 0.18 + before * 0.3);
    else {
      const grow = 1 - Math.exp(-(ms - impact) / 100);
      paint(pixels, fx, {
        scaleX: 0.6 + grow * 0.5 + after * 0.08,
        scaleY: (0.6 + grow * 0.5) * 0.54,
        cy: 92,
        alpha: fade * 0.95,
        phase: t,
      });
      ring(pixels, 36 + 21 * clamp((ms - impact) / 550), fade * 0.4);
    }
  } else if (fx.kind === "impact") {
    const grow = 1 - Math.exp(-ms / 100),
      opacity = Math.sin(Math.PI * Math.pow(t, 0.65));
    paint(pixels, fx, {
      scaleX: 0.35 + grow * 0.6 + t * 0.1,
      scaleY: (0.35 + grow * 0.6) * 0.65,
      cy: 87,
      alpha: opacity,
      phase: t,
    });
  } else if (fx.kind === "aura" || fx.kind === "aura-loop") {
    const loop = fx.kind === "aura-loop",
      size = loop
        ? 0.99 + 0.025 * Math.sin(t * Math.PI * 2)
        : 0.72 + before * 0.28;
    paint(pixels, fx, {
      scaleX: size * 0.88,
      scaleY: size,
      cy: 66,
      alpha: loop ? 0.5 : before * fade * 0.88,
      phase: t,
      shimmer: true,
    });
  } else if (fx.kind === "spark") {
    const opacity = Math.sin(Math.PI * Math.pow(t, 0.55));
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 + 0.3,
        r = 3 + Math.sqrt(t) * 29;
      glint(
        pixels,
        64 + Math.cos(a) * r,
        64 + Math.sin(a) * r,
        1.7 + (i % 3),
        opacity,
        i % 3 === 0,
      );
    }
  }
  if (fx.kind !== "spark" && !fx.kind.startsWith("aegis")) {
    const opacity =
      fx.kind === "embers"
        ? Math.sin(Math.PI * t) * 0.7
        : fx.cast
          ? before * fade * 0.7
          : Math.sin(Math.PI * t) * 0.7;
    const ground = ["quake", "impact"].includes(fx.kind),
      aura = fx.kind.startsWith("aura") || fx.kind === "embers";
    if (!ground || ms >= impact || !fx.cast)
      for (let i = 0; i < 12; i++) {
        const angle = i * 2.39996,
          radius = 13 + (18 + (i % 7)) * t,
          x = aura
            ? 64 + Math.sin(angle + t) * (26 + (i % 11))
            : 64 + Math.cos(angle) * radius,
          y = aura
            ? 110 - ((t + i / 12) % 1) * 82
            : (ground ? 92 : 66) +
              Math.sin(angle) * radius * (ground ? 0.4 : 0.7) -
              t * 12;
        glint(pixels, x, y, 1.4 + (i % 2), opacity, i % 3 === 0);
      }
  }
  return pixels;
}
const manifest = {};
for (const [id, fx] of Object.entries(WARRIOR_VFX)) {
  if (id === "guerreiro-avatar-corte") continue;
  const width = fx.frames * 128,
    pixels = Buffer.alloc(width * 128 * 4);
  for (let i = 0; i < fx.frames; i++) {
    const data = frame(fx, i);
    for (let y = 0; y < 128; y++)
      data.copy(pixels, (y * width + i * 128) * 4, y * 512, (y + 1) * 512);
  }
  writeFileSync(
    new URL(`../art/warrior/vfx/${id}.png`, import.meta.url),
    encodeRgba(width, 128, pixels),
  );
  manifest[id] = {
    frames: fx.frames,
    fps: fx.fps,
    durationMs: Math.round((fx.frames / fx.fps) * 1000),
    impactMs: fx.skill ? WARRIOR_ACTIONS[fx.skill].impact : null,
    frame: [128, 128],
    layer: fx.layer,
  };
}
writeFileSync(
  new URL("../art/warrior/vfx/manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Efeitos de habilidade empacotados, com preparação, impacto e dissipação.",
);
