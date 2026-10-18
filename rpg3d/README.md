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

**Modelos por classe:** o Tanque preserva o Fighter e a pose aprovada de espada/escudo. O Arqueiro usa `human_archer.glb`, com as mesmas malhas texturizadas do Fighter e os clipes nativos `wait_Bow`, `walk_Bow`, `run_Bow`, `Atk01_Bow` e `SpAtk01_Bow`. Mago e Curandeiro usam `human_mage.glb`, as malhas MMagic_M000 de `Magic.ukx`, postura, caminhada, corrida, conjuração e morte do Mage. A troca no Instrutor também troca o modelo da prévia do inventário. As posturas de repouso usam `wait_Bow_MFighter` e `wait_1HS_MMagic`, sem a postura de prontidão `atkWait`. O Arqueiro usa a animação de disparo nativa em 0,9 s para ataque comum e 0,65 s para habilidades, ajustando a velocidade do clipe. A longa animação especial de quatro segundos não bloqueia mais o ataque comum; recargas individuais continuam independentes. A velocidade normal é restaurada ao voltar ao repouso, andar, correr ou morrer.

**Texturas do corpo base do Mage:** sem equipamento, Mago e Curandeiro usam `MMagic_m000_t1000_u/l/g/b` no corpo/roupa, mãos e botas, e `MMagic_m000_t00_m00_ah_ori` mais `MMagic_m000_t00_m00_bh` nas duas malhas de cabelo. Foram extraídas do MMagic.utx enviado em duas partes, com CRC32 do arquivo verificado (`fd1e1a82`). O rosto mantém `MMagic_m000_t00_f`, de LineageFaceTex.utx. O alpha do corpo não produz transparência; apenas o cabelo usa recorte alpha com limite de 0,05. As texturas seguem os UVs do Mage, sem reutilizar atlas do Fighter.

[Arqueiro disparando](../docs/archer-native-attack.png) · [Humano Mage](../docs/mage-native-model.png) · [Curandeiro](../docs/healer-native-model.png) · [Texturas no inventário do Mago](../docs/mage-original-textures.png) · [Curandeiro no inventário](../docs/healer-original-textures.png)

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

Cada baú concede **um equipamento**, uma única vez por tentativa. O item pode ser espada, escudo, peitoral, calça, luvas ou botas e tem ID próprio, raridade e bônus de ataque ou defesa.

| Raridade | Chance por baú |
| --- | ---: |
| Comum | 65% |
| Incomum | 27% |
| Raro | 7,5% |
| Épico | 0,45% |
| Lendário | 0,05% |

Na mochila, selecione um item e use **Equipar** no painel direito. Ele sai da grade e ocupa somente seu slot no personagem; a peça anterior volta à bolsa. Clique no slot e em **Retirar** para devolvê-lo à mochila. Equipamentos vestidos não ocupam espaços da grade. A mochila começa com vinte espaços, tem filtros e ganha rolagem quando necessário. A prévia 3D acompanha classe e equipamento; as molduras e os detalhes mostram a raridade e a comparação de atributos. A organização livre da grade ainda não foi implementada.

Peças de saque equipadas aumentam o dano ou reduzem o dano recebido. As roupas usam as malhas e texturas originais correspondentes ao grau e ao tipo de armadura da classe. O conjunto inicial é No Grade e preserva os atributos base de vida, ataque e defesa; seu bônus completo aumenta somente o movimento. O Tanque usa a Long Sword e o Small Shield originais; o escudo mantém a inclinação aprovada de **45°**, mão atrás da madeira e encaixe igual no campo e na prévia. As manoplas maiores dos graus D–A recebem folga adicional atrás do painel, mantendo a alça no punho e a inclinação aprovada. O Arqueiro usa o Short Bow original em `Weapon_L_Bone`, em vez do osso de escudo. Mago e Curandeiro usam a varinha Apprentice's Rod em `Weapon_R_Bone`. Os encaixes seguem as animações nativas das respectivas classes; o inventário identifica as armas iniciais por nome e ícone.

Retirar a arma oculta a espada, o arco ou o cajado da classe e bloqueia ataques comuns e habilidades ofensivas. Cura, defesa e habilidades de movimento continuam disponíveis sem arma, respeitando suas demais condições.

Cada Grelim derrotado concede uma presa e cinco de ouro; o chefe concede três presas e cinquenta de ouro. Cada três monstros comuns derrotados concedem um nível. Equipar ou retirar peças fica bloqueado durante um golpe. A simulação permanece pausada enquanto a mochila está aberta.

## Perfil e estado atual

Classe escolhida (`player_class`), nível, experiência, inventário, itens de saque equipados, configurações e mundos liberados são salvos em `user://adventure_save.cfg`. Perfis antigos ou com classe inválida usam **Tanque** como padrão. Ao abrir o jogo novamente, você reaparece na vila. A tentativa em andamento e um baú ainda não coletado não são retomados. Testes usam estado isolado.

As instâncias são locais; ainda não há servidor ou multiplayer. Casas e bancas são cenografia com colisão; o Instrutor tem interação de classe, mas lojas ainda não estão implementadas. Grelims e Guardião usam geometria e animações procedurais provisórias; não são modelos de monstros extraídos do cliente. Tanque e Arqueiro compartilham as malhas Fighter com animações diferentes; Mago e Curandeiro compartilham o modelo Mage. As três famílias de roupa já têm variantes originais No Grade, D, C, B e A, incluindo as túnicas do Mage. Valores e cenários continuam em fase de protótipo.

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
godot --headless --path . --script res://tests/class_models_test.gd
godot --headless --path . --script res://tests/wardrobe_test.gd
godot --headless --path . --script res://tests/equipment_slots_sets_test.gd
godot --headless --path . --script res://tests/instance_classes_flow_test.gd
godot --headless --path . --script res://tests/ownership_merchant_test.gd
godot --headless --path . --script res://tests/client_item_icons_test.gd
godot --headless --path . --script res://tests/rarity_icon_background_test.gd
godot --headless --path . --script res://tests/storage_jewelry_balance_test.gd
```

A validação cobre controles e câmera, animações importadas e pose de morte, combate e recargas, quatro classes, projéteis e obstáculos, cura, equipamentos e bônus, poções, pausa, instâncias, seis ondas, chefe, prazo compartilhado, ausência de portal de retorno, baú único, resultado e passagem até o Mundo 10. Também verifica geração e restauração de itens, raridades, salvamento de classe e progressão, sem alterar o perfil normal do jogador.

## Modelo e arquivos

`assets/human_fighter.glb` foi convertido de `Fighter.ukx` enviado pelo usuário com UEViewer, importador PSK/PSA 7.1.3 e Blender 4.3.2. Contém malhas M000/M001 e um esqueleto compartilhado; o jogo alterna peças sem sobrepor versões. Os clipes reutilizados são `wait_1HS_MFighter`, `walk_1HS_MFighter`, `run_1HS_MFighter`, `Atk01_1HS_MFighter`, `SpAtk01_1HS_MFighter` e `Death_MFighter`. O GLB funciona diretamente no Godot, sem Blender no computador do jogador.

Corpo, cabelo, traje, luvas e botas usam texturas de `MFighter.utx`; o rosto vem de `LineageFaceTex.utx`. O cabelo conserva as duas partes originais e recorte alpha; nas texturas corporais, o alpha representa especularidade. A normalização dos nomes de ossos preserva as influências da luva. Origem e arquivos estão registrados em `assets/human_fighter_textures.json`.

Espada e escudo originais foram convertidos para `assets/long_sword.glb` e `assets/small_shield.glb`, com registros de origem próprios. O encaixe acompanha os ossos do Fighter e as animações originais. O arco e a varinha originais estão em `assets/short_bow.glb` e `assets/apprentices_rod.glb`, extraídos de LineageWeapons.ukx com as texturas de LineageWeaponsTex.utx. `scripts/class_weapon.gd` cancela a conversão de eixos da malha, como na espada original, sem rotações arbitrárias entre classes. `assets/class_models_source.json` registra origens, clipes, texturas, CRC32 e hashes SHA-256. O Mage está ativo para Mago e Curandeiro, com sete partes texturizadas: corpo superior/inferior, mãos, botas, rosto e cabelo frontal/traseiro. As malhas originais compartilham um esqueleto e preservam caminhada, corrida, conjuração e pose final de morte. Arquivos UKX/UTX completos não são necessários para jogar.

## Graus e roupas do Lineage 2

| Raridade | Grau |
| --- | --- |
| Comum | No Grade |
| Incomum | D |
| Raro | C |
| Épico | B |
| Lendário | A |

O baú e o inventário mostram o grau. Itens antigos sem esse campo continuam válidos e recebem a indicação pelo valor da raridade. Itens novos gravam o grau, e o carregamento valida a correspondência. As probabilidades não mudaram.

As roupas foram vinculadas aos registros de `Armorgrp_Classic.dat`, `L2GameDataName.dat` e `ItemName_Classic-eu.dat` do cliente enviado. São 60 peças de equipamento para 15 conjuntos com quatro slots independentes: Peito, Calça, Luvas e Botas. Outros seis registros preservam os antigos conjuntos inteiriços Blue Wolf leve e Dark Crystal túnica. Os nomes, IDs, malhas, texturas e referências dos ícones estão em `assets/wardrobe_source.json`. Roupas inteiriças originais ocupam Peito e Calça e são identificadas como Traje completo; equipar calça separada devolve o traje à mochila, sem sobrepor peças.

| Grau | Tanque | Arqueiro | Mago / Curandeiro |
| --- | --- | --- | --- |
| No Grade | Wooden Breastplate + Wooden Gaiters | Leather Shirt + Leather Pants | Tunic / Stockings of Devotion |
| D | Brigandine | Reinforced Leather | Knowledge |
| C | Dwarven Chain | Theca Leather | Karmian |
| B | Blue Wolf pesado | Zubei leve | Blue Wolf túnica |
| A | Dark Crystal pesado | Dark Crystal leve | Tallum túnica |

Peitoral e calça podem ter graus diferentes e são trocados individualmente. Luvas e botas acompanham as variantes originais pesada, leve e túnica; as peças No Grade usam acessórios iniciais existentes no cliente. Cada slot troca somente suas próprias malhas. As roupas compartilham o esqueleto animado do corpo, inclusive na prévia, sem um segundo controlador de animação. A conversão mantém as texturas difusas, sem reproduzir os antigos reflexos de ambiente dos shaders do Unreal.

Monstros têm 18% de chance de soltar um equipamento; o baú da instância garante um. Ambos sorteiam armas e roupas das três famílias: Tanque (espada/pesada), Arqueiro (arco/leve), Mago e Curandeiro (cajado/túnica). A raridade mantém as probabilidades anteriores. Cada arma registra seu tipo e cada roupa sua referência de modelo; nome, ícone, aparência, ID e atributos não se convertem ao trocar de classe. Equipamentos incompatíveis voltam à mochila, sem entregar substitutos ou vestir um novo conjunto inicial. Arqueiro usa o arco com duas mãos; Tanque, Mago e Curandeiro podem equipar escudo. Os modelos disponíveis de armas continuam os mesmos em todos os graus.

O kit inicial pertence somente ao personagem Tanque criado no início. Nos saves anteriores, os seis equipamentos iniciais virtuais viram itens únicos uma única vez, usando a classe gravada no save para preservar a aparência existente. `identity_version` impede repetir a migração. Itens já identificados conservam suas referências; a troca de classe nunca cria equipamento. Outros conjuntos e armas precisam ser obtidos nos monstros e baús.

[Dark Crystal no Tanque](../docs/roupa-dark-crystal-tanque.png) · [Dark Crystal no Arqueiro](../docs/roupa-dark-crystal-arqueiro.png) · [Túnica no inventário](../docs/roupa-dark-crystal-mago-inventario.png)

Teste da integração de roupas: `godot --headless --path . --script res://tests/wardrobe_test.gd`. Ele verifica os conjuntos nas quatro classes, vínculos de pele em repouso/movimento/ataque/conjuração/morte, troca por slot, remoção sem duplicação, compatibilidade de classe, prévia, restauração de dados e recompensas.

Teste da recuperação do Arqueiro: `godot --headless --path . --script res://tests/archer_recovery_test.gd`.


## Ícones, peças separadas e bônus de conjunto

Mochila, slots equipados, detalhes e baú usam os ícones originais extraídos do `Icon.utx` enviado: 82 texturas de 32 × 32 pixels atendem às 66 entradas de roupas, às quatro armas/escudo e às 15 joias. Cada roupa segue sua referência `icon_ref` nos DATs; espada, escudo, arco e cajado correspondem aos respectivos modelos. Referências iguais compartilham o mesmo ícone, como no cliente. Origem, IDs e hashes estão em `assets/client_icons/source.json`. O fundo gravado nos ícones é substituído na apresentação por um fundo uniforme da raridade: cinza (Comum), verde (Incomum), azul (Raro), roxo (Épico) e dourado (Lendário). Máscaras isolam o fundo; os pixels do equipamento e os PNGs originais são preservados. As variantes são calculadas uma vez e reutilizadas na mochila, slots, detalhes, aviso de saque e baú. Selecionar ou equipar o item mantém sua cor de raridade. Os ícones ocupam o interior dos slots com margem de quatro pixels e o fundo da célula tem exatamente a mesma cor, sem áreas escuras separadas. As miniaturas anteriores em `assets/item_thumbnails/` ficam apenas como material de geração; não são usadas pela interface. A arte da poção e da presa de Grelim, assim como a barra de habilidades, permanece própria do protótipo.

Saves anteriores são convertidos uma única vez: a armadura que juntava duas peças vira peitoral e calça, na mesma localização (vestido ou mochila), com IDs distintos e preservando a soma dos atributos anteriores. A versão do inventário impede repetir a conversão ao reabrir o jogo. Os trajes originalmente inteiriços continuam sendo um item que ocupa dois slots, sem criar uma calça fictícia.

Um conjunto ativa o bônus ao cobrir os quatro slots Peito, Calça, Luvas e Botas com peças da mesma família e grau. Um traje inteiriço conta pelos dois slots que ocupa. Elmos e acessórios ainda não participam dessa regra do protótipo. O inventário mostra o progresso, as peças ausentes e o bônus ativo; misturar conjuntos ou retirar uma peça desativa o bônus imediatamente.

Os valores abaixo são balanceamento inicial deste RPG, não estatísticas importadas do Lineage 2:

| Grau | Tanque | Arqueiro | Mago / Curandeiro |
| --- | --- | --- | --- |
| No Grade | Movimento +1% | Movimento +2% | Movimento +1,5% |
| D | Vida +30, Defesa +2 | Ataque +3, Movimento +3% | Vida +10, Ataque +4 |
| C | Vida +60, Defesa +4 | Ataque +6, Movimento +4% | Vida +20, Ataque +8 |
| B | Vida +100, Defesa +7 | Ataque +10, Movimento +5% | Vida +35, Ataque +13 |
| A | Vida +160, Defesa +12 | Ataque +16, Movimento +7% | Vida +80, Ataque +18 |

Os conjuntos inteiriços preservados têm bônus próprios: Blue Wolf leve, Ataque +12 e Movimento +4%; Dark Crystal túnica, Vida +40 e Ataque +22. Ataque e Defesa entram no cálculo real do combate, Vida altera o limite e Movimento altera WASD/corrida. Vestir um conjunto não cura; perder Vida máxima limita o HP atual ao novo máximo.

Validação adicional: `godot --headless --path . --script res://tests/equipment_slots_sets_test.gd`. Cobre migração idempotente, soma dos atributos, salvamento real, peito/calça independentes, trajes de dois slots, referências dos ícones originais e bônus ativos/inativos nas quatro classes. `tests/client_item_icons_test.gd` confere também armas por classe, peças com referência compartilhada, itens antigos e os ícones efetivamente mostrados na mochila, nos slots e no baú.

[Slots independentes e bônus ativo](../docs/inventario-peito-calca-bonus.png) · [Tallum separado no Mago](../docs/inventario-tallum-separado.png) · [Calça revelada no baú](../docs/bau-calca-miniatura.png)

Teste dos fundos: `godot --headless --path . --script res://tests/rarity_icon_background_test.gd`. Verifica as cinco raridades nos 82 ícones, preservação dos pixels do equipamento, originais intactos e reutilização das texturas de apresentação.

## Mercador da vila

Bento fica junto à mesa de poções, à direita do caminho central. Aproxime-se e pressione E. A tela permite comprar poções de vida (12 ouro), um kit de cinco (50 ouro) e presas de Grelim (8 ouro), além de vender materiais, poções e equipamentos guardados na mochila. Itens equipados precisam ser retirados antes da venda. É possível escolher de 1 a 99 unidades de consumíveis; equipamentos são vendidos individualmente. Preço, estoque e ouro são validados antes da alteração; transações concluídas são salvas imediatamente. Esc/TAB fecha a loja.

`tests/ownership_merchant_test.gd` verifica a migração, a preservação dos itens em cinco trocas de classe, restrições de armas, escudos nas classes mágicas, saques de todas as famílias, uma morte real de monstro com equipamento salvo, compra/venda pelos botões reais, falta de ouro, quantidades inválidas, venda duplicada, proteção dos itens equipados e persistência. Os testes de animação e combate fornecem seus próprios equipamentos de teste por `tests/owned_gear_fixture.gd`; selecionar a classe no jogo não fornece esses itens.

[Mercador na vila](../docs/mercador-na-vila.png) · [Compra de poções](../docs/mercador-compra.png) · [Venda de equipamento](../docs/mercador-venda.png)


## Baú pessoal, venda por seleção e joias

O **Baú pessoal** fica junto ao poço da vila. Aproxime-se e pressione **E** para abrir as listas Mochila e Baú. Selecione um item, escolha a quantidade de consumíveis e clique em Guardar ou Retirar. Equipamentos precisam ser retirados do personagem antes de serem guardados. O baú usa o mesmo save local do personagem e permanece disponível após trocar de classe ou reabrir o jogo. Itens no baú não aparecem na lista de venda do mercador. Guardar ou retirar move o mesmo ID e os mesmos atributos; não gera cópias. Esc/TAB fecha a tela.

No mercador, marque as caixas ao lado dos itens e use **Vender selecionados**. O botão informa quantos itens/pilhas serão vendidos e o valor total. Marcar poções ou materiais seleciona a pilha inteira; a venda individual continua permitindo escolher uma quantidade menor. Limpar seleção desmarca tudo. Se qualquer item ficar indisponível ou o limite de ouro for ultrapassado, a venda em lote inteira é rejeitada. Equipamentos vestidos e itens no baú são protegidos. A transação concluída é salva imediatamente.

Os saques de monstros e baús agora incluem **anéis, brincos e colares**, com os ícones originais do cliente em cada grau. Existem dois slots de anel, dois de brinco e um de colar, separados das roupas. Um anel ou brinco ocupa primeiro o slot vazio da dupla. Todas as classes podem usar as mesmas joias; trocar de classe conserva sua identidade e seus atributos. A categoria Joias filtra a mochila. As joias concedem Vida e Defesa mágica; esta última reduz os impactos mágicos do chefe, sem aumentar a defesa física. Os valores são próprios do protótipo, registrados em `scripts/jewelry_catalog.gd`. As probabilidades de raridade permanecem **65% / 27% / 7,5% / 0,45% / 0,05%**. Os nove tipos de saque têm o mesmo peso: seis equipamentos e três tipos de joia. Os slots adicionais começam vazios, sem entregar joias gratuitas.

[Baú na vila](../docs/bau-pessoal-vila.png) · [Guardar e retirar](../docs/bau-pessoal-interface.png) · [Venda por seleção](../docs/mercador-venda-selecionados.png) · [Joias equipadas](../docs/inventario-joias.png)

## Progressão e dificuldade

A antiga regra concedia um nível a cada três mortes e restaurava toda a vida. Agora cada nível exige `60 + 25 × nível` de experiência; monstros concedem `4 + 2 × mundo` e o chefe cinco vezes esse valor. A experiência excedente passa para o próximo nível. Subir de nível acrescenta apenas a diferença de Vida máxima à Vida atual: não oferece cura completa. O crescimento básico é de 8 de Vida e 1,5 de Ataque por nível até 30; depois há retornos menores. **Níveis, ouro, equipamentos e mundos liberados dos saves existentes são preservados**, mas os atributos passam a usar essas novas regras.

Cada mundo aumenta Vida, dano e velocidade dos monstros. Dentro da mesma instância, ondas posteriores ficam mais fortes. Os níveis sugeridos na fenda vão de 1 a 19, sem bloquear a entrada pela quantidade de níveis. A defesa agora reduz uma porcentagem do dano (`dano × 100 / (100 + defesa)`), evitando que uma defesa baixa anule ataques inteiros. O chefe tem mais Vida e dano, marca a posição de jogadores até 24 metros e acelera gradualmente após 35 segundos de luta, até 50%. Sair da área vermelha antes do impacto continua evitando o golpe. A tentativa mantém seis ondas de cinco monstros, um chefe e dez minutos de combate.

Validação: `godot --headless --path . --script res://tests/storage_jewelry_balance_test.gd`. Exercita os botões reais, quantidades e limites, transferências sem duplicação, persistência em arquivo, venda em lote atômica, proteção do baú/equipamentos, quinze joias, cinco slots, Defesa mágica e Vida no combate, troca de classe, preservação do save nível 115, experiência sem cura completa, aumento de dificuldade e ataques do chefe à distância. Os testes de inventário, conjuntos, ícones e smoke continuam cobrindo os fluxos anteriores. O ajuste numérico é inicial e ainda pode receber refinamentos com partidas completas dos jogadores.
