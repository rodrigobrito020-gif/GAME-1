// Painted skill flipbooks and small SVG particles for the basic sword/footstep.
import { vfxDefinition, WARRIOR_VFX } from "./warrior-vfx.mjs";
const particles = {
  "faisca-lamina": "spark",
  "golpe-basico": "spark",
  "poeira-passo": "dust",
};
export function warriorEffects(original) {
  const effects = structuredClone(original);
  effects.habilidades["egide-de-luz"] = {
    aura: {
      ativa: "guerreiro-egide-ativacao",
      loop: "guerreiro-egide-aura",
      fim: "guerreiro-egide-fim",
    },
  };
  effects.habilidades["impacto-de-luz"] = {
    indicador: "guerreiro-impacto-luz",
  };
  effects.habilidades["avanco-de-luz"] = {
    impacto: "guerreiro-avanco-impacto",
  };
  for (const id of Object.keys(WARRIOR_VFX))
    effects.efeitos[id] = vfxDefinition(id);
  for (const [id, kind] of Object.entries(particles))
    effects.efeitos[id] = {
      folha: `/assets/fx/royal-warrior/${id}.svg`,
      quadro: [128, 128],
      frames: 16,
      fps: 24,
      pivo: [0.5, 0.75],
      camada: kind === "dust" ? "chao" : "frente",
      alturaTela: 128,
      ...(kind === "dust" ? { decorativo: true } : {}),
    };
  return effects;
}
export function warriorFx(id) {
  const kind = particles[id];
  if (!kind) return null;
  const frames = [];
  for (let i = 0; i < 16; i++) {
    const t = i / 15,
      fade = Math.sin(Math.PI * t),
      radius = 8 + 48 * t;
    let art = "";
    if (kind === "dust") {
      for (let n = 0; n < 6; n++)
        art += `<circle cx="${64 + Math.cos(n) * radius}" cy="${100 + Math.sin(n) * radius * 0.25}" r="${3 + t * 5}" fill="#e6d6b2"/>`;
    } else {
      for (let n = 0; n < 10; n++) {
        const a = (n * Math.PI) / 5 + 0.2,
          r = radius * 0.8;
        const x = 64 + Math.cos(a) * r,
          y = 77 + Math.sin(a) * r;
        art += `<path d="M${x} ${y - 4} l2 4 -2 4 -2 -4Z" fill="${n % 2 ? "#fff9df" : "#eec15d"}"/>`;
      }
    }
    frames.push(
      `<g transform="translate(${i * 128} 0)" opacity="${fade.toFixed(3)}">${art}</g>`,
    );
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="128" viewBox="0 0 2048 128">${frames.join("")}</svg>`,
  );
}
export function warriorIcon(id) {
  const shapes = {
    "egide-de-luz":
      '<path d="m24 6 15 6-2 16-13 14-13-14-2-16Z" fill="#fff5d8" stroke="#e4b355" stroke-width="2"/><path d="m24 14 3 7 7 3-7 3-3 8-3-8-7-3 7-3Z" fill="#c18c35"/>',
    "impacto-de-luz":
      '<path d="M21 7h6v24l-3 6-3-6Z" fill="#fff4cf"/><path d="M16 15h16M24 4v7" stroke="#e4b355" stroke-width="3"/><path d="m7 37 9-3-3 8m28-5-9-3 3 8M18 41l6-4 6 4" fill="none" stroke="#ffda71" stroke-width="2"/>',
    "avanco-de-luz":
      '<path d="M8 22h23l-7-8 7-2 13 14-14 12-6-3 8-8H8Z" fill="#fff4cf"/><path d="M4 15h13M2 32h12" stroke="#e4b355" stroke-width="3"/><path d="m17 5 2 4 4 1-4 2-2 4-1-4-4-2 4-1Z" fill="#ffda71"/>',
    investida:
      '<path d="m9 15 15 9-15 9m13-18 15 9-15 9" fill="none" stroke="#fff0be" stroke-width="5"/>',
    "golpe-destruidor":
      '<path d="M23 8h6v22l8 4-10 6-17-7 13-4Z" fill="#fff4d2"/><path d="m8 41 8-3 4 6m20-5-5-1 4-5" fill="none" stroke="#e4b355" stroke-width="2"/>',
    "furia-guerreiro":
      '<path d="m24 7 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="#ffe6a0"/><circle cx="24" cy="24" r="6" fill="#fff9e8"/>',
  };
  if (!shapes[id]) return null;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="1" y="1" width="46" height="46" rx="8" fill="#433824" stroke="#c7a45c" stroke-width="2"/>${shapes[id]}</svg>`,
  );
}
