@echo off
setlocal
cd /d "%~dp0"
title Lineage 2D Idle - TESTE 2
echo TESTE 2 - interface compacta e praca importada
where node >nul 2>nul
if errorlevel 1 goto missing_node
where npm >nul 2>nul
if errorlevel 1 goto missing_node
node scripts\check-test-start.mjs
if errorlevel 1 goto failed
set "CITY_MODE=imported"
set "IDLE_CITY_ZIP=%~dp0recursos-publicos.zip"
if not exist "%IDLE_CITY_ZIP%" set "IDLE_CITY_ZIP=%USERPROFILE%\Downloads\recursos-publicos.zip"
if not exist "%IDLE_CITY_ZIP%" goto missing_zip
if not exist "node_modules\.package-lock.json" (
  echo Instalando dependencias. Aguarde...
  call npm ci
  if errorlevel 1 goto failed
)
if not exist ".env" copy ".env.example" ".env" >nul
echo Preparando a praca do seu ZIP...
call npm run import:city -- "%IDLE_CITY_ZIP%"
if errorlevel 1 goto failed
echo Preparando banco sem apagar personagens...
call npm run setup
if errorlevel 1 goto failed
echo.
echo Abra http://localhost:5173 quando aparecer VITE ready.
echo Mantenha esta janela aberta enquanto joga. Ctrl+C encerra.
echo.
call npm run dev
goto end
:missing_node
echo Instale o Node.js 22.12 ou superior pelo site https://nodejs.org/
goto failed
:missing_zip
echo Coloque recursos-publicos.zip nesta mesma pasta e abra este arquivo novamente.
echo Use o ZIP de recursos que voce ja baixou pelo navegador.
goto failed
:failed
echo.
echo Nao foi possivel iniciar. Envie uma captura desta janela para verificarmos.
pause
:end
endlocal
