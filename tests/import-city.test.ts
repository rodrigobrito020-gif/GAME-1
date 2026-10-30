import { describe, it, expect } from "vitest";
import { deflateSync } from "node:zlib";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { readZip, prepareCity, importCity } from "../scripts/import-city.mjs";
import { GameEngine } from "../apps/server/src/engine";
import { HUNTS, newCharacter } from "@idle/shared";

// Original synthetic map/PNG. No third-party artwork is required by these tests.
function crc(bytes: Buffer) {
  let value = 0xffffffff;
  for (const b of bytes) {
    value ^= b;
    for (let bit = 0; bit < 8; bit++)
      value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}
function png() {
  const chunk = (kind: string, data: Buffer) => {
    const bytes = Buffer.alloc(data.length + 12);
    bytes.writeUInt32BE(data.length);
    bytes.write(kind, 4, "ascii");
    data.copy(bytes, 8);
    bytes.writeUInt32BE(crc(bytes.subarray(4, -4)), bytes.length - 4);
    return bytes;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(32);
  header.writeUInt32BE(32, 4);
  header[8] = 8;
  header[9] = 6;
  const pixels = Buffer.alloc(32 * (32 * 4 + 1));
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const i = y * 129 + x * 4 + 1;
      pixels[i] = 80;
      pixels[i + 1] = 100;
      pixels[i + 2] = 130;
      pixels[i + 3] = 255;
    }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function fixture() {
  const cells = Array.from({ length: 2880 }, (_, i) =>
    i < 60 || i >= 2820 || i % 60 === 0 || i % 60 === 59 ? 1 : 0,
  );
  cells[22 * 60 + 15] = 1;
  const map = {
    format: "atlas-map",
    width: 60,
    height: 48,
    tileSize: 32,
    spawn: { x: 29, y: 22 },
    collisions: cells,
    animations: [],
    tilesets: [
      {
        id: "original_test",
        src: "tilesets/own.png",
        width: 32,
        height: 32,
        columns: 1,
        rows: 1,
      },
    ],
    layers: [
      {
        id: "ground",
        kind: "ground",
        visible: true,
        opacity: 1,
        data: Array.from({ length: 2880 }, () => ({
          tileset: "original_test",
          x: 0,
          y: 0,
        })),
      },
    ],
  };
  return new Map([
    ["0001_map.json", Buffer.from(JSON.stringify(map))],
    ["0002_own.png", png()],
    ["0003_unrelated.js", Buffer.from("not imported")],
  ]);
}
function zip(files: Map<string, Buffer>, compressed = false) {
  const parts: Buffer[] = [],
    central: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of files) {
    const filename = Buffer.from(name),
      packed = compressed ? deflateSync(data).subarray(2, -4) : data;
    const header = Buffer.alloc(30 + filename.length);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(compressed ? 8 : 0, 8);
    header.writeUInt32LE(crc(data), 14);
    header.writeUInt32LE(packed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    filename.copy(header, 30);
    const index = Buffer.alloc(46 + filename.length);
    index.writeUInt32LE(0x02014b50);
    index.writeUInt16LE(compressed ? 8 : 0, 10);
    index.writeUInt32LE(crc(data), 16);
    index.writeUInt32LE(packed.length, 20);
    index.writeUInt32LE(data.length, 24);
    index.writeUInt16LE(filename.length, 28);
    index.writeUInt32LE(offset, 42);
    filename.copy(index, 46);
    parts.push(header, packed);
    central.push(index);
    offset += header.length + packed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(
    central.reduce((n, b) => n + b.length, 0),
    12,
  );
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...central, end]);
}
const hash = "a".repeat(64);
describe("importação local de cenário", () => {
  it("lê ZIP comum/deflate e importa apenas mapa e imagens, sem executar/copiar JavaScript", () => {
    for (const compressed of [false, true]) {
      const prepared = prepareCity(readZip(zip(fixture(), compressed)), hash);
      expect([...prepared.files.keys()].sort()).toEqual([
        "layout.json",
        "map.json",
        "tilesets/original_test.png",
      ]);
      expect(prepared.layout.width).toBe(1920);
      expect(prepared.layout.atlas!.tilesets[0].url).toBe(
        "/local-city/tilesets/original_test.png",
      );
    }
  });
  it("recusa caminhos que escapam da pasta e ZIP truncado", () => {
    expect(() =>
      readZip(zip(new Map([["../escape.txt", Buffer.from("x")]]))),
    ).toThrow(/inseguro/);
    expect(() => readZip(zip(fixture()).subarray(0, -8))).toThrow(/inválido/);
  });
  it("recusa imagens ausentes e colisão inconsistente antes de substituir um pacote", () => {
    const entries = readZip(zip(fixture()));
    entries.delete("0002_own.png");
    expect(() => prepareCity(entries, hash)).toThrow(/own.png/);
    const bad = fixture(),
      map = JSON.parse(bad.get("0001_map.json")!.toString());
    map.collisions.pop();
    bad.set("0001_map.json", Buffer.from(JSON.stringify(map)));
    expect(() => prepareCity(readZip(zip(bad)), hash)).toThrow(/colisões/);
  });
  it("importação repetida preserva banco existente e mantém o pacote válido se outro ZIP falhar", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "idle-import-")),
      destination = path.join(root, "local-city"),
      source = path.join(root, "recursos.zip"),
      db = path.join(root, "dev.db");
    try {
      writeFileSync(db, "existing-progress");
      writeFileSync(source, zip(fixture()));
      importCity(source, destination);
      importCity(source, destination);
      const before = readFileSync(path.join(destination, "layout.json"));
      writeFileSync(source, Buffer.from("invalid"));
      expect(() => importCity(source, destination)).toThrow();
      expect(readFileSync(path.join(destination, "layout.json"))).toEqual(
        before,
      );
      expect(readFileSync(db, "utf8")).toBe("existing-progress");
      expect(readdirSync(destination).sort()).toEqual([
        "layout.json",
        "map.json",
        "tilesets",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("servidor usa dimensões/colisões importadas, encontra os quatro serviços e volta ao spawn correto", () => {
    const { layout } = prepareCity(readZip(zip(fixture())), hash),
      engine = new GameEngine(true, () => 0.01, layout),
      p = engine.connect(
        newCharacter("local", "Local Test", "human", "fighter"),
      );
    expect(p.actor.x).toBe(944);
    expect(p.actor.y).toBe(720);
    p.actor.x = 464;
    p.actor.y = 720;
    engine.command(p.c.id, { type: "move", dx: 1, dy: 0 });
    engine.tick();
    expect(p.actor.x).toBe(464);
    expect(() =>
      engine.command(p.c.id, { type: "move", x: 496, y: 720 }),
    ).toThrow(/livre/);
    for (const npc of layout.npcs) {
      engine.command(p.c.id, { type: "move", x: npc.x - 32, y: npc.y + 38 });
      for (let i = 0; i < 300; i++) engine.tick();
      expect(Math.hypot(p.actor.x - npc.x, p.actor.y - npc.y)).toBeLessThan(
        100,
      );
    }
    const snapshot = engine.snapshot(p);
    expect(snapshot.city.id).toBe("imported-atlas");
    expect(snapshot.city).not.toHaveProperty("collision");
    engine.enterHunt(p, HUNTS[0].id);
    engine.command(p.c.id, { type: "return" });
    expect({ x: p.actor.x, y: p.actor.y }).toEqual(layout.spawn);
  });
});
