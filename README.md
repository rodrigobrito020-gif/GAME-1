# Jogo local — 0.6.18: Shift corrigido e ataque com botão direito

Esta versão usa o cliente do seu `recursos-publicos.zip` com nosso servidor local. A cidade inicial agora é **Praça da Coroa**, um cenário próprio com palácio, comércio, armazém, fonte, jardins, muralhas e estandartes. A arquitetura usa pedra marfim, paredes brancas e telhados dourados.

A interface acompanha o padrão branco, marfim e dourado: painéis, HUD, chat, menus, loja, mochila, botões e confirmações. Texto escuro e cores de vida/mana preservam a leitura. As cores de raridade continuam identificando os itens.

## Atualização 0.6.18

- **Shift esquerdo corrigido:** tentar o dash durante a recarga, durante outro golpe ou diante de uma parede é uma recusa normal de gameplay. Não fecha a conexão e não encerra a caçada. Pressionamentos repetidos também são filtrados no cliente; a validação final continua no servidor.
- **Botão direito no inimigo:** seleciona o alvo e dá a ordem de se aproximar e atacar. No modo manual, usa ataques básicos somente nesse inimigo, sem ativar habilidades ou procurar outro alvo quando ele morre. WASD/setas, outra ordem de movimento, dash bem-sucedido, troca de modo e limpeza do alvo interrompem a ordem. No automático, o inimigo clicado vira a prioridade da caçada.
- Clique esquerdo/F e todos os visuais, habilidades, tempos e progressão da 0.6.17 mantidos.

## Atualização 0.6.17

- **Personagem mais nítido:** folhas de 128×128 por quadro, reamostradas das artes grandes originais. Mantém o tamanho no mundo, as roupas aprovadas, armadura equipada e as poses. Não é uma ampliação do PNG de 64 pixels. A prévia `/guerreiro` também usa as imagens maiores.
- **Modo manual ou automático:** botão no canto inferior direito da caçada. A escolha fica salva e não altera as habilidades que o jogador habilitou para automação. No manual, não há perseguição, patrulha ou uso automático de habilidades. No automático, as regras anteriores continuam funcionando, incluindo a ultimate com carga cheia e recarga concluída.
- **Manual:** WASD/setas para mover, Tab para escolher alvo, clique no inimigo ou F para um ataque básico ao alcance; 1–4 usam as habilidades. Ande até o inimigo para atacar. Cada golpe tem impacto e recuperação reais, sem repetição instantânea por spam.
- **Shift esquerdo:** dash direcional, separado do Avanço de Luz. Usa a direção de movimento ou a direção para a qual o personagem está olhando. Percorre até 128 unidades em 240ms, com intervalo de 2,5s; paredes encurtam ou bloqueiam o trajeto. Funciona na cidade e na caçada. Não concede invulnerabilidade nem atravessa colisões.
- **Monstros maiores e com papéis distintos:** guardião com golpe em área, arqueiro que recua e dispara flechas, feiticeiro que marca uma área antes do impacto. Os ataques têm preparação e alvo fixado; sair da marcação pode evitar o dano. Matar o conjurador cancela seu ataque pendente. As artes de monstros ainda usam o sprite-base disponível, com tamanhos e tons por papel; modelos próprios continuam nas próximas etapas.
- **Quatro ícones ilustrados novos:** linguagem visual marfim, luz e dourado sobre fundo azul escuro. Passar o mouse ou focar o botão mostra uma carta com efeito, custo, duração, recarga e atalho. Pressionar por 350ms consulta a carta sem lançar a habilidade; clique curto usa normalmente.
- Mantidos **Avatar 45s/60s**, **Égide 5min/120s**, equipamentos, itens, progressão e dados salvos.

Reconstruir as folhas maiores: `npm run art:hd`, depois de reconstruir as folhas básicas caso tenha alterado suas fontes. O jogo utiliza somente os PNGs já prontos. O recorte das novas ilustrações fica em `tools/pack-skill-icons.py` (ferramenta opcional de arte que usa Pillow).

## Atualização 0.6.16

- Espada inicial de ferro simples e escudo de madeira, preservando o corpo, roupas, rosto, encaixes e poses aprovados. Nenhum equipamento ou atributo foi concedido ao save.
- Avatar da Luz: **45 segundos de duração e 60 segundos de recarga**, contados do início da ativação; exige também 100 de energia. Usa automaticamente na caçada quando tiver carga cheia, recarga concluída e um alvo vivo, respeitando o golpe em andamento.
- Saves antigos recebem a automação da ultimate uma única vez. As escolhas das outras habilidades são preservadas; alterações posteriores da automação também ficam salvas.
- Égide de Luz: **5 minutos de duração e 120 segundos de recarga**. Como a duração é maior que a recarga, não gasta mana reaplicando uma proteção ainda ativa: renova depois que ela termina, sem acumular bônus.
- Sobre a cabeça aparece somente a duração ativa (minutos:segundos quando necessário). A recarga continua na barra de habilidades.
- `npm run art:weapons` reconstrói as armas e a variante equipada. As máscaras de cada pose também são usadas pela energia visual da ultimate.

## Quarta habilidade — Avatar da Luz

**Avatar da Luz (4)** é uma transformação temporária. O guerreiro ergue a espada, recebe uma coroa de ativação e mantém uma aura dourada. A energia da espada e do escudo acompanha o quadro real da animação: rosto, roupa, equipamento e identidade do personagem não são substituídos. A ativação leva 600 ms; depois o guerreiro continua andando e usando as três habilidades anteriores durante a transformação.

Valores atuais:

- **100 de energia** para ativar, sem gasto de mana. Começa em zero. Um impacto acertado dá +4, um ataque recebido +2 e cada inimigo derrotado +6. Um golpe em área não multiplica os +4 por quantidade de alvos. Não carrega na cidade, parado, contra um inimigo já morto ou durante a própria transformação.
- **45 segundos** ativos: ataques básicos atingem também inimigos vivos a até 100 unidades do alvo principal, uma vez por inimigo no impacto. O dano do ataque primário mantém seu valor anterior. O guerreiro recebe **35% menos dano**, depois da defesa normal/Égide, com mínimo de 1. A ultimate não cura nem dá invulnerabilidade.
- Intervalo mínimo de **60 segundos** entre ativações, além de precisar carregar novamente os 100 pontos. Energia e prazo da recarga ficam no save; sair/reentrar ou reiniciar não libera outra ativação. A transformação em si termina ao sair da caçada, morrer ou desconectar; morrer também zera a energia.

Na caçada, a barra acima das habilidades mostra a carga. Ao ficar pronta, **pressione 4 ou clique no quarto ícone**. A ativação manual funciona junto do combate automático das outras habilidades. Se houver um golpe em andamento, o Avatar aguarda a recuperação desse golpe, sem cancelar sua animação. A ultimate é automática por padrão nesta atualização, inclusive em saves antigos, e preserva as escolhas anteriores das outras habilidades. Também pode ser acionada manualmente quando pronta.

Acima da cabeça continua existindo **um único círculo de duração**: durante a transformação mostra o Avatar; ao terminar, volta à duração restante da Égide, caso ela ainda esteja ativa. A recarga fica na barra de habilidades e é restaurada corretamente ao recarregar o jogo. Aura e energia desaparecem na expiração, morte ou troca de cena.

Para examinar a habilidade isolada, abra **http://127.0.0.1:5188/guerreiro** e selecione **4 · Avatar da Luz**. A prévia não muda o inventário, a energia ou o save. `npm run art:avatar` reconstrói a aura, a ativação, o corte em área e o ícone a partir de `art/warrior/source/avatar-vfx.png`.

No Windows: feche o servidor antigo, extraia o novo ZIP, copie `.local-runtime` e `recursos-publicos.zip` da pasta anterior e abra `ABRIR_CLIENTE_COPIADO.bat`. Use Ctrl+F5 e confira **v0.6.15** no topo.

A implementação desta versão cobre o Guerreiro Humano. Os valores são provisórios para revisão jogando; as ultimates de outras classes ainda precisam de definição. A troca da espada e do escudo iniciais por modelos simples continua pendente: o jogador pediu para pausar essa alteração antes de aprovar a ultimate. Os sets do Lineage 2 continuam preservados como referência para adaptação 2D, conforme `LINEAGE_SETS.md`.

As seções abaixo registram versões anteriores.

> As seções de versões anteriores abaixo registram o histórico. Os tempos e indicadores vigentes são os da 0.6.16 descritos acima.

## Roupas redesenhadas nas próprias poses — 0.6.14

O visual da 0.6.13 foi rejeitado pelo jogador: as substituições de cor por máscaras deixaram blocos e contornos de armadura nas roupas. Esse processo foi retirado. As novas fontes em `art/warrior/source/novice/` trazem o personagem desenhado de camisa de linho, calça de tecido, cinto e botas de couro, com ombros e braços de roupa e sem capa ou saiote de armadura. Caminhada, golpes, salto, reações e repouso são empacotados dessas artes; não são pintados sobre as folhas antigas.

O corpo inicial continua sem armadura equipada. Equipar o peitoral existente modifica sua aparência e retirar restaura as roupas. Não há concessão de equipamentos nem reset de progresso. Cidade, mapas, inimigos, habilidades e seus tempos permanecem nas regras aprovadas. Acima da cabeça fica somente a duração da Égide; a recarga fica na barra.

No Windows, atualizar com o servidor fechado, copiar `.local-runtime` e `recursos-publicos.zip`, abrir `ABRIR_CLIENTE_COPIADO.bat`, usar Ctrl+F5 e conferir **v0.6.14**.

As seções abaixo são históricas. A técnica por máscaras descrita na 0.6.13 foi substituída nesta revisão.

## Roupas iniciais e um único indicador de duração — 0.6.13

- Sem peitoral equipado, o Guerreiro Humano usa camisa de linho, calça de tecido e botas simples, sem placas metálicas no corpo. As seis folhas de animação usam esse visual. Rosto, silhuetas, contato dos pés, espada, escudo e os movimentos aprovados continuam preservados.
- Equipar o peitoral de treino existente muda o tronco; retirar restaura as roupas simples. Não é preciso criar personagem novo. Saves que já têm o peitoral equipado continuam com a peça, sem perda de equipamento ou alteração de atributos.
- Acima do personagem aparece **somente DURAÇÃO**, em um círculo durante os 12 segundos da Égide. O círculo some ao terminar o buff. **A recarga permanece na barra nativa de habilidades**; não há segundo indicador nem contagem de recarga sobre a cabeça. Posição acima do nome e três escudos orbitais mantidos.
- Os sets do Lineage 2 preparados no GAME-1 continuam sendo a referência aprovada, do comum ao lendário. Seus catálogos, modelos e texturas são 3D; ainda não estão convertidos em todas as aparências desta base 2D. O peitoral de treino é a peça de teste existente, não um substituto desses sets. Ver [LINEAGE_SETS.md](LINEAGE_SETS.md) para as fontes e a correspondência de graus.
- `npm run art:clothes` reconstrói as roupas sem degradar as poses; `npm run art:armor` reconstrói a variante equipada. As referências anteriores ficam em `art/warrior/armored-reference` apenas para o empacotamento. A prévia `/guerreiro` identifica roupas iniciais e peitoral equipado.
- No Windows: fechar o servidor, extrair o ZIP novo, copiar `.local-runtime` e `recursos-publicos.zip` da pasta anterior e abrir `ABRIR_CLIENTE_COPIADO.bat`. Usar Ctrl+F5 e conferir **v0.6.13** no topo.

As seções abaixo são o histórico das versões; a regra atual dos indicadores é a descrita acima.

## Escudos legíveis, tempos acima do nome e primeiro peitoral visual — 0.6.12

- A Égide mantém **três escudos pintados orbitando na altura do corpo** durante a proteção. Eles acompanham caminhada, salto e ataque, passando pela frente e por trás do guerreiro. O tamanho mínimo na tela mantém a leitura mesmo com a câmera afastada. A órbita não depende do limite de efeitos decorativos do cliente. O aro no chão continua como complemento.
- **DURAÇÃO** e **RECARGA** aparecem em dois círculos acima de toda a identificação do personagem. Duração conta os 12 segundos do buff; recarga conta os 20 segundos até o próximo uso. O indicador antigo junto ao painel foi transferido para essa faixa. A posição considera o nome/barra já renderizados e é atualizada depois da câmera, para evitar a sobreposição durante deslocamento/zoom.
- O nível foi retirado da identificação acima do próprio jogador e do anúncio numérico flutuante de evolução. O nível no painel superior esquerdo, com foto e HP, continua atualizado. Níveis dos inimigos permanecem identificados.
- **Peitoral de treino:** novo desenho de aço azul, couro e prata, aplicado somente ao tronco. Equipar a peça muda a aparência no mapa, na mochila e na foto; retirar restaura o visual inicial. O mesmo conjunto de poses continua sendo usado. Rosto, braços, pernas, capa, espada, escudo e silhuetas originais são preservados. A capa continua cobrindo o peitoral nas costas.
- O visual deriva do item realmente equipado, sem conceder uma skin nem gravar uma aparência independente no save. A aparência retorna corretamente ao carregar o equipamento salvo. A peça conserva seus atributos existentes (+3 DEF e +25 HP); esta atualização não altera seus valores nem concede equipamentos.
- Esta primeira entrega cobre o único peitoral de armadura já existente na base local. Outras peças/modelos poderão ser acrescentados ao mesmo mapeamento quando seus itens e artes forem criados.
- Na prévia **/guerreiro**, a seleção de peitoral permite comparar o visual inicial com a peça de treino sem alterar o inventário da partida. O seletor é somente uma demonstração visual.
- O topo da tela identifica **v0.6.12**, facilitando conferir se a versão nova está aberta. O vídeo recebido mostra uma barra contendo apenas a primeira habilidade; a versão atual mantém as três habilidades disponíveis.

Defesa, custos e tempos da Égide, dash, cravada, loot, progressão e inventários mantêm as regras da versão anterior. Formação de equipes e múltiplas contas continuam pendentes nesta base local.

## Aura contínua e círculo de recarga — 0.6.11

A Égide agora mantém um **aro dourado com três pequenos escudos/luzes orbitando os pés**, em vez da cúpula discreta atrás do corpo. O efeito permanece em loop durante os 12 segundos de proteção, acompanha o deslocamento e se dissipa ao remover o buff. A borda em ouro escuro melhora a leitura sobre o piso claro do Pátio da Coroa. A ativação anterior foi preservada.

Acima do personagem aparece o ícone circular da Égide com um arco de progresso e a contagem da **recarga real de 20 segundos**. Ele acompanha o personagem, os movimentos da câmera e as mudanças de tamanho da janela. Não cobre o nome/barra de vida e não recebe cliques. Some quando a recarga termina, ao morrer/sair da tela ou ao trocar de cena; uma nova ativação reinicia a contagem. O relógio vem dos eventos de recarga do servidor.

O indicador de 12 segundos junto ao painel continua representando a **duração do buff**, e o círculo acima da cabeça representa a **recarga**. Portanto, a aura termina antes do círculo. A prévia também mantém a aura pelos 12 segundos reais. Defesa, custos, recarga, animações aprovadas, automação, progresso e inventários foram preservados. O adaptador local acrescenta apenas a comunicação dos indicadores de HUD; o ZIP capturado permanece intacto.

## Terceira habilidade — Égide de Luz (0.6.10)

**Égide de Luz (3)** é um buff de defesa. O guerreiro assume a postura de proteção, manifesta um escudo branco/dourado e recebe uma aura discreta. Um indicador junto ao painel do personagem mostra o tempo restante. As teclas 1 e 2 continuam sendo Avanço de Luz e Impacto de Luz.

- **Valores provisórios para avaliação:** DEF +30% sobre a defesa base dos equipamentos, arredondado para cima, com bônus mínimo de +2. Duração 12s, mana 10, recarga 20s. Não causa dano, não cura, não concede vida de escudo nem invulnerabilidade.
- Conjuração de 650ms; o bônus começa aos 300ms. O servidor aplica a defesa antes de calcular novos danos. Expiração, morte ou saída da instância removem o bônus e a aura. Sair/morrer antes da aplicação cancela o buff pendente. O bônus não se torna atributo permanente ao salvar/reabrir o jogo.
- O mesmo efeito não acumula. Outra aplicação pode renovar sua duração, mantendo um único bônus. A morte do conjurador não retira o buff de aliados vivos que já o receberam.
- A regra coletiva inclui o próprio guerreiro e **todos os jogadores e companheiros vivos do mesmo grupo e da mesma instância**, sem limite de distância dentro dela. Inimigos, desconhecidos, outros grupos e outras instâncias são excluídos. A lista de aliados vem do servidor; escolher um alvo pelo cliente não concede participação no grupo.
- **Limite desta versão local:** o jogo continua com uma única conta/um personagem local. Formação de grupos, contas multijogador, recrutamento de companheiros e a distribuição de estados entre jogadores ainda não existem. Portanto, na partida atual, o buff protege o guerreiro. A aplicação coletiva foi implementada no motor e validada com jogadores e companheiros em testes do servidor; não é um modo cooperativo já disponível na interface.
- O farm usa a proteção antes da aproximação quando há inimigos e o bônus está inativo. Depois, continua a combinação aprovada de dash e cravada, respeitando recargas e mana. Não desperdiça o buff com a arena vazia. Uma ordem automática vazia continua desativada; ordens anteriores ativas recebem a terceira habilidade uma única vez, preservando edições posteriores.
- Personagem, efeitos aprovados do dash/cravada, mapas, inventários, níveis e moedas foram preservados. A aplicação não concede itens.

A prévia em **http://127.0.0.1:5188/guerreiro** inclui o botão da terceira habilidade e as quatro direções. `client-defense-buff.mjs` encaminha apenas os eventos desse buff do próprio personagem para o indicador local; o cliente compatível continua renderizando as animações e a aura. O ZIP original de recursos permanece intacto.

## Duas habilidades no automático — 0.6.9

**Avanço de Luz (1)** e **Impacto de Luz (2)** agora funcionam juntos no farm. O guerreiro usa o dash contra um inimigo distante, respeita a recuperação e então salta/crava a espada em área quando está perto. Se uma habilidade estiver em recarga ou sem mana, os ataques básicos continuam normalmente. Não há nova regra de combo obrigatório: cada habilidade conserva seus requisitos, custo, recarga e animação aprovados.

Ao carregar um save anterior com habilidades automáticas ativadas, a ordem passa uma única vez para Avanço de Luz → Impacto de Luz. Uma ordem vazia continua desativada, e escolhas posteriores do jogador continuam salvas. Cidade, hunt, monstros, itens e progresso são preservados. Rascunhos das outras habilidades continuam bloqueados.

## Segunda habilidade — Impacto de Luz (0.6.8)

**Impacto de Luz (2)**: o guerreiro salta, segura a espada com as duas mãos e crava a lâmina no chão. O escudo acompanha o antebraço esquerdo. A onda de luz, fissuras e partículas dissipam no piso sem travar o corpo durante toda a duração do efeito.

- Preparação de 100ms, salto até 550ms, dano único na aterrissagem e recuperação até 950ms. A posição no chão permanece fixa; não há teleporte nem tremor de câmera.
- Área de 150 unidades ao redor da posição inicial do guerreiro. O servidor verifica os inimigos vivos dentro do círculo no instante do impacto, inclusive quem entrar/sair durante o salto. A morte do alvo inicial não cancela o impacto nos demais.
- Alcance de ativação 75, dano 2,5× ataque, custo 12 de mana e recarga 7s são **valores provisórios para avaliação**, ainda sujeitos à aprovação de balanceamento.
- Para avaliar a segunda habilidade, a ordem automática antiga passa uma única vez a conter somente Impacto de Luz. Uma ordem vazia continua desativada; alterações posteriores do jogador são preservadas. Avanço de Luz permanece no atalho 1 com seu comportamento aprovado. Rascunhos das habilidades 3/4 seguem bloqueados.
- Cidade, hunt, navegação, monstros, inventário e progresso são preservados. Nenhum item ou atributo é concedido. Morrer ou sair da hunt cancela dano pendente.
- Prévia quadro a quadro e nas quatro direções em **http://127.0.0.1:5188/guerreiro**. A folha técnica `axeheavy` é o nome compatível com o renderizador e contém exclusivamente nossas novas poses de espada com duas mãos.

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

A atualização troca apenas a aparência do jogador. Não concede equipamentos, não substitui itens e não reinicia nível, ouro, EXP, mochila ou armazém. NPCs e monstros conservam os visuais provisórios atuais. A espada e o escudo desenhados continuam no visual básico. A partir da 0.6.12, equipar o peitoral de treino também muda o tronco; as demais peças aguardam modelos próprios.

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
