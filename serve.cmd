@echo off
rem EchoSpeak local dev server (keep-alive wrapper)
setlocal
set "NODE_DIR=C:\Users\Administrator\AppData\Local\nodejs-portable\v26.13.1"
set "PATH=%NODE_DIR%;%PATH%"
set "LOG=%~dp0serve.log"
cd /d "%~dp0"

rem Skip if another instance already owns the port, so double-start never fights.
netstat -ano | findstr /R /C:":5173 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
  echo [EchoSpeak] %date% %time% port 5173 already in use, skip startup >> "%LOG%"
  exit /b 0
)

if not exist "node_modules" (
  echo [EchoSpeak] installing dependencies... >> "%LOG%"
  call "%NODE_DIR%\npm.cmd" install >> "%LOG%" 2>&1
)

:loop
echo [EchoSpeak] %date% %time% starting server on http://127.0.0.1:5173/ >> "%LOG%"
call "%NODE_DIR%\npm.cmd" run dev >> "%LOG%" 2>&1
echo [EchoSpeak] %date% %time% server stopped, restart in 5s >> "%LOG%"
timeout /t 5 /nobreak >nul
goto loop
