# Reload Adventure — protótipo RPG 3D

Projeto separado do combate em equipe de `godot/`. Abra **rpg3d/project.godot** no Godot **4.6.3 padrão** e pressione **F5**.

Você controla um humano mago em terceira pessoa num pátio de treino. O personagem usa o modelo 3D de verdade, com esqueleto e animações de repouso, corrida, conjuração e morte. O material é cinza provisório; texturas e equipamentos ainda faltam.

- **WASD:** andar em relação à câmera.
- **Mouse:** girar a câmera; **Esc:** liberar o cursor; clique na janela para capturá-lo novamente.
- **Shift:** correr; **Espaço:** pular.
- **Clique esquerdo** ou **1:** conjurar na direção da mira. A magia tem recarga de um segundo e aplica dano quando o projétil colide com o alvo.
- **R:** reiniciar o pátio, com vida, nível e inimigos restaurados.

Os três guardiões são esferas provisórias para testar combate: aproximam-se e atacam quando você chega perto. Derrote os três para ganhar nível. Não há ataque automático do jogador. Câmera com limite vertical e SpringArm para encurtar a distância em obstáculos; colisão de terreno e paredes. A morte impede ataques e mantém a animação final até reiniciar.

Este é o primeiro protótipo de controle e combate, sem missões, inventário, salvamento, multiplayer ou mapa definitivo. O salto ainda não possui animação própria. Os guardiões não representam os modelos definitivos dos monstros.

## Validação

```sh
godot --headless --path . --editor --import --quit
godot --headless --path . -- --smoke-test
```

O teste verifica animações importadas, movimento pelo cenário, conjuração manual, recarga, projétil, experiência, nível, morte e reinício.

## Modelo

`assets/human_mage.glb` foi convertido do humano mago enviado pelo usuário em `Magic.ukx`. Sequências: `wait_Hand_MMagic`, `run_Hand_MMagic`, `CastShort_MMagic`, `Death_MMagic`. Conversão com UEViewer, importador PSK/PSA 7.1.3 e Blender 4.3.2; GLB com um esqueleto compartilhado pelas partes do corpo e animações NLA. O jogo usa somente o GLB, sem precisar instalar Blender ou o importador.
