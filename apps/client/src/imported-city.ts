import Phaser from "phaser";
import type { CityInfo } from "@idle/shared";

interface Tile {
  tileset?: string;
  animation?: string;
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
  autotile?: { mask: number; width: number; height: number };
}
interface AtlasMap {
  width: number;
  height: number;
  tileSize: number;
  layers: {
    id: string;
    kind: string;
    visible: boolean;
    opacity: number;
    data: (Tile | null)[];
  }[];
  tilesets: { id: string; width: number; height: number; columns: number }[];
  animations: {
    id: string;
    frames: {
      tileset: string;
      x: number;
      y: number;
      w: number;
      h: number;
      duration: number;
    }[];
  }[];
  effects?: {
    emitters?: {
      type: string;
      x: number;
      y: number;
      radius: number;
      color: string;
      intensity: number;
    }[];
  };
}

export function preloadImportedCity(scene: Phaser.Scene, city: CityInfo) {
  if (!city.atlas) return;
  scene.load.json("local-atlas-map", city.atlas.mapUrl);
  for (const set of city.atlas.tilesets)
    scene.load.spritesheet(`local-atlas-${set.id}`, set.url, {
      frameWidth: 32,
      frameHeight: 32,
    });
}

// Original atlas reader. Treats the uploaded JSON as data, never as executable code.
function paintCell(
  c: CanvasRenderingContext2D,
  image: CanvasImageSource,
  cell: Tile,
  x: number,
  y: number,
) {
  c.save();
  c.translate(x + (cell.flipX ? 32 : 0), y + (cell.flipY ? 32 : 0));
  c.scale(cell.flipX ? -1 : 1, cell.flipY ? -1 : 1);
  if (!cell.autotile)
    c.drawImage(image, cell.x * 32, cell.y * 32, 32, 32, 0, 0, 32, 32);
  else {
    const mask = cell.autotile.mask;
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 2; col++) {
        const across = !!(mask & (col ? 2 : 8)),
          vertical = !!(mask & (row ? 4 : 1));
        const sx = cell.x * 32 + (col ? (across ? 32 : 48) : across ? 16 : 0);
        const sy =
          cell.y * 32 + (row ? (vertical ? 32 : 48) : vertical ? 16 : 0);
        c.drawImage(image, sx, sy, 16, 16, col * 16, row * 16, 16, 16);
      }
  }
  c.restore();
}

export function drawImportedCity(
  scene: Phaser.Scene,
  city: CityInfo,
  scenery: Phaser.GameObjects.GameObject[],
  reducedMotion: boolean,
) {
  const map = scene.cache.json.get("local-atlas-map") as AtlasMap;
  if (
    !map ||
    map.width * map.tileSize !== city.width ||
    map.height * map.tileSize !== city.height
  )
    throw Error(
      "O cenário não corresponde às colisões do servidor. Importe o ZIP novamente.",
    );
  const key = `imported-ground-${city.atlas!.packHash}`;
  if (!scene.textures.exists(key)) {
    const canvas = scene.textures.createCanvas(key, city.width, city.height)!,
      c = canvas.context;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#16172b";
    c.fillRect(0, 0, city.width, city.height);
    for (const layer of map.layers) {
      if (layer.visible === false || layer.kind === "roof") continue;
      c.globalAlpha = layer.opacity ?? 1;
      layer.data.forEach((tile, index) => {
        if (!tile?.tileset || tile.animation) return;
        const image = scene.textures
          .get(`local-atlas-${tile.tileset}`)
          .getSourceImage() as HTMLImageElement;
        paintCell(
          c,
          image,
          tile,
          (index % map.width) * 32,
          Math.floor(index / map.width) * 32,
        );
      });
    }
    c.globalAlpha = 1;
    canvas.refresh();
  }
  scenery.push(
    scene.add.image(0, 0, key).setOrigin(0).setDepth(-1000).setTint(0xbac0da),
  );
  const sets = new Map(map.tilesets.map((s) => [s.id, s]));
  for (const layer of map.layers) {
    if (layer.visible === false) continue;
    layer.data.forEach((tile, index) => {
      if (!tile || (!tile.animation && layer.kind !== "roof")) return;
      const x = (index % map.width) * 32,
        y = Math.floor(index / map.width) * 32;
      const depth = layer.kind === "roof" ? y + 32 : -900;
      if (tile.animation) {
        const animation = map.animations.find((a) => a.id === tile.animation);
        if (!animation) return;
        const animationKey = `local-${city.atlas!.packHash}-${animation.id}-${tile.x}-${tile.y}`;
        const baseDuration = Math.min(
          ...animation.frames.map((f) => f.duration),
        );
        const frames = animation.frames.map((f) => ({
          key: `local-atlas-${f.tileset}`,
          frame: (f.y + tile.y) * sets.get(f.tileset)!.columns + f.x + tile.x,
          duration: f.duration - baseDuration,
        }));
        if (!scene.anims.exists(animationKey))
          scene.anims.create({
            key: animationKey,
            frames,
            frameRate: 1000 / baseDuration,
            repeat: -1,
          });
        const image = scene.add
          .sprite(x, y, frames[0].key, frames[0].frame)
          .setOrigin(0)
          .setDepth(depth)
          .setTint(0xbac0da)
          .setAlpha(layer.opacity ?? 1);
        if (!reducedMotion) image.play(animationKey);
        scenery.push(image);
      } else if (tile.tileset) {
        if (tile.autotile) {
          const tileKey = `local-auto-${tile.tileset}-${tile.x}-${tile.y}-${tile.autotile.mask}-${!!tile.flipX}-${!!tile.flipY}`;
          if (!scene.textures.exists(tileKey)) {
            const t = scene.textures.createCanvas(tileKey, 32, 32)!;
            paintCell(
              t.context,
              scene.textures
                .get(`local-atlas-${tile.tileset}`)
                .getSourceImage() as HTMLImageElement,
              tile,
              0,
              0,
            );
            t.refresh();
          }
          scenery.push(
            scene.add
              .image(x, y, tileKey)
              .setOrigin(0)
              .setDepth(depth)
              .setTint(0xbac0da)
              .setAlpha(layer.opacity ?? 1),
          );
        } else {
          scenery.push(
            scene.add
              .image(
                x,
                y,
                `local-atlas-${tile.tileset}`,
                tile.y * sets.get(tile.tileset)!.columns + tile.x,
              )
              .setOrigin(0)
              .setDepth(depth)
              .setFlipX(!!tile.flipX)
              .setFlipY(!!tile.flipY)
              .setTint(0xbac0da)
              .setAlpha(layer.opacity ?? 1),
          );
        }
      }
    });
  }
  for (const light of map.effects?.emitters ?? []) {
    if (light.type !== "pointLight" || !/^#[a-f0-9]{6}$/i.test(light.color))
      continue;
    const color = Number.parseInt(light.color.slice(1), 16),
      radius = Math.min(128, light.radius || 64);
    for (let i = 0; i < 3; i++)
      scenery.push(
        scene.add
          .ellipse(
            light.x * 32 + 16,
            light.y * 32 + 16,
            radius * (1 - i * 0.22),
            radius * 0.7 * (1 - i * 0.22),
            color,
            0.03 + i * 0.01,
          )
          .setDepth(-800),
      );
  }
  for (const npc of city.npcs) {
    const race =
      npc.id === "forge"
        ? "orc"
        : npc.id === "shop"
          ? "dwarf"
          : npc.id === "class"
            ? "elf"
            : "human";
    const kind =
      npc.id === "class" || npc.id === "portal" ? "mystic" : "fighter";
    scenery.push(
      scene.add
        .ellipse(npc.x, npc.y, 36, 11, 0x111529, 0.45)
        .setDepth(npc.y - 1),
    );
    scenery.push(
      scene.add
        .image(npc.x, npc.y, `hero-${race}-${kind}-front-0`)
        .setOrigin(0.5, 100 / 112)
        .setScale(0.85)
        .setDepth(npc.y),
    );
    scenery.push(
      scene.add
        .text(npc.x, npc.y - 89, npc.name, {
          fontFamily: "Verdana, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#9fddc9",
          backgroundColor: "#141729e6",
          padding: { x: 6, y: 4 },
          stroke: "#141729",
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1)
        .setDepth(npc.y + 2),
    );
    scenery.push(
      scene.add
        .text(npc.x, npc.y + 9, "E · INTERAGIR", {
          fontFamily: "Verdana, sans-serif",
          fontSize: "8px",
          color: "#cfc3a1",
          stroke: "#15192b",
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setDepth(npc.y + 3),
    );
  }
}
