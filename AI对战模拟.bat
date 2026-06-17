@echo off
chcp 65001 >nul
title Sanguo Lushi - AI Battle Simulator

cd /d "%~dp0game"

echo.
echo  ============================================================
echo    Sanguo Lushi  -  AI Battle Simulator
echo  ============================================================
echo.
echo    Runs N AI-vs-AI games and outputs a per-card win-rate
echo    report, for data-driven balance tuning.
echo.

if not exist "node_modules" (
    echo   [!] Dependencies not installed.
    echo       Open a terminal in the "game" folder and run:  npm install
    echo.
    pause
    exit /b 1
)

set "GAMES="
set /p GAMES=  How many games?  [default 1000] :
if "%GAMES%"=="" set GAMES=1000

echo.
echo   Running %GAMES% games ... (this may take a few seconds)
echo.

call npx tsx --tsconfig=./tsconfig.app.json scripts/sim/run-sims.ts --games %GAMES% --label manual
if errorlevel 1 (
    echo.
    echo   [!] Simulation failed. Make sure Node.js is installed
    echo       and dependencies are set up ^(npm install^).
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo    Done. Report written to:  docs\sim-reports\
echo    Look for the newest file named  sim-YYYY-MM-DD-manual.md
echo  ============================================================
echo.
start "" "%~dp0docs\sim-reports"
pause
