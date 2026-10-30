import { inflateRawSync } from "node:zlib";
import path from "node:path";
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = (bytes) => {
  let n = 0xffffffff;
  for (const b of bytes) n = crcTable[(n ^ b) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
};

// Read only named entries; no uploaded JavaScript is evaluated or extracted.
export function readZip(bytes) {
  if (bytes.length > 128 * 1024 * 1024) throw Error("ZIP acima de 128 MB.");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      bytes.readUInt32LE(i) === 0x06054b50 &&
      i + 22 + bytes.readUInt16LE(i + 20) === bytes.length
    ) {
      end = i;
      break;
    }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6))
    throw Error("ZIP inválido ou dividido em volumes.");
  const count = bytes.readUInt16LE(end + 10),
    entries = new Map();
  if (count > 2000 || count === 65535)
    throw Error("ZIP com entradas demais ou formato ZIP64 não suportado.");
  let offset = bytes.readUInt32LE(end + 16),
    total = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50)
      throw Error("Índice ZIP inválido.");
    const compressed = bytes.readUInt32LE(offset + 20),
      size = bytes.readUInt32LE(offset + 24);
    const nameSize = bytes.readUInt16LE(offset + 28),
      extra = bytes.readUInt16LE(offset + 30),
      comment = bytes.readUInt16LE(offset + 32);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameSize)
      .toString("utf8");
    if (
      !name ||
      name.includes("\\") ||
      name.includes("\0") ||
      name.startsWith("/") ||
      name.split("/").some((p) => p === ".." || p.includes(":"))
    )
      throw Error("Caminho inseguro no ZIP.");
    if (entries.has(name) || bytes.readUInt16LE(offset + 8) & 1)
      throw Error("ZIP com entrada duplicada ou criptografada.");
    total += size;
    if (size > 32 * 1024 * 1024 || total > 128 * 1024 * 1024)
      throw Error("Conteúdo extraído acima do limite.");
    const expectedCrc = bytes.readUInt32LE(offset + 16),
      method = bytes.readUInt16LE(offset + 10),
      local = bytes.readUInt32LE(offset + 42);
    if (local + 30 > bytes.length || bytes.readUInt32LE(local) !== 0x04034b50)
      throw Error("Entrada ZIP inválida.");
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    if (start + compressed > bytes.length) throw Error("Arquivo ZIP truncado.");
    entries.set(name, () => {
      const packed = bytes.subarray(start, start + compressed);
      const result =
        method === 0
          ? packed
          : method === 8
            ? inflateRawSync(packed, { maxOutputLength: 32 * 1024 * 1024 })
            : null;
      if (!result || result.length !== size)
        throw Error("Compressão ou tamanho inválido.");
      if (crc32(result) !== expectedCrc)
        throw Error(`Arquivo corrompido no ZIP: ${name}.`);
      return result;
    });
    offset += 46 + nameSize + extra + comment;
  }
  return entries;
}
