# Versão de teste da praça importada — 30/10/2026

Esta versão permite jogar no mapa do ZIP `recursos-publicos.zip` fornecido pelo usuário, preservando o nosso servidor, farm, hunts, Party, inventário e personagens. Os personagens originais do outro jogo não são necessários: usamos os nossos sprites atuais até criar os assets próprios planejados.

## Windows: iniciar com dois cliques

1. Extraia o ZIP de código baixado do GitHub.
2. Mantenha `recursos-publicos.zip` na pasta Downloads do Windows ou coloque uma cópia na mesma pasta de `package.json`. O iniciador procura primeiro na pasta do jogo e depois em `%USERPROFILE%\Downloads`.
3. Abra `INICIAR_TESTE.bat`. Ele instala as dependências se necessário, importa o cenário, prepara o banco sem apagar personagens e inicia os dois processos.
4. Quando o terminal mostrar Vite pronto, abra **http://localhost:5173**. Deixe o terminal aberto; Ctrl+C encerra.

O Node.js 22.12+ continua necessário. Para manter os personagens da instalação anterior, pare o servidor e copie os **arquivos de código novos para dentro da pasta antiga**, substituindo os arquivos e mesclando pastas. Como o ZIP de código não contém `.env` nem banco, esses arquivos existentes permanecem. Não apague a pasta antiga ou substitua `prisma/dev.db` por um banco vazio. Faça uma cópia do banco com o servidor parado antes de atualizar.

## Instalação manual

Na pasta do projeto, depois de instalar as dependências e preparar `.env` conforme o README:

```bat
npm run import:city -- "C:\caminho\recursos-publicos.zip"
npm run setup
npm run dev
```

Com o ZIP na pasta do projeto, `npm run import:city` basta. O importador aceita ZIP comum ou deflate, valida CRC/tamanhos, rejeita caminhos inseguros e grava somente o mapa, a configuração de colisão e os sete tilesets. JavaScript, dados de contas, sons, fontes e outros catálogos do arquivo externo não são executados/copiados para esta versão.

Para executar a compilação, importe antes de `npm run build` e depois use `npm start`. O servidor e o cliente precisam do mesmo pacote; importar depois de compilar exige compilar novamente.

## O que está integrado

- Mapa de 60×48 tiles de 32 px: **1920×1536**, 11 camadas, sete tilesets e animações de portal/objetos.
- Autotiles, transparências, profundidade de elementos e iluminação local. A ambientação de Halloween veio no mapa enviado.
- Colisões usadas pelo **servidor**, movimentação WASD/clique e busca de caminho nas dimensões corretas. Não há apenas troca de uma imagem de fundo.
- Os quatro serviços do nosso jogo foram colocados em células acessíveis: hunts, mercador, forja e profissões. Os acessos são conferidos pelo importador e por testes.
- Entrada/retorno das hunts usam o spawn dessa praça. HP/MP, quatro skills, drops, limites de summons e dados de personagem continuam sendo os nossos.
- Mensagem de erro visível se o navegador não conseguir carregar o cenário; reimportar resolve arquivos faltantes/corrompidos.

## Distribuição e arte própria

O GitHub entrega nosso código de integração e o iniciador. O arquivo de recursos fornecido pelo usuário é importado **localmente**, em `apps/client/public/local-city/`, pasta ignorada pelo Git. Os arquivos originais do cenário, o ZIP de recursos e as capturas desse cenário não são adicionados à branch publicada. Os termos de redistribuição dos recursos externos continuam não identificados no pacote; este mecanismo não declara que o outro jogo ou suas artes sejam open source.

O projeto funciona também sem esse ZIP, usando nossa cidade anterior. Para forçar a cidade anterior mesmo com um pacote instalado, use `CITY_MODE=original` na `.env` e reinicie o servidor/recarregue o navegador. No PowerShell, a configuração temporária é `$env:CITY_MODE = "original"` antes de iniciar; no CMD é `set CITY_MODE=original`. Remova essa configuração para voltar ao cenário importado.

Os próximos assets de personagens serão próprios. Não foram importadas as regras, a economia, as contas, os itens ou o backend do jogo de referência.

## Verificação

- Lint, typecheck e build passaram.
- **34 testes de regras/rede/importação** passaram, incluindo conservação do banco, importação repetida, rejeição de caminhos inseguros e mapa inconsistente, movimento/serviços/spawn importados.
- Os **quatro testes existentes do navegador** passaram com a praça real instalada. O quinto teste específico passou: sete tilesets, quatro NPCs alcançáveis, clique em parede recusado pelo servidor e retorno da hunt ao spawn correto. Um sexto fluxo verifica o carregamento interrompido de imagens: mostra a orientação para reimportar e continua recebendo snapshots sem erro JavaScript.
- Cliente e servidor compilados foram executados em uma porta separada para verificar carregamento, progresso e bloqueio do DEV em produção. As capturas de cenário são locais ao teste, não parte dos assets redistribuídos.
- Windows: comandos e `.bat` preparados para CMD/PowerShell. Os testes executados neste ambiente usam Linux/Chromium; não se afirma que uma máquina física Windows foi usada.

Para repetir: `npm test` e `npm run test:browser`. Os dois testes específicos de navegador se aplicam quando o pacote local está instalado; sem ele, são marcados como não aplicáveis e os quatro testes originais continuam rodando.
