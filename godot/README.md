# Reload Adventure — protótipo Godot

Primeira base jogável do conceito: RPG em equipe para cinco heróis, com seis posições e batalhas automáticas. Feito e validado no Godot **4.6.3**, renderizador Compatibility, sem plugins ou downloads adicionais.

## Abrir e jogar

1. Instale/abra o Godot 4.6.3 (edição padrão, sem necessidade de .NET).
2. No gerenciador de projetos, escolha **Importar** e selecione `project.godot` desta pasta.
3. Abra o projeto e pressione **F6** para executar a cena aberta ou **F5** para executar o projeto.
4. Arraste os personagens no campo para ajustar a formação; soltar sobre outro troca as posições.
5. Clique em **Iniciar batalha**. São três ondas e um chefe, com vida e recargas preservadas entre ondas.

Selecione um cartão na coleção e use **Treinar** para gastar Adena e aumentar o nível. Os personagens da frente recebem os ataques primeiro. O healer prioriza aliados feridos. Cada herói tem um **círculo pequeno de habilidade acima dele**: quando pronto, mostra um símbolo; durante a recarga, fica vermelho e mostra os segundos restantes, com um anel de progresso. Passe o mouse para ler a descrição e clique no círculo para ativar. Desligue **Auto** para controlar somente de forma manual; também pode clicar com Auto ligado. **Pausar** ou **Esc** interrompe a batalha; a velocidade pode ser 1× ou 2×.

## O que já funciona

- Classes do conceito: Bounty Hunter (anã/tank), Bishop (humano/healer), Silver Ranger (elfa branca/arqueira), Spellhowler (elfa negra/maga) e Destroyer (orc/guerreiro), com uma habilidade ativa provisória cada. As cinco classes têm imagens próprias inspiradas nas referências visuais fornecidas pelo usuário.
- Dano, cura, proteção, recargas, habilidades automáticas/manuais, derrota e nova tentativa.
- Três ondas e um chefe por fase; fases seguintes com atributos maiores.
- Cenário de entrada de vila medieval junto à floresta, com chão em perspectiva; os marcadores de formação aparecem somente na preparação.
- Adena por vitória, treino até nível 50 e salvamento de níveis, formação, Adena e fase.
- Arquivo de progresso local em `user://progress.json`, no diretório de dados do aplicativo que o Godot escolhe para seu sistema. O teste de fumaça não lê nem altera esse progresso.

Os números são de teste. As classes seguem os nomes de referência do conceito; nomes pessoais e habilidades definitivas ainda não foram definidos. Os cinco heróis usam PNGs transparentes preparados com geração de imagem a partir das referências fornecidas pelo usuário, sem extração de arquivos de Lineage 2. Os Grelims usam uma adaptação em pixel art do modelo visual enviado pelo usuário; o chefe usa a mesma imagem em tamanho maior. Cada herói e inimigo tem uma pose: repouso com movimento sutil, avanço/inclinação ao atacar, indicação de dano e compressão ao cair são movimentos procedurais. Ainda não são animações desenhadas quadro a quadro; corrida, ataques completos e habilidades animadas por sprite sheet continuam pendentes de produção e aprovação visual.

## Escopo ainda por implementar

Este protótipo não contém o prólogo narrativo, os 30 heróis, passivas, raridades/fusão, equipamentos, invocações, recompensas offline ou evolução Mítica/Divina do documento. A campanha atual repete o cenário de entrada da vila; mapa de regiões e lobby navegável ainda não estão implementados. Não é uma versão publicada ou um jogo completo.

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

`scripts/main.gd` contém as regras e a interface. As definições de heróis estão em `HEROES`, incluindo raça e gênero. Cada herói instancia `scenes/hero_visual.tscn`, com um `Sprite2D` controlado por `scripts/hero_visual.gd`. Os PNGs separados estão em `art/heroes/`; os recursos `.tres` recortam apenas a margem transparente, sem modificar o PNG. `HERO_HEIGHTS` define a escala de apresentação. O próximo passo visual é substituir as poses estáticas por `AnimatedSprite2D` e sprite sheets, preservando as regras de batalha. O progresso existente continua usando os mesmos IDs e formato de salvamento.
