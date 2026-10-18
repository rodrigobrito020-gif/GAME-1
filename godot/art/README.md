# Personagens — primeira adaptação visual

Os PNGs estáticos na raiz de `heroes/` são adaptações produzidas com geração de imagem a partir das referências que o usuário enviou para este projeto. São estudos visuais para avaliação no jogo, sem extração de modelos, texturas ou animações de Lineage 2.

| Arquivo | Classe | Identidade |
| --- | --- | --- |
| `bounty_hunter.png` | Bounty Hunter | Anã, mulher, cabelo ruivo preso, martelo |
| `bishop.png` | Bishop | Humano, homem, vestes claras, cajado de cura |
| `silver_ranger.png` | Silver Ranger | Elfa branca, mulher, cabelo loiro, arco e aljava |
| `spellhowler.png` | Spellhowler | Elfa negra, mulher, pele azul acinzentada, cabelo branco, cajado |
| `destroyer.png` | Destroyer | Orc, homem, pele verde-oliva, corpo robusto, machado de duas mãos |

Cada PNG tem fundo transparente e contém **uma única pose**, com o personagem voltado à direita em três quartos. O recurso `AtlasTexture` `.tres` correspondente delimita o personagem dentro da margem transparente para centralizar os pés e dimensionar a imagem. Os arquivos originais são mantidos sem edição destrutiva.

A cena `scenes/hero_visual.tscn` é reutilizada pelos cinco heróis. Os movimentos iniciais são procedurais: repouso, impulso de ataque, indicação de dano e estado caído. O Bishop agora usa a sequência de teste descrita abaixo.

Estes visuais ainda precisam da avaliação do usuário, especialmente silhueta, arma, proporções e legibilidade no tamanho da batalha. Classes, raridades e habilidades definitivas continuam seguindo o documento de conceito.

## Grelim

`enemies/grelim.png` adapta o modelo visual enviado pelo usuário para pixel art: cabeça rochosa ocre, dois chifres, orelhas pontudas, olhos âmbar e garras longas. A imagem já está voltada à esquerda, na direção dos heróis. O Grelim comum e o chefe reutilizam a mesma pose, em tamanhos diferentes. Repouso, impulso ao atacar, dano e estado caído usam os mesmos movimentos procedurais dos heróis. Animações quadro a quadro ainda não estão presentes.

## Cenário

`backgrounds/village_edge.png` é uma primeira proposta de cenário de batalha em pixel art, produzida com geração de imagem para o projeto: casas de madeira e palha, muralha de pedra, floresta ao fundo e um campo aberto em perspectiva para as equipes. É uma imagem de fundo estática; não implementa navegação pela vila nem edifícios interativos. O cenário ocupa a largura do campo, com fundos separados para o cabeçalho e a coleção.

## Teste de conjuração do humano mago

`heroes/magic_test/frame-00.png` até `frame-12.png` são renders transparentes da sequência `CastShort_MMagic`, extraída de `Magic.ukx` enviado pelo usuário (CRC32 validado: `45453f56`). Amostras dos quadros 0, 2, …, 24; origem a 30 fps, reprodução em cerca de 0,83 segundo. UEViewer `a0bfb468`, importador PSK/PSA 7.1.3 e Blender 4.3.2.

O personagem usa material neutro cinza porque as texturas não vieram com o pacote. É somente um teste do movimento do humano mago; não representa a pixel art final, nem inclui partículas e sons do cliente. O jogo reproduz os quadros pelo relógio da ação, mantendo os pés ancorados e respeitando pausa, velocidade e derrota. Os arquivos UKX, PSK, PSA e o cliente original não fazem parte do projeto.
