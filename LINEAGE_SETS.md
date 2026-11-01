# Equipamentos já preparados — referência para a adaptação 2D

Decisão confirmada pelo jogador em 01/11/2026: aproveitar os sets do Lineage 2 já preparados no GAME-1. Não recomeçar o catálogo nem trocá-lo por armaduras genéricas. O jogador começa de roupas simples; peças de armadura só devem aparecer quando realmente equipadas. Cada conjunto completo mantém a proposta de bônus próprio.

## Correspondência já usada no GAME-1

| Raridade | Grau |
| --- | --- |
| Comum | No Grade |
| Incomum | D |
| Raro | C |
| Épico | B |
| Lendário | A |

Fontes existentes no outro projeto, consultadas nesta atualização:

- `GAME-1/rpg3d/scripts/loot_items.gd`: raridades e correspondência dos graus.
- `GAME-1/rpg3d/scripts/equipment_catalog.gd`: catálogo, perfis pesado/leve/túnica e compatibilidade.
- `GAME-1/rpg3d/scripts/equipment_catalog_data.gd`: conjuntos e referências de meshes, materiais, ícones e IDs originais do cliente.
- `GAME-1/rpg3d/scripts/client_equipment_data.gd`: roupas e elmos adicionais.
- `GAME-1/rpg3d/assets/wardrobe_heavy.glb`, `wardrobe_light.glb`, `wardrobe_robe.glb` e respectivas texturas: recursos 3D existentes.

Exemplos já identificados no catálogo pesado: Wooden Breastplate, Brigandine, Dwarven Chain, Blue Wolf e Dark Crystal. Há também os perfis leve e túnica. As fontes permanecem no GAME-1; não copiar somente o nome de um item e anunciar que seu modelo já foi integrado.

## Situação da base local 2D na 0.6.13

Funciona: roupas iniciais em todas as poses do guerreiro; visual do peitoral de treino derivado do item equipado; restauração das roupas ao retirar; inventário e persistência preservados.

Pendente: adaptar as artes dos sets existentes às direções/poses 2D, importar seus itens e ícones para esta base e ligar os slots e bônus de conjunto. Modelos 3D não são folhas de sprites prontas. A integração de todos os sets não foi concluída nesta versão. Os números de balanceamento definitivos continuam em aberto; não conceder itens, inventar bônus ou substituir o save ao acrescentar aparências.
