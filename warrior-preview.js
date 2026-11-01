import { LIGHT_AEGIS } from "/defense-buff.mjs";
import { LIGHT_AFTERIMAGES } from "/light-afterimages.mjs";
import {
  WARRIOR_SHEETS,
  WARRIOR_ACTIONS,
  WARRIOR_LIGHT_DASH,
} from "/warrior.mjs";
const rig = await (await fetch("/data/paperdoll.json")).json();
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
const trainingImages = {};
await Promise.all(
  Object.keys(WARRIOR_SHEETS).map(async (name) => {
    trainingImages[name] = await image(
      `/assets/paperdoll/entities/humano-guerreiro-peitoral-treino/${name}.png`,
    );
  }),
);
let trainingArmor = false;
const slamFx = await image(
  "/assets/fx/royal-warrior/guerreiro-impacto-luz.png",
);
const aegisCast = await image(
  "/assets/fx/royal-warrior/guerreiro-egide-ativacao.png",
);
const aegisAura = await image(
  "/assets/fx/royal-warrior/guerreiro-egide-aura.png",
);
const previewSkills = ["avanco-de-luz", "impacto-de-luz", "egide-de-luz"];
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

  let sheet = action,
    col = 0,
    phase = elapsed,
    total = 0,
    lift = 0,
    offset = 0,
    offsetY = 0;
  const move = rig.moves[WARRIOR_ACTIONS[action]?.move ?? action];
  if (action === "death") {
    sheet = "special";
    col = 5;
  } else if (move) {
    total = move.frames.length * rig.stepMs;
    const index = previewSkills.indexOf(action);
    const tail =
      action === "egide-de-luz"
        ? LIGHT_AEGIS.applyAtMs + LIGHT_AEGIS.durationMs + 800
        : action === "impacto-de-luz"
          ? 2000
          : index < 0
            ? 0
            : total + LIGHT_AFTERIMAGES.lifetimeMs;
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
  if (action === WARRIOR_LIGHT_DASH.id) {
    const progress = Math.max(
      0,
      Math.min(
        1,
        (phase - WARRIOR_LIGHT_DASH.start) /
          (WARRIOR_LIGHT_DASH.end - WARRIOR_LIGHT_DASH.start),
      ),
    );
    const axis = [
      [0, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
    ][direction];
    offset = axis[0] * (progress - 0.5) * 130;
    offsetY = axis[1] * (progress - 0.5) * 100;
  }
  ctx.fillStyle = "#60513828";
  ctx.beginPath();
  ctx.ellipse(300 + offset, 332 + offsetY, 68, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (action === "impacto-de-luz" && phase < 2000) {
    const frame = Math.min(31, Math.floor((phase * 16) / 1000));
    ctx.drawImage(
      slamFx,
      frame * 128,
      0,
      128,
      128,
      100,
      332 - 400 * 0.72,
      400,
      400,
    );
  }
  canvas.dataset.lift = String(lift);
  canvas.dataset.phase = String(phase);
  if (action === "egide-de-luz") {
    if (
      phase >= LIGHT_AEGIS.applyAtMs &&
      phase < LIGHT_AEGIS.applyAtMs + LIGHT_AEGIS.durationMs
    ) {
      const frame = Math.floor(((phase - 300) * 16) / 1000) % 32;
      ctx.drawImage(
        aegisAura,
        frame * 128,
        0,
        128,
        128,
        150,
        332 - 300 * 0.72,
        300,
        300,
      );
    }
  }
  let afterimages = 0;
  if (action === WARRIOR_LIGHT_DASH.id) {
    const axis = [
      [0, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
    ][direction];
    const stamps = [];
    for (
      let stamp = WARRIOR_LIGHT_DASH.start + LIGHT_AFTERIMAGES.intervalMs;
      stamp <= Math.min(phase, WARRIOR_LIGHT_DASH.end);
      stamp += LIGHT_AFTERIMAGES.intervalMs
    )
      if (phase - stamp < LIGHT_AFTERIMAGES.lifetimeMs) stamps.push(stamp);
    for (const stamp of stamps.slice(-LIGHT_AFTERIMAGES.maxVisible)) {
      const progress = Math.min(
        1,
        (stamp - WARRIOR_LIGHT_DASH.start) /
          (WARRIOR_LIGHT_DASH.end - WARRIOR_LIGHT_DASH.start),
      );
      const entry =
        move.frames[
          Math.min(move.frames.length - 1, Math.floor(stamp / rig.stepMs))
        ];
      const [pastSheet, pastCol] = Array.isArray(entry)
        ? entry
        : [move.sheet, entry];
      ctx.save();
      ctx.globalAlpha =
        LIGHT_AFTERIMAGES.opacity *
        Math.pow(1 - (phase - stamp) / LIGHT_AFTERIMAGES.lifetimeMs, 1.25);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        (trainingArmor ? trainingImages : images)[pastSheet],
        pastCol * 64,
        direction * 64,
        64,
        64,
        172 + axis[0] * (progress - 0.5) * 130,
        92 + axis[1] * (progress - 0.5) * 100,
        256,
        256,
      );
      ctx.restore();
      afterimages++;
    }
  }
  canvas.dataset.afterimages = String(afterimages);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    (trainingArmor ? trainingImages : images)[sheet],
    col * 64,
    direction * 64,
    64,
    64,
    172 + offset,
    92 + offsetY - lift,
    256,
    256,
  );
  if (action === "egide-de-luz" && phase < 1600) {
    const frame = Math.min(31, Math.floor((phase * 20) / 1000));
    ctx.drawImage(
      aegisCast,
      frame * 128,
      0,
      128,
      128,
      152,
      332 - 296 * 0.82,
      296,
      296,
    );
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
document.querySelector("#armor").onchange = (event) => {
  trainingArmor = event.target.value === "training";
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
