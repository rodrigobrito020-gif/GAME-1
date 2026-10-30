import path from "node:path";

// Data-only importer. Compiled scripts, remote requests and original CSS are never run.
export function prepareReferenceResources(entries, excluded = []) {
  const names = new Map();
  for (const [entry, read] of entries) {
    const name = path.posix.basename(entry).replace(/^\d+_/, "");
    const matches = names.get(name) ?? [];
    matches.push(read);
    names.set(name, matches);
  }
  const files = new Map();
  const manifest = {
    version: 1,
    images: {},
    audio: {},
    fonts: {},
    missing: [
      "character-body-layers",
      "character-walk-and-combat-sheets",
      "monster-sheets",
      "server-source",
    ],
  };
  for (const [name, readers] of names) {
    if (excluded.includes(name)) continue;
    if (readers.length !== 1 || !/^[a-zA-Z0-9_-]+\.(png|ogg|woff2)$/.test(name))
      continue;
    // Tilesets are already validated separately. All other uniquely named images
    // and sounds can be inspected locally, even if not yet mapped to a game action.
    if (
      [
        "metro_ground.png",
        "metro_buildings.png",
        "metro_props.png",
        "metro_fx.png",
        "moradia.png",
        "treino.png",
        "halloween.png",
      ].includes(name)
    )
      continue;
    const data = readers[0]();
    const ext = path.posix.extname(name),
      key = name.slice(0, -ext.length);
    const folder =
      ext === ".png" ? "images" : ext === ".ogg" ? "audio" : "fonts";
    if (ext === ".png") {
      if (
        data.length < 24 ||
        data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
        data.readUInt32BE(16) < 1 ||
        data.readUInt32BE(20) < 1 ||
        data.readUInt32BE(16) > 4096 ||
        data.readUInt32BE(20) > 4096
      )
        throw Error(`Imagem de interface inválida: ${name}.`);
    } else if (ext === ".ogg") {
      if (data.subarray(0, 4).toString("ascii") !== "OggS")
        throw Error(`Áudio inválido: ${name}.`);
    } else if (data.subarray(0, 4).toString("ascii") !== "wOF2")
      throw Error(`Fonte inválida: ${name}.`);
    const relative = `reference/${folder}/${name}`;
    files.set(relative, data);
    manifest[folder][key] = `/local-city/${relative}`;
  }
  if (files.size)
    files.set("reference.json", Buffer.from(JSON.stringify(manifest)));
  return { files, manifest };
}
