@echo off
setlocal
cd /d "%~dp0"
title Cliente copiado - Servidor local de teste
where node >nul 2>nul
if errorlevel 1 (
 echo Instale Node.js 22 ou 24 LTS para abrir este teste.
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 (
 echo Atualize o Node.js para 22 ou 24 LTS.
 pause
 exit /b 1
)
if not exist "node_modules\ws\package.json" (
 call npm ci --omit=dev --ignore-scripts
 if errorlevel 1 goto failed
)
echo Cliente capturado com servidor local de teste.
echo Mantenha recursos-publicos.zip aqui ou em Downloads.
echo O navegador abre com a conta local de demonstracao.
set "OPEN_BROWSER=1"
node server.mjs
if errorlevel 1 goto failed
endlocal
exit /b 0
:failed
echo Nao foi possivel iniciar. Leia o erro acima.
pause
endlocal
exit /b 1
