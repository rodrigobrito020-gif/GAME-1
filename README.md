# Reload Adventure — RPG 3D

RPG em terceira pessoa com controle direto, desenvolvido no **Godot 4.6.3**. Este repositório contém somente o projeto 3D.

## Baixar e jogar

1. Baixe o ZIP em **Code → Download ZIP** e extraia em uma pasta nova.
2. No Godot, clique em **Importar** e selecione **rpg3d/project.godot**.
3. Abra o projeto e pressione **F5**.

Você começa na **Vila da Fenda**, cercada e segura. Aproxime-se do **Instrutor** e pressione **E** para escolher **Tanque, Arqueiro, Mago ou Curandeiro**. A fenda dimensional da vila oferece dez mundos: apenas o primeiro começa liberado; vencer um mundo libera o seguinte, e os concluídos podem ser revisitados.

Cada arena tem **54 × 54 metros**, **30 segundos de preparação** e **10 minutos de combate** para vencer **seis ondas de cinco monstros e o Guardião da Fenda**. O chefe avisa seu ataque com uma área vermelha no chão. Morte ou tempo esgotado abre a opção **Voltar à vila**, também disponível por **R**. As arenas não têm portal de retorno.

Ao vencer o chefe, aproxime-se do baú e pressione **E**, ou use **Coletar baú** no aviso de vitória. A abertura revela **um equipamento real**, já adicionado à mochila. **Continuar** mostra as opções de seguir ao próximo mundo ou voltar à vila. O Mundo 10 encerra a sequência. Chances por baú: **65% Comum, 27% Incomum, 7,5% Raro, 0,45% Épico e 0,05% Lendário**.

As quatro classes têm ataques e habilidades próprios, incluindo projéteis, cura e movimento. Nesta versão, todas reutilizam o modelo humano Fighter e seus clipes originais; arco e cajados são visuais procedurais provisórios. A classe escolhida, nível, inventário, configurações e mundos liberados ficam salvos neste computador. A mochila pausa a simulação.

## Controles

- **WASD:** mover; **mouse:** câmera; **roda do mouse:** zoom.
- **Shift:** correr; **Espaço:** pular.
- **E:** falar com o Instrutor, acessar a fenda da vila ou abrir o baú próximo.
- **Clique esquerdo:** ataque da classe; **1–4:** habilidades. Arraste um ícone para baixo para ativar automático e para cima para desativar.
- **Q:** poção; **clique no ícone da poção:** configurar uso automático por porcentagem de vida.
- **I / TAB:** inventário; **Esc:** liberar cursor/fechar menus; **R:** voltar à vila após derrota ou tempo esgotado.

[Veja as classes](docs/classes-humanas.png), [o chefe](docs/chefe-da-fenda.png), [a revelação do baú](docs/revelacao-do-bau.png) e [o resultado da instância](docs/resultado-da-instancia.png).

Consulte [o manual do RPG 3D](rpg3d/README.md) para habilidades, equipamentos, limitações visuais e testes.
