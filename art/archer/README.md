# Arqueira Elfa — arte própria

Fontes ilustradas criadas para este projeto em `source/`. Roupas iniciais simples, arco de madeira, trança e orelhas élficas. Os ataques têm repouso, preparação, tensão, disparo e recuperação nas quatro direções. Frente/costas possuem poses próprias de disparo; a lateral é espelhada para manter a mesma personagem.

`npm run art:archer` reconstrói as folhas de `source/` com os recortes do corpo e das pernas. Caminhada articula pernas alternadas no mesmo sistema aprovado para o guerreiro. `tools/pack-archer-icons.py` reconstrói ícones e VFX (Pillow opcional). Python não é necessário para jogar.

Contrato: quadro de 128px na exibição HD e 64px no cliente nativo; quatro linhas S/O/L/N, pés em (64,120)/(32,60), fundo transparente. O corpo HD acompanha posição, orientação, impacto, visibilidade e animação nativos, sem mudar o tamanho no mundo. `manifest.json` registra as poses de ataque/reação e escalas. A maior silhueta conectada de cada recorte elimina fragmentos de células vizinhas.

Equipamentos por peça ficam para depois da conclusão das cinco classes iniciais, conforme decisão do jogador. Esta arte inicial não concede itens nem troca equipamentos no inventário.
