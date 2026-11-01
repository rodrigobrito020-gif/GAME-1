import { CHARACTER_ART as ART } from "/character-art.mjs";
const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d"),
  images = new Map();
const definitions = {
  warrior: ["idle", "walk", "run1", "weapon", "special", "axeheavy"],
  archer: ["idle", "walk", "run1", "weapon", "special"],
};
await Promise.all(
  Object.entries(definitions).flatMap(([cl, sheets]) =>
    sheets.map(async (sheet) => {
      const im = new Image();
      im.src = `/assets/fx/royal-${cl}/hd/base/${sheet}.png`;
      await im.decode();
      images.set(cl + ":" + sheet, im);
    }),
  ),
);
const rig = await (await fetch("/data/paperdoll.json")).json();
let action = "idle",
  direction = 0,
  start = performance.now();
function menu(id, values, choose) {
  const parent = document.querySelector("#" + id);
  for (const [key, name] of values) {
    const b = document.createElement("button");
    b.textContent = name;
    b.dataset.value = key;
    b.type = "button";
    b.onclick = () => {
      choose(key);
      for (const n of parent.children)
        n.setAttribute("aria-pressed", String(n === b));
      start = performance.now();
    };
    b.setAttribute(
      "aria-pressed",
      String(key === (id === "actions" ? "idle" : 0)),
    );
    parent.append(b);
  }
}
menu(
  "actions",
  [
    ["idle", "Repouso"],
    ["walk", "Caminhar"],
    ["attack", "Ataque"],
    ["area", "Habilidade em área"],
    ["buff", "Buff"],
    ["ultimate", "Ultimate"],
  ],
  (v) => (action = v),
);
menu(
  "directions",
  [
    [0, "Frente"],
    [1, "Esquerda"],
    [2, "Direita"],
    [3, "Costas"],
  ],
  (v) => (direction = Number(v)),
);
const moves = {
  warrior: {
    attack: "humano-espada",
    area: "humano-impacto-luz",
    buff: "humano-egide-luz",
    ultimate: "humano-avatar-luz",
  },
  archer: {
    attack: "elfa-flecha",
    area: "elfa-chuva",
    buff: "elfa-bencao",
    ultimate: "elfa-espirito",
  },
};
function render(now) {
  ctx.clearRect(0, 0, 960, 430);
  ctx.fillStyle = "#eee4cf";
  ctx.fillRect(0, 0, 960, 430);
  ctx.strokeStyle = "#c7b281";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(25, 370);
  ctx.lineTo(935, 370);
  ctx.stroke();
  ctx.strokeStyle = "#c7b28155";
  ctx.beginPath();
  ctx.moveTo(25, 146);
  ctx.lineTo(935, 146);
  ctx.stroke();
  const t = Math.max(0, now - start);
  for (const [cl, x] of [
    ["warrior", 240],
    ["archer", 720],
  ]) {
    let sheet = "idle",
      col = Math.floor(t / 400) % 4,
      lift = 0;
    const move = rig.moves[moves[cl][action]];
    if (action === "walk") {
      sheet = "walk";
      col = Math.floor(t / 125) % 4;
    } else if (move) {
      const total = move.frames.length * rig.stepMs,
        phase = t % (total + 700);
      if (phase < total) {
        const entry =
          move.frames[
            Math.min(move.frames.length - 1, Math.floor(phase / rig.stepMs))
          ];
        [sheet, col] = Array.isArray(entry) ? entry : [move.sheet, entry];
        if (
          action === "area" &&
          cl === "warrior" &&
          phase >= 100 &&
          phase < 550
        )
          lift = Math.sin(((phase - 100) / 450) * Math.PI) * 55;
      }
    }
    ctx.fillStyle = "#7d6a4033";
    ctx.beginPath();
    ctx.ellipse(x, 373, 35, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      images.get(cl + ":" + sheet),
      col * ART.frame,
      direction * ART.frame,
      ART.frame,
      ART.frame,
      x - ART.feet[0] * (4 / ART.nativeSampleStep),
      370 - ART.feet[1] * (4 / ART.nativeSampleStep) - lift,
      ART.frame * (4 / ART.nativeSampleStep),
      ART.frame * (4 / ART.nativeSampleStep),
    );
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
