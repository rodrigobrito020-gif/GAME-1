# Jogo local — 0.6.0: Guerreiro Humano

Esta versão usa o cliente do seu `recursos-publicos.zip` com nosso servidor local. A cidade inicial agora é **Praça da Coroa**, um cenário próprio com palácio, comércio, armazém, fonte, jardins, muralhas e estandartes. A arquitetura usa pedra marfim, paredes brancas e telhados dourados.

A interface acompanha o padrão branco, marfim e dourado: painéis, HUD, chat, menus, loja, mochila, botões e confirmações. Texto escuro e cores de vida/mana preservam a leitura. As cores de raridade continuam identificando os itens.

## Guerreiro Humano — 0.6.0

O jogador agora usa um personagem humano original: cabelo escuro, rosto visível, armadura marfim com detalhes dourados, capa curta e espada de aço. As folhas próprias incluem repouso, caminhada, espada, preparação de habilidade, reação a dano e derrota, com quatro direções. A corrida reutiliza os quadros de caminhada em cadência maior.

As quatro habilidades têm movimentos e efeitos próprios: corte crescente dourado, rastro da investida, impacto do golpe destruidor e aura da fúria. Cada golpe reserva sua preparação e recuperação; o servidor aplica o dano no quadro de impacto (350, 400, 600 e 300 ms, respectivamente). O ataque básico usa 200 ms. Sair da hunt ou morrer cancela os golpes pendentes. Valores de dano, custo de mana e recarga foram preservados.

**Prévia interativa:** com o servidor aberto, acesse **http://127.0.0.1:5188/guerreiro**. É possível ver as quatro direções, pausar, avançar quadros e testar cada sequência. A prévia usa as mesmas folhas e sequências do jogo; o jogador também está integrado à cidade e às hunts.

A atualização troca apenas a aparência do jogador. Não concede equipamentos, não substitui itens e não reinicia nível, ouro, EXP, mochila ou armazém. NPCs e monstros conservam os visuais provisórios atuais. A armadura e a espada desenhadas são uma aparência inicial fixa: trocar equipamentos ainda altera os atributos, mas não as peças do desenho.

Fontes e contrato de animação estão em **art/warrior/README.md**, **manifest.json** e **warrior.mjs**. Servirão como base técnica para as próximas classes, que precisarão de suas próprias artes e ações.

## Correção da hunt — 0.5.1

Os monstros agora são desenhados no ponto correto do mapa. O pivô da imagem estava em pixels (`48`, `100`), mas o renderer utiliza valores proporcionais ao quadro (`0.5`, `100/112`). Isso deixava a imagem e a barra sobre o monstro fora da tela, embora o servidor calculasse os ataques e as recompensas. A correção preserva os dados salvos, as regras do farm e o visual medieval.

## Abrir no Windows

1. Encerre a versão anterior com **Ctrl+C** no terminal.
2. Extraia o novo ZIP em uma pasta nova.
3. Coloque **recursos-publicos.zip** junto de **ABRIR_CLIENTE_COPIADO.bat**, sem extrair o arquivo de recursos. Ele também pode ficar em Downloads.
4. Para manter o progresso da versão anterior, copie a pasta **.local-runtime** inteira para a nova pasta, com ambos os servidores fechados. Se não copiar, será criada outra conta local de teste.
5. Abra **ABRIR_CLIENTE_COPIADO.bat**. O navegador entra automaticamente na conta local em **http://127.0.0.1:5188/jogar?demo=1**. Deixe o terminal aberto.

Requer Node.js **22.12+ ou 24 LTS**. O iniciador instala a dependência `ws` na primeira execução. Login manual: **teste**, senha **Teste123!**. Nenhuma conta do site original é utilizada.

## Testar o farm

1. Na cidade, pressione **M** para abrir **Caçadas**.
2. Em **Arena local — treino**, clique em **Iniciar**. O personagem procura e ataca monstros automaticamente. A segunda arena exige nível 5.
3. As quatro habilidades são usadas automaticamente por padrão. **1–4** também permitem acioná-las respeitando alvo, alcance, mana e recarga. **Z** usa uma poção de vida e **X**, de mana. Cada conta recebe dez pequenas de cada, uma única vez.
4. Observe a vida dos inimigos, os números de dano, EXP, ouro, contador de abates e drops. Os inimigos reaparecem três segundos depois de morrer.
5. Clique em **Sair da caçada** no canto superior direito e confirme. **I** abre a mochila. Selecione uma espada ou peitoral de treino recebido e use a opção de equipar. Equipamentos só são trocados na cidade.
6. Feche e reabra o servidor: nível, EXP, ouro, itens, equipamentos, poções e ordem das habilidades permanecem salvos. A conta retorna à cidade; não existe ganho offline nesta versão.

Na cidade: **WASD/setas** para andar, **I** inventário, **M** caçadas e **Esc** fecha painéis. O cliente usa clique para selecionar/interagir, não para caminhar pelo chão. Na caçada, a movimentação é automática.

Ao morrer, o farm para e o personagem volta à cidade em três segundos, recuperado. Não há perda de EXP neste teste. Uma segunda janela autenticada encerra a conexão da primeira: existe **um único personagem local**, sem duplicar recompensas por abas abertas.

## Serviços da cidade

Perto do ponto onde o personagem aparece existem três NPCs com aparência provisória:

- **Mercador**, à esquerda: aproxime-se e pressione **E** para abrir a loja. Compre poções, confirme em **Adquirir** e veja o estoque e o ouro atualizarem. **Vender itens** abre a seleção de drops para venda.
- **Armazém**, à direita: aproxime-se e pressione **E**. Guarde itens da mochila e retire os itens do cofre usando as ações da interface. São cem espaços em cada inventário. Itens guardados continuam salvos ao reiniciar.
- **Guia de caçadas**, acima: abre a lista das arenas. **M** continua sendo o atalho.

O personagem começa perto dos três. Dê alguns passos na direção do NPC desejado antes de pressionar E, ou selecione o NPC com o mouse. O serviço só funciona dentro do alcance de 128 pixels e na cidade.

Na mochila, **Equipar melhores** mostra uma prévia das trocas antes de aplicar. Os critérios de ataque, defesa, vida e poder usam os atributos implementados no servidor local. A ordenação por poder, nível, raridade ou tipo também funciona. O botão direito trava/destrava um item; equipamentos travados não são vendidos. Vendas de parte de uma pilha descontam apenas a quantidade escolhida. Transferências para o armazém preservam o item e recusam o que não couber.

O nível sobre o personagem é atualizado ao evoluir, sem precisar sair da caçada. Os NPCs e o personagem ainda usam a sombra provisória. A mudança desta etapa é na cidade e na interface.

## Conteúdo e limites deste teste

- A cidade medieval é um mapa e arte próprios do projeto, com colisões correspondentes no cliente e no servidor. As duas arenas continuam usando o cenário capturado anterior e sua grade de colisões. A praça medieval permanece segura, sem monstros.
- Não vieram os sprites completos de monstros nem as animações completas dos personagens. O jogador usa o Guerreiro Humano original desta versão. NPCs e inimigos ainda usam a sombra provisória disponível no pacote; suas novas artes ficam para outra etapa.
- As habilidades usam eventos reais de combate no cliente, com dano e cura calculados no servidor. Os efeitos das quatro habilidades do guerreiro foram criados localmente. Alguns outros efeitos gráficos e áudios não vieram no pacote e continuam indisponíveis.
- Itens implementados: fragmento empilhável, espada e peitoral de treino. Cada abate dá fragmento se houver espaço; a cada três abates da caçada, uma espada ou peitoral. Com mochila cheia, não entram itens novos; o jogo continua concedendo EXP e ouro. Retirar equipamento com a mochila cheia é recusado.
- Poções pequenas de vida/mana consomem estoque, recuperam 40% e têm intervalo de 1,5 segundo. O protocolo de compra funciona na cidade: dez ouros por poção, sem ouro ou itens gratuitos repetidos.
- Números de dano, monstros, drops, progressão, cura na cidade e preços são **regras provisórias para testar a base**, não o balanceamento do jogo original nem decisões finais aprovadas.
- Ainda não há criação de personagens, novas classes, todos os equipamentos originais, chefes, negociação entre jogadores, guildas, rankings, talentos ou multiplayer implementados. Os três serviços locais descritos acima estão funcionais. Os menus capturados desses sistemas podem existir, mas suas operações continuam recusadas. Consultas de avisos/listas recebem estados vazios, sem criar eventos ou recompensas.

## Executar e testar pelo terminal

Dentro da pasta extraída, no CMD:

```bat
npm ci --omit=dev --ignore-scripts
node server.mjs "C:\Users\Brito\Downloads\recursos-publicos.zip"
```

Abra **http://127.0.0.1:5188/jogar?demo=1**. Não use a porta 5173 do projeto anterior.

```bat
npm test
```

Se o ZIP não estiver nesta pasta ou em Downloads:

```bat
set "TEST_CAPTURE_ZIP=C:\caminho\recursos-publicos.zip"
npm test
```

São **21 testes automatizados**: protocolo, PNG, combate, habilidades, morte, progressão, itens, equipamentos, vendas, armazém, cidade e integração real WebSocket. Os novos testes verificam quadros distintos, transparência, ausência de corte das armas, alinhamento dos pés, efeitos locais e sincronização dos golpes. A integração também migra uma aparência antiga e verifica ouro, EXP, poções e item guardado após reiniciar o processo. Sem o ZIP, a integração é explicitamente pulada. O jogo e a prévia também são verificados no Chromium. Consulte **RESULTADO_TESTE.txt**.

Para reempacotar as fontes originais do guerreiro (não é necessário para jogar):

```bat
npm run art:warrior
```

## Dados e isolamento

Conta e progresso: **.local-runtime/account.json**. Não apague essa pasta para conservar os dados. Senha armazenada com scrypt; tokens locais duram até oito horas no processo. Ao reiniciar o servidor, a entrada automática faz novo login.

Servidor somente em **127.0.0.1**. Não é uma instalação multiplayer/VPS pronta. Nenhuma conexão, proxy, conta ou sessão do servidor original é utilizada. Scripts e estilos compilados do cliente permanecem sem alteração; uma folha de estilo própria aplica o tema branco e dourado. O servidor fornece o novo mapa e compõe sua textura com a arte em `art/medieval-ivory-gold.png`. Os demais recursos continuam sendo lidos do ZIP local.

O GitHub contém código próprio e adaptadores, com as artes próprias da cidade e do guerreiro e sem redistribuir o pacote capturado. Os outros jogos e branches foram preservados.

Diagnóstico: **http://127.0.0.1:5188/diagnostico**.
