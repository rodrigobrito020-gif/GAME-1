# Personagem 01 — Guerreiro Humano

Arte original criada em 01/11/2026 para este projeto com a ferramenta de geração de imagens da OpenAI. Homem adulto de cabelo castanho escuro, armadura de marfim com ouro, couro marrom, capa curta e espada de aço. Não usa capacete nem escudo nesta aparência inicial.

## Folhas entregues

| Arquivo     | Quadros por direção | Uso                                                                                           |
| ----------- | ------------------: | --------------------------------------------------------------------------------------------- |
| idle.png    |                   4 | Repouso e respiração                                                                          |
| walk.png    |                   4 | Ciclo de caminhada                                                                            |
| run1.png    |                   4 | Mesmo ciclo de pernas, com cadência maior                                                     |
| weapon.png  |                   6 | Preparação, elevação, corte, seguimento e recuperação; o último quadro sustenta a recuperação |
| special.png |                   6 | Neutro, preparar salto, ferido, ajoelhar, grito de guerra, caído                              |

Cada quadro mede **64 × 64 pixels**, com pés em **(32,60)** e linhas **frente, esquerda, direita, costas**. O renderer do cliente exibe o quadro em escala 2. Espada e capa pertencem à arte do corpo e seguem a mão/ombro; não há uma arma flutuante sobreposta.

As fontes de alta resolução estão em `source/`. `tools/pack-warrior.mjs` recorta as silhuetas conectadas para conservar as espadas/capas que ultrapassaram as divisões da folha, alinha o apoio dos pés e exporta PNGs RGBA com margens transparentes. A pose muito larga de extensão horizontal não é usada para evitar encolher o corpo. O grito de guerra volta de frente nas direções laterais. `manifest.json` registra dimensões, recortes, escala e espelhamento.

## Contrato para as próximas classes

`warrior.mjs` concentra o identificador da aparência, as folhas e as sequências com passos de 50 ms. A mesma definição de duração e impacto é usada pelo servidor de combate; os efeitos ficam separados em `warrior-fx.mjs`. Não alterar o identificador do guerreiro para criar outra classe: cada classe receberá uma aparência e movimentos próprios usando este contrato de quadros, direção e pivô.

| Ação               | Duração | Impacto |
| ------------------ | ------: | ------: |
| Espada básica      |  550 ms |  200 ms |
| Corte Poderoso     |  700 ms |  350 ms |
| Investida          |  650 ms |  400 ms |
| Golpe Destruidor   |  900 ms |  600 ms |
| Fúria do Guerreiro |  800 ms |  300 ms |

O servidor inicia a ação, reserva sua recuperação e só aplica dano no impacto. Não sobrepõe ataque básico e habilidade. Morte/saída da arena cancela os impactos pendentes. Reações leves a dano são usadas entre ações, sem interromper uma habilidade em andamento.

## Revisão

Com o servidor aberto: `http://127.0.0.1:5188/guerreiro`. A prévia permite pausar, avançar quadros e conferir as quatro direções. Não substitui os testes no jogo: cidade, WASD, caça automática, habilidades, EXP e drops também foram exercitados no cliente.

Esta é a primeira versão integrada para avaliação. Ainda faltam uma corrida com poses exclusivas, troca visual de peças ao equipar itens e variantes de aparência. Os quadros gerados podem receber refinamentos manuais de consistência nas próximas revisões. Os NPCs e monstros não foram substituídos por este personagem.
