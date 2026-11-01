// Asset packing mask: keep the largest opaque silhouette in each calibrated part
// rectangle plus its antialiased edge. Faint matte and neighboring rows are not
// sprite content, even when an export writes nonzero alpha into every pixel.
export function isolateParts(source, rectangles) {
  const { width, height } = source,
    pixels = Buffer.from(source.pixels),
    keep = new Uint8Array(width * height),
    partMasks = new Map();
  for (const [x0, y0, x1, y1] of rectangles) {
    const seen = new Set(),
      components = [];
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const at = y * width + x;
        if (seen.has(at) || source.pixels[at * 4 + 3] < 245) continue;
        const points = [at];
        seen.add(at);
        for (let n = 0; n < points.length; n++) {
          const i = points[n],
            px = i % width,
            py = Math.floor(i / width);
          for (const [nx, ny] of [
            [px - 1, py],
            [px + 1, py],
            [px, py - 1],
            [px, py + 1],
          ]) {
            const j = ny * width + nx;
            if (
              nx < x0 ||
              nx > x1 ||
              ny < y0 ||
              ny > y1 ||
              seen.has(j) ||
              source.pixels[j * 4 + 3] < 245
            )
              continue;
            seen.add(j);
            points.push(j);
          }
        }
        components.push(points);
      }
    const body = components.sort((a, b) => b.length - a.length)[0];
    if (!body) throw Error("Opaque sprite part missing: " + [x0, y0, x1, y1]);
    const mask = new Set(body);
    for (const i of body)
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const x = (i % width) + dx,
            y = Math.floor(i / width) + dy;
          if (x >= x0 && x <= x1 && y >= y0 && y <= y1) mask.add(y * width + x);
        }
    partMasks.set([x0, y0, x1, y1].join(","), mask);
    for (const i of mask) keep[i] = 1;
  }
  for (let i = 0; i < keep.length; i++) if (!keep[i]) pixels[i * 4 + 3] = 0;
  return { ...source, pixels, partMasks };
}
