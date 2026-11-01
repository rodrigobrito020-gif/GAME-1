# Reconstrução com os arquivos disponíveis

Decisão de 31/10/2026: construir o nosso servidor e jogo sobre o cliente e os recursos já fornecidos. O pacote não contém o servidor original. Não apresentar regras reconstruídas como se fossem as originais.

## Entregue

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

1. Refinar o Guerreiro Humano após a revisão visual do jogador. Criar variações visuais de equipamentos, corrida dedicada e artes distintas dos monstros e NPCs; o humano inicial já está integrado.
2. Criação de personagens e classes, usando um catálogo próprio de habilidades e equipamentos.
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
