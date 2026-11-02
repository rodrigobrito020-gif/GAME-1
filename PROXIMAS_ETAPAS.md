# Reconstrução com os arquivos disponíveis

Decisão de 31/10/2026: construir o nosso servidor e jogo sobre o cliente e os recursos já fornecidos. O pacote não contém o servidor original. Não apresentar regras reconstruídas como se fossem as originais.

## Referência principal de todas as classes — 02/11/2026

Orientação expressa do jogador: **o guerreiro é a base para todas as outras classes, atuais e futuras**. Usar o guerreiro aprovado como referência de proporções estáveis, fluidez e peso dos movimentos, preparação/disparo/recuperação das habilidades, impactos, Dash e energia de Ki vinculada ao corpo nas ultimates. Cada classe mantém sua identidade, armas, cores e mecânicas próprias, seguindo esse padrão de qualidade e coerência.

O jogador aprovou o resultado da 0.6.37 após a revisão da arqueira e pistoleira. Preservar essa versão aprovada e comparar futuras alterações com o guerreiro antes de entregar. A arqueira e a pistoleira aprovadas complementam a referência; o guerreiro continua sendo a base principal.

## Primeira habilidade dos melees e fúria do Orc — 02/11/2026

Pedido expresso do jogador após aprovar o Orc: **toda classe de combate corpo a corpo deve ter avanço na primeira habilidade**. Guerreiro mantém Avanço de Luz; Berserker recebe Avanço Selvagem no slot 1, preservando o identificador salvo `corte-selvagem`. Usar a mesma validação de percurso, chegada, colisão e dano do guerreiro. Aplicar esse padrão aos futuros melees.

Fúria Ancestral do Orc: pedido de 1 minuto ativo, recarga de 3 minutos, mais regeneração de vida, corrida em direção ao alvo, ataque e velocidade de ataque. Bônus iniciais implementados na 0.6.39: ATK +30%, AS +50%, regeneração de 2% HP máximo/s, corrida real a 300 unidades/s. Mantidos os bônus anteriores de redução de dano e básicos em área. A convenção foi informada ao jogador: recarga de 180s a partir do uso (60s ativos e cerca de 120s restantes após o fim). Corrida com poses próprias; caminhada, aparência, porte e identidade vermelha aprovados preservados. Todos os bônus voltam ao normal quando a fúria acaba.

## Berserker Orc e recurso de ultimate — 02/11/2026

Quarta classe escolhida expressamente pelo jogador: Berserker da raça Orc. O jogador esclareceu que o Orc tem porte bem maior e que sua cor predominante é vermelha. Primeira versão 0.6.38: pele verde, machado de duas mãos, corpo robusto, 30% mais alto que o guerreiro e escala fixa em todas as poses. Corte Selvagem, Ruptura da Terra, Grito de Guerra e Fúria Ancestral são o conjunto inicial para teste. Mesma base de animação/impacto/Ki do guerreiro, com identidade vermelha; manter as outras classes aprovadas.

Pedido adicional do jogador: todas as classes devem ter a barra de ultimate acima do HP no painel do personagem, em vez de sobre a interface de habilidades. A tecla 4 e as opções por habilidade permanecem na barra. A 0.6.38 integra o medidor ao painel, na cor da classe, também na cidade.

## Decisão sobre ultimates — 02/11/2026

Todas as próximas ultimates devem usar energia de Ki vinculada ao corpo e às armas, com a apresentação do guerreiro como referência e a cor da própria classe. A 0.6.36 aplica o mesmo movimento às três classes. Não reintroduzir molduras ou imagens fixas atrás dos personagens.

## Padrão de proporções — 02/11/2026

Arqueira e pistoleira usam a família de fontes coherent-v36, exportada por tools/pack-class-animations.py. Uma figura neutra é compartilhada pelos estados equivalentes. A exibição dessas classes tem escala fixa; os quadros mudam pose, sem ajuste de tamanho por animação. Reações e ultimates também precisam respeitar esse padrão. Ao alterar uma fonte, reconstruir retratos e todas as máscaras de energia e conferir repouso, caminhada nas quatro direções, ataques, buffs, ultimate e derrota. As ferramentas antigas encaminham a exportação para a família atual, para evitar regressão às poses anteriores.

## Habilidades a distância — 02/11/2026

O jogador confirmou que a diferença para o guerreiro inclui o movimento do corpo e os efeitos. A 0.6.37 acrescenta transferência de peso/recuo por tempo da ação e impactos com 16 quadros distintos, além de chuvas com queda acelerada/rastros e campos móveis. Os corpos da 0.6.36, escala fixa, caminhada, Ki e level up ficam preservados. Não compensar animação ausente aumentando uma imagem estática nem alterar dano/cadência para sincronizar efeitos. Auras devem usar o deslocamento/rotação da exibição HD. Apresentação da 0.6.37 aprovada pelo jogador em 02/11/2026.

## Entregue

- 0.6.39: avanço na primeira habilidade do Orc no padrão do guerreiro; Fúria Ancestral com 60s ativos/180s de recarga, ATK, AS, regeneração e corrida própria.

- 0.6.38: Berserker Orc, porte 30% maior, machado de duas mãos, quatro habilidades iniciais e energia vermelha no padrão do guerreiro; barra de ultimate acima do HP nas quatro classes. Aparência do Orc aprovada pelo jogador; combate ajustado na 0.6.39 conforme o pedido.

- 0.6.37: movimento de preparação/recuo/recuperação das classes a distância e habilidades com impactos animados. Chuvas em três ondas, rastros e partículas móveis, sem o grande desenho fixo de área. Guerreiro e restante aprovado preservados.

- 0.6.36: arqueira e pistoleira com revisão de todas as poses, escala uniforme fixa e uma figura neutra compartilhada entre repouso/preparação/recuperação. Passadas com apoio alternado e figuras completas no padrão do guerreiro. Ki nas três ultimates com cores próprias. Level up com anel texturizado, runas, descargas, espirais e setas conforme as duas referências. Avaliação visual do jogador pendente.

- 0.6.35: Avatar da Luz com Ki dourado gerado junto à silhueta, superfície e bordas das poses, incluindo peitoral de treino; retirada da imagem de fundo. Celebração original de nível inspirada no Ragnarok nas três classes, por evento real e sem repetir no login. Repouso da pistoleira alinhado ao modelo atual da caminhada após o vídeo. Restante do jogo preservado; avaliação visual do jogador pendente.

- 0.6.34: cabeça completa na caminhada norte da elfa, caminhada da pistoleira alinhada ao modelo parado, rastro único de Dash com duração independente e passos mais suaves. Desenhos próprios de espada/flecha nos impactos do guerreiro/arqueira; Soulshot violeta da pistoleira preservado. Auras regeneradas para as poses corrigidas. Revisão visual pelo jogador pendente.

- 0.6.33: energia das ultimates da arqueira e pistoleira vinculada à silhueta e superfície de cada pose, com luz animada no corpo/armas e partículas em camadas. Visual do guerreiro preservado. Impactos de habilidades com cores próprias e sons do pacote nas três classes, usando volume/mute nativos. “Animais” foi esclarecido pelo jogador como animações de impacto, sem pedido de animais no cenário. Revisão visual do jogador pendente.

- 0.6.32: tiros da pistoleira com clarão direcional, rastro luminoso, cartuchos e recuo visual curto; números de dano maiores e impacto inspirado em Soulshot nos acertos reais contra monstros das três classes. Apresentação da queimadura separada dos tiros. Valores e cadência preservados; revisão visual do jogador pendente.

- 0.6.31: Disparo Sombrio com queimadura de 5s sem acúmulo; Chuva de Balas com pose para o alto e três ondas de dano na área; Eclipse com energia de corpo inteiro e armas iluminadas acompanhando todas as poses. Ícones/cartas atualizados. Proporções e movimento aprovados preservados.

- 0.6.30: proporções da pistoleira revistas em todas as poses com referência na arqueira; tiros, impactos, Rajada e Eclipse com violeta/dourado mais visíveis. As outras classes e regras de combate são preservadas. Avaliação artística pelo jogador pendente.

- 0.6.25: aura corporal verde, caminhada vertical redesenhada, habilidade 1 com três flechas em cone e Dash com a cor da classe. Poções compactas ao lado da barra: uma HP/uma mana, tipo selecionado, AUTO/MANUAL e limites persistentes. Revisão visual do jogador pendente. As próximas classes devem registrar sua cor, movimento e ícone do Dash em class-visuals.mjs.

- 0.6.24: arqueira revisada após dois vídeos: soltura sincronizada, flechas orientadas corretamente, Chuva com pose própria e três ondas, efeitos de buffs com menos sobreposição e mira estável. Afastamento curto entre disparos sob pressão próxima, com colisão e intervalo. Guerreiro aprovado preservado; revisão visual da arqueira pelo jogador pendente.

- 0.6.23: revisão da caminhada após o vídeo: fases laterais de contato/passagem, poses verticais existentes preservadas, cadência por distância e conclusão da parada. Camada HD com oito quadros, peitoral e efeitos alinhados à pose visível. Revisão do movimento pelo jogador pendente.

- 0.6.22: substituída a montagem rejeitada de tronco/pernas por figuras completas com referência corporal comum, novas poses para as duas classes e escala constante no mapa. Artes em quadros de 384px, rastro e máscaras da ultimate compatíveis, retratos uniformes e comparação interativa em `/personagens`. Revisão visual do jogador pendente: os testes de código não significam aprovação da arte.

- 0.6.21: corrigidos quadril, proporções e encaixe de coxas/joelhos/botas nos dois personagens e na variante com peitoral. Removida a sobreposição da calça fixa sobre as pernas móveis; postura lateral parada sem agachamento permanente e cadência ajustada à passada. Reconstruídas folhas HD/nativas e retratos, preservando o combate e os dados salvos.

- 0.6.20: Arqueira Elfa com arte própria, disparos e quatro habilidades aprovadas, mais o Dash comum. Troca de classe na cidade preserva inventários/equipamentos/progresso e lembra automação por classe. Seis poções HP/mana, níveis 1/55/150, Manual/Auto e limites 30/50/70% independentes. Indicadores simultâneos de todos os buffs, cada um com duração e carta.

- 0.6.19: retirada do modo manual global; caça automática com AUTO/MANUAL por habilidade e escolhas salvas. Dash universal na barra/Shift, manual por padrão e com evasão de marcações no AUTO. Ícones de efeitos ativos iguais aos da barra, com carta e tempo restante ao consultar.

- 0.6.18: corrigido o fechamento indevido da conexão ao repetir o dash durante a recarga; adicionado botão direito para aproximar/atacar o inimigo escolhido, com interrupção por movimento/dash e parada após a morte do alvo no modo manual.

- 0.6.17: personagem em 128px a partir das fontes originais, dash direcional no Shift esquerdo, alternância persistente manual/automático, inimigos maiores com preparação, flechas e ataque mágico em área, quatro ícones ilustrados e cartas de habilidade por hover/foco/pressionamento longo. Valores de ultimate e Égide mantidos.

- 0.6.16: espada de ferro simples e escudo de madeira; energia do Avatar adaptada às novas armas. Avatar automático também nos saves anteriores: 45s de duração, 60s de recarga e energia 100. Égide: 5min de duração e 120s de recarga, renovada após expirar, sem acumular defesa. Indicador único de duração em m:ss.

- 0.6.15: Avatar da Luz na tecla/ícone 4, energia real de combate, transformação de 8s, ataque básico em pequena área e redução de dano. Manual por padrão; aura e armas de energia seguem as poses, indicador único de duração e recarga persistente. Valores iniciais para teste.

- 0.6.14: roupas redesenhadas nas próprias artes das poses; removida a substituição por máscaras da 0.6.13, rejeitada pelo jogador. Sem capa/saiote no corpo inicial. Preparação compacta preserva a escala do personagem; peitoral visível também nas costas.

- 0.6.13: roupas simples sem peitoral equipado; armadura apenas com a peça equipada. Acima do personagem, somente a duração da Égide; recarga apenas na barra de habilidades.

- 0.6.1: caminhada articulada e alternada, ataques com escala estável e combo, Pátio da Coroa próprio para as hunts e reaparecimento dos monstros com novas identidades para impedir invisibilidade após a morte.

- 0.6.0: Guerreiro Humano original integrado ao jogador, folhas de repouso/caminhada/espada/reações, quatro habilidades com efeitos próprios, impacto sincronizado e prévia interativa. Progresso e equipamentos preservados.

- 0.5.1: corrigido o pivô dos monstros para que sprites e barras de vida sejam desenhados dentro da tela na hunt.

- 0.2: login local, cidade, movimento e colisões.
- 0.3: caçadas de teste, combate automático, quatro habilidades, morte e retorno, EXP, ouro, drops, equipamentos e dados salvos.
- 0.5: cidade medieval própria (Praça da Coroa), paleta branca/marfim/dourada, interface correspondente e colisões separadas das arenas.
- 0.4: NPCs de mercador/armazém/guia, compra de poções, venda de itens, proteção de itens travados, armazenamento persistente, prévia e aplicação de melhores equipamentos, ordenação e correção do nível sobre o personagem.

## Próximas partes da construção

1. Guerreiro, arqueira e pistoleira aprovados pelo jogador na 0.6.37. Revisar o Berserker Orc no jogo após a 0.6.38. Registro histórico da revisão anterior da pistoleira na 0.6.33: energia no corpo da arqueira/pistoleira, sons e animações de impacto das habilidades. Dano contínuo e duração da queimadura são valores iniciais para teste. Guerreiro e arqueira aprovados preservados; preferências de habilidades e poções permanecem independentes.
2. Após concluir o Berserker Orc (quarta classe), o jogador definirá a quinta classe inicial. **Somente depois das cinco, trabalhar nos equipamentos**, conforme decisão de 01/11/2026. Não inventar silenciosamente as próximas classes.
3. Ambientes de caça próprios, inimigos variados e chefes. Cidade e arena já têm mapas próprios; faltam novos ambientes e inimigos com artes distintas.
4. Reaproveitar os sets do Lineage 2 já preparados no GAME-1: comum/No Grade, incomum/D, raro/C, épico/B e lendário/A. Adaptar os modelos/texturas 3D para as poses 2D e vincular cada peça ao slot equipado, com bônus de conjunto completo. Não substituir esse catálogo por equipamentos novos genéricos. Fontes e limites atuais em `LINEAGE_SETS.md`. Balancear recompensas com testes de jogo.
5. Expandir os demais sistemas escolhidos para o nosso jogo. Menus existentes no cliente não significam que o servidor desses sistemas foi implementado.
6. Ampliar a identidade visual aprovada: branco, marfim e dourado. A cidade e os painéis principais já seguem essa direção na 0.5.

## Decisões ainda em aberto

- Nome final do jogo e artes das próximas classes/monstros. A paleta branca/marfim/dourada e a cidade medieval foram aprovadas em 31/10/2026. Começar pelo Guerreiro Humano e usá-lo como base das outras classes foi aprovado em 01/11/2026; a aparência inicial da 0.6 fica disponível para revisão visual.
- Números definitivos de combate, progressão, preços e drops. Os atuais são de teste.
- Quais sistemas do cliente serão mantidos ou removidos; não remover menus nesta etapa.
- Regras de multiplayer e hospedagem desta nova base. O servidor atual serve somente uma conta local.

Preservar progresso ao atualizar: copiar `.local-runtime` com o servidor fechado. Testar as mudanças e entregar o ZIP do GitHub, como solicitado pelo usuário.

- Entregue em 0.6.26: contraste dos efeitos da arqueira no cenário claro (contornos, rastros, área e impactos); nova revisão visual do jogador pendente.

- Entregue em 0.6.27: efeitos da arqueira com texturas de flechas/folhas verde e dourado, substituindo os contornos da 0.6.26; aguarda avaliação visual do jogador.
- Também em 0.6.27: aura da ultimate aberta e suave; bônus da ultimate trocado de ataque para +50% de velocidade de ataque (1s para ~0,667s entre disparos), preservando os demais valores.

- 0.6.28: terceira classe inicial integrada — Pistoleira Dark Elf, visual aprovado, quatro habilidades iniciais, Dash violeta, controles e galeria. Aguardar avaliação no jogo; equipamentos completos seguem adiados até concluir as cinco classes.

- 0.6.29: caminhada vertical da pistoleira refeita com cabeça completa, mira mantida entre disparos, efeitos distintos de Disparo/Rajada/Instinto e órbita de Eclipse. Aguardar nova avaliação visual do jogador.
