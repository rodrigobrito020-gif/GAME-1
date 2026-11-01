# Referência comum — Guerreiro Humano e Arqueira Elfa

A versão 0.6.21 foi rejeitada visualmente. As fontes de `source/` substituem a montagem antiga por desenhos de figuras inteiras: mesma direção de luz, paleta e proporção de cabeça/tronco/pernas. Cada pose pertence a um único desenho completo. Foram criados modelo de quatro direções para as duas classes, caminhadas, espada, arco, salto/cravada, buffs, reações e morte.

Contrato de exibição em `character-art.mjs`: quadro 384×384, pés em (192,352), altura de referência corporal 224px. O cliente nativo usa proxy 64×64, com pés em (32,60). A escala de exibição é dividida por quatro, mantendo o corpo em 112 unidades no mundo quando o ator nativo está em escala dois. Rosto e pernas usam a mesma transformação do corpo inteiro. O espaço vazio acomoda armas/saltos e não determina o tamanho do personagem.

`npm run art:characters` reconstrói as duas classes e suas variantes a partir dessas fontes. Ferramenta opcional de arte: Python 3 + Pillow. Não são dependências para jogar. Os scripts `art:warrior`, `art:archer`, `art:hd`, `art:weapons` e `art:clothes` também usam a construção nova para evitar reintroduzir os recortes rejeitados.

O empacotador mantém a silhueta conectada e a borda antialias, normaliza a figura neutra de cada direção e usa **uma escala uniforme para todos os quadros daquela animação**. O centro é o quadril, sem recentralizar pela ponta de uma arma ou por um pé que avança. Cada manifest registra retângulo-fonte, escala e pivô. A linha de aterrissagem da pose aérea acompanha a ponta da espada; o salto continua sendo deslocado pelo motor.

As ilustrações foram criadas para este projeto com a ferramenta de geração de imagens da OpenAI, usando os personagens próprios anteriores como referência. Arquivos antigos continuam no histórico de arte, mas não são a construção ativa. As novas artes ainda dependem da avaliação visual do jogador.
