# Validação da versão 0.1.0

Executada em 30/10/2026, Linux, Node 24.19.0, npm 11.9.0 e Chromium do ambiente. Esta é uma primeira versão jogável, com arte procedural e balanceamento provisórios.

A atualização de integração da praça possui validação adicional e instruções em [TESTE_DA_PRACA.md](TESTE_DA_PRACA.md): 34 testes de regras/rede/importação e seis fluxos de navegador, com o pacote local instalado. As contagens abaixo descrevem o marco anterior. O pacote externo é importado localmente; não é incluído no GitHub.

## Verificações automáticas

| Comando | Resultado |
| --- | --- |
| `npm ci --cache /tmp/lineage-npm-cache` | Instalação limpa pelo lockfile: passou |
| `npm run setup` | Prisma Client, migration SQLite e seed idempotente: passaram |
| `npm run lint` | Passou, sem erros |
| `npm run build` | Typecheck e compilação de cliente/servidor: passaram |
| `npm test` | **29 testes passaram**: 27 de regras/simulação e 2 de integração com servidor, banco temporário e sockets reais |
| `npm run test:browser` | **4 testes passaram** no Chromium: ciclo completo, dois jogadores, DEV/craft/summon e largura de celular |

Os testes conferem faixas/grades/kits, armas incompatíveis, precisão+nível, limites anões, Spoil/Sweeper com MP/cooldown e rolagem única, fórmulas de Party, distribuição de loot, isolamento das instâncias, colisão, movimento entre spawns, fabricação, conservação de equipamentos, crescimento além de 300, morte/retorno e bloqueio de comandos DEV em produção. O teste de rede conecta cinco personagens de teste independentes, monta uma Party real, verifica 25 monstros nos cinco spawns, quinze summons, EXP dos cinco e loot exclusivo do líder no modo escolhido. Esses personagens são fixtures de teste, não jogadores humanos anunciados como online.

## Compilação executada de verdade

Além dos testes sobre o código-fonte, foi iniciado **`PORT=3002 npm start`** para conferir a saída compilada, sem conflito com o servidor de desenvolvimento da porta 3001. No Windows PowerShell, o equivalente para mudar a porta é `$env:PORT = "3002"` antes de `npm start`; a porta padrão continua sendo 3001.

No Chromium, foram conferidos criação/login, movimento WASD, acesso ao NPC, hunt, combate, ganho de 42 EXP, retorno, inventário e reconexão. O cliente compilado não mostrou o painel DEV; a API informou `dev: false`. Nenhum erro de JavaScript foi capturado.

O processo de produção foi encerrado por SIGTERM e iniciado novamente. Um novo login recuperou do SQLite o personagem de teste em nível 2, 1.220 Adena e 2 EXP restantes. A persistência também foi verificada após recarregar o navegador.

## Inspeção visual e combate em grupo

As capturas foram feitas no navegador sobre o jogo em execução e inspecionadas:

- [Entrada](images/entrada.png), [cidade](images/cidade.png), [hunt](images/hunt.png), [inventário](images/inventario.png) e [celular 390×844](images/celular.png).
- [Party com 20 unidades](images/party-20-unidades.png): um cliente com renderização Phaser e quatro clientes Socket.IO de teste, cinco personagens e quinze summons vivos no estado recebido. Lógica, sincronização e renderização permaneceram operantes, sem erros de JavaScript. Não é um benchmark de 30 jogadores ou uma promessa de 60 FPS em qualquer máquina.
- [Boss experimental 225](images/boss-experimental.png): Party entrou na hunt mista 201–225, invocou o Boss pelo comando validado, selecionou o alvo, causou dano e o derrotou. O encontro usa estatísticas/modelo provisórios; seu desenho definitivo não foi aprovado.

## Limites e observações

- A compilação do cliente emite um aviso de chunk grande (aproximadamente 1,80 MB, 443 KB gzip, incluindo Phaser e o passe de arte). É um ponto de otimização de carregamento; a compilação e os fluxos testados passaram.
- Prisma informa que o adapter de migrations usa a URL configurada em `prisma.config.ts`. O adapter é local e não exige conta Turso ou serviço remoto.
- Os comandos de inicialização foram escritos para Windows e não dependem de sintaxe Unix; uma instalação física no Windows não foi executada neste ambiente. Os scripts temporários de captura não fazem parte dos testes portáveis do projeto; as capturas e os quatro testes de navegador estão incluídos.
- Os limites de summons e monstros aprovados foram mantidos. Pooling/limites de partículas afetam somente efeitos visuais. O passe de arte reduz a sobreposição ao ocultar nomes de summons; nomes de jogadores próximos ainda podem se sobrepor em aglomerações.
- Talentos, kits definitivos 150+/300, híbridos e sistemas econômicos futuros continuam conforme [APROVACOES_PENDENTES.md](APROVACOES_PENDENTES.md) e a seção de sistemas não implementados do README. Nenhuma definição pendente foi apresentada como aprovação.
- GAME-2 permaneceu sem alterações; GAME-1 manteve somente os arquivos não rastreados preexistentes `godot/` e `index.html`.
- O documento mestre incluído é idêntico ao anexo, SHA-256 `7ab6001436423911d966eee69d765df0b805f0513fb2eff4f09edb0cc5e44d7f`.

## Arquivos entregues

Todos os arquivos novos estão em `LINEAGE-2D-IDLE/`; não houve alterações de fontes nos dois jogos anteriores.

- Raiz: documento mestre completo, README, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts` e `prisma.config.ts`.
- `apps/client/`: `index.html`, `package.json`, `vite.config.ts`; `src/main.tsx`, `src/world.ts`, `src/art.ts`, `src/icons.tsx`, `src/style.css` e `src/visual.css`.
- `apps/server/`: `package.json`; `src/index.ts`, `src/engine.ts` e `src/db.ts`.
- `packages/shared/`: `package.json`; `src/types.ts`, `config.ts`, `skills.ts`, `rules.ts`, `drops.ts` e `index.ts`.
- `prisma/`: `schema.prisma`, `seed.ts`, `migrations/migration_lock.toml` e migration inicial SQL versionada.
- `scripts/start-prod.mjs`; `tests/rules.test.ts`, `tests/network.test.ts` e `tests/browser/game.spec.ts`.
- `docs/`: esta validação, aprovações pendentes, `ATUALIZACAO_VISUAL.md` e as sete capturas de tela em `images/`.

O pacote de fontes exclui banco, sessões, `.env`, dependências instaladas e saídas de testes/compilação. Execute os comandos do README para instalar e preparar um banco próprio. A distribuição do código usa a branch exclusiva `lineage-2d-idle` no repositório GAME-1; a branch principal do RPG 3D é preservada. Publicar os fontes no GitHub não hospeda automaticamente o servidor do jogo.
