import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CITY } from "@idle/shared";
import type { CityLayout } from "@idle/shared";
import { rootDir } from "./db";

export function loadCity(): CityLayout {
  const filename = path.join(
    rootDir,
    "apps/client/public/local-city/layout.json",
  );
  if (process.env.CITY_MODE === "original" || !existsSync(filename))
    return CITY;
  const city = JSON.parse(readFileSync(filename, "utf8")) as CityLayout;
  const grid = city.collision;
  if (
    city.id !== "imported-atlas" ||
    city.width !== 1920 ||
    city.height !== 1536 ||
    !grid ||
    grid.tileSize !== 32 ||
    grid.columns !== 60 ||
    grid.rows !== 48 ||
    !Array.isArray(grid.cells) ||
    grid.cells.length !== 2880 ||
    grid.cells.some((v) => v !== 0 && v !== 1) ||
    city.atlas?.mapUrl !== "/local-city/map.json" ||
    !Array.isArray(city.atlas.tilesets) ||
    city.atlas.tilesets.length > 20 ||
    !/^[a-f0-9]{64}$/.test(city.atlas.packHash)
  )
    throw Error(
      "Pacote de cidade inválido. Execute npm run import:city novamente.",
    );
  for (const set of city.atlas.tilesets) {
    if (
      !/^[a-z0-9_-]{1,50}$/i.test(set.id) ||
      set.url !== `/local-city/tilesets/${set.id}.png` ||
      !existsSync(path.join(rootDir, "apps/client/public", set.url))
    )
      throw Error("Tileset ausente ou inválido. Importe o ZIP novamente.");
  }
  if (
    !Array.isArray(city.blocks) ||
    city.blocks.length ||
    !Array.isArray(city.npcs) ||
    city.npcs.length !== 4 ||
    new Set(city.npcs.map((n) => n.id)).size !== 4 ||
    !["portal", "forge", "shop", "class"].every((id) =>
      city.npcs.some((n) => n.id === id),
    )
  )
    throw Error("Serviços da praça inválidos.");
  for (const point of [city.spawn, ...city.npcs]) {
    if (
      !point ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      point.x < 32 ||
      point.y < 32 ||
      point.x >= city.width - 32 ||
      point.y >= city.height - 32 ||
      grid.cells[Math.floor(point.y / 32) * 60 + Math.floor(point.x / 32)]
    )
      throw Error("Ponto de entrada/serviço bloqueado.");
  }
  return city;
}
