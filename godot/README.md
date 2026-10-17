# Reload Adventure — protótipo Godot

Primeira base jogável do conceito: RPG em equipe para cinco heróis, com seis posições e batalhas automáticas. Feito e validado no Godot **4.6.3**, renderizador Compatibility, sem plugins ou downloads adicionais.

## Abrir e jogar

1. Instale/abra o Godot 4.6.3 (edição padrão, sem necessidade de .NET).
2. No gerenciador de projetos, escolha **Importar** e selecione `project.godot` desta pasta.
3. Abra o projeto e pressione **F6** para executar a cena aberta ou **F5** para executar o projeto.
4. Arraste os personagens no campo para ajustar a formação; soltar sobre outro troca as posições.
5. Clique em **Iniciar batalha**. São três ondas e um chefe, com vida e recargas preservadas entre ondas.

Selecione um cartão na coleção e use **Treinar** para gastar Adena e aumentar o nível. Os personagens da frente recebem os ataques primeiro. O healer prioriza aliados feridos. Desligue **Auto** para acionar as habilidades pelos botões; elas também podem ser usadas manualmente enquanto Auto está ligado. **Pausar** ou **Esc** interrompe a batalha; a velocidade pode ser 1× ou 2×.

## O que já funciona

- Tank, healer, arqueira, maga e guerreiro, com uma habilidade ativa provisória cada.
- Dano, cura, proteção, recargas, habilidades automáticas/manuais, derrota e nova tentativa.
- Três ondas e um chefe por fase; fases seguintes com atributos maiores.
- Adena por vitória, treino até nível 50 e salvamento de níveis, formação, Adena e fase.
- Arquivo de progresso local em `user://progress.json`, no diretório de dados do aplicativo que o Godot escolhe para seu sistema. O teste de fumaça não lê nem altera esse progresso.

Os números são de teste. Nomes de habilidades e heróis são provisórios. Os personagens são desenhos geométricos próprios feitos pelo código, sem assets de Lineage 2 ou de outros jogos. Um pequeno avanço e os efeitos de combate indicam os ataques; animações por sprite sheet e arte final ainda serão integradas.

## Escopo ainda por implementar

Este protótipo não contém o prólogo narrativo, os 30 heróis, passivas, raridades/fusão, equipamentos, invocações, recompensas offline ou evolução Mítica/Divina do documento. A campanha atual repete o cenário de teste. Não é uma versão publicada ou um jogo completo.

O projeto é voltado também ao navegador, mas esta entrega foi validada como projeto Godot nativo. Exportações Web e Android precisam dos templates de exportação correspondentes e de testes nas plataformas antes de publicação.

## Desenvolvimento

```sh
# Dentro desta pasta:
godot --editor --path .
godot --path .

# Importar e validar sem interface:
godot --headless --path . --editor --import --quit
godot --headless --path . -- --smoke-test
```

O teste executa a simulação real no Godot: formação, troca, treino, dano, cura, recargas, batalha completa, recompensas, derrota e reinício. Retorna código diferente de zero em caso de falha.

Se o ambiente de execução bloquear as pastas padrão de configuração, use diretórios graváveis:

```sh
mkdir -p /tmp/reload-godot/data /tmp/reload-godot/config /tmp/reload-godot/cache
XDG_DATA_HOME=/tmp/reload-godot/data XDG_CONFIG_HOME=/tmp/reload-godot/config XDG_CACHE_HOME=/tmp/reload-godot/cache godot --headless --path . -- --smoke-test
```

`scripts/main.gd` contém o protótipo e desenha a arte provisória. As definições de heróis estão em `HEROES`; a apresentação visual está em `_draw_unit()`. Podemos substituir esse desenho por cenas com `AnimatedSprite2D` e sprite sheets quando o padrão visual estiver aprovado, preservando as regras de batalha.
