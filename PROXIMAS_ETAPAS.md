# Reconstrução com os arquivos disponíveis

Decisão de 31/10/2026: construir o nosso servidor e jogo sobre o cliente e os recursos já fornecidos. O pacote não contém o servidor original. Não apresentar regras reconstruídas como se fossem as originais.

## Entregue

- 0.2: login local, cidade, movimento e colisões.
- 0.3: caçadas de teste, combate automático, quatro habilidades, morte e retorno, EXP, ouro, drops, equipamentos e dados salvos.
- 0.5: cidade medieval própria (Praça da Coroa), paleta branca/marfim/dourada, interface correspondente e colisões separadas das arenas.
- 0.4: NPCs de mercador/armazém/guia, compra de poções, venda de itens, proteção de itens travados, armazenamento persistente, prévia e aplicação de melhores equipamentos, ordenação e correção do nível sobre o personagem.

## Próximas partes da construção

1. Personagem próprio e animações de repouso, andar, ataque, habilidade e morte; monstros com aparência distinta.
2. Criação de personagens e classes, usando um catálogo próprio de habilidades e equipamentos.
3. Ambientes de caça próprios, inimigos variados e chefes. As arenas conservam o mapa capturado anterior; a cidade medieval da versão 0.5 já é própria.
4. Ampliar os equipamentos, raridades e progressão; balancear as recompensas com testes de jogo.
5. Expandir os demais sistemas escolhidos para o nosso jogo. Menus existentes no cliente não significam que o servidor desses sistemas foi implementado.
6. Ampliar a identidade visual aprovada: branco, marfim e dourado. A cidade e os painéis principais já seguem essa direção na 0.5.

## Decisões ainda em aberto

- Nome final do jogo e artes próprias de personagens e monstros. A paleta branca/marfim/dourada e a cidade medieval foram aprovadas em 31/10/2026.
- Números definitivos de combate, progressão, preços e drops. Os atuais são de teste.
- Quais sistemas do cliente serão mantidos ou removidos; não remover menus nesta etapa.
- Regras de multiplayer e hospedagem desta nova base. O servidor atual serve somente uma conta local.

Preservar progresso ao atualizar: copiar `.local-runtime` com o servidor fechado. Testar as mudanças e entregar o ZIP do GitHub, como solicitado pelo usuário.
