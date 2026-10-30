# Versão de teste da praça importada — 30/10/2026

Esta versão permite jogar no mapa do ZIP `recursos-publicos.zip` fornecido pelo usuário, preservando o nosso servidor, farm, hunts, Party, inventário e personagens. A direção atual é reproduzir primeiro a experiência da referência e decidir os cortes depois. O ZIP não contém as folhas completas dos personagens, então essa parte ainda usa os nossos sprites. Não se afirma equivalência completa com o jogo de referência.

## Windows: iniciar com dois cliques

1. Extraia o ZIP de código baixado do GitHub.
   Se uma versão anterior ainda estiver rodando, encerre-a com Ctrl+C no terminal. O iniciador do Referência 3 verifica as portas 3001/5173 e interrompe a abertura com uma mensagem se estiverem ocupadas; não encerra outros programas automaticamente.
2. Mantenha `recursos-publicos.zip` na pasta Downloads do Windows ou coloque uma cópia na mesma pasta de `package.json`. O iniciador procura primeiro na pasta do jogo e depois em `%USERPROFILE%\Downloads`.
3. Abra `INICIAR_TESTE.bat`. Ele instala as dependências se necessário, importa o cenário, prepara o banco sem apagar personagens e inicia os dois processos.
4. Quando o terminal mostrar Vite pronto, abra **http://localhost:5173**. Deixe o terminal aberto; Ctrl+C encerra.

O Node.js 22.12+ continua necessário. Para manter os personagens da instalação anterior, pare o servidor e copie os **arquivos de código novos para dentro da pasta antiga**, substituindo os arquivos e mesclando pastas. Como o ZIP de código não contém `.env` nem banco, esses arquivos existentes permanecem. Não apague a pasta antiga ou substitua `prisma/dev.db` por um banco vazio. Faça uma cópia do banco com o servidor parado antes de atualizar.

O iniciador identifica a versão como `REFERENCIA 3`. A interface dessa versão usa indicadores compactos no alto à esquerda, menus no alto à direita, chat no canto inferior esquerdo e Auto Farm separado à direita. Os contadores de jogadores/EXP/loot são reais. Não foram adicionados buffs premium, jogadores fictícios ou serviços de sistemas não implementados para reproduzir a imagem da referência.

## Instalação manual

Na pasta do projeto, depois de instalar as dependências e preparar `.env` conforme o README:

```bat
npm run import:city -- "C:\caminho\recursos-publicos.zip"
npm run setup
npm run dev
```

Com o ZIP na pasta do projeto, `npm run import:city` basta. O importador aceita ZIP comum ou deflate, valida CRC/tamanhos, rejeita caminhos inseguros e grava o mapa, a configuração de colisão, os sete tilesets e as imagens/áudios/fontes únicos válidos em um manifesto local. Imagens têm assinatura/dimensões verificadas; arquivos OGG/WOFF2 têm a assinatura conferida. JavaScript, CSS e dados de contas não são executados nem copiados. Referências de catálogo sem imagem não viram itens automaticamente.

Para executar a compilação, importe antes de `npm run build` e depois use `npm start`. O servidor e o cliente precisam do mesmo pacote; importar depois de compilar exige compilar novamente.

## O que está integrado

- Mapa de 60×48 tiles de 32 px: **1920×1536**, 11 camadas, sete tilesets e animações de portal/objetos.
- Autotiles, transparências, profundidade de elementos e iluminação local. A ambientação de Halloween veio no mapa enviado.
- Colisões usadas pelo **servidor**, movimentação WASD/clique e busca de caminho nas dimensões corretas. Não há apenas troca de uma imagem de fundo.
- Os seis serviços do nosso jogo foram colocados em células acessíveis: hunts, mercador, forja, profissões, curandeira e guarda-volumes. Os acessos são conferidos pelo importador e por testes.
- Inventário com filtros, busca, raridade reversível, equipamentos nos slots e detalhes reais. Armazém persistente com pilhas completas por duplo clique, botão direito ou arrastar. Transferência recusa distância, hunts, capacidade cheia e itens ausentes.
- Ícones e poções do pacote local com fallback para arte própria se uma imagem falhar. Música da praça, passos e impactos; volume e botão de som respeitam gesto do usuário e pausa quando a aba fica oculta.
- Entrada/retorno das hunts usam o spawn dessa praça. HP/MP, quatro skills, drops, limites de summons e dados de personagem continuam sendo os nossos.
- Mensagem de erro visível se o navegador não conseguir carregar o cenário; reimportar resolve arquivos faltantes/corrompidos.

## Distribuição e arte própria

O GitHub entrega nosso código de integração e o iniciador. O arquivo de recursos fornecido pelo usuário é importado **localmente**, em `apps/client/public/local-city/`, pasta ignorada pelo Git. Os arquivos originais do cenário, o ZIP de recursos e as capturas desse cenário não são adicionados à branch publicada. Os termos de redistribuição dos recursos externos continuam não identificados no pacote; este mecanismo não declara que o outro jogo ou suas artes sejam open source.

O projeto funciona também sem esse ZIP, usando nossa cidade anterior. Para forçar a cidade anterior mesmo com um pacote instalado, use `CITY_MODE=original` na `.env` e inicie manualmente com `npm run dev`. No PowerShell, a configuração temporária é `$env:CITY_MODE = "original"`; no CMD é `set CITY_MODE=original`. Remova essa configuração para voltar ao cenário importado. `INICIAR_TESTE.bat` escolhe explicitamente o cenário importado no processo de teste e não altera permanentemente a `.env`.

Os próximos assets de personagens serão próprios. Não foram importadas as regras, a economia, as contas, os itens ou o backend do jogo de referência.

## Verificação

- Lint, typecheck e build passaram.
- **39 testes de regras/rede/importação/serviços** passaram, incluindo conservação do banco, importação repetida, rejeição de caminhos inseguros e mapa inconsistente, movimento/serviços/spawn importados.
- Os **quatro testes existentes do navegador** passaram com a praça real instalada. O quinto teste específico passou: sete tilesets, quatro NPCs alcançáveis, clique em parede recusado pelo servidor e retorno da hunt ao spawn correto. Um sexto fluxo verifica o carregamento interrompido de imagens: mostra a orientação para reimportar e continua recebendo snapshots sem erro JavaScript.
- Mais dois fluxos de navegador verificam ícones reais, fallback de imagem, áudio opt-in, filtros e ordenação; armazém por três gestos, persistência após recarregar e curandeira.
- Cliente e servidor compilados foram executados em uma porta separada para verificar carregamento, progresso e bloqueio do DEV em produção. As capturas de cenário são locais ao teste, não parte dos assets redistribuídos.
- Windows: comandos e `.bat` preparados para CMD/PowerShell. Os testes executados neste ambiente usam Linux/Chromium; não se afirma que uma máquina física Windows foi usada.

Para repetir: `npm test` e `npm run test:browser`. Os fluxos que exigem o pacote local são marcados como não aplicáveis quando ele não está instalado. As regras do jogo e os serviços continuam testáveis com a cidade própria.
