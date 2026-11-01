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
| Espada básica e golpe de retorno |  400 ms |  150 ms |
| Avanço de Luz                    |  550 ms |  300 ms |
| Investida                        |  600 ms |  250 ms |
| Golpe Destruidor                 |  850 ms |  400 ms |
| Fúria do Guerreiro               |  600 ms |  250 ms |

`warrior.mjs` compartilha durações/impactos com o servidor e fornece as sequências. `warrior-fx.mjs` mantém os efeitos separados da arte do corpo. As próximas classes devem receber identificadores e ações próprios seguindo o mesmo contrato.

## Verificar

Com o servidor aberto: **http://127.0.0.1:5188/guerreiro**. A prévia permite ver direções, caminhada, os dois golpes básicos, habilidades, ferido e caído, com pausa e passo a passo. A verificação no cliente também cobre caminhada WASD, combate real e reaparecimento dos inimigos.

Aparência inicial fixa: equipamentos alteram atributos, ainda não as peças desenhadas. Corrida sem poses exclusivas. O grito de guerra vira de frente nas direções laterais. NPCs e monstros conservam suas aparências provisórias. Ainda há espaço para refinamento artístico dos quadros.

## Habilidades e escudo — 0.6.2

As fontes de torso, espada e reação agora incluem o escudo na esquerda. A separação das poses usa núcleos opacos e proximidade para preservar pontas de lâmina sem capturar a névoa entre as linhas da fonte. A calibração lateral de repouso mantém a sola no plano comum.

`source/skills-vfx.png` contém quatro artes pintadas originais em transparência. `npm run art:vfx` monta nove flipbooks de 128px, com deformação, partículas, antecipação e dissipação. `warrior-vfx.mjs` centraliza os metadados e `warrior.mjs` compartilha os instantes de impacto com o servidor. Efeitos disparados no início da ação possuem quadros de preparação; os efeitos de contato iniciam no dano. A fissura usa `inteiro: true` para não ser encerrada prematuramente pelo evento de impacto do cliente.

Armadura, espada e escudo são a aparência base. Não há item de escudo nem nova defesa/bloqueio concedidos por esta arte. A área atrasada é avaliada na posição marcada no chão, com os ocupantes presentes no impacto.

## Limpeza e agilidade — 0.6.3

Fontes revisadas com cabeça/rosto mais legíveis e contornos mais marcados. A montagem usa amostragem pontual para não dissolver olhos e contornos na redução para 64px. As máscaras são individuais por peça: um recorte não pode herdar pixels da espada ou cabeça da linha vizinha, mesmo que os retângulos se cruzem. A névoa semitransparente do fundo não é conteúdo de personagem. Componentes muito altos de poses adjacentes são separados antes do empacotamento.

As ações do corpo agora duram 400–850ms, com efeito visual independente e mais longo. Não há tremores de câmera nessas ações; o salto usa altura discreta de 8 unidades. O desenho permanece uma base de 64px, sem troca visual de equipamentos. NPCs e monstros ainda usam sprites provisórios.

## Primeira habilidade — Avanço de Luz (0.6.4)

`WARRIOR_LIGHT_DASH` compartilha alcance, preparação, fim do avanço e distância de contato. `humano-avanco-luz` usa preparação, corrida, ataque na chegada e recuperação (550ms). A posição é deslocada no servidor; não usar `motion.dash`, pois o cliente adicionaria outro deslocamento visual e retorno. O rastro de luz é uma animação própria montada a partir da arte de vento, com partículas claras/douradas; o contato usa faíscas de luz. As demais três habilidades permanecem inalteradas.

Prévia inclui uma travessia em sentido único para demonstrar a ação. Colisão, alcance e dano são testados no jogo e no servidor, não apenas na prévia.
