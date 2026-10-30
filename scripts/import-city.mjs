import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  rmSync,
  existsSync,
} from "node:fs";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { prepareReferenceResources } from "./reference-resources.mjs";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
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

export function prepareCity(entries, packHash) {
  const find = (name) => {
    const results = [...entries.keys()].filter(
      (p) => path.posix.basename(p).replace(/^\d+_/, "") === name,
    );
    if (results.length !== 1)
      throw Error(
        `Esperado um arquivo ${name}, encontrados ${results.length}.`,
      );
    return entries.get(results[0])();
  };
  const map = JSON.parse(find("map.json").toString("utf8"));
  if (
    map.format !== "atlas-map" ||
    map.width !== 60 ||
    map.height !== 48 ||
    map.tileSize !== 32 ||
    !Array.isArray(map.collisions) ||
    map.collisions.length !== 2880 ||
    map.collisions.some((n) => n !== 0 && n !== 1)
  )
    throw Error(
      "Esta versão requer a praça atlas-map de 60×48 tiles de 32 px, com colisões válidas.",
    );
  if (
    !Array.isArray(map.tilesets) ||
    map.tilesets.length < 1 ||
    map.tilesets.length > 20 ||
    !Array.isArray(map.layers) ||
    map.layers.length > 24
  )
    throw Error("Camadas ou tilesets inválidos.");
  const files = new Map(),
    ids = new Set(),
    renderSets = [];
  const referenceExcluded = map.tilesets.map((set) =>
    path.posix.basename(set.src),
  );
  for (const set of map.tilesets) {
    if (
      !/^[a-z0-9_-]{1,50}$/i.test(set.id) ||
      ids.has(set.id) ||
      typeof set.src !== "string"
    )
      throw Error("Tileset inválido.");
    const png = find(path.posix.basename(set.src));
    if (
      png.length < 24 ||
      png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      png.readUInt32BE(16) !== set.width ||
      png.readUInt32BE(20) !== set.height ||
      set.width % 32 ||
      set.height % 32 ||
      set.width > 4096 ||
      set.height > 4096
    )
      throw Error(`PNG inválido: ${set.id}.`);
    if (
      set.sourceHash &&
      createHash("sha256").update(png).digest("hex") !== set.sourceHash
    )
      throw Error(`Imagem diferente da referência: ${set.id}.`);
    ids.add(set.id);
    files.set(`tilesets/${set.id}.png`, png);
    renderSets.push({ id: set.id, url: `/local-city/tilesets/${set.id}.png` });
    set.src = `tilesets/${set.id}.png`;
  }
  for (const layer of map.layers) {
    if (!Array.isArray(layer.data) || layer.data.length !== 2880)
      throw Error("Tamanho de camada inválido.");
    for (const cell of layer.data)
      if (cell) {
        if (
          (!cell.animation && !ids.has(cell.tileset)) ||
          !Number.isInteger(cell.x) ||
          !Number.isInteger(cell.y) ||
          cell.x < 0 ||
          cell.y < 0 ||
          cell.x > 128 ||
          cell.y > 128
        )
          throw Error("Referência de tile inválida.");
        if (
          cell.autotile &&
          (!Number.isInteger(cell.autotile.mask) ||
            cell.autotile.mask < 0 ||
            cell.autotile.mask > 15 ||
            cell.autotile.width !== 2 ||
            cell.autotile.height !== 2)
        )
          throw Error("Autotile não suportado.");
      }
  }
  if (!Array.isArray(map.animations) || map.animations.length > 100)
    throw Error("Animações inválidas.");
  for (const anim of map.animations) {
    if (
      typeof anim.id !== "string" ||
      !Array.isArray(anim.frames) ||
      anim.frames.length < 1 ||
      anim.frames.length > 100
    )
      throw Error("Animação inválida.");
    for (const f of anim.frames)
      if (
        !ids.has(f.tileset) ||
        ![f.x, f.y, f.w, f.h, f.duration].every(Number.isFinite) ||
        f.x < 0 ||
        f.y < 0 ||
        f.w < 1 ||
        f.h < 1 ||
        f.duration < 16
      )
        throw Error("Quadro de animação inválido.");
  }
  const point = (x, y) => ({ x: x * 32 + 16, y: y * 32 + 16 });
  const layout = {
    id: "imported-atlas",
    name: "Refúgio de Aden · Praça de teste",
    width: 1920,
    height: 1536,
    spawn: point(map.spawn.x, map.spawn.y),
    blocks: [],
    npcs: [
      { id: "portal", name: "Guardião das Hunts", ...point(29, 18) },
      { id: "forge", name: "Forja Universal", ...point(18, 31) },
      { id: "shop", name: "Mercador", ...point(37, 31) },
      { id: "class", name: "Mestre de Profissões", ...point(29, 33) },
      { id: "healer", name: "Curandeira", ...point(33, 18) },
      { id: "storage", name: "Guarda-volumes", ...point(40, 26) },
    ],
    collision: { tileSize: 32, columns: 60, rows: 48, cells: map.collisions },
    atlas: { mapUrl: "/local-city/map.json", tilesets: renderSets, packHash },
  };
  const free = (p) =>
    p.x >= 32 &&
    p.y >= 32 &&
    p.x < 1888 &&
    p.y < 1504 &&
    !map.collisions[Math.floor(p.y / 32) * 60 + Math.floor(p.x / 32)];
  if (
    !Number.isInteger(map.spawn.x) ||
    !Number.isInteger(map.spawn.y) ||
    !free(layout.spawn)
  )
    throw Error("Ponto de entrada bloqueado.");
  for (const npc of layout.npcs)
    if (!free(npc) || !free({ x: npc.x - 32, y: npc.y + 38 }))
      throw Error(`Acesso ao NPC bloqueado: ${npc.name}.`);
  const seen = new Set(),
    queue = [map.spawn.y * 60 + map.spawn.x];
  seen.add(queue[0]);
  for (let i = 0; i < queue.length; i++)
    for (const delta of [-1, 1, -60, 60]) {
      const n = queue[i] + delta;
      if (
        n < 0 ||
        n >= 2880 ||
        Math.abs((n % 60) - (queue[i] % 60)) > 1 ||
        map.collisions[n] ||
        seen.has(n)
      )
        continue;
      seen.add(n);
      queue.push(n);
    }
  for (const npc of layout.npcs)
    if (
      !seen.has(
        Math.floor((npc.y + 38) / 32) * 60 + Math.floor((npc.x - 32) / 32),
      )
    )
      throw Error(`NPC sem caminho: ${npc.name}.`);
  const resources = prepareReferenceResources(entries, referenceExcluded);
  for (const [name, data] of resources.files) files.set(name, data);
  if (resources.files.size)
    layout.atlas.resourcesUrl = "/local-city/reference.json";
  files.set("map.json", Buffer.from(JSON.stringify(map)));
  files.set("layout.json", Buffer.from(JSON.stringify(layout)));
  return { files, layout };
}

export function importCity(
  filename,
  destination = path.join(projectRoot, "apps/client/public/local-city"),
) {
  const bytes = readFileSync(filename),
    { files, layout } = prepareCity(
      readZip(bytes),
      createHash("sha256").update(bytes).digest("hex"),
    );
  const temporary = destination + "-preparing",
    backup = destination + "-previous";
  rmSync(temporary, { recursive: true, force: true });
  mkdirSync(temporary, { recursive: true });
  for (const [name, data] of files) {
    const output = path.join(temporary, name);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, data);
  }
  rmSync(backup, { recursive: true, force: true });
  if (existsSync(destination)) renameSync(destination, backup);
  try {
    renameSync(temporary, destination);
  } catch (error) {
    if (existsSync(backup)) renameSync(backup, destination);
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
  return { layout, files: files.size };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const source = path.resolve(
      process.argv[2] ?? path.join(projectRoot, "recursos-publicos.zip"),
    );
    const result = importCity(source);
    console.log(
      `Referência importada: ${result.layout.width}×${result.layout.height}, ${result.files} arquivos. Cenário, interface e áudio locais preparados; banco preservado. Reinicie o servidor.`,
    );
  } catch (error) {
    console.error(`Não foi possível importar a praça: ${error.message}`);
    process.exitCode = 1;
  }
}
