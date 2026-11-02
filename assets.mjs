import {
  GUNSLINGER_SKIN,
  GUNSLINGER_SHEETS,
  gunslingerRig,
} from "./gunslinger.mjs";
import { ARCHER_SKIN, ARCHER_SHEETS, archerRig } from "./archer.mjs";
import { adaptIdle } from "./png.mjs";
import { readFileSync } from "node:fs";
import { WARRIOR_SKIN, WARRIOR_SHEETS, warriorRig } from "./warrior.mjs";
import { warriorEffects, warriorFx, warriorIcon } from "./warrior-fx.mjs";
import { TRAINING_ARMOR_LOOK } from "./equipment-look.mjs";
import { WARRIOR_VFX } from "./warrior-vfx.mjs";
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
  looks.entities[WARRIOR_SKIN] = Object.keys(WARRIOR_SHEETS);
  looks.looks[WARRIOR_SKIN] = { entity: WARRIOR_SKIN };
  looks.entities[TRAINING_ARMOR_LOOK] = Object.keys(WARRIOR_SHEETS);
  looks.looks[TRAINING_ARMOR_LOOK] = { entity: TRAINING_ARMOR_LOOK };
  looks.entities[ARCHER_SKIN] = Object.keys(ARCHER_SHEETS);
  looks.looks[ARCHER_SKIN] = { entity: ARCHER_SKIN };
  looks.entities[GUNSLINGER_SKIN] = Object.keys(GUNSLINGER_SHEETS);
  looks.looks[GUNSLINGER_SKIN] = { entity: GUNSLINGER_SKIN };
  const errors = JSON.parse(first("errors.json"));
  Object.assign(errors, {
    "errors.local.not_implemented":
      "Este recurso ainda não está implementado no servidor local de teste.",
    "errors.auth.invalid_credentials":
      "Neste teste local, entre com teste e a senha Teste123!. Nenhuma conta do site é usada.",
  });
  const messages = {
    invalid_hunt: "Caçada inválida. Escolha uma das arenas locais de teste.",
    level_required:
      "Você ainda não tem o nível necessário para usar esse recurso.",
    already_hunting: "Retorne à cidade antes de iniciar outra caçada.",
    invalid_target: "Selecione um monstro vivo ao alcance da habilidade.",
    ultimate_energy:
      "A ultimate precisa de 100 de energia. Carregue a barra em combate.",
    buff_active: "Essa transformação ou proteção já está ativa.",
    target_too_close:
      "Alvo muito próximo. Use o Avanço de Luz para alcançar inimigos distantes.",
    not_hunting: "Entre em uma caçada para usar habilidades de combate.",
    invalid_skill: "Habilidade inválida para este personagem local.",
    cooldown: "A habilidade ainda está recarregando.",
    no_mana: "Mana insuficiente.",
    invalid_item:
      "Item indisponível ou operação inválida. Confira o espaço na mochila.",
    invalid_inventory: "Inventário inválido.",
    city_only:
      "Retorne à cidade para trocar de classe, trocar equipamentos ou comprar poções.",
    potion_unavailable:
      "Poção indisponível: confira estoque, vida/mana e intervalo de uso.",
    no_gold: "Ouro insuficiente.",
    npc_range:
      "Aproxime-se do mercador ou do guardião do armazém para usar este serviço.",
  };
  for (const [key, value] of Object.entries(messages))
    errors["errors.local." + key] = value;
  return (pathname) => {
    const energy =
      /^\/assets\/fx\/royal-energy\/(archer|gunslinger)\/(emitters\.json|(?:idle|walk|run1|weapon|axeheavy|special)-(?:surface|contour)\.png)$/.exec(
        pathname,
      );
    if (energy)
      return {
        type: energy[2].endsWith(".json") ? "application/json" : "image/png",
        bytes: readFileSync(
          new URL(`./art/energy/${energy[1]}/${energy[2]}`, import.meta.url),
        ),
      };
    const gun =
        /^\/assets\/paperdoll\/entities\/dark-elf-pistoleira\/([a-z0-9]+)\.png$/.exec(
          pathname,
        ),
      gunHd =
        /^\/assets\/fx\/royal-gunslinger\/hd\/base\/([a-z0-9]+)\.png$/.exec(
          pathname,
        ),
      gunIcon =
        /^\/assets\/ui\/royal-gunslinger\/(dash|disparo-sombrio|rajada-do-crepusculo|instinto-noturno|eclipse)\.png$/.exec(
          pathname,
        ),
      gunMask =
        /^\/assets\/fx\/royal-gunslinger\/eclipse-weapons\/(idle|walk|run1|weapon|special|axeheavy)\.png$/.exec(
          pathname,
        ),
      gunFx =
        /^\/assets\/fx\/royal-gunslinger\/(bullet|muzzle|impact|aura|power|powerimpact|volley|orbit|firebullet|burn|eclipse|shotflash|tracer|soulshot|casing)\.png$/.exec(
          pathname,
        );
    const ownGun =
      gun && GUNSLINGER_SHEETS[gun[1]]
        ? `${gun[1]}.png`
        : gunHd && GUNSLINGER_SHEETS[gunHd[1]]
          ? `hd/${gunHd[1]}.png`
          : gunIcon
            ? `icons/${gunIcon[1]}.png`
            : gunMask
              ? `eclipse-weapons/${gunMask[1]}.png`
              : gunFx
                ? `vfx/${gunFx[1]}.png`
                : null;
    if (ownGun)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/gunslinger/${ownGun}`, import.meta.url),
        ),
      };
    const elfSheet =
      /^\/assets\/paperdoll\/entities\/elfa-arqueira\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (elfSheet && ARCHER_SHEETS[elfSheet[1]])
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/archer/${elfSheet[1]}.png`, import.meta.url),
        ),
      };
    const elfHd =
      /^\/assets\/fx\/royal-archer\/hd\/base\/([a-z0-9]+)\.png$/.exec(pathname);
    if (elfHd && ARCHER_SHEETS[elfHd[1]])
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/archer/hd/${elfHd[1]}.png`, import.meta.url),
        ),
      };
    const elfIcon =
      /^\/assets\/ui\/royal-archer\/(dash|tiro-perfurante|chuva-de-flechas|olhos-da-floresta|espirito-da-floresta)\.png$/.exec(
        pathname,
      );
    if (elfIcon)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/archer/icons/${elfIcon[1]}.png`, import.meta.url),
        ),
      };
    const elfFx =
      /^\/assets\/fx\/royal-archer\/(aura|ring|spirit|arrow|impact)\.png$/.exec(
        pathname,
      );
    if (elfFx)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/archer/vfx/${elfFx[1]}.png`, import.meta.url),
        ),
      };
    const potion = /^\/assets\/ui\/royal-potions\/(hp|mana)-([123])\.png$/.exec(
      pathname,
    );
    if (potion)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(
            `./art/potions/icons/${potion[1]}-${potion[2]}.png`,
            import.meta.url,
          ),
        ),
      };
    const classPortrait =
      /^\/assets\/ui\/royal-classes\/(warrior|archer|gunslinger)\.png$/.exec(
        pathname,
      );
    if (classPortrait)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(
            classPortrait[1] === "gunslinger"
              ? "./art/gunslinger/portrait.png"
              : classPortrait[1] === "archer"
                ? "./art/archer/portrait.png"
                : "./art/classes/warrior.png",
            import.meta.url,
          ),
        ),
      };
    const hd =
      /^\/assets\/fx\/royal-warrior\/hd\/(base|training)\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (hd && WARRIOR_SHEETS[hd[2]])
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(
            `./art/warrior/hd/${hd[1] === "training" ? "training/" : ""}${hd[2]}.png`,
            import.meta.url,
          ),
        ),
      };
    const skillIcon =
      /^\/assets\/ui\/royal-warrior\/(avanco-de-luz|impacto-de-luz|egide-de-luz|avatar-da-luz|dash)-card\.png$/.exec(
        pathname,
      );
    if (skillIcon)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(`./art/warrior/icons/${skillIcon[1]}.png`, import.meta.url),
        ),
      };
    const hdWeaponMask =
      /^\/assets\/fx\/royal-warrior\/avatar-weapons-hd\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (hdWeaponMask && WARRIOR_SHEETS[hdWeaponMask[1]])
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(
            `./art/warrior/hd/${hdWeaponMask[1]}-mask.png`,
            import.meta.url,
          ),
        ),
      };
    const weaponMask =
      /^\/assets\/fx\/royal-warrior\/avatar-weapons\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (weaponMask && WARRIOR_SHEETS[weaponMask[1]])
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL(
            `./art/warrior/weapon-masks/${weaponMask[1]}.png`,
            import.meta.url,
          ),
        ),
      };
    const ownAvatar = {
      "/assets/ui/royal-warrior/avatar-da-luz.png": "avatar-da-luz.png",
      "/assets/fx/royal-warrior/guerreiro-avatar-aura.png":
        "vfx/guerreiro-avatar-aura.png",
      "/assets/fx/royal-warrior/guerreiro-avatar-ativacao.png":
        "vfx/guerreiro-avatar-ativacao.png",
    }[pathname];
    if (ownAvatar)
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL("./art/warrior/" + ownAvatar, import.meta.url),
        ),
      };

    if (
      pathname === "/data/paperdoll.json" ||
      pathname === "/data/effects.json"
    ) {
      const name = pathname.split("/").at(-1),
        original = first(name);
      if (!original) return null;
      return {
        type: "application/json",
        bytes: Buffer.from(
          JSON.stringify(
            name === "paperdoll.json"
              ? gunslingerRig(archerRig(warriorRig(JSON.parse(original))))
              : warriorEffects(JSON.parse(original)),
          ),
        ),
      };
    }
    const hero =
      /^\/assets\/paperdoll\/entities\/(humano-guerreiro(?:-peitoral-treino)?)\/([a-z0-9]+)\.png$/.exec(
        pathname,
      );
    if (hero && WARRIOR_SHEETS[hero[2]]) {
      const key = hero[1] + "/" + hero[2];
      if (!sheets.has(key))
        sheets.set(
          key,
          readFileSync(
            new URL(
              `./art/warrior/${hero[1] === TRAINING_ARMOR_LOOK ? "training/" : ""}${hero[2]}.png`,
              import.meta.url,
            ),
          ),
        );
      return { type: "image/png", bytes: sheets.get(key) };
    }
    const effect = /^\/assets\/fx\/royal-warrior\/([a-z-]+)\.svg$/.exec(
      pathname,
    );
    const painted = /^\/assets\/fx\/royal-warrior\/([a-z-]+)\.png$/.exec(
      pathname,
    );
    if (painted && WARRIOR_VFX[painted[1]]) {
      if (!sheets.has(pathname))
        sheets.set(
          pathname,
          readFileSync(
            new URL(`./art/warrior/vfx/${painted[1]}.png`, import.meta.url),
          ),
        );
      return { type: "image/png", bytes: sheets.get(pathname) };
    }
    if (pathname === "/assets/ui/royal-warrior/peitoral-treino.png")
      return {
        type: "image/png",
        bytes: readFileSync(
          new URL("./art/warrior/training-cuirass-icon.png", import.meta.url),
        ),
      };
    const icon = /^\/assets\/ui\/royal-warrior\/([a-z-]+)\.svg$/.exec(pathname);
    if (effect || icon) {
      const key = pathname;
      if (!sheets.has(key))
        sheets.set(key, effect ? warriorFx(effect[1]) : warriorIcon(icon[1]));
      if (sheets.get(key))
        return { type: "image/svg+xml", bytes: sheets.get(key) };
    }
    if (pathname === "/assets/monsters/local-treino/anim.json")
      return {
        type: "application/json",
        bytes: Buffer.from(
          JSON.stringify({
            quadro: { w: 96, h: 112 },
            // Phaser origins are normalized to the frame, not pixel offsets.
            // Pixel values placed the artwork thousands of pixels off-screen.
            pivo: { x: 0.5, y: 100 / 112 },
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
