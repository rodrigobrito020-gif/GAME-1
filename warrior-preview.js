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
  fxNames.map((id) => image(effects.efeitos[id].folha)),
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
    phase = elapsed % (total + 300);
    const entry =
      move.frames[
        Math.min(move.frames.length - 1, Math.floor(phase / rig.stepMs))
      ];
    [sheet, col] = Array.isArray(entry) ? entry : [move.sheet, entry];
    if (action === "golpe-destruidor" && phase >= 150 && phase <= 600)
      lift = Math.sin(((phase - 150) / 450) * Math.PI) * 50;
    if (action === "investida" && phase >= 100 && phase <= 400)
      offset = Math.sin(((phase - 100) / 300) * Math.PI) * 45;
  } else
    col =
      Math.floor(
        elapsed / (action === "idle" ? 333 : action === "walk" ? 125 : 83.33),
      ) % 4;
  const n = Object.keys(WARRIOR_ACTIONS).indexOf(action);
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
  if (
    n >= 0 &&
    phase >= WARRIOR_ACTIONS[action].impact - 100 &&
    phase <= WARRIOR_ACTIONS[action].impact + 480
  ) {
    const f = Math.min(
      15,
      Math.floor((phase - WARRIOR_ACTIONS[action].impact + 100) / 40),
    );
    ctx.drawImage(fx[n], f * 128, 0, 128, 128, 172, 140, 256, 256);
  }
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
