# Reload Adventure — RPG 3D em campo aberto

Abra **rpg3d/project.godot** no Godot **4.6.3 padrão** e pressione **F5**. Este é o único projeto Godot do repositório.

Você controla o **humano guerreiro (Fighter)** em terceira pessoa, num campo de **1000 × 1000 metros**, com uma clareira central ampla, vegetação afastada e colinas no horizonte. O terreno jogável é plano; as colinas são cenário distante. Há limite de deslocamento a 490 metros do centro, sem muros fechando a vista.

O campo tem **textura de grama** em escala de 1,8 metro, com variação natural de cor e relevo fino. Perto do jogador há tufos de grama em geometria 3D, curvados e movidos suavemente pelo vento. Os blocos de vegetação acompanham a exploração por todo o campo; à distância, os tufos diminuem gradualmente e o solo texturizado continua visível. São instâncias MultiMesh opacas, sem cartões transparentes nem milhares de colisores. A textura foi gerada para o projeto; a origem está em `assets/environment/meadow_grass_source.json`.

- **WASD:** caminhar em relação à câmera; **mouse:** girar a câmera.
- **Roda do mouse:** para cima aproxima, para baixo afasta. Zoom suave entre 2 e 14 metros, encurtado pelo SpringArm quando houver obstáculos.
- **Shift:** correr; **Espaço:** pular.
- **Clique esquerdo:** ataque comum com espada, manual, até 2,6 metros à frente. O dano acontece no momento do golpe.
- **1 — Golpe potente:** outra animação de ataque, com efeito de arco azul, dano reforçado e alcance de 3,6 metros. Recarga de 6 segundos, além do intervalo do golpe comum. Acerte de perto e de frente; obstáculos bloqueiam o golpe.
- **2 — Corte giratório:** atinge os inimigos ao redor, até 3,2 metros; recarga de 8 segundos. Usa a animação de ataque especial como base provisória.
- **3 — Defesa:** reduz o dano recebido em 65% por 4 segundos; recarga de 12 segundos.
- **4 — Investida:** avanço curto na direção da câmera, com colisão; recarga de 7 segundos.
- **Q — Poção manual:** recupera 40 de vida, com intervalo de 2 segundos e consumo de uma unidade.
- **Configuração da poção:** libere o cursor com Esc e clique diretamente no ícone da poção, alinhado com as habilidades. O clique abre a janela e não consome o item. Ative “Usar automaticamente” e ajuste o limite entre 10% e 90% de vida, em passos de 5%. Exemplo: em 40%, a poção só é usada quando a vida chega a 40% ou menos. A opção começa desligada; só consome se houver poção no estoque, o personagem estiver vivo e o intervalo de dois segundos tiver terminado. O uso automático também pausa com a mochila aberta. A configuração permanece durante reinícios com R, mas ainda não é salva entre sessões.
- **I / TAB — Inventário:** abre/fecha a mochila e pausa a simulação. Espada pode ser equipada/guardada selecionando o item e clicando no botão do painel de detalhes; três poções iniciais recuperam 40 de vida cada. Vida cheia não consome poção. Cada Grelim derrotado adiciona uma presa e 5 de ouro automaticamente. Tela de equipamentos com personagem 3D, slots do corpo, mochila de 20 espaços e filtros Todos/Armas/Trajes/Poções/Materiais. Clique em um item para inspecionar e use Equipar ou Usar poção no painel direito. Ao equipar, a peça sai da grade e da contagem da mochila e aparece somente no slot correspondente do personagem. Clique nesse slot e em Retirar para devolver a peça à mochila. Espada, escudo, traje, luvas e botas aparecem no personagem da prévia; slots sem equipamento ficam vazios. Organização livre e persistência ainda não implementadas. R reinicia também os itens e o saque.
- **Esc:** fecha a mochila ou libera o cursor; clique na janela para capturá-lo novamente.
- **R:** reiniciar campo, vida, nível e inimigos.

O guerreiro usa o modelo 3D original enviado pelo usuário, com esqueleto e animações de repouso, caminhada, corrida, ataque comum, ataque especial e morte. A espada agora é a Long Sword original (`long_sword_m00_wp`), extraída de LineageWeapons.ukx, com a textura correspondente de LineageWeaponsTex.utx e presa ao osso Weapon_R_Bone. Ela substitui a espada geométrica provisória e acompanha as animações de repouso, movimento e ataque. O modelo agora inclui o traje inicial, as luvas e as botas M001 do próprio Fighter. Na mochila [I / TAB], selecione a peça e clique em Equipar/Retirar; retirar restaura a malha básica M000, mantendo rosto/cabelo e animações. As peças começam equipadas e a troca fica bloqueada durante um golpe. Nesta etapa, são equipamentos visuais, sem bônus de atributos. Corpo, traje inicial, cabelo, luvas e botas agora usam texturas originais do MFighter.utx enviado pelo usuário. Foram mantidos os UVs do modelo e o recorte alpha do cabelo. O rosto também recebeu a textura original MFighter_m000_t00_f, do pacote compartilhado LineageFaceTex.utx enviado pelo usuário. O salto ainda não tem animação própria.

Os três **Grelims provisórios em 3D** substituem as esferas de treino: corpo, rosto, olhos, chifres, orelhas, braços e garras. Foram montados com geometria simples inspirada na referência enviada pelo usuário, sem extrair modelos de monstros do cliente. Movimentam braços e pernas proceduralmente, aproximam-se e atacam. Os modelos e animações definitivos dos monstros ainda precisam ser importados.

A interface mantém vida, nível e experiência no canto superior esquerdo. A barra inferior tem quatro ícones quadrados, molduras escuras/douradas, teclas 1–4 e recarga sobre o ícone. Nome e descrição aparecem ao passar o mouse. Segure um ícone e arraste para baixo para ativar o modo automático; arraste para cima para desativar. O indicador verde AUTO identifica slots ativos. Um clique curto continua usando a habilidade manualmente. A poção tem um slot circular próprio à esquerda das habilidades, sem gesto de arrastar. Clique na poção para abrir a configuração; somente o botão “Usar automaticamente” liga ou desliga o automático. O último Grelim atingido também tem uma barra fina no topo central; ela desaparece quando ele é derrotado. Os Grelims têm pequenas barras de vida sobre a cabeça, acompanhando sua posição, ocultas quando distantes ou atrás da câmera.

Os Grelims aceleram e viram gradualmente. A caminhada considera apenas a velocidade no chão; braços e pernas alternam lados com transições suaves entre repouso, caminhada e ataque. Há reação ao dano e queda ao morrer. São animações procedurais provisórias, não animações do cliente.

Derrote os três para ganhar nível. O ataque comum continua manual. Cada habilidade pode ser colocada em automático individualmente pelo gesto no ícone: as ofensivas usam seu alcance, Defesa reage a inimigos próximos e Investida só avança se houver inimigo à frente entre 4,5 e 8 metros. São respeitados recarga, morte, espada equipada e pausa da mochila; a configuração permanece ao reiniciar com R. Câmera com limite vertical e SpringArm; colisão com chão e troncos. Ao morrer, o guerreiro mantém o último quadro da animação até reiniciar. Esta versão ainda não contém missões, salvamento, multiplayer ou mapa definitivo. Habilidades, itens e números desta versão são provisórios para testar a jogabilidade.

## Validação

```sh
godot --headless --path . --editor --import --quit
godot --headless --path . -- --smoke-test
```

O teste executa as animações importadas, golpe manual, acerto frontal, dano e recargas das habilidades, defesa, investida, barras de vida, poções, equipamento, pausa da mochila, saque, zoom e limites de câmera, transições dos Grelims, experiência, morte, reinício e deslocamento longe do centro com chão físico. Também verifica o limite de vida para poções automáticas, desativação, estoque, morte, pausa e intervalo entre usos.

## Modelo e arquivos

`assets/human_fighter.glb` foi convertido de `Fighter.ukx` enviado pelo usuário. Inclui as malhas M000 (base) e M001 (traje superior/inferior, luvas e botas); o jogo alterna a visibilidade sem sobrepor as duas versões. Animações: `wait_1HS_MFighter`, `walk_1HS_MFighter`, `run_1HS_MFighter`, `Atk01_1HS_MFighter`, `SpAtk01_1HS_MFighter`, `Death_MFighter`. Conversão com UEViewer, importador PSK/PSA 7.1.3 e Blender 4.3.2; um esqueleto compartilhado pelas partes do corpo. O projeto usa o GLB diretamente; não requer Blender no computador do jogador.

`assets/human_mage.glb` conserva o teste anterior do mago para uso futuro; o personagem ativo desta versão é o guerreiro. `scripts/open_field.gd` cria o campo e agrupa a vegetação em MultiMesh; `scripts/grelim_visual.gd` monta os monstros provisórios; `scripts/world.gd` controla câmera, movimento e combate; `scripts/rpg_hud.gd` constrói a interface e projeta as barras dos inimigos.

## Texturas do guerreiro

As partes MFighter.z01, MFighter.z02 e MFighter.zip foram reunidas e o conteúdo MFighter.utx passou no CRC32 (`78f9f072`). O GLB incorpora onze imagens originais: corpo básico M000 (u/l/g/b), cabelo t00 (partes ah e bh) e conjunto M001 t01 (u/l/g/b), mais o rosto t00 de LineageFaceTex.utx. O alpha das texturas corporais representa especularidade e não é usado como transparência; somente o cabelo usa recorte alpha.

As imagens também ficam em `assets/human_fighter_MFighter_*.png`, extraídas pelo importador do Godot. `assets/human_fighter_textures.json` registra a origem das texturas e do rosto. As animações e a troca de equipamento continuam usando o mesmo esqueleto. O pacote UTX completo não faz parte do projeto.

A montagem do cabelo inclui as duas partes originais `MFighter_m000_m00_ah` e `MFighter_m000_m00_bh`, para cobrir também a parte posterior da cabeça. O rosto recebeu a textura do pacote LineageFaceTex.utx. A Long Sword original e sua textura foram convertidas para `assets/long_sword.glb`; o registro de origem está em `assets/long_sword_source.json`. Não há dependência de arquivos UKX/UTX no computador do jogador.

## Correção da luva

A ponta fina que parecia sair da espada vinha de uma influência descartada na malha M001 da luva: havia um nome de osso de dedo duplicado. Os nomes do esqueleto foram normalizados pela ordem e hierarquia do M000, preservando os pesos e a geometria. O GLB não contém mais a influência neutral_bone. A origem e os aliases corrigidos estão em assets/human_fighter_textures.json.

O guerreiro começa também com o Small Shield original no braço esquerdo (Shield_L_Bone). O escudo possui ícone no inventário e pode ser equipado ou guardado; acompanha as animações. O painel fica voltado para a frente em torno da alça interna, com suportes metálicos e uma tira de couro que acompanha o antebraço. O espaço entre a luva e a madeira é verificado nas poses importadas, incluindo o fim do golpe. Nesta etapa é um equipamento visual, sem bônus passivo adicional. O encaixe compensa a conversão de eixos das malhas glTF, preserva o eixo original da lâmina e centraliza o cabo no socket da mão.
