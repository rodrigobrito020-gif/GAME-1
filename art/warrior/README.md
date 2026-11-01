# Personagem 01 — Guerreiro Humano

Arte original criada em 01/11/2026 com a ferramenta de geração de imagens da OpenAI. Homem de cabelo escuro, rosto visível, armadura marfim/dourada, couro marrom, capa curta, espada de aço na direita e escudo no braço esquerdo.

## Correção de movimento — 0.6.1

A folha inicial continha poses com a mesma perna à frente e mudava o centro do corpo ao alinhar o pé que avançava. A correção substitui essa sequência por um pequeno esqueleto 2D: cada perna tem quadril, joelho e pé, com uma fase de apoio e outra de avanço. A fonte `source/walk-parts.png` contém as peças originais, e `warrior-walk-rig.mjs` compõe os quadros com transformações afins e articulação dos joelhos. Não depende de gerar separadamente cada pose de caminhada.

O eixo é o quadril em x=32, com oscilação vertical de até 0,7 pixel. As duas poses de contato mantêm o mesmo tronco. As pernas alternam apoio a cada meia passada. As direções laterais são espelhadas depois da composição, preservando escala, anatomia e cadência. A passada de 96 unidades no mundo considera a escala 2 do renderer e a compensação do pé de apoio na caminhada lateral. A cadência da prévia acompanha a definição do rig.

Os ataques usam a nova fonte `source/sword-v2.png`. A escala de todos os quadros é constante, com eixo horizontal no quadril e apoio no chão. Erguer a espada não encolhe o corpo. O ataque básico alterna corte descendente e golpe de retorno, com preparação, impacto e recuperação. As habilidades usam sequências próprias desses quadros e as reações de `source/reactions.png`.

## Contrato das folhas

Cada quadro tem **64 × 64 pixels**, pés em **(32,60)**, linhas **frente, esquerda, direita, costas** e escala 2 no renderer.

| Folha       | Quadros por direção | Uso                                                                    |
| ----------- | ------------------: | ---------------------------------------------------------------------- |
| idle.png    |                   4 | Repouso com respiração discreta                                        |
| walk.png    |                   4 | Contato esquerdo, passagem direita, contato direito, passagem esquerda |
| run1.png    |                   4 | Mesmo ciclo com cadência maior                                         |
| weapon.png  |                   6 | Guarda, preparação, espada alta, corte, seguimento, recuperação        |
| special.png |                   6 | Neutro, preparar salto, ferido, ajoelhar, grito, caído                 |

`npm run art:warrior` reempacota as fontes em PNGs RGBA. `manifest.json` registra as poses articuladas, os recortes, as escalas e os espelhamentos. O servidor entrega apenas os PNGs prontos: não precisa montar o esqueleto durante o jogo.

| Ação                             | Duração | Impacto |
| -------------------------------- | ------: | ------: |
| Espada básica e golpe de retorno |  500 ms |  200 ms |
| Corte Poderoso                   | 1400 ms |  700 ms |
| Investida                        | 1300 ms |  750 ms |
| Golpe Destruidor                 | 1900 ms | 1100 ms |
| Fúria do Guerreiro               | 1700 ms |  700 ms |

`warrior.mjs` compartilha durações/impactos com o servidor e fornece as sequências. `warrior-fx.mjs` mantém os efeitos separados da arte do corpo. As próximas classes devem receber identificadores e ações próprios seguindo o mesmo contrato.

## Verificar

Com o servidor aberto: **http://127.0.0.1:5188/guerreiro**. A prévia permite ver direções, caminhada, os dois golpes básicos, habilidades, ferido e caído, com pausa e passo a passo. A verificação no cliente também cobre caminhada WASD, combate real e reaparecimento dos inimigos.

Aparência inicial fixa: equipamentos alteram atributos, ainda não as peças desenhadas. Corrida sem poses exclusivas. O grito de guerra vira de frente nas direções laterais. NPCs e monstros conservam suas aparências provisórias. Ainda há espaço para refinamento artístico dos quadros.

## Habilidades e escudo — 0.6.2

As fontes de torso, espada e reação agora incluem o escudo na esquerda. A separação das poses usa núcleos opacos e proximidade para preservar pontas de lâmina sem capturar a névoa entre as linhas da fonte. A calibração lateral de repouso mantém a sola no plano comum.

`source/skills-vfx.png` contém quatro artes pintadas originais em transparência. `npm run art:vfx` monta nove flipbooks de 128px, com deformação, partículas, antecipação e dissipação. `warrior-vfx.mjs` centraliza os metadados e `warrior.mjs` compartilha os instantes de impacto com o servidor. Efeitos disparados no início da ação possuem quadros de preparação; os efeitos de contato iniciam no dano. A fissura usa `inteiro: true` para não ser encerrada prematuramente pelo evento de impacto do cliente.

Armadura, espada e escudo são a aparência base. Não há item de escudo nem nova defesa/bloqueio concedidos por esta arte. A área atrasada é avaliada na posição marcada no chão, com os ocupantes presentes no impacto.
