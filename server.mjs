import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readZip } from "./zip-reader.mjs";
import { attachLocalGame } from "./local-game.mjs";
import { withDefenseBuffUi } from "./client-defense-buff.mjs";
import { withLightAfterimages } from "./client-afterimages.mjs";
import { localAssets } from "./assets.mjs";
import { createMedievalCity } from "./medieval-city.mjs";
import { createRoyalHunt } from "./royal-hunt.mjs";
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CAPTURE_PORT ?? 5188);
const version = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).version;
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error("Porta inválida.");
const candidates = [
  process.argv[2],
  path.join(root, "recursos-publicos.zip"),
  path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? root,
    "Downloads",
    "recursos-publicos.zip",
  ),
].filter(Boolean);
const source = candidates.find((file) => existsSync(file));
if (!source) {
  console.error(
    "Coloque recursos-publicos.zip nesta pasta ou em Downloads. Nenhum jogo foi alterado.",
  );
  process.exit(1);
}
const entries = readZip(readFileSync(source)),
  byName = new Map(),
  cached = new Map();
for (const [name, read] of entries) {
  const basename = path.posix.basename(name).replace(/^\d+_/, "");
  const list = byName.get(basename) ?? [];
  list.push({ name, read });
  byName.set(basename, list);
}
const required = [
  "main-Du8N-0Wf.js",
  "overlays-CiSZXpkZ.js",
  "rolldown-runtime-C_s2cVnS.js",
  "preload-helper-BZ1Pz5am.js",
  "main-CfDhE7HM.css",
  "overlays-BfDeQoSF.css",
];
for (const name of required)
  if (byName.get(name)?.length !== 1)
    throw Error(
      `Build ausente ou ambíguo: ${name}. Este iniciador é para o ZIP enviado em 30/10/2026.`,
    );
// Validate once at startup, before exposing a client whose adapter cannot run.
const adaptedClient = withDefenseBuffUi(
  withLightAfterimages(byName.get("main-Du8N-0Wf.js")[0].read()),
);
const status = {
  mode: "captured-client-only",
  version,
  originalBackend: false,
  ownGameLoaded: false,
  files: entries.size,
  served: [],
  missing: [],
  websocketAttempts: 0,
  apiAttempts: 0,
};
const medievalCity = createMedievalCity();
const royalHunt = createRoyalHunt();
const asset = localAssets(byName, status);
const remember = (list, value) => {
  if (!list.includes(value)) {
    list.push(value);
    if (list.length > 100) list.shift();
  }
};
const types = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ogg": "audio/ogg",
  ".woff2": "font/woff2",
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Praça da Coroa — RPG local</title><link rel="stylesheet" href="/assets/overlays-BfDeQoSF.css"><link rel="stylesheet" href="/assets/main-CfDhE7HM.css"><link rel="stylesheet" href="/royal-theme.css"></head><body><a href="/diagnostico" target="_blank" rel="noopener" class="local-city-badge">PRAÇA DA COROA · v${version}</a><div id="game"></div><div id="ui"></div><script src="/ultimate-ui.js" defer></script><script src="/avatar-visuals.js" defer></script><script type="module" src="/character-hd.js"></script><script src="/combat-visuals.js" defer></script><script src="/class-ui.js" defer></script><script src="/potions-ui.js" defer></script><script type="module" src="/archer-visuals.js"></script><script type="module" src="/gunslinger-visuals.js"></script><script src="/combat-ui.js" defer></script><script src="/aegis-visuals.js" defer></script><script src="/local-boot.js" defer></script><script type="module" src="/assets/main-Du8N-0Wf.js"></script></body></html>`;
const server = createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // No proxy, account transfer, session imitation or login bypass.
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self' ws://127.0.0.1:${port} ws://localhost:${port}; object-src 'none'; base-uri 'self'; form-action 'self'`,
  );
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    );
  } catch {
    res.writeHead(400).end();
    return;
  }
  const reply = (code, type, body) => {
    res.writeHead(code, { "Content-Type": type });
    res.end(req.method === "HEAD" ? undefined : body);
  };
  if (pathname === `/assets/maps/${medievalCity.id}/map.json`) {
    remember(status.served, pathname);
    return reply(200, types[".json"], JSON.stringify(medievalCity.map));
  }
  if (pathname === `/assets/maps/${medievalCity.id}/tilesets/coroa.svg`) {
    remember(status.served, pathname);
    return reply(200, types[".svg"], medievalCity.texture());
  }
  if (pathname === `/assets/maps/${royalHunt.id}/map.json`) {
    remember(status.served, pathname);
    return reply(200, types[".json"], JSON.stringify(royalHunt.map));
  }
  if (pathname === `/assets/maps/${royalHunt.id}/tilesets/patio.svg`) {
    remember(status.served, pathname);
    return reply(200, types[".svg"], royalHunt.texture());
  }
  if (
    /^\/assets\/ui\/cacadas\/mapa-(patio-da-coroa|treino-local|elite-local)\.webp$/.test(
      pathname,
    )
  ) {
    remember(status.served, pathname);
    return reply(
      200,
      "image/webp",
      readFileSync(path.join(root, "art/royal-hunt-preview.webp")),
    );
  }
  if (pathname === "/personagens")
    return reply(
      200,
      "text/html; charset=utf-8",
      readFileSync(path.join(root, "character-comparison.html")),
    );
  if (pathname === "/royal-theme.css")
    return reply(
      200,
      types[".css"],
      readFileSync(path.join(root, "royal-theme.css")),
    );
  const local = asset(pathname);
  if (local) {
    remember(status.served, pathname);
    return reply(200, local.type, local.bytes);
  }
  if (pathname === "/__diagnostic.json")
    return reply(200, types[".json"], JSON.stringify(status));
  if (pathname === "/api/auth/captcha")
    return reply(200, types[".json"], '{"site_key":""}');
  if (pathname.startsWith("/api/")) {
    status.apiAttempts++;
    return reply(
      503,
      types[".json"],
      JSON.stringify({
        error: "O servidor original não foi fornecido no pacote.",
        code: "local.backend_missing",
      }),
    );
  }
  if (!["GET", "HEAD"].includes(req.method))
    return reply(405, types[".json"], "{}");
  if (pathname === "/" || pathname === "/jogar")
    return reply(200, types[".html"], html);
  if (
    [
      "/diagnostico",
      "/diagnostic.js",
      "/diagnostic.css",
      "/local-boot.js",
      "/aegis-visuals.js",
      "/guerreiro",
      "/warrior-preview.js",
      "/warrior-preview.css",
      "/ultimate-ui.js",
      "/character-hd.js",
      "/character-art.mjs",
      "/character-locomotion.mjs",
      "/character-comparison.js",
      "/combat-visuals.js",
      "/combat-ui.js",
      "/potions-ui.js",
      "/class-ui.js",
      "/archer-visuals.js",
      "/gunslinger-visuals.js",
      "/gunslinger.mjs",
      "/archer-vfx.mjs",
      "/class-visuals.mjs",
      "/dash-visuals.mjs",
      "/archer.mjs",
      "/avatar-visuals.js",
      "/light-avatar.mjs",
      "/warrior.mjs",
      "/defense-buff.mjs",
      "/warrior-walk-rig.mjs",
      "/light-afterimages.mjs",
    ].includes(pathname)
  ) {
    const file =
      pathname === "/diagnostico"
        ? "diagnostic.html"
        : pathname === "/guerreiro"
          ? "warrior-preview.html"
          : pathname.slice(1);
    return reply(
      200,
      types[path.extname(file)],
      readFileSync(path.join(root, file)),
    );
  }
  // Restore numeric-prefix capture names only when the basename is unique.
  const name = path.posix.basename(pathname).replaceAll("@", "_");
  const allowed =
    pathname.startsWith("/data/") ||
    pathname.startsWith("/assets/") ||
    /^\/locales\/pt-BR\/[a-z]+\.json$/.test(pathname);
  const choices = allowed ? byName.get(name) : undefined;
  if (!choices || choices.length !== 1) {
    remember(status.missing, pathname);
    if (pathname.startsWith("/assets/ui/") && pathname.endsWith(".png")) {
      const placeholder =
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect x="2" y="2" width="44" height="44" rx="5" fill="#f6ead0" stroke="#b99a5b"/><path d="M24 9 36 24 24 39 12 24Z" fill="none" stroke="#9b7a3d" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="#ad883e"/></svg>';
      return reply(200, "image/svg+xml", placeholder);
    }

    return reply(
      404,
      types[".json"],
      JSON.stringify({
        error: choices
          ? "Nome ambíguo na captura"
          : "Arquivo ausente na captura",
        path: pathname,
      }),
    );
  }
  const entry = choices[0];
  let data = cached.get(entry.name);
  try {
    if (!data) {
      data = name === "main-Du8N-0Wf.js" ? adaptedClient : entry.read();
      cached.set(entry.name, data);
    }
  } catch {
    return reply(422, types[".json"], '{"error":"Arquivo inválido"}');
  }
  remember(status.served, pathname);
  return reply(
    200,
    types[path.extname(name)] ?? "application/octet-stream",
    data,
  );
});
const localGame = attachLocalGame(server, {
  build: byName.get("overlays-CiSZXpkZ.js")[0].read().toString("utf8"),
  map: royalHunt.map,
  root,
  status,
  cityMap: medievalCity.map,
  cityMapId: medievalCity.id,
  cityName: medievalCity.name,
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    localGame.close();
    server.close(() => process.exit(0));
  });
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `A porta ${port} está ocupada. Feche este teste anterior com Ctrl+C.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/jogar?demo=1`;
  console.log(
    `CLIENTE CAPTURADO + SERVIDOR LOCAL DE TESTE\nAbrir: ${url}\nDiagnóstico: http://127.0.0.1:${port}/diagnostico\n${entries.size} arquivos disponíveis. Login manual: teste / Teste123!\nCtrl+C encerra.`,
  );
  if (process.platform === "win32" && process.env.OPEN_BROWSER === "1")
    execFile(
      "cmd.exe",
      ["/d", "/s", "/c", `start "" "${url}"`],
      { windowsHide: true },
      (error) => {
        if (error) console.log("Abra manualmente o endereço acima.");
      },
    );
});
