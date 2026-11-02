// Pose-bound energy: actual silhouette rim, animated light clipped onto the
// body and particles emitted from its edges. The warrior keeps its own effect.
(() => {
  const art = new Map(),
    emitters = new Map(),
    scenes = new Map(),
    actors = new Map();
  let state = null,
    stateAt = 0,
    castAt = -Infinity;
  window.addEventListener(
    "royal-combat-cue",
    () => (castAt = performance.now()),
  );
  const looks = {
    arqueira: {
      look: "archer",
      buff: "espirito-da-floresta",
      color: 0x78d99b,
      light: 0xe4ffc5,
      css: "115,230,160",
    },
    pistoleira: {
      look: "gunslinger",
      buff: "eclipse",
      color: 0xb58aff,
      light: 0xf0d5ff,
      css: "178,123,255",
    },
  };
  for (const look of ["archer", "gunslinger"]) {
    fetch(`/assets/fx/royal-energy/${look}/emitters.json`)
      .then((r) => r.json())
      .then((d) => emitters.set(look, d))
      .catch(() => {});
    for (const sheet of [
      "idle",
      "walk",
      "run1",
      "weapon",
      "axeheavy",
      "special",
    ])
      for (const kind of ["surface", "contour"]) {
        const im = new Image();
        im.src = `/assets/fx/royal-energy/${look}/${sheet}-${kind}.png`;
        im.decode()
          .then(() => art.set(`${look}:${sheet}:${kind}`, im))
          .catch(() => {});
      }
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    stateAt = performance.now();
  });
  function remove(a) {
    const s = actors.get(a);
    if (!s) return;
    for (const x of [s.outer, s.rim, s.flow, s.front, s.back]) x.destroy();
    if (s.scene.textures.exists(s.key)) s.scene.textures.remove(s.key);
    actors.delete(a);
  }
  function draw(a) {
    const now = performance.now(),
      config = looks[state?.classId],
      buff = state?.activeBuffs?.find((b) => b.id === config?.buff),
      body = window.__royalHD?.capture(a);
    if (
      !config ||
      !buff ||
      !state.inHunt ||
      !state.alive ||
      !a.root.active ||
      !a.alive ||
      !body ||
      a.hidden ||
      !a.root.visible
    ) {
      remove(a);
      return;
    }
    const pose = body.pose,
      stem = `${config.look}:${pose.sheet}`,
      surface = art.get(stem + ":surface"),
      contour = art.get(stem + ":contour"),
      points = emitters.get(config.look)?.[
        `${pose.sheet}:${pose.row}:${pose.col}`
      ];
    if (!surface || !contour || !points) return;
    const scene = a.root.scene,
      key = `attached-energy:${a.id}`;
    let s = actors.get(a);
    if (!s) {
      const tex = scene.textures.createCanvas(key, 384, 384);
      s = {
        key,
        scene,
        tex,
        ctx: tex.getContext(),
        last: -Infinity,
        poseKey: "",
        outer: scene.add.image(0, 0, key),
        rim: scene.add.image(0, 0, key),
        flow: scene.add.image(0, 0, key),
        front: scene.add.graphics(),
        back: scene.add.graphics(),
      };
      actors.set(a, s);
      for (const im of [s.outer, s.rim, s.flow]) im.royalAttachedEnergy = true;
      s.flow.royalEnergySurface = true;
      s.front.royalEnergyParticles = true;
      s.back.royalEnergyParticles = true;
    }
    const age = buff.totalMs - buff.remainingMs + now - stateAt,
      left = buff.remainingMs - (now - stateAt),
      fade = Math.max(0, Math.min(1, age / 240, left / 350)),
      phase = age / 850,
      poseKey = `${stem}:${pose.row}:${pose.col}`,
      cols = contour.width / 384,
      frame = pose.row * cols + pose.col;
    const contourKey = `energy-contour:${stem}`;
    if (!scene.textures.exists(contourKey))
      scene.textures.addSpriteSheet(contourKey, contour, {
        frameWidth: 384,
        frameHeight: 384,
      });
    for (const [im, depth] of [
      [s.outer, a.root.depth + 0.008],
      [s.rim, a.root.depth + 0.025],
      [s.flow, a.root.depth + 0.04],
    ])
      im.setPosition(a.x + body.x, a.y + body.y)
        .setOrigin(body.originX, body.originY)
        .setScale(body.scaleX, body.scaleY)
        .setAngle(body.angle)
        .setFlipX(body.flipX)
        .setDepth(depth)
        .setVisible(true);
    s.outer
      .setTexture(contourKey, frame)
      .setTint(config.color)
      .setAlpha((0.8 + 0.1 * Math.sin(phase * 3)) * fade);
    s.rim
      .setTexture(contourKey, frame)
      .setTint(config.light)
      .setAlpha((0.24 + 0.08 * Math.sin(phase * 4)) * fade);
    if (poseKey !== s.poseKey || now - s.last >= 40) {
      const c = s.ctx;
      c.clearRect(0, 0, 384, 384);
      c.globalCompositeOperation = "source-over";
      const wash = c.createLinearGradient(0, 125, 0, 352);
      wash.addColorStop(0, `rgba(${config.css},.08)`);
      wash.addColorStop(0.6, `rgba(${config.css},.12)`);
      wash.addColorStop(1, "rgba(255,222,162,.14)");
      c.fillStyle = wash;
      c.fillRect(0, 0, 384, 384);
      for (let i = 0; i < 8; i++) {
        const base = 102 + i * 26,
          travel = (phase * 0.48 + i * 0.173) % 1,
          mid = 352 - travel * 240;
        c.beginPath();
        for (let y = mid - 52; y <= mid + 52; y += 4) {
          const x = base + Math.sin(y * 0.036 + phase * 2 + i) * 12;
          if (y === mid - 52) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        const g = c.createLinearGradient(0, mid - 52, 0, mid + 52);
        g.addColorStop(0, `rgba(${config.css},0)`);
        g.addColorStop(0.45, `rgba(${config.css},.82)`);
        g.addColorStop(0.6, "rgba(255,238,192,.88)");
        g.addColorStop(1, `rgba(${config.css},0)`);
        c.strokeStyle = g;
        c.lineWidth = 4;
        c.shadowColor = `rgb(${config.css})`;
        c.shadowBlur = 10;
        c.stroke();
        c.shadowBlur = 0;
      }
      for (let i = 0; i < 2; i++) {
        const y = 360 - ((phase * 0.55 + i * 0.5) % 1) * 245;
        c.beginPath();
        c.moveTo(90, y + 10);
        c.bezierCurveTo(150, y - 15, 220, y + 18, 298, y - 8);
        c.strokeStyle = `rgba(${config.css},.22)`;
        c.lineWidth = 14;
        c.stroke();
        c.strokeStyle = "rgba(255,239,196,.72)";
        c.lineWidth = 3;
        c.shadowColor = `rgb(${config.css})`;
        c.shadowBlur = 8;
        c.stroke();
        c.shadowBlur = 0;
      }
      c.globalCompositeOperation = "destination-in";
      c.drawImage(
        surface,
        pose.col * 384,
        pose.row * 384,
        384,
        384,
        0,
        0,
        384,
        384,
      );
      c.globalCompositeOperation = "source-over";
      s.tex.refresh();
      s.last = now;
      s.poseKey = poseKey;
    }
    s.flow.setAlpha(
      (0.82 + 0.18 * Math.max(0, 1 - (now - castAt) / 300)) * fade,
    );
    for (const g of [s.front, s.back])
      g.clear()
        .setPosition(a.x + body.x, a.y + body.y)
        .setScale(body.scaleX * (body.flipX ? -1 : 1), body.scaleY)
        .setAngle(body.angle);
    s.back.setDepth(a.root.depth + 0.006);
    s.front.setDepth(a.root.depth + 0.07);
    for (let i = 0; i < points.length; i++) {
      const p = (phase * 0.65 + i * 0.163) % 1,
        life = Math.sin(p * Math.PI),
        pt = points[i],
        x = pt[0] - 192 + Math.sin(phase * 3 + i) * 3,
        y = pt[1] - 352 - p * 17,
        g = i % 2 ? s.front : s.back;
      g.lineStyle(6, config.color, life * 0.18 * fade).lineBetween(
        x,
        y + 5,
        x + Math.sin(i + phase) * 3,
        y - 5,
      );
      g.lineStyle(
        2,
        i % 3 ? config.light : 0xffd89e,
        life * 0.8 * fade,
      ).lineBetween(x, y + 3, x + Math.sin(i + phase) * 2, y - 3);
    }
    s.flow.royalEnergyPose = poseKey;
    s.flow.royalEnergyUpdates = (s.flow.royalEnergyUpdates ?? 0) + 1;
  }
  window.__royalAttachedEnergy = {
    ready(look) {
      return (
        !!emitters.get(look) &&
        ["idle", "walk", "run1", "weapon", "axeheavy", "special"].every(
          (s) =>
            art.has(`${look}:${s}:surface`) && art.has(`${look}:${s}:contour`),
        )
      );
    },
    update(a) {
      if (a.id !== 1) return;
      const scene = a.root.scene;
      if (!scenes.has(scene)) {
        const targets = new Set(),
          cb = () => {
            for (const x of targets) {
              if (!x.root.active) {
                remove(x);
                targets.delete(x);
              } else draw(x);
            }
          };
        scenes.set(scene, targets);
        scene.events.on("postupdate", cb);
        scene.events.once("shutdown", () => {
          scene.events.off("postupdate", cb);
          for (const x of targets) remove(x);
          scenes.delete(scene);
        });
      }
      scenes.get(scene).add(a);
    },
    clear() {
      for (const a of actors.keys()) remove(a);
    },
  };
  window.addEventListener("royal-skill-scene-reset", () => {
    state = null;
    window.__royalAttachedEnergy.clear();
  });
})();
