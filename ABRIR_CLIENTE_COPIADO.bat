@echo off
setlocal
cd /d "%~dp0"
title Teste isolado do cliente capturado
where node >nul 2>nul
if errorlevel 1 (
 echo Instale Node.js 22 ou 24 LTS para abrir este teste.
 pause
 exit /b 1
)
echo Este teste usa apenas o cliente copiado, sem o nosso jogo.
echo O servidor original nao foi fornecido no ZIP.
echo Acesse http://127.0.0.1:5188/jogar quando o terminal estiver pronto.
echo Diagnostico em http://127.0.0.1:5188/diagnostico
node server.mjs
pause
endlocal
