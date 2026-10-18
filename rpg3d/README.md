# Reload Adventure — RPG 3D por instâncias

Abra **rpg3d/project.godot** no Godot **4.6.3 padrão** e pressione **F5**. Este é o único projeto Godot do repositório.

## Vila, classes e controles

O jogo começa na **Vila da Fenda**, uma área rural segura e inteiramente cercada, com casas térreas, poço, caminhos de terra, vegetação e uma fenda dimensional. Ataques e habilidades ficam desativados na vila. Aproxime-se do **Instrutor** e pressione **E** para escolher uma das quatro classes humanas. A escolha recupera a vida e atualiza habilidades, ícones, recargas e equipamento visual.

| Classe | Vida inicial | Habilidades 1–4 | Recargas |
| --- | ---: | --- | --- |
| Tanque | 100 | Golpe potente; Corte giratório; Defesa; Investida | 6 / 8 / 12 / 7 s |
| Arqueiro | 85 | Disparo potente; Rajada de flechas; Passo evasivo; Chuva de flechas | 6 / 8 / 9 / 12 s |
| Mago | 75 | Bola de fogo; Explosão arcana; Barreira arcana; Teleporte | 6 / 8 / 12 / 7 s |
| Curandeiro | 90 | Luz sagrada; Cura; Santuário; Onda sagrada | 6 / 8 / 14 / 10 s |

O Tanque combate de perto com espada e escudo; Defesa reduz o dano em 65% por quatro segundos. Arqueiro, Mago e Curandeiro têm ataques comuns à distância e habilidades próprias. Flechas e magias viajam como projéteis, colidem com obstáculos e causam dano ao atingir. A seleção de alvos e o dano em área respeitam linha de visão. Passo evasivo e Teleporte respeitam colisões. Cura recupera até 40 de vida; Santuário cura ao longo de quatro segundos. Estas ações funcionam em combate, com alcance e recarga; escolher uma classe muda a jogabilidade.

**Limitação visual atual:** as quatro classes usam o mesmo corpo humano Fighter, suas texturas e seus clipes originais de uma mão. Arco e cajados são modelos procedurais provisórios. As animações de ataque reutilizadas ainda são as do Fighter; não são animações originais de arco ou de mago. O arquivo `assets/human_mage.glb` continua reservado para uso futuro e ainda não tem suas texturas integradas.

- **WASD:** mover em relação à câmera; **mouse:** girar a câmera.
- **Roda do mouse:** aproximar/afastar, com zoom suave de 2 a 14 metros e SpringArm para obstáculos.
- **Shift:** correr; **Espaço:** pular. O salto ainda não tem animação própria.
- **E:** falar com o Instrutor, acessar a fenda da vila ou abrir o baú próximo.
- **Clique esquerdo:** ataque comum da classe; **1–4:** habilidades.
- **Q:** poção manual; **clique no ícone circular da poção:** configurar automático.
- **I / TAB:** abrir/fechar inventário e pausar a simulação.
- **Esc:** fechar menus ou liberar o cursor; clique no campo para capturá-lo novamente.
- **R:** voltar à vila após morrer ou esgotar o tempo.

Cada habilidade pode ser colocada em automático: segure o ícone e arraste **para baixo** para ligar ou **para cima** para desligar. Um clique curto usa manualmente. O indicador AUTO identifica as ativas. O automático respeita recargas, alcance, alvos, vida, área segura e menus. Poções têm configuração separada, sem gesto de arrastar: ative **Usar automaticamente** e ajuste o limite entre 10% e 90% de vida, em passos de 5%. Cada poção recupera até 40 de vida, consome uma unidade e tem intervalo de dois segundos. Vida cheia não consome poção.

[Classes humanas](../docs/classes-humanas.png) · [Vila](../docs/village-gameplay.png) · [Seleção de mundos](../docs/dimensional-rift-worlds.png)

## Mundos, ondas e chefe

Aproxime-se da fenda da vila e pressione **E** para escolher entre os **Mundos 1 a 10**. Apenas o primeiro começa disponível. Vencer o chefe de um mundo libera somente o seguinte; mundos concluídos podem ser revisitados. Uma nova entrada sempre inicia uma nova tentativa.

Cada mundo é uma arena separada de **54 × 54 metros**, com paredes físicas no perímetro de 27 metros do centro. Há variações de paleta, sementes, pedras, ruínas e dificuldade, usando uma base de cenário comum. A vila é descarregada ao entrar na arena, que é descarregada ao voltar. **Não há portal de retorno nas arenas.**

A sequência da tentativa é:

1. **Preparação de 30 segundos**, sem inimigos.
2. **Seis ondas de cinco monstros**, totalizando trinta. A próxima onda só nasce quando a anterior termina.
3. **Guardião da Fenda**, o chefe que aparece após a sexta onda.
4. **Baú especial**, disponível somente após derrotar o chefe.

O limite é de **600 segundos (10 minutos)** para ondas **e chefe juntos**; a preparação não consome esse prazo e o relógio não reinicia quando o chefe aparece. A mochila e os menus de seleção pausam a simulação e os cronômetros. O HUD mostra preparação, onda, vivos, derrotados, fase do chefe e tempo restante.

O Guardião tem visual maior, barra de vida dourada e um ataque carregado: uma **área vermelha no chão** avisa o local do impacto. Saia dela antes do golpe para evitar o dano. Sua vida é `8 × vida do monstro comum + 80 × número do mundo`, e seu dano é `3 × dano do monstro comum`. No Mundo 1, isso corresponde a **560 de vida e 36 de dano base**, antes de defesa e equipamentos.

Morte ou tempo esgotado encerra a tentativa sem baú. O painel apresenta **Voltar à vila**; **R** faz o mesmo. O personagem recupera a vida ao voltar e mantém itens e progresso já obtidos. A animação de morte termina e conserva a pose final enquanto o painel está aberto.

Ao derrotar o chefe, o mundo é concluído e surge um baú no centro. O aviso de vitória permite **Coletar baú**, que leva o personagem até o baú real e o abre; também é possível caminhar até ele e pressionar **E**. A abertura mostra uma janela de revelação com ícone, nome, raridade e atributos do item já colocado na mochila. **Continuar** fecha essa janela e apresenta **Seguir para o mundo seguinte** ou **Voltar à vila**. O Mundo 10 oferece somente o retorno, sem criar um Mundo 11. Seguir inicia uma nova preparação com a vida recuperada.

[Guardião da Fenda](../docs/chefe-da-fenda.png) · [Revelação do baú](../docs/revelacao-do-bau.png) · [Resultado da instância](../docs/resultado-da-instancia.png)

## Equipamentos e inventário

Cada baú concede **um equipamento**, uma única vez por tentativa. O item pode ser espada, escudo, armadura, luvas ou botas e tem ID próprio, raridade e bônus de ataque ou defesa.

| Raridade | Chance por baú |
| --- | ---: |
| Comum | 65% |
| Incomum | 27% |
| Raro | 7,5% |
| Épico | 0,45% |
| Lendário | 0,05% |

Na mochila, selecione um item e use **Equipar** no painel direito. Ele sai da grade e ocupa somente seu slot no personagem; a peça anterior volta à bolsa. Clique no slot e em **Retirar** para devolvê-lo à mochila. Equipamentos vestidos não ocupam espaços da grade. A mochila começa com vinte espaços, tem filtros e ganha rolagem quando necessário. A prévia 3D acompanha classe e equipamento; as molduras e os detalhes mostram a raridade e a comparação de atributos. A organização livre da grade ainda não foi implementada.

Peças de saque equipadas aumentam o dano ou reduzem o dano recebido. Elas reutilizam as malhas disponíveis, sem criar aparências inéditas para cada raridade. O conjunto inicial mantém os atributos base. O Tanque usa a Long Sword e o Small Shield originais; o escudo mantém a inclinação aprovada de **45°**, mão atrás da madeira e encaixe igual no campo e na prévia. As demais classes usam o arco ou cajado provisório correspondente.

Retirar a arma oculta a espada, o arco ou o cajado da classe e bloqueia ataques comuns e habilidades ofensivas. Cura, defesa e habilidades de movimento continuam disponíveis sem arma, respeitando suas demais condições.

Cada Grelim derrotado concede uma presa e cinco de ouro; o chefe concede três presas e cinquenta de ouro. Cada três monstros comuns derrotados concedem um nível. Equipar ou retirar peças fica bloqueado durante um golpe. A simulação permanece pausada enquanto a mochila está aberta.

## Perfil e estado atual

Classe escolhida (`player_class`), nível, experiência, inventário, itens de saque equipados, configurações e mundos liberados são salvos em `user://adventure_save.cfg`. Perfis antigos ou com classe inválida usam **Tanque** como padrão. Ao abrir o jogo novamente, você reaparece na vila. A tentativa em andamento e um baú ainda não coletado não são retomados. Testes usam estado isolado.

As instâncias são locais; ainda não há servidor ou multiplayer. Casas e bancas são cenografia com colisão; o Instrutor tem interação de classe, mas lojas ainda não estão implementadas. Grelims e Guardião usam geometria e animações procedurais provisórias; não são modelos de monstros extraídos do cliente. As classes mudam ações e equipamentos, mas compartilham o Fighter. Valores e cenários continuam em fase de protótipo.

O campo usa textura de grama em escala de 1,8 metro, variação de cor e relevo fino. Tufos 3D perto do personagem se movem com o vento e acompanham a exploração em blocos MultiMesh. À distância, os tufos diminuem e o solo texturizado permanece visível. A textura foi gerada para o projeto; a origem está em `assets/environment/meadow_grass_source.json`.

## Validação

Execute a partir da pasta `rpg3d`:

```sh
godot --headless --path . --editor --import --quit
godot --headless --path . -- --smoke-test
godot --headless --path . --script res://tests/progression_test.gd
godot --headless --path . --script res://tests/instance_run_test.gd
godot --headless --path . --script res://tests/loot_items_test.gd
godot --headless --path . --script res://tests/player_classes_test.gd
godot --headless --path . --script res://tests/instance_classes_flow_test.gd
```

A validação cobre controles e câmera, animações importadas e pose de morte, combate e recargas, quatro classes, projéteis e obstáculos, cura, equipamentos e bônus, poções, pausa, instâncias, seis ondas, chefe, prazo compartilhado, ausência de portal de retorno, baú único, resultado e passagem até o Mundo 10. Também verifica geração e restauração de itens, raridades, salvamento de classe e progressão, sem alterar o perfil normal do jogador.

## Modelo e arquivos

`assets/human_fighter.glb` foi convertido de `Fighter.ukx` enviado pelo usuário com UEViewer, importador PSK/PSA 7.1.3 e Blender 4.3.2. Contém malhas M000/M001 e um esqueleto compartilhado; o jogo alterna peças sem sobrepor versões. Os clipes reutilizados são `wait_1HS_MFighter`, `walk_1HS_MFighter`, `run_1HS_MFighter`, `Atk01_1HS_MFighter`, `SpAtk01_1HS_MFighter` e `Death_MFighter`. O GLB funciona diretamente no Godot, sem Blender no computador do jogador.

Corpo, cabelo, traje, luvas e botas usam texturas de `MFighter.utx`; o rosto vem de `LineageFaceTex.utx`. O cabelo conserva as duas partes originais e recorte alpha; nas texturas corporais, o alpha representa especularidade. A normalização dos nomes de ossos preserva as influências da luva. Origem e arquivos estão registrados em `assets/human_fighter_textures.json`.

Espada e escudo originais foram convertidos para `assets/long_sword.glb` e `assets/small_shield.glb`, com registros de origem próprios. O encaixe acompanha os ossos do Fighter e as animações originais. Arco e cajados estão em `scripts/class_weapon.gd`; seus visuais são provisórios. O mago de `assets/human_mage.glb` não é usado pelas classes ativas e continua sem texturas integradas. Arquivos UKX/UTX completos não são necessários para jogar.
