import { projectilePose } from "/archer-vfx.mjs";
import { gunslingerRainPose } from "/gunslinger-vfx.mjs";
import { GUNSLINGER_MUZZLES } from "/gunslinger.mjs";
// Fire projectile and damage-over-time flames, three skyward bullet waves,
// and a full-body Eclipse transformation following the warrior presentation.
(() => {
  const art = new Map(),
    scenes = new Map();
  let state = null,
    at = 0;
  for (const name of [
    "bullet",
    "muzzle",
    "impact",
    "power",
    "powerimpact",
    "volley",
    "firebullet",
    "burn",
    "eclipse",
  ]) {
    const im = new Image();
    im.src = `/assets/fx/royal-gunslinger/${name}.png`;
    im.decode()
      .then(() => art.set(name, im))
      .catch(() => {});
  }
  for (const sheet of [
    "idle",
    "walk",
    "run1",
    "weapon",
    "special",
    "axeheavy",
  ]) {
    const im = new Image();
    im.src = `/assets/fx/royal-gunslinger/eclipse-weapons/${sheet}.png`;
    im.decode()
      .then(() => art.set(`weapons:${sheet}`, im))
      .catch(() => {});
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    at = performance.now();
  });
  function clear(e) {
    for (const s of e.images.values()) s.destroy();
    e.images.clear();
    e.shots.clear();
    e.actors.clear();
    e.hits = [];
  }
  function draw(scene, e) {
    const now = performance.now(),
      seen = new Set(),
      shots = new Set();
    for (const [name, im] of art)
      if (!scene.textures.exists(`gun-fx:${name}`))
        if (name.startsWith("weapons:"))
          scene.textures.addSpriteSheet(`gun-fx:${name}`, im, {
            frameWidth: 384,
            frameHeight: 384,
          });
        else scene.textures.addImage(`gun-fx:${name}`, im);
    for (const [id, a] of e.actors) if (!a.root?.scene) e.actors.delete(id);
    function image(id, name, x, y, w, h, alpha, angle = 0, depth = 1e6) {
      if (!art.has(name) || alpha <= 0) return;
      seen.add(id);
      let s = e.images.get(id);
      if (!s) {
        s = scene.add.image(0, 0, `gun-fx:${name}`);
        e.images.set(id, s);
      }
      s.setTexture(`gun-fx:${name}`)
        .setPosition(x, y)
        .setDisplaySize(w, h)
        .setAlpha(alpha)
        .setAngle(angle)
        .setDepth(depth)
        .setVisible(true);
      return s;
    }
    const active =
      state?.classId === "pistoleira" &&
      state.inHunt &&
      state.alive &&
      e.actor?.root.scene === scene;
    if (active)
      for (const fx of state.gunslingerFx ?? []) {
        const left = fx.remainingMs - (now - at),
          age = fx.durationMs - left;
        if (left <= 0) continue;
        if (fx.kind === "burn") {
          const target = e.actors.get(fx.target),
            x = target?.x ?? fx.x,
            y = target?.y ?? fx.y,
            fade = Math.min(1, left / 300),
            phase = now / 180,
            depth = (target?.root.depth ?? e.actor.root.depth) + 0.04;
          for (let i = 0; i < 2; i++)
            image(
              `${fx.id}:flame:${i}`,
              "burn",
              x + (i ? 10 : -10),
              y - 25 + Math.sin(phase + i) * 3,
              38,
              57 + Math.sin(phase + i) * 4,
              0.8 * fade,
              0,
              depth,
            );
          continue;
        }
        if (fx.kind === "rain") {
          const rain = gunslingerRainPose(fx, age),
            depth = e.actor.root.depth - 0.3;
          if (rain.telegraph)
            image(
              `${fx.id}:area`,
              "volley",
              fx.x,
              fx.y + 3,
              fx.radius * 2.1,
              fx.radius * 1.4,
              0.65 *
                Math.min(
                  1,
                  Math.max(0, (age - fx.releaseMs) / 140),
                  left / 250,
                ),
              0,
              depth,
            );
          for (const d of rain.drops)
            image(
              `${fx.id}:drop:${d.wave}:${d.index}`,
              "bullet",
              d.x,
              d.y - 7,
              58,
              20,
              d.alpha,
              90,
            );
          for (const hit of rain.impacts)
            for (let i = 0; i < 10; i++) {
              const a = i * 2.399963 + hit.wave * 0.7,
                r = fx.radius * 0.85 * Math.sqrt((i + 0.5) / 10),
                p = hit.progress;
              image(
                `${fx.id}:hit:${hit.wave}:${i}`,
                "impact",
                fx.x + Math.cos(a) * r,
                fx.y + Math.sin(a) * r - 8,
                30 + p * 24,
                36 + p * 24,
                Math.pow(1 - p, 1.3) * 0.9,
              );
            }
          // Two visual launches have no extra damage: only the server rain hits.
          for (const [hand, release] of [150, 350].entries()) {
            const t = (age - release) / 240;
            if (t >= 0 && t < 1)
              image(
                `${fx.id}:launch:${hand}`,
                "bullet",
                e.actor.x + (hand ? 17 : -17),
                e.actor.y - 130 - t * 75,
                42,
                16,
                (1 - t) * 0.9,
                -90,
              );
          }
          continue;
        }
        const target = e.actors.get(fx.target),
          render = target?.root.active
            ? { ...fx, tx: target.x, ty: target.y - 70 }
            : fx,
          power = fx.skillId === "disparo-sombrio",
          burst = fx.skillId === "rajada-do-crepusculo";
        shots.add(fx.id);
        e.shots.set(fx.id, { fx: render, due: now + left });
        const pose = projectilePose(render, age);
        if (!pose) {
          if (power) {
            const p = Math.min(1, Math.max(0, age / fx.releaseMs));
            image(
              fx.id + ":charge",
              "muzzle",
              fx.x,
              fx.y,
              16 + p * 22,
              16 + p * 22,
              p * 0.9,
            );
          }
          continue;
        }
        if (age - fx.releaseMs < 110) {
          const p = (age - fx.releaseMs) / 110;
          image(
            fx.id + ":muzzle",
            "muzzle",
            fx.x,
            fx.y,
            (power ? 50 : 32) + p * 8,
            (power ? 42 : 28) + p * 6,
            Math.pow(1 - p, 0.7),
            pose.angle,
          );
        }
        image(
          fx.id,
          power ? "firebullet" : "bullet",
          pose.x,
          pose.y,
          power ? 128 : burst ? 66 : state.activeMs > 0 ? 58 : 50,
          power ? 58 : burst ? 28 : 23,
          1,
          pose.angle,
        );
      }
    for (const [id, shot] of e.shots)
      if (!shots.has(id)) {
        if (active && Math.abs(now - shot.due) < 180)
          e.hits.push({
            id,
            x: shot.fx.tx,
            y: shot.fx.ty,
            at: now,
            power: shot.fx.skillId === "disparo-sombrio",
            angle:
              (Math.atan2(shot.fx.ty - shot.fx.y, shot.fx.tx - shot.fx.x) *
                180) /
              Math.PI,
          });
        e.shots.delete(id);
      }
    e.hits = e.hits.filter((h) => active && now - h.at < 320);
    for (const h of e.hits) {
      const p = (now - h.at) / 320;
      image(
        h.id + ":impact",
        h.power ? "burn" : "impact",
        h.x,
        h.y,
        (h.power ? 85 : 36) + p * 18,
        (h.power ? 60 : 36) + p * 15,
        Math.pow(1 - p, 1.3) * 0.95,
        0,
      );
    }
    if (active) {
      const a = e.actor,
        buffs = state.activeBuffs ?? [],
        eclipse = buffs.find((b) => b.id === "eclipse"),
        instinct = buffs.find((b) => b.id === "instinto-noturno");
      if (eclipse) {
        const age = eclipse.totalMs - eclipse.remainingMs + (now - at),
          phase = age / 850,
          fade = Math.max(
            0,
            Math.min(1, age / 200, (eclipse.remainingMs - (now - at)) / 350),
          );
        const width = 128,
          height = 145;
        image(
          "eclipse:body",
          "eclipse",
          a.x,
          a.y + 5,
          width,
          height,
          (0.8 + 0.06 * Math.sin(phase * 3)) * fade,
          0,
          a.root.depth - 0.2,
        )?.setOrigin(0.5, 0.94);
        image(
          "eclipse:feet",
          "eclipse",
          a.x,
          a.y + 5,
          width,
          height,
          0.32 * fade,
          0,
          a.root.depth + 0.035,
        )
          ?.setOrigin(0.5, 0.94)
          .setCrop(0, 198, 256, 58);
        const body = window.__royalHD?.capture(a),
          pose = body?.pose;
        if (body && pose && art.has(`weapons:${pose.sheet}`)) {
          const name = `weapons:${pose.sheet}`,
            im = art.get(name),
            sprite = image(
              "eclipse:weapons",
              name,
              a.x + body.x,
              a.y + body.y,
              384,
              384,
              (0.86 + 0.1 * Math.sin(age / 180)) * fade,
              body.angle,
              a.root.depth + 0.05,
            );
          sprite
            ?.setTexture(
              `gun-fx:${name}`,
              pose.row * (im.width / 384) + pose.col,
            )
            .setOrigin(body.originX, body.originY)
            .setScale(body.scaleX, body.scaleY)
            .setFlipX(body.flipX)
            .setBlendMode(1);
        }
      }
      const pose = window.__royalHD?.capture(a)?.pose;
      if (instinct && pose?.sheet === "weapon") {
        const hand = pose.col >= 3 ? 1 : 0,
          [x, y] = GUNSLINGER_MUZZLES[pose.row][hand];
        image(
          "instinct:weapon",
          "muzzle",
          a.x + x,
          a.y + y,
          12,
          12,
          0.5 + 0.08 * Math.sin(now / 300),
        );
      }
      for (const b of buffs) {
        const p = (b.totalMs - b.remainingMs + (now - at)) / 650;
        if (p >= 0 && p < 1)
          image(
            "buff:" + b.id,
            "muzzle",
            a.x,
            a.y - 57,
            38 + p * 25,
            42 + p * 28,
            Math.pow(1 - p, 1.3) * 0.8,
          );
      }
    }
    for (const [id, s] of e.images)
      if (!seen.has(id)) {
        s.destroy();
        e.images.delete(id);
      }
  }
  window.__royalGunslingerVisuals = {
    ready() {
      return [
        "firebullet",
        "burn",
        "eclipse",
        "weapons:weapon",
        "weapons:axeheavy",
      ].every((n) => art.has(n));
    },
    update(a) {
      const scene = a.root.scene;
      let e = scenes.get(scene);
      if (!e) {
        e = {
          actor: null,
          actors: new Map(),
          images: new Map(),
          shots: new Map(),
          hits: [],
        };
        scenes.set(scene, e);
        const update = () => draw(scene, e);
        scene.events.on("postupdate", update);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", update);
          clear(e);
          scenes.delete(scene);
        });
      }
      e.actors.set(a.id, a);
      if (a.id === 1) e.actor = a;
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    for (const e of scenes.values()) clear(e);
  });
})();
