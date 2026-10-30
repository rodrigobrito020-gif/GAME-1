// Small PNG adapter for the captured RGBA8 idle sheet. Only converts the local
// uploaded image to the client's 64px frame format; it invents no walk/attack art.
import { inflateSync, deflateSync } from "node:zlib";
function crc(bytes) {
  let n = 0xffffffff;
  for (const b of bytes) {
    n ^= b;
    for (let i = 0; i < 8; i++) n = n & 1 ? (n >>> 1) ^ 0xedb88320 : n >>> 1;
  }
  return (n ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc(Buffer.concat([name, data])), out.length - 4);
  return out;
}
export function encodeRgba(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++)
    pixels.copy(
      rows,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
export function decodeRgba(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw Error("PNG invalid");
  let i = 8,
    width = 0,
    height = 0;
  const packed = [];
  while (i + 12 <= bytes.length) {
    const len = bytes.readUInt32BE(i),
      name = bytes.subarray(i + 4, i + 8).toString("ascii");
    if (i + len + 12 > bytes.length) throw Error("PNG truncated");
    const data = bytes.subarray(i + 8, i + 8 + len);
    if (name === "IHDR") {
      width = data.readUInt32BE();
      height = data.readUInt32BE(4);
      if (
        data[8] !== 8 ||
        data[9] !== 6 ||
        data[12] !== 0 ||
        width > 4096 ||
        height > 4096
      )
        throw Error("Only RGBA8 non-interlaced PNG accepted");
    }
    if (name === "IDAT") packed.push(data);
    i += len + 12;
    if (name === "IEND") break;
  }
  if (!width || !height) throw Error("PNG header missing");
  const stride = width * 4,
    raw = inflateSync(Buffer.concat(packed), {
      maxOutputLength: (stride + 1) * height,
    }),
    pixels = Buffer.alloc(stride * height);
  if (raw.length !== (stride + 1) * height) throw Error("PNG rows invalid");
  for (let y = 0; y < height; y++) {
    const kind = raw[y * (stride + 1)];
    if (kind > 4) throw Error("PNG filter invalid");
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0,
        b = y ? pixels[(y - 1) * stride + x] : 0,
        c = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (kind === 1) predictor = a;
      else if (kind === 2) predictor = b;
      else if (kind === 3) predictor = Math.floor((a + b) / 2);
      else if (kind === 4) {
        const p = a + b - c,
          pa = Math.abs(p - a),
          pb = Math.abs(p - b),
          pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[y * stride + x] =
        (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  return { width, height, pixels };
}
export function adaptIdle(bytes, frames = 4) {
  const source = decodeRgba(bytes);
  if (source.width !== 384 || source.height !== 448)
    throw Error("Captured idle dimensions differ");
  const width = frames * 64,
    height = 256,
    pixels = Buffer.alloc(width * height * 4);
  for (let row = 0; row < 4; row++)
    for (let frame = 0; frame < frames; frame++)
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 55; x++) {
          const sx = (frame % 4) * 96 + Math.min(95, Math.floor((x * 96) / 55)),
            sy = row * 112 + Math.min(111, Math.floor((y * 112) / 64));
          const src = (sy * 384 + sx) * 4,
            dst = ((row * 64 + y) * width + frame * 64 + x + 4) * 4;
          source.pixels.copy(pixels, dst, src, src + 4);
        }
  return encodeRgba(width, height, pixels);
}
