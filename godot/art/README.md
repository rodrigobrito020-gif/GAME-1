# Personagens — primeira adaptação visual

Os arquivos em `heroes/` são adaptações produzidas com geração de imagem a partir das referências que o usuário enviou para este projeto. São estudos visuais para avaliação no jogo, sem extração de modelos, texturas ou animações de Lineage 2.

| Arquivo | Classe | Identidade |
| --- | --- | --- |
| `bounty_hunter.png` | Bounty Hunter | Anã, mulher, cabelo ruivo preso, martelo |
| `bishop.png` | Bishop | Humano, homem, vestes claras, cajado de cura |
| `silver_ranger.png` | Silver Ranger | Elfa branca, mulher, cabelo loiro, arco e aljava |
| `spellhowler.png` | Spellhowler | Elfa negra, mulher, pele azul acinzentada, cabelo branco, cajado |
| `destroyer.png` | Destroyer | Orc, homem, pele verde-oliva, corpo robusto, machado de duas mãos |

Cada PNG tem fundo transparente e contém **uma única pose**, com o personagem voltado à direita em três quartos. O recurso `AtlasTexture` `.tres` correspondente delimita o personagem dentro da margem transparente para centralizar os pés e dimensionar a imagem. Os arquivos originais são mantidos sem edição destrutiva.

A cena `scenes/hero_visual.tscn` é reutilizada pelos cinco heróis. Os movimentos iniciais são procedurais: repouso, impulso de ataque, indicação de dano e estado caído. **Não há sequência de quadros de animação nesta entrega.**

Estes visuais ainda precisam da avaliação do usuário, especialmente silhueta, arma, proporções e legibilidade no tamanho da batalha. Classes, raridades e habilidades definitivas continuam seguindo o documento de conceito.
