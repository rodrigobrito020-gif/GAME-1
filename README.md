# Cliente capturado com servidor local — versão 0.2

Agora o cliente copiado entra no jogo com um **servidor local de compatibilidade próprio**. A versão anterior carregava somente o cliente e parava em 25%; esta implementação responde ao protocolo binário, autentica a conta de demonstração, envia os dados necessários e abre a praça.

**Escopo desta versão: abrir o jogo, entrar no mapa e caminhar.** Não é uma cópia completa do servidor original e não é o Lineage 2D Idle desenvolvido anteriormente.

## Abrir no Windows

1. Instale Node.js **22.12+ ou 24 LTS** se ainda não tiver.
2. Extraia este ZIP em uma **pasta nova**, separada dos outros jogos. Se a versão anterior deste teste estiver aberta, encerre seu terminal com Ctrl+C.
3. Coloque o `recursos-publicos.zip` que você enviou nesta pasta, ou mantenha-o em Downloads. Não precisa extrair esse arquivo.
4. Abra **ABRIR_CLIENTE_COPIADO.bat**. Na primeira vez, ele instala a dependência `ws` pelo npm.
5. O navegador abre **http://127.0.0.1:5188/jogar?demo=1** e entra na conta local de demonstração. Se não abrir automaticamente, acesse esse endereço. Deixe o terminal aberto.

Login manual em **http://127.0.0.1:5188/jogar**: clique em **Já tenho conta**, usuário **teste**, senha **Teste123!**. Essa é uma conta local nova; nenhuma conta ou sessão do site original é usada.

**WASD ou setas:** movimentação. **I:** inventário. **Esc:** fechar painéis. O cliente original usa clique para selecionar/interagir; clicar no chão não manda um comando de caminhada.

Para iniciar pelo terminal, dentro da pasta extraída:

```bat
npm ci --omit=dev --ignore-scripts
node server.mjs "C:\Users\Brito\Downloads\recursos-publicos.zip"
```

Depois abra **http://127.0.0.1:5188/jogar?demo=1**. Não use a porta 5173 da instalação anterior.

## O que funciona

- Conexão WebSocket local e Protobuf compatível com os descritores contidos no cliente capturado. Nenhuma conexão com o serviço original.
- Autenticação da conta de demonstração, verificação de senha com scrypt, token local e reconexão ao recarregar.
- Interface original do cliente, dados básicos de personagem e inventário vazio consultável.
- Entrada na praça do ZIP, sete tilesets, animações e iluminação renderizados pelo próprio cliente capturado.
- Coordenadas em décimos de pixel, snapshots, direção e confirmações de movimento no formato esperado pelo cliente.
- Caminhada WASD/setas com validação de colisões no servidor e grade em bits usada pela previsão do cliente.
- Avatar temporário visível e retrato, usando a imagem `idle-sombra.png` do pacote. O adaptador ajusta o tamanho dos quadros e reaproveita as poses idle; **não inventa nem recupera as animações de caminhada/ataque ausentes**.
- Marcador discreto “SERVIDOR LOCAL · AVATAR TEMPORÁRIO” diferencia esta instalação.

## Limites explícitos

Caçadas, combate, drops, NPCs de serviço, evolução, comércio, guildas, rankings, correio e outros sistemas não foram implementados neste servidor de entrada. Os menus do cliente existem, mas pedidos desses recursos recebem erro localizado; não simulamos sucesso nem recompensas.

Os números iniciais do personagem e a capacidade do inventário são apenas dados mínimos de demonstração para abrir a interface, não balanceamento aprovado. O inventário começa vazio. Não há novas raças, classes ou kits aprovados por esta etapa.

O pacote do navegador não continha as imagens completas dos personagens nem todos os demais assets. O diagnóstico lista arquivos ausentes; alguns ícones/sons secundários permanecem indisponíveis. Ícones ausentes recebem um marcador neutro e continuam listados no diagnóstico. Consultas automáticas de avisos/listas recebem estados vazios para a interface iniciar sem uma pilha de erros; ações de gameplay não implementadas continuam recusadas. O pequeno adaptador de aparência insere somente uma skin local de teste no catálogo visual e converte a folha idle disponível em memória. Os scripts e estilos compilados capturados continuam sem alterações.

## Dados locais e isolamento

A conta e o hash da senha ficam em `.local-runtime/account.json`, ignorado pelo Git. Não há vínculo com o banco dos outros jogos. Tokens de sessão duram até oito horas dentro do processo; ao reiniciar o servidor, entre novamente ou use a entrada automática da demonstração.

O servidor escuta somente **127.0.0.1**, não abre a rede/VPS. Esta é uma implementação de teste para uma conta local, não um servidor multiplayer pronto para publicação. O navegador só pode solicitar recursos e WebSocket locais; não há proxy para o serviço original.

O GitHub contém código próprio e adaptadores. O pacote capturado permanece no ZIP local do usuário. O servidor lê seus arquivos em memória; não é necessário redistribuir as imagens/áudios/builds do outro jogo no repositório.

## Verificação

```bat
npm test
```

Os testes de codec e PNG usam fixtures próprias. A integração de rede usa o ZIP local quando disponível; se ele estiver fora da pasta/Downloads, indique `TEST_CAPTURE_ZIP`. No CMD:

```bat
set "TEST_CAPTURE_ZIP=C:\caminho\recursos-publicos.zip"
npm test
```

A integração verifica autenticação, falha de senha, mapa, colisões, movimento, consulta ao inventário, retomada de sessão e recusa explícita de comandos não implementados. O cliente capturado também foi aberto em Chromium para conferir a entrada na cidade e a interface. O relatório descreve os limites reais. Os comandos/batch foram preparados para Windows; a execução disponível neste ambiente é Linux/Chromium.

Diagnóstico ao vivo: **http://127.0.0.1:5188/diagnostico**.
