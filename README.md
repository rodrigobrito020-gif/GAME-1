# Teste isolado do cliente copiado — 30/10/2026

Este pacote abre os builds do cliente que estavam em `recursos-publicos.zip`. Não carrega o jogo que desenvolvemos. O código JavaScript e o CSS capturados são servidos sem alterações; o HTML mínimo de entrada e o servidor estático são nossos arquivos de teste.

**Não é um jogo independente jogável.** No teste real em Chromium, o cliente carregou a tela original e parou em **25%**, com **“Servidor indisponível. Tentando novamente…”**. Ele exige conexão WebSocket antes de abrir o login e receber personagens, catálogos e mundo. O servidor original não veio no ZIP e não é substituído por este servidor estático.

## Windows

1. Extraia este ZIP em uma **pasta nova**, separada dos outros jogos.
2. Mantenha o `recursos-publicos.zip` que você enviou em Downloads, ou copie-o para esta pasta.
3. Abra **ABRIR_CLIENTE_COPIADO.bat**. É necessário Node.js 22 ou 24 LTS; não precisa instalar pacotes npm.
4. Abra **http://127.0.0.1:5188/jogar**. A tela original ficará aguardando o servidor.
5. Veja os arquivos carregados e as tentativas de conexão em **http://127.0.0.1:5188/diagnostico**. Deixe o terminal aberto; Ctrl+C encerra.

Não use a porta 5173 da instalação anterior para este teste. Os bancos e personagens dos outros jogos não são abertos nem modificados.

Também é possível iniciar pelo terminal nesta pasta:

```bat
node server.mjs "C:\Users\Brito\Downloads\recursos-publicos.zip"
```

## Conteúdo e limites

- ZIP lido em memória, com validação CRC, limites de tamanho e recusa de caminhos inseguros.
- Os arquivos foram renomeados durante a captura com prefixos numéricos. O servidor resolve nomes únicos; nomes repetidos são indicados como ambíguos, sem escolher um arquivo arbitrariamente.
- Scripts e estilos do build esperado, traduções pt-BR, imagens e fontes existentes são servidos localmente. Arquivos que não vieram na captura retornam 404.
- Chamadas de API e conexão WebSocket não possuem implementação de jogo. O diagnóstico indica essa ausência, sem simular login, sessão ou personagens.
- Este teste não faz proxy nem transfere contas para o servidor original. Não existe acesso ao banco do outro jogo.
- O GitHub contém apenas o iniciador e o servidor de teste próprios. Os arquivos capturados são lidos do ZIP local do usuário.

## O que falta para jogar essa cópia independentemente

O projeto do servidor original e sua configuração/banco, além dos arquivos de cliente que não vieram na captura. O código baixado pelo navegador contém a comunicação e a apresentação do cliente, mas não a implementação que o servidor executa. Reconstruir esse servidor seria um novo trabalho; este pacote não afirma que isso já foi feito.

## Testes executados

Chromium, 1440×900, cliente capturado sem alterações: nenhuma exceção JavaScript; tela original em 25%; tentativas de WebSocket registradas; nenhum código do nosso jogo carregado. Scripts/estilos/traduções foram conferidos pelas requisições locais. Resultado também em RESULTADO_TESTE.txt. Comandos preparados para Windows; execução verificada neste ambiente Linux/Chromium.
