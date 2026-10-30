import Phaser from "phaser";
import { CITY, SPAWNS, RACES } from "@idle/shared";
import type { Actor, Command, Snapshot } from "@idle/shared";
export class World extends Phaser.Scene {
  snapshot: Snapshot | null = null;
  private receivedAt = 0;
  private mapId = "";
  private lastMove = 0;
  private moving = false;
  private lastEvent = 0;
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
    this.cameras.main.setZoom(1.25);
    this.cameras.main.setBackgroundColor("#142b24");
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
    const colors = ["#377345", "#3f7d4b", "#39714b"];
    for (let n = 0; n < 3; n++) {
      const canvas = this.textures.createCanvas(`grass${n}`, 32, 32)!,
        ctx = canvas.context;
      ctx.fillStyle = colors[n];
      ctx.fillRect(0, 0, 32, 32);
      for (let j = 0; j < 16; j++) {
        ctx.fillStyle = j % 2 ? "#639458" : "#315c3d";
        ctx.fillRect((j * 11 + n * 5) % 31, (j * 7) % 31, 2, 2);
      }
      canvas.refresh();
    }
    const stone = this.textures.createCanvas("stone", 32, 32)!,
      ctx = stone.context;
    ctx.fillStyle = "#9c9781";
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = "#747767";
    ctx.strokeRect(0, 0, 16, 16);
    ctx.strokeRect(16, 16, 16, 16);
    ctx.fillStyle = "#b2ab91";
    ctx.fillRect(2, 2, 12, 2);
    ctx.fillRect(18, 18, 12, 2);
    stone.refresh();
    for (const race of Object.keys(RACES))
      for (const kind of ["fighter", "mystic"])
        for (let frame = 0; frame < 3; frame++) {
          const tex = this.textures.createCanvas(
              `${race}-${kind}-${frame}`,
              32,
              48,
            )!,
            c = tex.context;
          const dwarf = race === "dwarf",
            orc = race === "orc",
            y = dwarf ? 9 : 0,
            skin = RACES[race as keyof typeof RACES].color;
          const rect = (
            color: string,
            x: number,
            yy: number,
            w: number,
            h: number,
          ) => {
            c.fillStyle = color;
            c.fillRect(x, yy, w, h);
          };
          rect("#142126", 6, 14 + y, 21, 25 - y);
          rect(
            kind === "mystic" ? "#656b96" : "#718b95",
            8,
            22 + y,
            17,
            14 - y,
          );
          rect("#bdad70", 10, 24 + y, 3, 11 - y);
          rect("#a0916e", 7, 35, 20, 3);
          rect("#373f4b", 9 + (frame === 1 ? -2 : 0), 38, 6, 8);
          rect("#373f4b", 19 + (frame === 2 ? 2 : 0), 38, 6, 8);
          rect("#856047", 8 + (frame === 1 ? -2 : 0), 44, 8, 3);
          rect("#856047", 19 + (frame === 2 ? 2 : 0), 44, 8, 3);
          rect(skin, 5, 5 + y, 23, 19);
          rect("#dbc7a1", 8, 5 + y, 17, 3);
          rect(
            race === "elf"
              ? "#f0dd9a"
              : race === "darkelf"
                ? "#d4d4ec"
                : race === "orc"
                  ? "#363933"
                  : "#69503b",
            5,
            3 + y,
            23,
            7,
          );
          rect("#1b2933", 10, 14 + y, 3, 3);
          rect("#1b2933", 21, 14 + y, 3, 3);
          rect("#d5a37c", 16, 20 + y, 4, 2);
          if (race === "elf" || race === "darkelf") {
            rect(skin, 1, 13 + y, 6, 4);
            rect(skin, 27, 13 + y, 5, 4);
          }
          if (dwarf) {
            rect("#ad9a7e", 10, 20, 14, 10);
            rect("#67523d", 15, 21, 4, 7);
          }
          if (orc) rect("#e4ddbd", 12, 21, 3, 4);
          rect(skin, 3, 25 + y, 5, 9);
          rect(skin, 26, 25 + y, 5, 9);
          tex.refresh();
        }
    for (const type of ["physical", "magic", "summon"]) {
      const tex = this.textures.createCanvas(type, 40, 42)!,
        c = tex.context;
      const rect = (
        color: string,
        x: number,
        y: number,
        w: number,
        h: number,
      ) => {
        c.fillStyle = color;
        c.fillRect(x, y, w, h);
      };
      rect("#18232c", 6, 10, 28, 27);
      rect(
        type === "physical"
          ? "#a46c51"
          : type === "magic"
            ? "#7b72bb"
            : "#9b9c89",
        8,
        13,
        24,
        19,
      );
      rect(
        type === "physical"
          ? "#ceaa69"
          : type === "magic"
            ? "#9f8bd0"
            : "#c8b67f",
        12,
        8,
        17,
        14,
      );
      rect("#decf9b", 5, 3, 5, 12);
      rect("#decf9b", 29, 3, 5, 12);
      rect("#e9d474", 12, 17, 6, 4);
      rect("#e9d474", 24, 17, 6, 4);
      rect("#202a30", 14, 17, 2, 3);
      rect("#202a30", 25, 17, 2, 3);
      rect("#2a3033", 16, 26, 10, 3);
      rect("#d1ba8f", 2, 24, 5, 11);
      rect("#d1ba8f", 33, 24, 5, 11);
      rect("#584839", 8, 34, 8, 6);
      rect("#584839", 25, 34, 8, 6);
      tex.refresh();
    }
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
    this.cameras.main.setBounds(0, 0, width, height);
    const floor = this.add.container(0, 0).setDepth(-1000);
    this.scenery.push(floor);
    let seed = 73;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let y = 0; y < height; y += 32)
      for (let x = 0; x < width; x += 32) {
        const road =
          city &&
          (Math.abs(x - 784) < 76 ||
            Math.abs(y - 592) < 70 ||
            (y > 350 && y < 420 && x > 450 && x < 1110));
        floor.add(
          this.add.image(
            x + 16,
            y + 16,
            road ? "stone" : `grass${Math.floor(random() * 3)}`,
          ),
        );
      }
    const g = this.add.graphics().setDepth(-10);
    this.scenery.push(g);
    const tree = (x: number, y: number) => {
      const crown = this.add.graphics({ x, y }).setDepth(y);
      crown.fillStyle(0x183b31, 0.35);
      crown.fillEllipse(4, 13, 65, 19);
      crown.fillStyle(0x66503c);
      crown.fillRect(-6, -35, 12, 45);
      crown.fillStyle(0x193d32);
      crown.fillRect(-30, -90, 60, 55);
      crown.fillStyle(0x2d6840);
      crown.fillRect(-35, -80, 70, 34);
      crown.fillRect(-22, -104, 42, 27);
      crown.fillStyle(0x4f8e50);
      crown.fillRect(-23, -94, 32, 18);
      crown.fillStyle(0x76a65a);
      crown.fillRect(-17, -94, 15, 8);
      this.scenery.push(crown);
      this.tweens.add({
        targets: crown,
        angle: 1.2,
        duration: 2000 + random() * 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    };
    for (let i = 0; i < 30; i++) {
      tree(35 + i * 55, 65);
      tree(i % 2 ? 45 : width - 40, 160 + i * 28);
    }
    for (let i = 0; i < 60; i++) {
      const x = 100 + random() * (width - 200),
        y = 100 + random() * (height - 200);
      if (city && x > 350 && x < 1200) continue;
      g.fillStyle(random() > 0.5 ? 0xd5bb6d : 0x99abb6);
      g.fillRect(x, y, 3, 3);
    }
    if (city) {
      for (const b of CITY.blocks) {
        const house = this.add.graphics().setDepth(b.y + b.h);
        house.fillStyle(0x14271f, 0.35);
        house.fillRect(b.x + 12, b.y + 16, b.w, b.h);
        house.fillStyle(0xd0bc92);
        house.fillRect(b.x, b.y + 70, b.w, b.h - 70);
        house.fillStyle(0x654735);
        for (let x = b.x; x <= b.x + b.w; x += 70)
          house.fillRect(x, b.y + 70, 9, b.h - 70);
        house.fillRect(b.x, b.y + b.h - 12, b.w, 12);
        house.fillStyle(0x664035);
        house.fillTriangle(
          b.x - 20,
          b.y + 80,
          b.x + b.w / 2,
          b.y - 15,
          b.x + b.w + 20,
          b.y + 80,
        );
        house.fillStyle(0x9f5c43);
        house.fillTriangle(
          b.x - 5,
          b.y + 68,
          b.x + b.w / 2,
          b.y - 4,
          b.x + b.w + 5,
          b.y + 68,
        );
        house.fillStyle(0x322e2c);
        house.fillRect(b.x + b.w / 2 - 18, b.y + b.h - 65, 36, 65);
        house.fillStyle(0x78a7ad);
        for (let x = b.x + 30; x < b.x + b.w - 30; x += 100) {
          house.fillRect(x, b.y + 100, 28, 34);
          house.lineStyle(3, 0xebd7a3);
          house.strokeRect(x, b.y + 100, 28, 34);
        }
        this.scenery.push(house);
      }
      g.fillStyle(0x656e69);
      g.fillEllipse(800, 460, 140, 75);
      g.fillStyle(0x78aaad);
      g.fillEllipse(800, 452, 120, 59);
      g.fillStyle(0xb7bdac);
      g.fillRect(790, 400, 20, 55);
      g.fillEllipse(800, 397, 70, 24);
      for (const npc of CITY.npcs) {
        const glow = this.add.graphics().setDepth(npc.y - 1);
        glow.lineStyle(2, npc.id === "portal" ? 0x74b7c5 : 0xc4a76a, 0.7);
        glow.strokeEllipse(npc.x, npc.y + 8, 70, 30);
        if (npc.id === "portal") {
          glow.lineStyle(9, 0x746c6b);
          glow.strokeEllipse(npc.x, npc.y - 20, 65, 95);
          glow.lineStyle(4, 0x80bee0);
          glow.strokeEllipse(npc.x, npc.y - 20, 46, 76);
          this.tweens.add({
            targets: glow,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 1300,
          });
        } else {
          const npcSprite = this.add
            .image(npc.x, npc.y, "human-mystic-0")
            .setOrigin(0.5, 1)
            .setDepth(npc.y)
            .setTint(npc.id === "forge" ? 0xffcc88 : 0xa9c1bd);
          this.scenery.push(npcSprite);
        }
        const label = this.add
          .text(npc.x, npc.y + 20, npc.name, {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#e8d49b",
            backgroundColor: "#17242bd9",
            padding: { x: 7, y: 5 },
          })
          .setOrigin(0.5, 0)
          .setDepth(npc.y + 1);
        this.scenery.push(glow, label);
      }
    } else {
      for (const [i, s] of SPAWNS.entries()) {
        g.lineStyle(2, 0x7b8b69, 0.22);
        g.strokeCircle(s.x, s.y, 80);
        const label = this.add
          .text(s.x, s.y + 100, `RESPAWN ${i + 1}`, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#9cbd95",
          })
          .setOrigin(0.5)
          .setAlpha(0.45);
        this.scenery.push(label);
      }
      for (let i = 0; i < 9; i++) {
        const x = 70 + i * 164,
          y = i % 2 ? 1050 : 110;
        g.fillStyle(0x69766a);
        g.fillRoundedRect(x, y, 65, 28, 6);
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
      const texture =
        actor.kind === "player"
          ? `${actor.race}-${actor.archetype}-0`
          : actor.kind === "summon"
            ? "summon"
            : actor.species?.startsWith("magic")
              ? "magic"
              : "physical";
      if (!this.textures.exists(texture)) continue;
      if (!entity) {
        const shadow = this.add.ellipse(0, 0, 28, 9, 0x0b181c, 0.35),
          sprite = this.add.image(0, 0, texture).setOrigin(0.5, 1),
          gear = this.add.graphics(),
          bar = this.add.graphics(),
          label = this.add
            .text(
              0,
              10,
              actor.kind === "monster"
                ? `${actor.boss ? actor.name : actor.species?.startsWith("magic") ? "Mágico" : "Físico"}`
                : actor.name,
              {
                fontFamily: "monospace",
                fontSize: "10px",
                color:
                  actor.kind === "player"
                    ? "#e6d5a3"
                    : actor.kind === "summon"
                      ? "#91d5cc"
                      : "#d7b5a3",
                stroke: "#15242b",
                strokeThickness: 3,
              },
            )
            .setOrigin(0.5, 0),
          root = this.add.container(actor.x, actor.y, [
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
        attacking = clock - actor.lastAttack < 330;
      entity.sprite.setTexture(
        actor.kind === "player"
          ? `${actor.race}-${actor.archetype}-${walking ? 1 + (Math.floor(time / 140) % 2) : 0}`
          : texture,
      );
      entity.sprite.setFlipX(Math.cos(actor.facing) < 0);
      entity.sprite.y = walking
        ? Math.sin(time / 85) * 2
        : Math.sin(time / 450) * 0.4;
      entity.sprite.setAngle(
        actor.hp <= 0
          ? 80
          : attacking
            ? Math.sin((clock - actor.lastAttack) / 65) * 7
            : 0,
      );
      entity.root.setAlpha(actor.hp <= 0 ? 0.4 : 1);
      entity.root.setScale(actor.boss ? 1.8 : 1);
      const bar = entity.bar;
      bar.clear();
      bar.fillStyle(0x13202b);
      bar.fillRect(-18, -54, 36, 5);
      bar.fillStyle(
        actor.kind === "player"
          ? 0x7fae70
          : actor.kind === "summon"
            ? 0x6ab7b0
            : 0xc06b61,
      );
      bar.fillRect(-17, -53, 34 * Math.max(0, actor.hp / actor.maxHp), 3);
      if (snap.actor.targetId === actor.id) {
        bar.lineStyle(2, 0xe9ca7b);
        bar.strokeEllipse(0, 0, 45, 18);
      }
      const gear = entity.gear;
      gear.clear();
      if (actor.kind === "player" && actor.hp > 0) {
        gear.fillStyle(this.color(actor.armorColor ?? "#718b95"));
        gear.fillRect(-7, -25, 14, 12);
        gear.fillStyle(0xd1b56e);
        gear.fillRect(-7, -26, 14, 2);
        const angle = attacking
          ? Math.sin((clock - actor.lastAttack) / 90) * 0.9
          : 0;
        gear.setRotation(angle);
        gear.lineStyle(3, 0xd5d7c4);
        if (actor.weapon === "bow") {
          gear.lineStyle(3, 0xb68c59);
          gear.strokeEllipse(15, -23, 15, 35);
          gear.lineStyle(1, 0xd2cfaa);
          gear.lineBetween(15, -40, 15, -7);
        } else if (actor.weapon === "staff" || actor.weapon === "magicMace") {
          gear.lineStyle(3, 0x9b774b);
          gear.lineBetween(13, -4, 13, -43);
          gear.fillStyle(actor.weapon === "staff" ? 0x84a9db : 0xddcc85);
          gear.fillCircle(13, -43, 5);
        } else if (actor.weapon === "hammer") {
          gear.lineStyle(3, 0x9b774b);
          gear.lineBetween(13, -9, 13, -36);
          gear.fillStyle(0xbcc8bd);
          gear.fillRect(4, -41, 21, 11);
          gear.fillStyle(0x687d83);
          gear.fillRect(4, -41, 4, 11);
        } else if (actor.weapon === "fist") {
          gear.fillStyle(0xbfa266);
          gear.fillRect(10, -20, 10, 8);
          gear.fillRect(-20, -20, 10, 8);
        } else if (actor.weapon) {
          gear.lineStyle(actor.weapon === "greatsword" ? 5 : 3, 0xd5d7c4);
          gear.lineBetween(
            12,
            -12,
            actor.weapon === "polearm" ? 17 : 18,
            actor.weapon === "polearm"
              ? -58
              : actor.weapon === "dagger"
                ? -28
                : actor.weapon === "greatsword"
                  ? -49
                  : -39,
          );
          gear.lineStyle(4, 0xc1a362);
          gear.lineBetween(7, -20, 21, -20);
          if (actor.weapon === "swordShield" && actor.shield) {
            gear.fillStyle(0xa18d5c);
            gear.fillRoundedRect(-22, -31, 13, 20, 3);
          }
          if (actor.weapon === "dual") {
            gear.lineStyle(3, 0xd5d7c4);
            gear.lineBetween(-13, -12, -20, -39);
          }
        }
      }
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
          .setPosition(to.root.x, to.root.y - 22)
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
            .setPosition(from.root.x, from.root.y - 25)
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
            y: to.root.y - 24,
            duration: 180,
            onComplete: () => bolt.setActive(false).setVisible(false),
          });
        }
      }
      if (event.amount || event.kind === "miss") {
        const text = this.pooled(this.textPool, 64, () =>
          this.add.text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "14px",
            fontStyle: "bold",
            stroke: "#17212a",
            strokeThickness: 3,
          }),
        );
        if (text) {
          text
            .setPosition(to.root.x, to.root.y - 64)
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
