import { adaptIdle } from "./png.mjs";
export function localAssets(byName, status) {
  const first = (name) => byName.get(name)?.[0]?.read();
  const sheets = new Map(),
    frames = {
      idle: 4,
      walk: 4,
      run1: 4,
      punch: 4,
      kick: 8,
      dodge: 6,
      weapon: 6,
      shoot1: 4,
      special: 6,
      axeheavy: 8,
    };
  const looks = JSON.parse(first("paperdoll-looks.json"));
  looks.entities["local-sombra"] = Object.keys(frames);
  looks.looks["local-sombra"] = { entity: "local-sombra" };
  const errors = JSON.parse(first("errors.json"));
  Object.assign(errors, {
    "errors.local.not_implemented":
      "Este recurso ainda não está implementado no servidor local de teste.",
    "errors.auth.invalid_credentials":
      "Neste teste local, entre com teste e a senha Teste123!. Nenhuma conta do site é usada.",
  });
  const messages = {
    invalid_hunt: "Caçada inválida. Escolha uma das arenas locais de teste.",
    level_required: "Você ainda não tem o nível necessário para esta caçada.",
    already_hunting: "Retorne à cidade antes de iniciar outra caçada.",
    invalid_target: "Selecione um monstro vivo ao alcance da habilidade.",
    not_hunting: "Entre em uma caçada para usar habilidades de combate.",
    invalid_skill: "Habilidade inválida para este personagem local.",
    cooldown: "A habilidade ainda está recarregando.",
    no_mana: "Mana insuficiente.",
    invalid_item:
      "Item indisponível ou operação inválida. Confira o espaço na mochila.",
    invalid_inventory: "Inventário inválido.",
    city_only: "Retorne à cidade para trocar equipamentos ou comprar poções.",
    potion_unavailable:
      "Poção indisponível: confira estoque, vida/mana e intervalo de uso.",
    no_gold: "Ouro insuficiente.",
    npc_range:
      "Aproxime-se do mercador ou do guardião do armazém para usar este serviço.",
  };
  for (const [key, value] of Object.entries(messages))
    errors["errors.local." + key] = value;
  return (pathname) => {
    if (pathname === "/assets/monsters/local-treino/anim.json")
      return {
        type: "application/json",
        bytes: Buffer.from(
          JSON.stringify({
            quadro: { w: 96, h: 112 },
            pivo: { x: 48, y: 100 },
            andar: { passada: 48 },
            estados: Object.fromEntries(
              ["idle", "attack", "death", "hurt"].map((name) => [
                name,
                {
                  folha: name + ".png",
                  frames: 4,
                  ms: 180,
                  loop: name === "idle",
                },
              ]),
            ),
          }),
        ),
      };
    if (
      /^\/assets\/monsters\/local-treino\/(walk|idle|attack|death|hurt)\.png$/.test(
        pathname,
      )
    )
      return { type: "image/png", bytes: first("idle-sombra.png") };
    if (pathname === "/data/gear-emanation-styles.json")
      return { type: "application/json", bytes: Buffer.from("{}") };
    if (pathname === "/assets/audio/musica/bosque-dos-cacadores.ogg")
      return { type: "audio/ogg", bytes: first("praca-de-seul.ogg") };
    if (pathname === "/data/paperdoll-looks.json")
      return {
        type: "application/json",
        bytes: Buffer.from(JSON.stringify(looks)),
      };
    if (pathname === "/locales/pt-BR/errors.json")
      return {
        type: "application/json",
        bytes: Buffer.from(JSON.stringify(errors)),
      };
    const match =
      /^\/assets\/paperdoll\/entities\/local-sombra\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (match && frames[match[1]]) {
      const count = frames[match[1]];
      if (!sheets.has(count))
        sheets.set(count, adaptIdle(first("idle-sombra.png"), count));
      return { type: "image/png", bytes: sheets.get(count) };
    }
    if (
      [
        "/assets/ui/v2/cacador.png",
        "/assets/ui/dock/cacador.png",
        "/assets/ui/dock/menu.png",
        "/assets/ui/passe-reino/menu.png",
      ].includes(pathname)
    ) {
      const basename = pathname.endsWith("cacador.png")
        ? "cacador.png"
        : "menu.png";
      const data = byName
        .get(basename)
        ?.find(
          (entry) =>
            entry.read().readUInt32BE(16) ===
            (pathname.includes("/dock/") ? 48 : 32),
        );
      if (data) return { type: "image/png", bytes: data.read() };
    }
    if (pathname === "/assets/ui/v2/pocao.png")
      return { type: "image/png", bytes: first("pocao-vida.png") };
    return null;
  };
}
