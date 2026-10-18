# Validação antes da entrega

O usuário pediu que as atualizações do jogo sejam sempre testadas antes da entrega.

- O projeto ativo é `rpg3d/project.godot`, no Godot 4.6.3 padrão.
- Antes de entregar mudanças no jogo, execute a importação do Godot, o smoke test e os testes de comportamento relevantes descritos em `rpg3d/README.md`. Corrija falhas e examine os logs, inclusive erros que não alteram o código de saída.
- Para modelos, materiais, equipamentos, animações e interface, renderize no próprio Godot e inspecione as imagens. Para alterações no personagem, confira repouso, movimento, ataque/conjuração, morte e prévia do inventário. Testes headless sozinhos não confirmam o resultado visual.
- Informe o que foi realmente verificado e qualquer limitação restante. Não descreva uma verificação não executada como aprovada.
- Preserve os arquivos legados não rastreados `godot/` e `index.html`; não os inclua no pacote nem os remova.
