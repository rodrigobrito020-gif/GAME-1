import { WARRIOR_SHEETS, WARRIOR_ACTIONS } from "/warrior.mjs";
const rig = await (await fetch("/data/paperdoll.json")).json();
const effects = await (await fetch("/data/effects.json")).json();
const images = {};
async function image(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}
await Promise.all(
  Object.keys(WARRIOR_SHEETS).map(async (name) => {
    images[name] = await image(
      `/assets/paperdoll/entities/humano-guerreiro/${name}.png`,
    );
  }),
);
const fxNames = [
  "guerreiro-corte-crescente",
  "guerreiro-investida-rastro",
  "guerreiro-destruidor-fenda",
  "guerreiro-furia-explosao",
];
const fx = await Promise.all(
  fxNames.map(async (id) => ({
    image: await image(effects.efeitos[id].folha),
    def: effects.efeitos[id],
  })),
);
const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");
const readout = document.querySelector("output"),
  pause = document.querySelector("#pause");
let direction = 0,
  action = "idle",
  elapsed = 0,
  paused = false,
  speed = 1,
  last = performance.now();
function render() {
  ctx.fillStyle = "#e9dfc9";
  ctx.fillRect(0, 0, 600, 420);
  ctx.strokeStyle = "#d5c5a2";
  ctx.lineWidth = 1;
  for (let y = 200; y < 460; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
    for (let x = y % 80 ? 0 : 40; x < 660; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 40);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#60513828";
  ctx.beginPath();
  ctx.ellipse(300, 332, 68, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  let sheet = action,
    col = 0,
    phase = elapsed,
    total = 0,
    lift = 0,
    offset = 0;
  const move = rig.moves[WARRIOR_ACTIONS[action]?.move ?? action];
  if (action === "death") {
    sheet = "special";
    col = 5;
  } else if (move) {
    total = move.frames.length * rig.stepMs;
    const index = Object.keys(WARRIOR_ACTIONS).indexOf(action);
    const tail =
      index < 0 ? 0 : (fx[index].def.frames / fx[index].def.fps) * 1000;
    phase = elapsed % (Math.max(total, tail) + 350);
    const entry =
      move.frames[
        Math.min(move.frames.length - 1, Math.floor(phase / rig.stepMs))
      ];
    [sheet, col] = Array.isArray(entry) ? entry : [move.sheet, entry];
    if (phase > total) {
      sheet = "idle";
      col = 0;
    }
    const jump = move.motion?.jump;
    if (jump && phase >= jump.at[0] && phase <= jump.at[1])
      lift =
        Math.sin(((phase - jump.at[0]) / (jump.at[1] - jump.at[0])) * Math.PI) *
        jump.height *
        2;
    const dash = move.motion?.dash;
    if (dash && phase >= dash.at[0] && phase <= dash.at[1])
      offset =
        Math.sin(((phase - dash.at[0]) / (dash.at[1] - dash.at[0])) * Math.PI) *
        45;
  } else
    col =
      Math.floor(
        elapsed /
          (1000 /
            (action === "idle"
              ? rig.loops.idle.fps
              : action === "walk"
                ? rig.loops.walk.fps
                : rig.loops.run.fps)),
      ) % 4;
  const n = Object.keys(WARRIOR_ACTIONS).indexOf(action);
  const effect = n >= 0 ? fx[n] : null;
  const drawEffect = () => {
    if (!effect || phase >= (effect.def.frames / effect.def.fps) * 1000) return;
    const def = effect.def,
      f = Math.floor((phase * def.fps) / 1000);
    const size = def.alturaTela * 1.35;
    ctx.save();
    ctx.translate(
      300 + offset,
      def.camada === "chao" || def.camada === "atras" ? 332 : 268,
    );
    if (def.orientacao === "direita")
      ctx.rotate([Math.PI / 2, Math.PI, 0, -Math.PI / 2][direction]);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      effect.image,
      f * 128,
      0,
      128,
      128,
      -size * def.pivo[0],
      -size * def.pivo[1],
      size,
      size,
    );
    ctx.restore();
  };
  if (effect?.def.camada !== "frente") drawEffect();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    images[sheet],
    col * 64,
    direction * 64,
    64,
    64,
    172 + offset,
    92 - lift,
    256,
    256,
  );
  if (effect?.def.camada === "frente") drawEffect();
  readout.textContent = `${["Frente", "Esquerda", "Direita", "Costas"][direction]} · ${sheet} · quadro ${col + 1} / ${WARRIOR_SHEETS[sheet]}`;
  canvas.dataset.sheet = sheet;
  canvas.dataset.frame = String(col);
  canvas.dataset.direction = String(direction);
}
document.querySelectorAll("[data-direction]").forEach(
  (button) =>
    (button.onclick = () => {
      direction = Number(button.dataset.direction);
      document
        .querySelectorAll("[data-direction]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      render();
    }),
);
document.querySelectorAll("[data-action]").forEach(
  (button) =>
    (button.onclick = () => {
      action = button.dataset.action;
      elapsed = 0;
      document
        .querySelectorAll("[data-action]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      render();
    }),
);
pause.onclick = () => {
  paused = !paused;
  pause.textContent = paused ? "Continuar" : "Pausar";
};
document.querySelector("#step").onclick = () => {
  paused = true;
  pause.textContent = "Continuar";
  elapsed += rig.stepMs;
  render();
};
document.querySelector("#speed").onchange = (event) => {
  speed = Number(event.target.value);
};
function tick(now) {
  if (!paused) elapsed += Math.min(100, now - last) * speed;
  last = now;
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
