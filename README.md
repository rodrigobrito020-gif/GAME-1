# Reload Adventure — RPG 3D

RPG em terceira pessoa com controle direto, desenvolvido no **Godot 4.6.3**. Este repositório contém somente o projeto 3D.

## Baixar e jogar

1. Baixe o ZIP em **Code → Download ZIP** e extraia em uma pasta nova.
2. No Godot, clique em **Importar** e selecione **rpg3d/project.godot**.
3. Abra o projeto e pressione **F5**.

## Controles

- **WASD:** mover; **mouse:** câmera; **roda do mouse:** zoom.
- **Shift:** correr; **Espaço:** pular.
- **E:** acessar a fenda dimensional na vila ou usar a fenda de retorno dentro de um mundo.
- **Clique esquerdo:** atacar com espada; **1–4:** habilidades. Arraste um ícone para baixo para ativar automático e para cima para desativar.
- **Q:** poção; **clique no ícone da poção:** configurar uso automático por porcentagem de vida.
- **I / TAB:** inventário; **Esc:** liberar cursor/fechar janelas; **R:** retornar à vila após morrer.

O jogo começa em uma vila totalmente murada, sem monstros, com casas, praça, fonte e uma **fenda dimensional**. Aproxime-se da fenda e pressione **E** para escolher entre **10 mundos**. Apenas o Mundo 1 começa liberado; derrotar todos os Grelims de um mundo libera o seguinte. Mundos concluídos podem ser revisitados. Nível, inventário, configurações e desbloqueios são salvos neste computador.

Os mundos são instâncias locais separadas, com campos de 1000 × 1000 metros, variações iniciais de cenário e dificuldade crescente. A vila e os mundos ainda usam cenários de protótipo. Casas e bancas são cenografia; lojas e NPCs ainda não estão implementados.

[Veja a vila no jogo](docs/village-gameplay.png), [a seleção dos mundos](docs/dimensional-rift-worlds.png) e [o desbloqueio após concluir o Mundo 1](docs/dimensional-rift-unlocked.png).

Consulte [o manual do RPG 3D](rpg3d/README.md) para funcionalidades, limitações e testes.
