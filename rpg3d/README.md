# Reload Adventure — RPG 3D em campo aberto

Abra **rpg3d/project.godot** no Godot **4.6.3 padrão** e pressione **F5**. Este projeto é separado do combate em equipe em `godot/`.

Você controla o **humano guerreiro (Fighter)** em terceira pessoa, num campo de **1000 × 1000 metros**, com uma clareira central ampla, vegetação afastada e colinas no horizonte. O terreno jogável é plano; as colinas são cenário distante. Há limite de deslocamento a 490 metros do centro, sem muros fechando a vista.

- **WASD:** caminhar em relação à câmera; **mouse:** girar a câmera.
- **Shift:** correr; **Espaço:** pular.
- **Clique esquerdo:** ataque comum com espada, manual, até 2,6 metros à frente. O dano acontece no momento do golpe.
- **1 — Golpe potente:** outra animação de ataque, com efeito de arco azul, dano reforçado e alcance de 3,6 metros. Recarga de 6 segundos, além do intervalo do golpe comum. Acerte de perto e de frente; obstáculos bloqueiam o golpe.
- **Esc:** liberar o cursor; clique na janela para capturá-lo novamente.
- **R:** reiniciar campo, vida, nível e inimigos.

O guerreiro usa o modelo 3D original enviado pelo usuário, com esqueleto e animações de repouso, caminhada, corrida, ataque comum, ataque especial e morte. A espada é uma malha provisória criada para o teste, presa ao osso da arma; não é um equipamento extraído do cliente. O material do personagem é cinza: texturas e equipamentos definitivos continuam pendentes. O salto ainda não tem animação própria.

Os três **Grelims provisórios em 3D** substituem as esferas de treino: corpo, rosto, olhos, chifres, orelhas, braços e garras. Foram montados com geometria simples inspirada na referência enviada pelo usuário, sem extrair modelos de monstros do cliente. Movimentam braços e pernas proceduralmente, aproximam-se e atacam. Os modelos e animações definitivos dos monstros ainda precisam ser importados.

Derrote os três para ganhar nível. Não há ataque automático do jogador. Câmera com limite vertical e SpringArm; colisão com chão e troncos. Ao morrer, o guerreiro mantém o último quadro da animação até reiniciar. Esta versão ainda não contém missões, inventário, salvamento, multiplayer ou mapa definitivo.

## Validação

```sh
godot --headless --path . --editor --import --quit
godot --headless --path . -- --smoke-test
```

O teste executa as animações importadas, golpe manual, intervalo de ataque, acerto frontal, rejeição de alvos atrás/distantes, dano da skill, recarga, experiência, nível, morte, reinício e deslocamento longe do centro com chão físico.

## Modelo e arquivos

`assets/human_fighter.glb` foi convertido de `Fighter.ukx` enviado pelo usuário. Animações: `wait_1HS_MFighter`, `walk_1HS_MFighter`, `run_1HS_MFighter`, `Atk01_1HS_MFighter`, `SpAtk01_1HS_MFighter`, `Death_MFighter`. Conversão com UEViewer, importador PSK/PSA 7.1.3 e Blender 4.3.2; um esqueleto compartilhado pelas partes do corpo. O projeto usa o GLB diretamente; não requer Blender no computador do jogador.

`assets/human_mage.glb` conserva o teste anterior do mago para uso futuro; o personagem ativo desta versão é o guerreiro. `scripts/open_field.gd` cria o campo e agrupa a vegetação em MultiMesh; `scripts/grelim_visual.gd` monta os monstros provisórios; `scripts/world.gd` controla câmera, movimento e combate.
