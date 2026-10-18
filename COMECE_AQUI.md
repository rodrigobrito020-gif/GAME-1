# Reload Adventure — RPG 3D

Este é o único projeto Godot desta versão.

1. Extraia o ZIP em uma **pasta nova**.
2. No Godot, importe **rpg3d/project.godot**.
3. Pressione **F5** para jogar.

Você começa na **Vila da Fenda**, pequena, cercada e segura. Siga o caminho de terra até a **fenda dimensional**. Perto dela, pressione **E** e escolha o **Mundo 1**. Aguarde os **30 segundos de preparação**. Depois, derrote **6 ondas de 5 Grelims (30 no total)** em até **10 minutos de combate** para liberar o próximo mundo. Cada onda só aparece quando todos da anterior forem derrotados. Ao vencer, surge um **baú no centro da arena**: chegue perto e pressione **E** para receber um equipamento na mochila. A sequência continua até o Mundo 10. Use a fenda de retorno perto da chegada de cada mundo para voltar à vila. O progresso e os equipamentos ficam salvos neste computador. Depois de morrer ou esgotar o prazo, **R** retorna à vila com a vida recuperada. Uma tentativa encerrada sem vitória não concede baú.

**WASD** move, **mouse** gira a câmera, **scroll** ajusta o zoom, **clique esquerdo** ataca e **1–4** usam habilidades. **I ou TAB** abre a mochila, **Q** usa poção e **clique no ícone da poção** configura o uso automático. Arraste os ícones das habilidades para baixo para ativar o automático e para cima para desativar. **Esc** libera o cursor.

Se o projeto antigo ainda aparecer no gerenciador do Godot, remova apenas a entrada **Reload Adventure** da lista. Abra **Reload Adventure — RPG 3D**. O gerenciador pode manter entradas de pastas importadas anteriormente.

Veja [o manual](rpg3d/README.md) para todos os controles e detalhes.

Na mochila, selecione um item no centro e use o botão do painel direito para equipar ou usar. Ao equipar, a peça sai da mochila e aparece somente no slot correspondente à esquerda, ao lado da prévia 3D do personagem. Clique nesse slot e em **Retirar** para devolver a peça à mochila. Equipamentos vestidos não ocupam espaço na mochila. A grade começa com 20 espaços e ganha rolagem quando houver mais itens. Itens de baú possuem raridade e bônus; equipar uma peça devolve a anterior à mochila.
