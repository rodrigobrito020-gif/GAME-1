import Phaser from "phaser";
import { CITY } from "@idle/shared";
import { createArt, createFloor } from "./art";
import type { Actor, Command, Snapshot } from "@idle/shared";
export class World extends Phaser.Scene {
  snapshot: Snapshot | null = null;
  private receivedAt = 0;
  private mapId = "";
  private lastMove = 0;
  private moving = false;
  private lastEvent = 0;
  private reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  private burstPool: Phaser.GameObjects.Arc[] = [];
  private boltPool: Phaser.GameObjects.Rectangle[] = [];
  private textPool: Phaser.GameObjects.Text[] = [];
  private pooled<T extends Phaser.GameObjects.GameObject>(
    pool: T[],
    limit: number,
    create: () => T,
  ): T | undefined {
    let item = pool.find((o) => !o.active);
    if (!item && pool.length < limit) {
      item = create();
      pool.push(item);
    }
    if (item) {
      this.tweens.killTweensOf(item);
      item.setActive(true);
    }
    return item;
  }
  private entities = new Map<
    string,
    {
      root: Phaser.GameObjects.Container;
      sprite: Phaser.GameObjects.Image;
      label: Phaser.GameObjects.Text;
      bar: Phaser.GameObjects.Graphics;
      gear: Phaser.GameObjects.Graphics;
      actor: Actor;
    }
  >();
  private scenery: Phaser.GameObjects.GameObject[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(
    private send: (cmd: Command) => void,
    private panel: (name: string) => void,
  ) {
    super("world");
  }
  create() {
    this.makeTextures();
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT",
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.cameras.main.setZoom(innerWidth < 700 ? 1.05 : 1);
    this.input.on(
      "wheel",
      (
        _p: Phaser.Input.Pointer,
        _objects: unknown,
        _dx: number,
        dy: number,
      ) => {
        this.cameras.main.setZoom(
          Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.8, 1.5),
        );
      },
    );
    this.cameras.main.setBackgroundColor("#222b3b");
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0 || !this.snapshot) return;
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.snapshot.map === "city") {
        const npc = CITY.npcs.find(
          (n) => Phaser.Math.Distance.Between(n.x, n.y, point.x, point.y) < 55,
        );
        this.send({
          type: "move",
          x: npc ? npc.x - 32 : point.x,
          y: npc ? npc.y + 38 : point.y,
        });
        if (npc) this.panel(npc.id);
      } else {
        const enemy = this.snapshot.actors
          .filter((a) => a.kind === "monster" && a.hp > 0)
          .find(
            (a) =>
              Phaser.Math.Distance.Between(a.x, a.y, point.x, point.y) < 35,
          );
        if (enemy) this.send({ type: "target", id: enemy.id });
      }
    });
    this.drawMap("city");
    this.cameras.main.centerOn(CITY.spawn.x, CITY.spawn.y);
  }
  setSnapshot(s: Snapshot) {
    this.snapshot = s;
    this.receivedAt = performance.now();
    if (this.sys.isActive() && s.map !== this.mapId) this.drawMap(s.map);
  }
  private color(hex: string) {
    return Phaser.Display.Color.HexStringToColor(hex).color;
  }
  private makeTextures() {
    createArt(this);
  }
  private drawMap(map: string) {
    this.mapId = map;
    for (const obj of this.scenery) {
      this.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.scenery = [];
    const city = map === "city",
      width = city ? 1600 : 1536,
      height = city ? 1152 : 1088;
    const min = this.snapshot?.hunt?.min ?? 1;
    const theme = city ? 0 : min >= 251 ? 2 : min >= 151 ? 1 : 0;
    this.cameras.main.setBounds(0, 0, width, height);
    const floor = this.add
      .image(0, 0, createFloor(this, city, theme))
      .setOrigin(0)
      .setDepth(-1000);
    this.scenery.push(floor);
    let seed = 71;
    const random = () =>
      ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const prop = (kind: string, x: number, y: number, scale = 1) => {
      const image = this.add
        .image(x, y, `prop-${kind}`)
        .setOrigin(0.5, 1)
        .setDepth(y)
        .setScale(scale);
      this.scenery.push(image);
      return image;
    };
    const tree = (x: number, y: number, pine = true, scale = 1) => {
      const image = this.add
        .image(x, y, pine ? "tree-pine" : "tree-oak")
        .setOrigin(0.5, 0.91)
        .setDepth(y)
        .setScale(scale);
      this.scenery.push(image);
      if (!this.reducedMotion)
        this.tweens.add({
          targets: image,
          angle: { from: -0.6, to: 0.7 },
          duration: 2700 + random() * 1800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
    };
    const light = (x: number, y: number, color = 0xf4c78a, radius = 62) => {
      for (let i = 0; i < 4; i++) {
        const glow = this.add
          .ellipse(
            x,
            y,
            radius * (1 - i * 0.18),
            radius * 0.55 * (1 - i * 0.18),
            color,
            0.025 + i * 0.015,
          )
          .setDepth(y - 140);
        this.scenery.push(glow);
        if (!this.reducedMotion)
          this.tweens.add({
            targets: glow,
            alpha: glow.alpha * 0.6,
            duration: 1300 + i * 210,
            yoyo: true,
            repeat: -1,
            ease: "Sine.InOut",
          });
      }
    };
    if (city) {
      for (const [i, b] of CITY.blocks.entries()) {
        const house = this.add
          .image(b.x, b.y - 35, `building-${i}`)
          .setOrigin(0)
          .setDepth(b.y + b.h);
        this.scenery.push(house);
      }
      for (const x of [175, 280, 1330, 1410])
        for (const y of [450, 570]) tree(x, y, true, 0.8 + random() * 0.15);
      for (let i = 0; i < 14; i++) {
        tree(42 + i * 116, 120, i % 4 !== 0, 0.8);
        if (i % 2 === 0) tree(i % 4 ? 35 : 1560, 350 + i * 44, true, 0.9);
      }
      for (const [x, y] of [
        [435, 540],
        [1120, 400],
        [430, 730],
        [1160, 700],
        [680, 840],
        [925, 840],
      ]) {
        prop("lamp", x, y, 0.75);
        light(x, y - 77);
        light(x, y, 0xecc494, 100);
      }
      for (const [x, y] of [
        [610, 492],
        [975, 490],
        [665, 835],
        [931, 835],
      ])
        prop("bench", x, y, 0.75);
      for (const [x, y] of [
        [564, 480],
        [1024, 480],
        [618, 830],
        [982, 830],
      ])
        prop("planter", x, y, 0.68);
      prop("fountain", 800, 485, 0.85);
      for (let i = 0; i < 3; i++) {
        const ripple = this.add
          .ellipse(800, 455, 52 + i * 20, 16 + i * 6)
          .setStrokeStyle(1, 0xa4d6dc, 0.5)
          .setDepth(487);
        this.scenery.push(ripple);
        if (!this.reducedMotion)
          this.tweens.add({
            targets: ripple,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 1800,
            delay: i * 600,
            repeat: -1,
          });
      }
      prop("forge", 475, 397, 0.8);
      light(470, 370, 0xffa15b, 100);
      prop("market", 1080, 799, 0.9);
      for (const npc of CITY.npcs) {
        const shadow = this.add
          .ellipse(npc.x, npc.y + 2, 38, 12, 0x111927, 0.45)
          .setDepth(npc.y - 1);
        this.scenery.push(shadow);
        if (npc.id === "portal") {
          prop("portal", npc.x, npc.y + 10, 0.78);
          light(npc.x, npc.y - 35, 0x8e9eea, 110);
          const veil = this.add
            .ellipse(npc.x, npc.y - 61, 38, 75, 0x80b6e2, 0.17)
            .setDepth(npc.y + 11);
          this.scenery.push(veil);
          if (!this.reducedMotion)
            this.tweens.add({
              targets: veil,
              alpha: 0.4,
              scaleX: 0.88,
              duration: 1800,
              yoyo: true,
              repeat: -1,
            });
        } else {
          const race =
            npc.id === "forge" ? "orc" : npc.id === "shop" ? "dwarf" : "elf";
          const kind = npc.id === "class" ? "mystic" : "fighter";
          const npcSprite = this.add
            .image(npc.x, npc.y, `hero-${race}-${kind}-front-0`)
            .setOrigin(0.5, 100 / 112)
            .setScale(0.86)
            .setDepth(npc.y);
          this.scenery.push(npcSprite);
          if (!this.reducedMotion)
            this.tweens.add({
              targets: npcSprite,
              y: npc.y - 0.8,
              duration: 1700,
              yoyo: true,
              repeat: -1,
              ease: "Sine.InOut",
            });
        }
        const label = this.add
          .text(npc.x, npc.y - 97, npc.name, {
            fontFamily: "Verdana, sans-serif",
            fontSize: "11px",
            fontStyle: "bold",
            color: "#9cdcc8",
            stroke: "#151a2d",
            strokeThickness: 4,
            padding: { x: 6, y: 4 },
            backgroundColor: "#131a2be8",
          })
          .setOrigin(0.5, 1)
          .setDepth(npc.y + 12);
        const role = this.add
          .text(
            npc.x,
            npc.y - 80,
            npc.id === "portal"
              ? "◇ INSTÂNCIAS DE CAÇA"
              : npc.id === "forge"
                ? "◇ FABRICAR E REFORJAR"
                : npc.id === "shop"
                  ? "◇ COMPRAR E VENDER"
                  : "◇ ESCOLHER PROFISSÃO",
            {
              fontFamily: "Verdana, sans-serif",
              fontSize: "7px",
              color: "#b6b4bc",
              stroke: "#14182b",
              strokeThickness: 2,
            },
          )
          .setOrigin(0.5, 1)
          .setDepth(npc.y + 13);
        this.scenery.push(label, role);
      }
    } else {
      // Three visual biomes use the same authoritative spawn layout and species IDs.
      for (let i = 0; i < 25; i++) {
        tree(25 + i * 63, 93, i % 5 !== 0, 0.8 + random() * 0.3);
        if (i < 16) {
          tree(25, 170 + i * 58, true, 0.9);
          tree(width - 20, 160 + i * 58, true, 0.9);
        }
      }
      for (const [x, y] of [
        [130, 490],
        [710, 220],
        [1310, 570],
        [1030, 990],
        [420, 980],
        [1300, 170],
      ]) {
        prop("rock", x, y, 0.7 + random() * 0.4);
        if (theme > 0) {
          const ruins = this.add.graphics().setDepth(y - 20);
          ruins.fillStyle(0x3d4658);
          ruins.fillRect(x - 8, y - 104, 17, 82);
          ruins.fillStyle(0x727c88);
          ruins.fillRect(x - 11, y - 114, 23, 10);
          ruins.fillRect(x - 13, y - 28, 27, 8);
          ruins.lineStyle(1, 0xb6b8ac, 0.5);
          ruins.lineBetween(x - 5, y - 104, x - 5, y - 30);
          this.scenery.push(ruins);
        }
      }
      if (!this.reducedMotion)
        for (let i = 0; i < 15; i++) {
          const mote = this.add
            .ellipse(
              100 + random() * (width - 200),
              170 + random() * (height - 300),
              2,
              2,
              theme === 1 ? 0xaca1e1 : 0xd6d4a1,
              0.55,
            )
            .setDepth(2000);
          this.scenery.push(mote);
          this.tweens.add({
            targets: mote,
            y: mote.y - 20,
            alpha: 0.08,
            duration: 1800 + random() * 2600,
            yoyo: true,
            repeat: -1,
          });
        }
    }
  }
  private actorTexture(actor: Actor, frame: number) {
    if (actor.kind === "player") {
      const direction =
        Math.sin(actor.facing) < -0.55
          ? "back"
          : Math.abs(Math.cos(actor.facing)) > 0.75
            ? "side"
            : "front";
      return `hero-${actor.race}-${actor.archetype}-${direction}-${frame}`;
    }
    const variant =
      actor.kind === "summon"
        ? actor.name.includes("Swoop")
          ? 2
          : actor.name.includes("Hog")
            ? 1
            : 0
        : Math.floor((Number(actor.species?.split("-")[1] ?? 1) - 1) / 50) % 3;
    return `creature-${actor.kind === "summon" ? "summon" : actor.species?.startsWith("magic") ? "magic" : "physical"}-${variant}-${frame}`;
  }
  private drawGear(
    gear: Phaser.GameObjects.Graphics,
    actor: Actor,
    attack: number,
  ) {
    gear.clear();
    if (actor.kind !== "player" || actor.hp <= 0) return;
    const back = Math.sin(actor.facing) < -0.55;
    gear.setScale(
      Math.abs(Math.cos(actor.facing)) > 0.75 && Math.cos(actor.facing) < 0
        ? -1
        : 1,
      1,
    );
    gear.setRotation(attack);
    const polygon = (points: number[][], color: number, outline = 0x161e2d) => {
      const p = points.map(([x, y]) => ({ x, y }));
      gear.fillStyle(color);
      gear.fillPoints(p, true);
      gear.lineStyle(1, outline);
      gear.strokePoints(p, true);
    };
    if (actor.archetype !== "mystic" && !back) {
      const top = actor.race === "dwarf" ? -32 : -43;
      polygon(
        [
          [-9, top],
          [0, top - 3],
          [9, top],
          [7, -22],
          [0, -18],
          [-7, -22],
        ],
        this.color(actor.armorColor ?? "#71818b"),
      );
      gear.lineStyle(1, 0xd4c49b, 0.75);
      gear.lineBetween(-7, top + 3, 0, top + 7);
      gear.lineBetween(0, top + 7, 7, top + 3);
      gear.lineBetween(0, top + 7, 0, -23);
    }
    if (actor.weapon === "bow") {
      gear.lineStyle(5, 0x252234);
      gear.beginPath();
      gear.arc(13, -27, 20, -Math.PI / 2, Math.PI / 2);
      gear.strokePath();
      gear.lineStyle(2.6, 0xc5a575);
      gear.beginPath();
      gear.arc(13, -27, 20, -Math.PI / 2, Math.PI / 2);
      gear.strokePath();
      gear.lineStyle(1, 0xc5d4d5);
      gear.lineBetween(13, -47, 13, -7);
      gear.lineStyle(3, 0x655444);
      gear.lineBetween(29, -30, 29, -23);
      gear.lineStyle(1, 0xddd8bb);
      gear.lineBetween(8, -26, 38, -26);
    } else if (actor.weapon === "staff" || actor.weapon === "magicMace") {
      gear.lineStyle(5, 0x242234);
      gear.lineBetween(18, -6, 18, -61);
      gear.lineStyle(2.5, 0xba9c68);
      gear.lineBetween(18, -6, 18, -61);
      gear.fillStyle(0xc0a478);
      gear.fillCircle(18, -64, 8);
      gear.fillStyle(0x31384f);
      gear.fillCircle(18, -64, 5.5);
      polygon(
        [
          [18, -72],
          [22, -65],
          [18, -57],
          [14, -65],
        ],
        actor.weapon === "staff" ? 0xa4bced : 0xd9cf98,
        0xe1d6aa,
      );
      gear.lineStyle(1, 0xe0d2a4);
      gear.lineBetween(14, -42, 22, -42);
      gear.lineBetween(14, -39, 22, -39);
    } else if (actor.weapon === "hammer") {
      gear.lineStyle(5, 0x252431);
      gear.lineBetween(18, -9, 21, -44);
      gear.lineStyle(2.5, 0x9c7a59);
      gear.lineBetween(18, -9, 21, -44);
      polygon(
        [
          [9, -50],
          [29, -48],
          [32, -38],
          [10, -39],
        ],
        0x65788b,
      );
      gear.fillStyle(0xc1c6bd);
      gear.fillRect(10, -49, 5, 10);
      gear.lineStyle(1, 0xd8d5ba);
      gear.lineBetween(15, -48, 29, -46);
    } else if (actor.weapon === "fist") {
      for (const x of [-19, 13]) {
        polygon(
          [
            [x, -28],
            [x + 9, -29],
            [x + 10, -17],
            [x, -16],
          ],
          0xa49371,
        );
        gear.lineStyle(1, 0xe5d7ae);
        gear.lineBetween(x + 2, -25, x + 7, -25);
      }
    } else if (actor.weapon) {
      const pole = actor.weapon === "polearm",
        dagger = actor.weapon === "dagger",
        large = actor.weapon === "greatsword";
      if (pole) {
        gear.lineStyle(4, 0x202536);
        gear.lineBetween(17, 5, 21, -66);
        gear.lineStyle(2, 0xa88c68);
        gear.lineBetween(17, 5, 21, -66);
        polygon(
          [
            [21, -81],
            [26, -65],
            [21, -57],
            [16, -65],
          ],
          0xabbfc9,
        );
      } else {
        const tipY = dagger ? -43 : large ? -70 : -57,
          tipX = large ? 29 : 23;
        polygon(
          [
            [16, -23],
            [16, tipY + 10],
            [tipX, tipY],
            [23, -24],
            [20, -19],
          ],
          0x8296ab,
        );
        polygon(
          [
            [18, -26],
            [19, tipY + 12],
            [tipX, tipY],
            [21, -25],
          ],
          0xd4d9cf,
          0xb4c4ce,
        );
        gear.lineStyle(3, 0xb49a68);
        gear.lineBetween(11, -24, 29, -22);
        gear.lineStyle(4, 0x4f4040);
        gear.lineBetween(18, -22, 18, -11);
        gear.fillStyle(0xc7b17c);
        gear.fillCircle(18, -10, 2.5);
      }
      if (actor.weapon === "swordShield" && actor.shield) {
        polygon(
          [
            [-29, -41],
            [-14, -38],
            [-12, -24],
            [-20, -13],
            [-30, -24],
          ],
          0x5e6f88,
          0xb7a57b,
        );
        polygon(
          [
            [-27, -39],
            [-20, -37],
            [-20, -17],
            [-28, -25],
          ],
          0x8598a4,
          0xb7a57b,
        );
        gear.lineStyle(2, 0xd2bc88);
        gear.lineBetween(-21, -35, -21, -24);
        gear.lineBetween(-26, -30, -17, -30);
      }
      if (actor.weapon === "dual") {
        polygon(
          [
            [-19, -18],
            [-27, -52],
            [-29, -60],
            [-32, -52],
            [-23, -16],
          ],
          0xa3b4bf,
        );
        gear.lineStyle(3, 0xc3a674);
        gear.lineBetween(-29, -21, -16, -24);
        gear.lineStyle(3, 0x524343);
        gear.lineBetween(-21, -21, -18, -13);
      }
    }
  }
  update(time: number, delta: number) {
    const snap = this.snapshot;
    if (!snap) return;
    if (snap.map !== this.mapId) this.drawMap(snap.map);
    const clock = snap.serverTime + performance.now() - this.receivedAt,
      ids = new Set(snap.actors.map((a) => a.id));
    for (const [id, v] of this.entities)
      if (!ids.has(id)) {
        v.root.destroy();
        this.entities.delete(id);
      }
    for (const actor of snap.actors) {
      let entity = this.entities.get(actor.id);
      const texture = this.actorTexture(actor, 0);
      if (!this.textures.exists(texture)) continue;
      if (!entity) {
        const shadow = this.add.ellipse(0, 0, 36, 11, 0x101523, 0.48),
          sprite = this.add
            .image(0, 0, texture)
            .setOrigin(0.5, 100 / 112)
            .setScale(0.8),
          gear = this.add.graphics(),
          bar = this.add.graphics();
        const label = this.add
          .text(0, -91, actor.name, {
            fontFamily: "Verdana, sans-serif",
            fontSize: "11px",
            fontStyle: "bold",
            color:
              actor.kind === "player"
                ? "#e7e5db"
                : actor.kind === "summon"
                  ? "#9dcfc6"
                  : "#edcfa4",
            stroke: "#10182a",
            strokeThickness: 4,
            align: "center",
          })
          .setOrigin(0.5, 1);
        const root = this.add.container(actor.x, actor.y, [
          shadow,
          sprite,
          gear,
          bar,
          label,
        ]);
        entity = { root, sprite, gear, bar, label, actor };
        this.entities.set(actor.id, entity);
      }
      entity.actor = actor;
      const alpha = 1 - Math.exp(-delta / 75),
        dx = actor.x - entity.root.x,
        dy = actor.y - entity.root.y;
      entity.root.x += dx * alpha;
      entity.root.y += dy * alpha;
      entity.root.setDepth(entity.root.y);
      const walking = Math.hypot(dx, dy) > 1,
        attacking = clock - actor.lastAttack < 330,
        dead = actor.hp <= 0;
      const frame = walking ? 1 + (Math.floor(time / 150) % 2) : 0;
      entity.sprite.setTexture(this.actorTexture(actor, frame));
      entity.sprite.setFlipX(Math.cos(actor.facing) < 0);
      entity.sprite.y = dead
        ? 0
        : walking
          ? Math.sin(time / 95) * 1.2
          : this.reducedMotion
            ? 0
            : Math.sin(time / 650) * 0.35;
      const strike = attacking ? Math.sin((clock - actor.lastAttack) / 75) : 0;
      entity.sprite.setAngle(dead ? 85 : strike * 4);
      entity.root.setAlpha(dead ? 0.3 : 1);
      entity.root.setScale(actor.boss ? 1.65 : 1);
      const top = actor.kind === "player" && actor.race === "dwarf" ? -65 : -79;
      const selected = snap.actor.targetId === actor.id;
      const showName = actor.kind === "player" || actor.boss || selected;
      entity.label.setVisible(showName && !dead).setY(top - 10);
      const name =
        actor.kind === "player"
          ? `${actor.name}\nNv. ${actor.id === snap.self.id ? snap.self.level : (snap.online.find((p) => p.id === actor.id)?.level ?? "")}`
          : actor.name.replace(" [modelo de teste]", "");
      if (entity.label.text !== name) entity.label.setText(name);
      const bar = entity.bar;
      bar.clear();
      if (selected) {
        bar.lineStyle(2, 0xccb17e, 0.9);
        bar.strokeEllipse(0, 1, 49, 17);
        bar.lineStyle(1, 0xf5e5b0, 0.5);
        bar.strokeEllipse(0, 1, 55, 21);
      } else if (actor.id === snap.self.id) {
        bar.lineStyle(1, 0xc9b68f, 0.4);
        bar.strokeEllipse(0, 1, 39, 14);
      }
      if (
        !dead &&
        (actor.kind === "player" || selected || actor.hp < actor.maxHp)
      ) {
        bar.fillStyle(0x161b2a);
        bar.fillRect(-21, top, 42, 5);
        bar.fillStyle(
          actor.kind === "player"
            ? 0x71b78a
            : actor.kind === "summon"
              ? 0x6caeaf
              : 0xb8696d,
        );
        bar.fillRect(-20, top + 1, 40 * Math.max(0, actor.hp / actor.maxHp), 3);
        bar.lineStyle(1, 0xb0ac9980, 0.4);
        bar.strokeRect(-21, top, 42, 5);
      }
      this.drawGear(entity.gear, actor, strike * 0.22);
    }
    const self = this.entities.get(snap.self.id);
    if (self) this.cameras.main.centerOn(self.root.x, self.root.y - 25);
    for (const event of snap.vfx) {
      if (event.id <= this.lastEvent) continue;
      this.lastEvent = event.id;
      const from = this.entities.get(event.from),
        to = this.entities.get(event.to);
      if (!to) continue;
      const heal = event.kind === "heal";
      const color = heal
        ? 0x9ce6a9
        : event.kind === "magic"
          ? 0xa99ae7
          : event.kind === "spoil"
            ? 0x78b7dd
            : 0xf3ce83;
      const burst = this.pooled(this.burstPool, 48, () =>
        this.add.circle(0, 0, 4, color),
      );
      if (burst) {
        burst
          .setPosition(to.root.x, to.root.y - 32)
          .setRadius(4)
          .setFillStyle(color, 0.8)
          .setAlpha(1)
          .setVisible(true)
          .setDepth(3000);
        this.tweens.add({
          targets: burst,
          radius: 22,
          alpha: 0,
          duration: 350,
          onComplete: () => burst.setActive(false).setVisible(false),
        });
      }
      if (from && from !== to) {
        const bolt = this.pooled(this.boltPool, 48, () =>
          this.add.rectangle(0, 0, 5, 3, color),
        );
        if (bolt) {
          bolt
            .setPosition(from.root.x, from.root.y - 38)
            .setSize(event.kind === "arrow" ? 14 : 5, 3)
            .setFillStyle(color)
            .setAlpha(1)
            .setVisible(true)
            .setDepth(3000)
            .setRotation(
              Math.atan2(to.root.y - from.root.y, to.root.x - from.root.x),
            );
          this.tweens.add({
            targets: bolt,
            x: to.root.x,
            y: to.root.y - 32,
            duration: 180,
            onComplete: () => bolt.setActive(false).setVisible(false),
          });
        }
      }
      if (event.amount || event.kind === "miss") {
        const text = this.pooled(this.textPool, 64, () =>
          this.add.text(0, 0, "", {
            fontFamily: "Verdana, sans-serif",
            fontSize: "15px",
            fontStyle: "bold",
            stroke: "#17212a",
            strokeThickness: 3,
          }),
        );
        if (text) {
          text
            .setPosition(to.root.x + ((event.id % 5) - 2) * 8, to.root.y - 103)
            .setText(
              event.kind === "miss"
                ? "MISS"
                : `${heal ? "+" : ""}${event.amount}`,
            )
            .setColor(heal ? "#aeedaf" : "#f6d7a2")
            .setAlpha(1)
            .setVisible(true)
            .setDepth(3100);
          this.tweens.add({
            targets: text,
            y: text.y - 35,
            alpha: 0,
            duration: 750,
            onComplete: () => text.setActive(false).setVisible(false),
          });
        }
      }
    }
    if (time - this.lastMove > 100 && snap.map === "city") {
      this.lastMove = time;
      const focused = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(focused ?? "")) return;
      const dx =
          Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
          Number(this.keys.A.isDown || this.keys.LEFT.isDown),
        dy =
          Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
          Number(this.keys.W.isDown || this.keys.UP.isDown);
      if (dx || dy) {
        this.moving = true;
        this.send({ type: "move", dx, dy });
      } else if (this.moving) {
        this.moving = false;
        this.send({ type: "move", dx: 0, dy: 0 });
      }
    }
  }
}
