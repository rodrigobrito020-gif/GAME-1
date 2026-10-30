# Direção aprovada e estado da reconstrução — 30/10/2026

O usuário pediu para reproduzir primeiro o jogo de referência, Leveling Idle 2D, e somente depois decidir quais recursos retirar ou mudar. Esta passa a ser a direção de apresentação e interação. Não vamos apresentar uma troca de cenário como se fosse o jogo completo.

As decisões explícitas do `PROMPT_MESTRE_CODEX_LINEAGE_2D_IDLE.md` permanecem preservadas, incluindo raças, classes, progressões, quatro slots, Party, loot, summons, grades e separação entre regras aprovadas e números de demonstração. Nenhum sistema pago foi inventado a partir de contadores da imagem.

## Referência 3: o que funciona agora

- Cidade do pacote com sete tilesets, animações, profundidade, colisão autoritativa e caminhos.
- Ícones locais do pacote nos menus, poções e galeria de imagens existentes. Fontes locais. As imagens de equipamento que não vieram no ZIP continuam com ícones próprios.
- Música da praça, passos durante movimento real, sons de impactos de combate, controle de volume, ativação por gesto, pausa em segundo plano e limite de oito vozes de efeitos. Sem downloads de áudio ao abrir uma sessão com som desativado.
- HUD compacto, barra de serviços no alto, chat e registro, alvo, quatro habilidades e controles de farm ligados ao servidor.
- Inventário com slots de equipamento, prévia do personagem, detalhes, uso de poções, equipar/retirar, busca, filtros e ordenação de raridade reversível. Todos os itens existentes continuam acessíveis por rolagem interna.
- Curandeira acessível por clique/E ou botão/caminhar, restaurando HP/MP no servidor. Serviço gratuito **provisório**.
- Guarda-volumes com duas grades de itens. Depositar/retirar por duplo clique, botão direito ou arrastar. Somente perto do NPC, fora de hunts; mantém itens equipados separados, valida capacidade e evita duplicação. Contas anteriores recebem coleção vazia sem perder a mochila.
- Conteúdo funcional anterior mantido: movimento, criação/contas, multiplayer, hunts, combate automático, habilidades, drops, profissões, Party, fabricação, reforja e progresso persistente.

## O que ainda impede dizer que está igual

1. As folhas de corpo, cabelo, olhos, roupas, equipamentos, caminhada e combate dos personagens normais não vieram no ZIP. `paperdoll.json` e `paperdoll-looks.json` são referências e configurações, não imagens. Há uma folha idle de sombra e previews, insuficientes para reproduzir todos os personagens.
2. As folhas de monstros, mapas completos de hunts e todos os efeitos não vieram na captura. Os biomas e criaturas das hunts ainda usam arte própria de teste.
3. Os builds JavaScript do navegador não contêm o projeto do servidor nem banco, autenticação, economia e regras internas completas do jogo original. Rodar esses builds sem o servidor original não produz um jogo independente funcional. Nosso servidor continua executando as decisões aprovadas.
4. Textos/ícones de guilda, correio, leilão, rankings, eventos e outros menus não implementam seus sistemas. Eles ainda precisam de especificação e código real; não criamos botões que fingem esses resultados.

Não foram removidos recursos funcionais anteriores para simplificar o trabalho. Os cortes e a substituição por assets próprios continuam para uma etapa posterior, conforme solicitado. Não há equivalência integral nem prazo automático prometido para sistemas cujas regras não constam do material recebido.

## Entrega e verificação

O GitHub recebe código próprio e importador. O pacote do usuário continua local em pasta ignorada. Execute `INICIAR_TESTE.bat` com `recursos-publicos.zip` em Downloads ou na pasta do jogo. A etiqueta no jogo mostra `REFERÊNCIA · 3`.

Para atualizar, pare o servidor, faça backup de `prisma/dev.db` e mescle os arquivos novos na instalação existente, preservando `.env` e o banco. Importação e `setup` não apagam personagens. O iniciador recusa portas ocupadas para evitar abrir uma versão antiga sem perceber.

Checks: `npm run lint`, `npm run build`, `npm test`, `npm run test:browser`. Testes de serviços verificam pilhas, falta de espaço sem perda de itens, repetição sem duplicação, restrições de mapa/distância e saves antigos. Fluxos reais de navegador cobrem os três gestos de transferência e persistência.

## Decisões ainda pendentes conforme o prompt mestre

Kits definitivos de nível 150+/300, talentos, híbridos, números finais de balanceamento, valores definitivos dos novos serviços e regras específicas dos sistemas da referência ainda não definidos no documento aprovado. A solicitação de reproduzir a experiência não preenche automaticamente regras internas ausentes.
