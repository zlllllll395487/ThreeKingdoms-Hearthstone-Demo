@echo off
chcp 65001 >nul
title Sanguo Lushi - Dev Preview

cd /d "%~dp0game"

echo.
echo  ====================================================
echo    Sanguo Lushi - Local Dev Preview
echo  ====================================================
echo.
echo   Starting Vite dev server with hot reload...
echo   Browser will auto-open at http://localhost:5173/
echo.
echo   Tips:
echo     - Code changes auto-reload (no build needed)
echo     - Press Ctrl+C to stop the server
echo     - Close this window when done
echo.
echo  ====================================================
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo  ====================================================
    echo   Failed to start. Possible reasons:
    echo    1. Node.js not installed
    echo    2. npm install never ran in game/ folder
    echo    3. Port 5173 occupied by another process
    echo  ====================================================
    pause
)
