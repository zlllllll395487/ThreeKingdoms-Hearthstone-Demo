@echo off
title Sanguo Lushi - Dev Preview

cd /d "%~dp0game"

echo.
echo  ====================================================
echo    Sanguo Lushi - Local Dev Preview
echo  ====================================================
echo.
echo   Killing stale Vite/node processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo   Starting Vite dev server on port 5180
echo   Browser will open at http://127.0.0.1:5180/
echo.
echo   Tips:
echo     1. Code changes auto-reload, no rebuild needed
echo     2. Press Ctrl+C to stop the server
echo     3. Close this window when done
echo.
echo  ====================================================
echo.

call npx vite --host 127.0.0.1 --port 5180 --strictPort --open

if errorlevel 1 (
    echo.
    echo  ====================================================
    echo   Failed to start. Possible reasons:
    echo    1. Node.js not installed
    echo    2. npm install never ran in game folder
    echo    3. Port 5180 also occupied
    echo  ====================================================
    pause
)
