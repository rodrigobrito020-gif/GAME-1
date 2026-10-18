# Reload Adventure — RPG 3D

RPG em terceira pessoa com controle direto, desenvolvido no **Godot 4.6.3**. Este repositório contém somente o projeto 3D.

## Baixar e jogar

1. Baixe o ZIP em **Code → Download ZIP** e extraia em uma pasta nova.
2. No Godot, clique em **Importar** e selecione **rpg3d/project.godot**.
3. Abra o projeto e pressione **F5**.

## Controles

- **WASD:** mover; **mouse:** câmera; **roda do mouse:** zoom.
- **Shift:** correr; **Espaço:** pular.
- **E:** acessar a fenda, voltar à vila ou abrir o baú de recompensa.
- **Clique esquerdo:** atacar com espada; **1–4:** habilidades. Arraste um ícone para baixo para ativar automático e para cima para desativar.
- **Q:** poção; **clique no ícone da poção:** configurar uso automático por porcentagem de vida.
- **I / TAB:** inventário; **Esc:** liberar cursor/fechar janelas; **R:** retornar à vila após morrer ou esgotar o tempo.

O jogo começa em uma pequena vila rústica totalmente cercada, sem monstros, com casas térreas, caminhos de terra, poço, vegetação e uma **fenda dimensional**. Aproxime-se da fenda e pressione **E** para escolher entre **10 mundos**. Apenas o Mundo 1 começa liberado; derrotar todos os Grelims de um mundo libera o seguinte. Mundos concluídos podem ser revisitados. Nível, inventário, configurações e desbloqueios são salvos neste computador.

Os mundos são arenas locais separadas de **54 × 54 metros**, com o mesmo limite da vila. Após **30 segundos de preparação**, começam **6 ondas de 5 monstros**, totalizando **30**. A onda seguinte só nasce quando a anterior acaba. Há **10 minutos de combate** para vencer todas e fazer surgir um baú; se o prazo acabar, a tentativa falha e não há baú. O baú concede um equipamento de Comum a Lendário: **65% Comum, 27% Incomum, 7,5% Raro, 0,45% Épico e 0,05% Lendário**. Os itens podem ser equipados e dão bônus de ataque ou defesa. A vila e os mundos ainda usam cenários de protótipo. Casas e bancas são cenografia; lojas e NPCs ainda não estão implementados.

[Veja a vila no jogo](docs/village-gameplay.png), [a vista mais afastada](docs/village-rustic-overview.png), [a seleção dos mundos](docs/dimensional-rift-worlds.png), [as ondas de combate](docs/arena-wave-one.png), [o baú](docs/arena-reward-chest.png) e [os itens no inventário](docs/arena-loot-inventory.png).

Consulte [o manual do RPG 3D](rpg3d/README.md) para funcionalidades, limitações e testes.
