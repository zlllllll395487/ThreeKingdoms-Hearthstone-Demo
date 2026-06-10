@echo off
chcp 65001 >nul
title Sanguo Lushi - Dev Preview

cd /d "%~dp0game"

echo.
echo  ====================================================
echo    Sanguo Lushi - Local Dev Preview
echo  ====================================================
echo.
echo   Killing any stale Vite/node processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo   Starting Vite dev server on port 5180...
echo   Browser will open at http://127.0.0.1:5180/
echo.
echo   Tips:
echo     - Code changes auto-reload (no rebuild needed)
echo     - Press Ctrl+C to stop the server
echo     - Close this window when done
echo.
echo  ====================================================
echo.

REM Use port 5180 + bind IPv4 only (避免 Windows System 占 5173 IPv6)
REM --strictPort = 端口被占就报错（不静默 fallback 到错误端口）
REM --open = 自动打开浏览器
call npx vite --host 127.0.0.1 --port 5180 --strictPort --open

if errorlevel 1 (
    echo.
    echo  ====================================================
    echo   Failed to start. Possible reasons:
    echo    1. Node.js not installed
    echo    2. npm install never ran in game/ folder
    echo    3. Port 5180 also occupied
    echo  ====================================================
    pause
)
