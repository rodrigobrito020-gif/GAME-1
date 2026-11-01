// Original SVG flipbooks: effects are separate from the character artwork.
const kinds = {
  "faisca-lamina": "spark",
  "golpe-basico": "spark",
  "poeira-passo": "dust",
  "guerreiro-corte-crescente": "slash",
  "guerreiro-faisca-dourada": "spark",
  "guerreiro-investida-rastro": "rush",
  "guerreiro-atordoar": "spark",
  "guerreiro-destruidor-fenda": "crack",
  "guerreiro-destruidor-pilar": "pillar",
  "guerreiro-furia-explosao": "burst",
  "guerreiro-furia-aura": "aura",
  "guerreiro-furia-brasas": "embers",
};
export function warriorEffects(original) {
  const effects = structuredClone(original);
  for (const [id, kind] of Object.entries(kinds)) {
    effects.efeitos[id] = {
      folha: `/assets/fx/royal-warrior/${id}.svg`,
      quadro: [128, 128],
      frames: 16,
      fps: kind === "aura" ? 16 : 24,
      pivo: [0.5, 0.75],
      camada: ["crack", "dust", "rush"].includes(kind)
        ? "chao"
        : kind === "aura"
          ? "atras"
          : "frente",
      alturaTela: kind === "pillar" ? 180 : 128,
      ...(kind === "aura" ? { loop: true } : {}),
      ...(["slash", "rush"].includes(kind)
        ? { orientacao: "direita", espelharAoVirar: true }
        : {}),
      ...(kind === "dust" ? { decorativo: true } : {}),
    };
  }
  return effects;
}
export function warriorFx(id) {
  const kind = kinds[id];
  if (!kind) return null;
  const frames = [];
  for (let i = 0; i < 16; i++) {
    const t = i / 15,
      fade = Math.sin(Math.PI * t),
      radius = 8 + 48 * t;
    let art = "";
    if (kind === "slash") {
      const angle = -100 + t * 180;
      art = `<g transform="rotate(${angle} 64 80)"><path d="M27 101 Q18 29 109 31 Q44 47 41 99Z" fill="#fff6d4"/><path d="M27 101 Q18 29 109 31" stroke="#e7b94f" stroke-width="4" fill="none"/></g>`;
    } else if (kind === "rush") {
      for (let n = 0; n < 5; n++)
        art += `<path d="M${5 + n * 7} ${78 + n * 6} Q60 ${66 + n * 6} 120 ${80 + n * 5}" fill="none" stroke="${n % 2 ? "#ffd36c" : "#ecf6ff"}" stroke-width="${5 - n * 0.6}"/>`;
    } else if (kind === "crack") {
      art = `<ellipse cx="64" cy="96" rx="${radius}" ry="${radius * 0.4}" fill="none" stroke="#ffd875" stroke-width="3"/>`;
      for (let n = 0; n < 8; n++)
        art += `<path d="M64 96 l${Math.cos((n * Math.PI) / 4) * radius} ${Math.sin((n * Math.PI) / 4) * radius * 0.45} l-7 2 4 4" stroke="#d4a245" stroke-width="2" fill="none"/>`;
    } else if (kind === "pillar") {
      art = `<ellipse cx="64" cy="96" rx="${radius * 0.6}" ry="10" fill="#ffe8ab"/><path d="M${64 - 22 * fade} 96 Q62 54 ${64 - 10 * fade} ${96 - 80 * fade} Q70 55 ${64 + 22 * fade} 96Z" fill="#fff5d5"/><path d="M64 100V${96 - 88 * fade}" stroke="#e8b74f" stroke-width="4"/>`;
    } else if (kind === "aura" || kind === "burst") {
      const r = kind === "aura" ? 36 + Math.sin(t * Math.PI * 2) * 3 : radius;
      art = `<ellipse cx="64" cy="96" rx="${r}" ry="${r * 0.35}" fill="none" stroke="#f4cc69" stroke-width="3"/><ellipse cx="64" cy="96" rx="${r * 0.8}" ry="${r * 0.28}" fill="none" stroke="#fff4c9"/>`;
      for (let n = 0; n < 8; n++) {
        const x = 64 + Math.cos((n * Math.PI) / 4) * r;
        art += `<path d="M${x} 92 l-2 ${-18 - 22 * ((t + n / 8) % 1)} 4 0Z" fill="#ffe7a5"/>`;
      }
    } else if (kind === "dust") {
      for (let n = 0; n < 6; n++)
        art += `<circle cx="${64 + Math.cos(n) * radius}" cy="${100 + Math.sin(n) * radius * 0.25}" r="${3 + t * 5}" fill="#e6d6b2"/>`;
    } else {
      for (let n = 0; n < 10; n++) {
        const a = (n * Math.PI) / 5 + 0.2,
          r = kind === "embers" ? 20 + t * 22 : radius * 0.8;
        const x = 64 + Math.cos(a) * r,
          y = 77 + Math.sin(a) * r - (kind === "embers" ? t * 35 : 0);
        art += `<path d="M${x} ${y - 4} l2 4 -2 4 -2 -4Z" fill="${n % 2 ? "#fff9df" : "#eec15d"}"/>`;
      }
    }
    frames.push(
      `<g transform="translate(${i * 128} 0)" opacity="${kind === "aura" ? 0.75 : fade.toFixed(3)}">${art}</g>`,
    );
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="128" viewBox="0 0 2048 128">${frames.join("")}</svg>`,
  );
}
export function warriorIcon(id) {
  const shapes = {
    "corte-poderoso":
      '<path d="M15 35 35 12 38 16 19 38Z" fill="#fff4d2"/><path d="m12 29 11 11M12 40l5-5" stroke="#e4b355" stroke-width="4"/>',
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
