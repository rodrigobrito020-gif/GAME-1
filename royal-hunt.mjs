import { readFileSync } from "node:fs";
export const ROYAL_HUNT_MAP_ID = "patio-da-coroa";
export function createRoyalHunt() {
  const width = 60,
    height = 48;
  const collisions = Array.from({ length: width * height }, (_, i) => {
    const x = i % width,
      y = Math.floor(i / width);
    return x < 6 || x >= 54 || y < 11 || y >= 39 ? 1 : 0;
  });
  const map = {
    format: "atlas-map",
    version: 1,
    name: "Pátio da Coroa",
    tileSize: 32,
    width,
    height,
    tilesets: [
      {
        id: "coroa-hunt",
        name: "Pátio medieval",
        src: "tilesets/patio.svg",
        width: 1920,
        height: 1536,
        tileSize: 32,
        columns: width,
        rows: height,
      },
    ],
    layers: [
      {
        id: "ground",
        name: "Pátio",
        kind: "ground",
        visible: true,
        opacity: 1,
        data: Array.from({ length: width * height }, (_, index) => ({
          tileset: "coroa-hunt",
          x: index % width,
          y: Math.floor(index / width),
          flipX: false,
          flipY: false,
        })),
      },
    ],
    collisions,
    spawn: { x: 29, y: 31 },
    animations: [],
    properties: {
      backgroundColor: "#e6d7b7",
      music: "",
      notes: "Arena medieval própria, sem obstáculos no pátio de combate.",
    },
    effects: {
      sun: { enabled: true, intensity: 0.07 },
      fog: { enabled: false },
      rain: { enabled: false },
      snow: { enabled: false },
      lighting: { period: "day", intensity: 0.04 },
      particles: {
        leaves: { enabled: true, intensity: 0.015 },
        fireflies: { enabled: false },
        embers: { enabled: false },
      },
    },
  };
  let svg;
  return {
    id: ROYAL_HUNT_MAP_ID,
    map,
    texture() {
      return (svg ??= `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1536" viewBox="0 0 1920 1536"><image x="0" y="0" width="1920" height="1536" preserveAspectRatio="none" href="data:image/png;base64,${readFileSync(new URL("./art/royal-hunt.png", import.meta.url)).toString("base64")}"/></svg>`);
    },
  };
}
