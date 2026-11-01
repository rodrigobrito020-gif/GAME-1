# Jogo local — 0.6.7: rastro do personagem no dash

Esta versão usa o cliente do seu `recursos-publicos.zip` com nosso servidor local. A cidade inicial agora é **Praça da Coroa**, um cenário próprio com palácio, comércio, armazém, fonte, jardins, muralhas e estandartes. A arquitetura usa pedra marfim, paredes brancas e telhados dourados.

A interface acompanha o padrão branco, marfim e dourado: painéis, HUD, chat, menus, loja, mochila, botões e confirmações. Texto escuro e cores de vida/mana preservam a leitura. As cores de raridade continuam identificando os itens.

## Rastro do personagem — 0.6.7

O Avanço de Luz deixa cópias translúcidas do próprio guerreiro nos pontos por onde ele passa, preservando a pose, direção, espada e escudo. As cópias têm tonalidade suave de luz, desaparecem em 320ms e ficam limitadas a cinco visíveis. Só são emitidas com deslocamento durante o dash; não permanecem como personagens no mapa.

O efeito comprido que parecia um projétil foi retirado da ativação. As faíscas de contato continuam na chegada. A prévia também usa poses anteriores ao longo do caminho para mostrar o rastro. Distância mínima de 160, alcance de 300, dano, mana, recarga e progresso foram preservados; somente o Avanço de Luz segue disponível.

Para tornar as silhuetas visíveis sobre o piso claro, `client-afterimages.mjs` adapta localmente o pequeno trecho de renderização dos rastros do cliente compatível. O ZIP de recursos permanece intacto. O adaptador é validado na inicialização e limita o novo comportamento ao Avanço de Luz; outros rastros conservam o funcionamento anterior. Não há mudança no cálculo do combate.

## Dash reservado para inimigos distantes — 0.6.6

O Avanço de Luz exige um alvo a **160–300 unidades**. Perto do inimigo, o guerreiro continua com ataques básicos e guarda o dash para outra aproximação. A tecla **1** também respeita o alcance mínimo e mostra um aviso de alvo próximo demais. A tentativa recusada não gasta mana nem inicia recarga, deslocamento ou efeito da habilidade.

O limite é validado pelo servidor, inclusive ao usar a referência antiga da primeira habilidade. A regra mede a distância entre as posições do personagem e do alvo no instante da ativação. Movimento, efeitos e parâmetros restantes do dash foram mantidos; só o Avanço de Luz continua ativo.

## Teste isolado da habilidade — 0.6.5

Somente **Avanço de Luz (1)** está disponível para uso manual e automático. Investida, Golpe Destruidor e Fúria foram retiradas do catálogo jogável e da prévia, e o servidor recusa tentativas de usá-las ou reativá-las pela automação. As definições anteriores ficam guardadas no código para o trabalho futuro.

Ao carregar um progresso antigo, a ordem automática é filtrada para a habilidade em revisão; uma ordem vazia continua desativada. Ataques básicos, movimentação, poções, inventário e progresso permanecem funcionando. O dash conserva seu comportamento, custo e recarga da 0.6.4.

## Primeira habilidade — Avanço de Luz (0.6.4)

A habilidade **1** agora é **Avanço de Luz**: avanço real em linha reta na direção do inimigo, rastro branco/dourado e golpe na chegada. Ela funciona na aproximação automática e pelo atalho **1**, com alvo válido na hunt. As outras três habilidades continuam como antes, aguardando definição individual.

- Alcance de ativação: 300 unidades. O deslocamento termina 52 unidades antes da posição inicial do alvo, sem atravessá-lo. Na versão atual, alvos próximos demais impedem a ativação.
- Preparação de 50ms, dash até 300ms e recuperação até 550ms. O dano acontece uma vez aos 300ms, somente se o alvo ainda estiver vivo e ao alcance de contato (75 unidades).
- Dano 2× ataque, oito de mana e recarga de quatro segundos preservam os valores da primeira habilidade anterior. São valores provisórios para testar esta habilidade.
- O servidor valida o corredor inteiro antes de consumir mana/recarga e verifica colisões durante o movimento. Caminho bloqueado recusa o dash; a caça automática continua pela navegação normal. Um obstáculo surgido durante o avanço interrompe o movimento e cancela o dano.
- Morte, saída da hunt ou perda do alvo cancelam o avanço pendente. Um alvo que se afaste da chegada não recebe dano remoto. O corpo não recebe um segundo deslocamento visual nem retorna à origem.
- A ordem automática salva é migrada de `corte-poderoso` para `avanco-de-luz`, mantendo a posição na ordem e os espaços desativados. Nenhum item, atributo, nível ou moeda é concedido/reiniciado.

## Atualização — 0.6.3

- Recortes do personagem limpos: resíduos semitransparentes e pedaços das poses vizinhas deixaram de aparecer como manchas na cidade. Arte revisada com rosto maior, olhos/contornos mais claros e amostragem pontual, preservando detalhes no quadro de 64px. Escudo esquerdo e espada direita mantidos.
- Golpes mais ágeis: básico/retorno 400 ms (impacto 150 ms); Corte 650 ms (250 ms); Investida 600 ms (250 ms); Destruidor 850 ms (400 ms); Fúria 600 ms (250 ms). Efeitos dissipam de forma independente, sem bloquear o corpo por toda sua duração. Tremores de câmera removidos dessas ações e salto do Destruidor reduzido.
- Doze monstros distribuídos por regiões do Pátio da Coroa. A altura considera a parte desenhada da imagem, deixando-os aproximadamente do tamanho do herói. As artes dos inimigos continuam provisórias.
- Reaparecimento escalonado entre 20 e 28 segundos em suas regiões, com uma nova identidade de rede a cada vida. Inimigos distantes conservam posição; os próximos reagem e retornam à região de origem ao se afastarem demais.
- Farm automático escolhe o inimigo vivo mais próximo entre as ações. O alvo de um golpe já iniciado é mantido até a recuperação; uma seleção manual continua valendo até o alvo morrer ou ser removida. Sem inimigos vivos, o herói patrulha o mapa.
- Travessias em piso livre usam uma linha direta com verificação de colisões, evitando virar a cada quadrado. O caminho pela grade continua disponível quando existe obstáculo.

Custos, danos, cura, recargas e progresso preservados. A maior agilidade altera a cadência prática do combate. A aparência continua fixa, sem conceder itens ou atributos.

## Atualização — 0.6.2

- Escudo de marfim, ouro e aço azul no braço esquerdo, acompanhando repouso, caminhada, espada, habilidades, ferimento e derrota. A espada continua na direita. O escudo faz parte da aparência inicial fixa; não concede item, defesa ou bloqueio novo.
- Nove efeitos pintados em PNG transparente substituem os desenhos geométricos das habilidades. Arco de lâmina, vento da investida, fissuras com detritos e aura recebem contraste azul-aço, brilho branco/dourado, partículas e dissipação gradual.
- Preparação e recuperação mais legíveis: Corte Poderoso 1,4 s (impacto 700 ms), Investida 1,3 s (750 ms), Golpe Destruidor 1,9 s (1100 ms) e Fúria 1,7 s (700 ms). Os efeitos principais duram entre 1,6 e 2,67 s, com antecipação antes do golpe. O dano continua aplicado uma única vez no impacto; não foi criado dano contínuo.
- Dano, cura, mana e recargas preservados. A sequência de ações fica naturalmente mais cadenciada pela preparação maior. A área do Golpe Destruidor considera os inimigos que estão dentro do círculo no instante do impacto.
- Prévia atualizada para usar as novas durações, camadas e dissipação. Praça da Coroa, Pátio da Coroa, inventários e reaparecimento dos monstros continuam preservados.

## Correções — 0.6.1

- Caminhada refeita com pernas articuladas, apoio alternado e eixo no quadril. O tronco mantém posição e escala; os lados usam a mesma sequência espelhada. A passada lateral considera o deslocamento no chão em escala 2.
- Ataques com novas poses, escala constante, preparação, corte e recuperação. O ataque básico alterna um golpe descendente com um golpe de retorno; ambos têm impacto aos 200 ms e recuperação total de 500 ms. As quatro habilidades mantêm seus valores de dano, mana e recarga.
- Nova arena própria **Pátio da Coroa**, com pedra marfim, detalhes dourados, muralhas e vegetação. As duas caçadas deixaram de usar o mapa capturado antigo. A prévia do mapa também está disponível no menu de caçadas.
- Reaparecimento dos monstros corrigido: cada nova vida tem um identificador diferente. Assim, a animação de morte/transparência anterior não se aplica ao inimigo que acabou de nascer. Retornam após três segundos, como antes, e aparecem maiores para facilitar a leitura.

Nível, ouro, EXP, equipamentos, mochila e armazém são preservados. A atualização não concede nem substitui itens.

## Guerreiro Humano

O jogador agora usa um personagem humano original: cabelo escuro, rosto visível, armadura marfim com detalhes dourados, capa curta e espada de aço. As folhas próprias incluem repouso, caminhada, espada, preparação de habilidade, reação a dano e derrota, com quatro direções. A corrida reutiliza os quadros de caminhada em cadência maior.

As quatro habilidades têm movimentos e efeitos próprios: corte crescente de aço e luz, rastro da investida, impacto do golpe destruidor e aura da fúria. Cada golpe reserva sua preparação e recuperação; o servidor aplica o dano no quadro de impacto (250, 250, 400 e 250 ms, respectivamente). O ataque básico usa 150 ms. Sair da hunt ou morrer cancela os golpes pendentes. Valores de dano, custo de mana e recarga foram preservados.

**Prévia interativa:** com o servidor aberto, acesse **http://127.0.0.1:5188/guerreiro**. É possível ver as quatro direções, pausar, avançar quadros e testar cada sequência. A prévia usa as mesmas folhas e sequências do jogo; o jogador também está integrado à cidade e às hunts.

A atualização troca apenas a aparência do jogador. Não concede equipamentos, não substitui itens e não reinicia nível, ouro, EXP, mochila ou armazém. NPCs e monstros conservam os visuais provisórios atuais. A armadura, a espada e o escudo desenhados são uma aparência inicial fixa: trocar equipamentos ainda altera os atributos, mas não as peças do desenho.

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
2. Em **Pátio da Coroa — treino**, clique em **Iniciar**. O personagem procura e ataca monstros automaticamente. A segunda arena exige nível 5.
3. As quatro habilidades são usadas automaticamente por padrão. **1–4** também permitem acioná-las respeitando alvo, alcance, mana e recarga. **Z** usa uma poção de vida e **X**, de mana. Cada conta recebe dez pequenas de cada, uma única vez.
4. Observe a vida dos inimigos, os números de dano, EXP, ouro, contador de abates e drops. Os inimigos reaparecem entre 20 e 28 segundos depois de morrer, em suas regiões.
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

O nível sobre o personagem é atualizado ao evoluir, sem precisar sair da caçada. Os NPCs ainda usam a sombra provisória; o jogador já utiliza o Guerreiro Humano com animações próprias.

## Conteúdo e limites deste teste

- A cidade medieval é um mapa e arte próprios do projeto, com colisões correspondentes no cliente e no servidor. As duas caçadas utilizam o novo Pátio da Coroa, com arte e grade próprias, separado da praça segura. A praça medieval permanece segura, sem monstros.
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

São **39 testes automatizados**: protocolo, PNG, combate, habilidades, morte, progressão, itens, equipamentos, vendas, armazém, cidade e integração real WebSocket. Os novos testes verificam quadros distintos, transparência, ausência de corte das armas, alinhamento dos pés, efeitos locais e sincronização dos golpes. Também verificam apoio alternado dos pés, tronco estável, escala constante dos golpes e 50 ciclos consecutivos de reaparecimento (600 novas vidas). A integração também migra uma aparência antiga e verifica ouro, EXP, poções e item guardado após reiniciar o processo. Sem o ZIP, a integração é explicitamente pulada. O jogo e a prévia também são verificados no Chromium. Consulte **RESULTADO_TESTE.txt**.

Para reempacotar as fontes originais do guerreiro (não é necessário para jogar):

```bat
npm run art:warrior
npm run art:vfx
```

## Dados e isolamento

Conta e progresso: **.local-runtime/account.json**. Não apague essa pasta para conservar os dados. Senha armazenada com scrypt; tokens locais duram até oito horas no processo. Ao reiniciar o servidor, a entrada automática faz novo login.

Servidor somente em **127.0.0.1**. Não é uma instalação multiplayer/VPS pronta. Nenhuma conexão, proxy, conta ou sessão do servidor original é utilizada. O servidor adapta o rastro do Avanço de Luz no script entregue ao navegador, mantendo o ZIP de recursos intacto. Uma folha de estilo própria aplica o tema branco e dourado. O servidor fornece a cidade com `art/medieval-ivory-gold.png` e a arena com `art/royal-hunt.png`, cada uma com sua grade de colisão. Os demais recursos continuam sendo lidos do ZIP local.

O GitHub contém código próprio e adaptadores, com as artes próprias da cidade, da arena e do guerreiro e sem redistribuir o pacote capturado. Os outros jogos e branches foram preservados.

Diagnóstico: **http://127.0.0.1:5188/diagnostico**.
