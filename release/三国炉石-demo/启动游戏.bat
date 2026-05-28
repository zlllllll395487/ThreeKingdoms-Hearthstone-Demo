@echo off
title Sanguo Lushi Demo

echo.
echo  ====================================================
echo    Sanguo Lushi Demo  -  Local Launcher
echo  ====================================================
echo.
echo   Starting local server...
echo   If browser does not open, visit http://localhost:5173/
echo.

cd /d "%~dp0"

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"

if errorlevel 1 (
    echo.
    echo  ====================================================
    echo   Failed to start. Possible reasons:
    echo    1. PowerShell is disabled by system policy
    echo    2. All ports 5173-5189 are in use
    echo    3. dist folder is missing or corrupted
    echo  ====================================================
    pause
)
