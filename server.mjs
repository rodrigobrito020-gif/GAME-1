import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readZip } from './zip-reader.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CAPTURE_PORT ?? 5188);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Porta inválida.');
const candidates = [process.argv[2],path.join(root,'recursos-publicos.zip'),path.join(process.env.USERPROFILE ?? process.env.HOME ?? root,'Downloads','recursos-publicos.zip')].filter(Boolean);
const source = candidates.find(file => existsSync(file));
if (!source) { console.error('Coloque recursos-publicos.zip nesta pasta ou em Downloads. Nenhum jogo foi alterado.'); process.exit(1); }
const entries = readZip(readFileSync(source)), byName = new Map(), cached = new Map();
for (const [name, read] of entries) {
  const basename = path.posix.basename(name).replace(/^\d+_/, '');
  const list = byName.get(basename) ?? []; list.push({name,read}); byName.set(basename,list);
}
const required=['main-Du8N-0Wf.js','overlays-CiSZXpkZ.js','rolldown-runtime-C_s2cVnS.js','preload-helper-BZ1Pz5am.js','main-CfDhE7HM.css','overlays-BfDeQoSF.css'];
for (const name of required) if (byName.get(name)?.length !== 1) throw Error(`Build ausente ou ambíguo: ${name}. Este iniciador é para o ZIP enviado em 30/10/2026.`);
const status={mode:'captured-client-only',originalBackend:false,ownGameLoaded:false,files:entries.size,served:[],missing:[],websocketAttempts:0,apiAttempts:0};
const remember = (list, value) => {if(!list.includes(value)){list.push(value);if(list.length>100)list.shift();}};
const types={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.ogg':'audio/ogg','.woff2':'font/woff2','.html':'text/html; charset=utf-8'};
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cliente capturado — teste isolado</title><link rel="stylesheet" href="/assets/overlays-BfDeQoSF.css"><link rel="stylesheet" href="/assets/main-CfDhE7HM.css"></head><body><div id="game"></div><div id="ui"></div><script type="module" src="/assets/main-Du8N-0Wf.js"></script></body></html>`;
const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  // No proxy, account transfer, session imitation or login bypass.
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self' ws://127.0.0.1:${port} ws://localhost:${port}; object-src 'none'; base-uri 'self'; form-action 'self'`);
  let pathname;try {pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);} catch {res.writeHead(400).end();return;}
  const reply=(code,type,body)=>{res.writeHead(code,{'Content-Type':type});res.end(req.method==='HEAD'?undefined:body);};
  if(pathname==='/__diagnostic.json')return reply(200,types['.json'],JSON.stringify(status));
  if(pathname.startsWith('/api/')) {status.apiAttempts++;return reply(503,types['.json'],JSON.stringify({error:'O servidor original não foi fornecido no pacote.',code:'local.backend_missing'}));}
  if(!['GET','HEAD'].includes(req.method))return reply(405,types['.json'],'{}');
  if(pathname==='/'||pathname==='/jogar')return reply(200,types['.html'],html);
  if(['/diagnostico','/diagnostic.js','/diagnostic.css'].includes(pathname)) {
    const file=pathname==='/diagnostico'?'diagnostic.html':pathname.slice(1);return reply(200,types[path.extname(file)],readFileSync(path.join(root,file)));
  }
  // Restore numeric-prefix capture names only when the basename is unique.
  const name=path.posix.basename(pathname).replaceAll('@','_');
  const allowed=pathname.startsWith('/assets/')||/^\/locales\/pt-BR\/[a-z]+\.json$/.test(pathname);
  const choices=allowed?byName.get(name):undefined;
  if(!choices || choices.length!==1){remember(status.missing,pathname);return reply(404,types['.json'],JSON.stringify({error:choices?'Nome ambíguo na captura':'Arquivo ausente na captura',path:pathname}));}
  const entry=choices[0];let data=cached.get(entry.name);
  try {if(!data){data=entry.read();cached.set(entry.name,data);}}catch{return reply(422,types['.json'],'{"error":"Arquivo inválido"}');}
  remember(status.served,pathname);return reply(200,types[path.extname(name)]??'application/octet-stream',data);
});
server.on('upgrade',(_req,socket)=>{status.websocketAttempts++;socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`A porta ${port} está ocupada. Feche este teste anterior com Ctrl+C.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`CLIENTE CAPTURADO — sem usar o nosso jogo\nAbrir: http://127.0.0.1:${port}/jogar\nDiagnóstico: http://127.0.0.1:${port}/diagnostico\n${entries.size} arquivos disponíveis. Servidor original NÃO incluído.\nCtrl+C encerra.`));
