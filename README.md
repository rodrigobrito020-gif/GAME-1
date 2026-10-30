# Cliente capturado + servidor local — 0.3: teste de farm

Esta versão usa **o cliente do seu `recursos-publicos.zip` como base**, com um servidor local próprio. Já permite testar uma caçada funcional: movimento automático até os inimigos, ataques, quatro habilidades, dano recebido, mortes, respawn, EXP, ouro, drops, equipamentos e progresso salvo.

## Abrir no Windows

1. Encerre a versão anterior com **Ctrl+C** no terminal.
2. Extraia o novo ZIP em uma pasta nova.
3. Coloque **recursos-publicos.zip** junto de **ABRIR_CLIENTE_COPIADO.bat**, sem extrair o arquivo de recursos. Ele também pode ficar em Downloads.
4. Para manter o progresso da versão anterior, copie a pasta **.local-runtime** inteira para a nova pasta, com ambos os servidores fechados. Se não copiar, será criada outra conta local de teste.
5. Abra **ABRIR_CLIENTE_COPIADO.bat**. O navegador entra automaticamente na conta local em **http://127.0.0.1:5188/jogar?demo=1**. Deixe o terminal aberto.

Requer Node.js **22.12+ ou 24 LTS**. O iniciador instala a dependência `ws` na primeira execução. Login manual: **teste**, senha **Teste123!**. Nenhuma conta do site original é utilizada.

## Testar o farm

1. Na cidade, pressione **M** para abrir **Caçadas**.
2. Em **Arena local — treino**, clique em **Iniciar**. O personagem procura e ataca monstros automaticamente. A segunda arena exige nível 5.
3. As quatro habilidades são usadas automaticamente por padrão. **1–4** também permitem acioná-las respeitando alvo, alcance, mana e recarga. **Z** usa uma poção de vida e **X**, de mana. Cada conta recebe dez pequenas de cada, uma única vez.
4. Observe a vida dos inimigos, os números de dano, EXP, ouro, contador de abates e drops. Os inimigos reaparecem três segundos depois de morrer.
5. Clique em **Sair da caçada** no canto superior direito e confirme. **I** abre a mochila. Selecione uma espada ou peitoral de treino recebido e use a opção de equipar. Equipamentos só são trocados na cidade.
6. Feche e reabra o servidor: nível, EXP, ouro, itens, equipamentos, poções e ordem das habilidades permanecem salvos. A conta retorna à cidade; não existe ganho offline nesta versão.

Na cidade: **WASD/setas** para andar, **I** inventário, **M** caçadas e **Esc** fecha painéis. O cliente usa clique para selecionar/interagir, não para caminhar pelo chão. Na caçada, a movimentação é automática.

Ao morrer, o farm para e o personagem volta à cidade em três segundos, recuperado. Não há perda de EXP neste teste. Uma segunda janela autenticada encerra a conexão da primeira: existe **um único personagem local**, sem duplicar recompensas por abas abertas.

## Conteúdo e limites deste teste

- O ZIP forneceu **um mapa completo da cidade**, seus sete tilesets e colisões. Não vieram os mapas das caçadas. As duas arenas são instâncias separadas que reutilizam esse cenário; a praça segura não recebe monstros.
- Não vieram os sprites completos de monstros nem as animações completas dos personagens. Avatar e inimigos usam **artes provisórias derivadas da sombra idle disponível**. Os GIFs de prévia não equivalem às folhas completas de animação. Não recuperamos as animações ausentes.
- As habilidades usam eventos reais de combate no cliente, com dano e cura calculados no servidor. Alguns efeitos gráficos e áudios não vieram no pacote e continuam indisponíveis.
- Itens implementados: fragmento empilhável, espada e peitoral de treino. Cada abate dá fragmento se houver espaço; a cada três abates da caçada, uma espada ou peitoral. Com mochila cheia, não entram itens novos; o jogo continua concedendo EXP e ouro. Retirar equipamento com a mochila cheia é recusado.
- Poções pequenas de vida/mana consomem estoque, recuperam 40% e têm intervalo de 1,5 segundo. O protocolo de compra funciona na cidade: dez ouros por poção, sem ouro ou itens gratuitos repetidos.
- Números de dano, monstros, drops, progressão, cura na cidade e preços são **regras provisórias para testar a base**, não o balanceamento do jogo original nem decisões finais aprovadas.
- Não há novos personagens/classes, todos os equipamentos originais, chefes, NPCs de serviço, negociação, guildas, rankings, talentos ou multiplayer implementados. Os menus capturados desses sistemas podem existir, mas suas operações continuam recusadas. Consultas de avisos/listas recebem estados vazios, sem criar eventos ou recompensas.

## Executar e testar pelo terminal

Dentro da pasta extraída, no CMD:

```bat
npm ci --omit=dev --ignore-scripts
node server.mjs "C:\Users\Brito\Downloads\recursos-publicos.zip"
```

Abra **http://127.0.0.1:5188/jogar?demo=1**. Não use a porta 5173 do projeto anterior.

```bat
npm test
```

Se o ZIP não estiver nesta pasta ou em Downloads:

```bat
set "TEST_CAPTURE_ZIP=C:\caminho\recursos-publicos.zip"
npm test
```

São dez testes automatizados: codec, PNG, combate, respawn, habilidades, morte, progressão, itens, equipamentos, capacidade, poções e integração real WebSocket com o protocolo capturado. A integração também reinicia o processo do servidor e verifica os dados restaurados. Sem o ZIP, a integração é explicitamente pulada; os testes das regras próprias continuam disponíveis. O cliente também foi aberto no Chromium para testar a interface e o ciclo de farm. Consulte **RESULTADO_TESTE.txt**.

## Dados e isolamento

Conta e progresso: **.local-runtime/account.json**. Não apague essa pasta para conservar os dados. Senha armazenada com scrypt; tokens locais duram até oito horas no processo. Ao reiniciar o servidor, a entrada automática faz novo login.

Servidor somente em **127.0.0.1**. Não é uma instalação multiplayer/VPS pronta. Nenhuma conexão, proxy, conta ou sessão do servidor original é utilizada. Scripts e estilos compilados do cliente permanecem sem alteração; nossos adaptadores leem o ZIP local e acrescentam o conteúdo de teste em memória.

O GitHub contém código próprio e adaptadores, sem redistribuir o pacote capturado. Os outros jogos e branches foram preservados.

Diagnóstico: **http://127.0.0.1:5188/diagnostico**.
