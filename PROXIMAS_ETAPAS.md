# Reconstrução com os arquivos disponíveis

Decisão de 31/10/2026: construir o nosso servidor e jogo sobre o cliente e os recursos já fornecidos. O pacote não contém o servidor original. Não apresentar regras reconstruídas como se fossem as originais.

## Entregue

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

1. Revisar a Arqueira Elfa jogando; guerreiro aprovado preservado. Os quatro nomes e o conjunto foram aprovados; números novos, preços e forças das poções são valores iniciais para teste. Preferências de cada habilidade e poção permanecem independentes.
2. Definir e construir as três classes restantes: duas de cinco iniciais estão prontas (Guerreiro Humano e Arqueira Elfa). **Somente depois das cinco, trabalhar nos equipamentos**, conforme decisão de 01/11/2026. Não inventar silenciosamente as próximas três classes.
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
