# Reload Adventure — RPG 3D

Este é o único projeto Godot desta versão.

1. Extraia o ZIP em uma **pasta nova**.
2. No Godot **4.6.3 padrão**, importe **rpg3d/project.godot**.
3. Pressione **F5** para jogar.

Você começa na **Vila da Fenda**, pequena, cercada e segura. Perto do **Instrutor**, pressione **E** para escolher **Tanque, Arqueiro, Mago ou Curandeiro**. As habilidades mudam com a classe; Tanque e Arqueiro usam o Fighter (com animações próprias de arco para o Arqueiro), enquanto Mago e Curandeiro usam o humano Mage com conjurações nativas. O arco Short Bow e a varinha Apprentice's Rod são originais. Para completar as texturas da roupa e do cabelo do Mage ainda falta o arquivo MMagic.utx; o rosto já usa a textura correta. Sem escolha anterior salva, a classe inicial é Tanque.

Siga até a **fenda dimensional**, pressione **E** e escolha o **Mundo 1**. Aguarde os **30 segundos de preparação**. Depois, vença **seis ondas de cinco monstros e o Guardião da Fenda**, tudo dentro de **10 minutos de combate**. A próxima onda só aparece quando a anterior acaba. Quando o chefe marcar uma área vermelha, saia dela antes do impacto.

A vitória libera o próximo mundo e faz surgir um **baú especial**. Chegue perto e pressione **E**, ou clique em **Coletar baú** no aviso de vitória. A revelação mostra o equipamento recebido, sua raridade e seus bônus. **Continuar** abre a escolha entre seguir ao próximo mundo e voltar à vila. A sequência termina no Mundo 10; você pode revisitar mundos concluídos.

**Não há portal de retorno nas arenas.** Ao morrer ou esgotar o tempo, use **Voltar à vila** no painel ou pressione **R**. Você recupera a vida e mantém o progresso já obtido; essa tentativa não concede baú. O jogo salva classe, equipamentos e desbloqueios neste computador e sempre reabre na vila.

**WASD** move, **mouse** gira a câmera, **scroll** ajusta o zoom, **clique esquerdo** usa o ataque da classe e **1–4** ativam habilidades. **I ou TAB** abre a mochila e pausa a simulação. **Q** usa poção; clicar no ícone circular abre a configuração do uso automático. Arraste uma habilidade para baixo para ativar seu automático e para cima para desativar. **Esc** libera o cursor.

Na mochila, selecione um item e use **Equipar** no painel direito. Ele sai da grade e ocupa somente o slot correspondente do personagem. Clique nesse slot e em **Retirar** para devolvê-lo à mochila. Trocar uma peça devolve a anterior à bolsa. Itens de baú têm raridade e bônus de ataque ou defesa; a grade ganha rolagem quando houver mais itens.

Se o projeto antigo ainda aparecer no gerenciador do Godot, remova apenas a entrada **Reload Adventure** da lista. Abra **Reload Adventure — RPG 3D**. O gerenciador pode manter entradas de pastas importadas anteriormente.

Veja [o manual](rpg3d/README.md) para habilidades, probabilidades do baú e detalhes.
