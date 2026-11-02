import { projectilePose } from "/archer-vfx.mjs";
import { GUNSLINGER_MUZZLES } from "/gunslinger.mjs";
// Distinct painted signatures: charged piercing shot, six-hit crescent volley,
// a restrained weapon glint and an open moving Eclipse orbit.
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
    "orbit",
  ]) {
    const im = new Image();
    im.src = `/assets/fx/royal-gunslinger/${name}.png`;
    im.decode()
      .then(() => art.set(name, im))
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
    e.volleys.clear();
    e.actors.clear();
    e.hits = [];
  }
  function draw(scene, e) {
    const now = performance.now(),
      seen = new Set(),
      shots = new Set();
    for (const [name, im] of art)
      if (!scene.textures.exists(`gun-fx:${name}`))
        scene.textures.addImage(`gun-fx:${name}`, im);
    for (const [id, a] of e.actors) if (!a.root?.scene) e.actors.delete(id);
    function image(id, name, x, y, w, h, alpha, angle = 0, depth = 1e6) {
      if (!art.has(name) || alpha <= 0) return;
      seen.add(id);
      let s = e.images.get(id);
      if (!s) {
        s = scene.add.image(0, 0, `gun-fx:${name}`);
        e.images.set(id, s);
      }
      s.setPosition(x, y)
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
        const target = e.actors.get(fx.target),
          render = target?.root.active
            ? { ...fx, tx: target.x, ty: target.y - 70 }
            : fx,
          power = fx.skillId === "disparo-sombrio",
          burst = fx.skillId === "rajada-do-crepusculo";
        shots.add(fx.id);
        e.shots.set(fx.id, { fx: render, due: now + left });
        if (burst && fx.area) {
          const id = fx.area.group ?? `rajada:${fx.start}`,
            old = e.volleys.get(id);
          e.volleys.set(id, {
            area: fx.area,
            at: now - age,
            until: Math.max(now + left, old?.until ?? 0),
          });
        }
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
          power ? "power" : "bullet",
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
        h.power ? "powerimpact" : "impact",
        h.x,
        h.y,
        (h.power ? 85 : 36) + p * 18,
        (h.power ? 60 : 36) + p * 15,
        Math.pow(1 - p, 1.3) * 0.95,
        h.power ? h.angle : 0,
      );
    }
    for (const [id, v] of e.volleys) {
      if (!active || now > v.until + 220) {
        e.volleys.delete(id);
        continue;
      }
      const fade = Math.max(
        0,
        Math.min(1, (now - v.at) / 130, (v.until + 220 - now) / 240),
      );
      image(
        id + ":ground",
        "volley",
        v.area.x,
        v.area.y + 4,
        v.area.radius * 2.15,
        v.area.radius * 1.4,
        fade * 0.68,
        0,
        e.actor.root.depth - 0.3,
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
        image(
          "eclipse:orbit",
          "orbit",
          a.x,
          a.y - 50 + Math.sin(phase) * 2,
          110,
          120,
          (0.78 + 0.025 * Math.sin(phase)) * fade,
          Math.sin(phase * 0.5) * 7,
          a.root.depth - 0.2,
        );
        image(
          "eclipse:front",
          "orbit",
          a.x,
          a.y - 50 + Math.sin(phase) * 2,
          110,
          120,
          0.4 * fade,
          Math.sin(phase * 0.5) * 7,
          a.root.depth + 0.03,
        )?.setCrop(0, 128, 256, 128);
        for (let i = 0; i < 2; i++) {
          const t = phase + i * Math.PI;
          image(
            "eclipse:mote:" + i,
            "muzzle",
            a.x + Math.cos(t) * 38,
            a.y - 48 + Math.sin(t) * 21,
            12,
            12,
            0.9 * fade,
            phase * 20,
            Math.sin(t) > 0 ? a.root.depth + 0.04 : a.root.depth - 0.25,
          );
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
    update(a) {
      const scene = a.root.scene;
      let e = scenes.get(scene);
      if (!e) {
        e = {
          actor: null,
          actors: new Map(),
          images: new Map(),
          shots: new Map(),
          volleys: new Map(),
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
