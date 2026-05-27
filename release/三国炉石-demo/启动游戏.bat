@echo off
chcp 65001 >nul
title 三国炉石 Demo

echo.
echo  ====================================================
echo    三国炉石 Demo  ·  本地启动器
echo  ====================================================
echo.
echo   正在启动本地服务器，请稍候...
echo   首次启动若浏览器未自动打开，请手动访问 http://localhost:5173/
echo.

cd /d "%~dp0"

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"

if errorlevel 1 (
    echo.
    echo  ====================================================
    echo   启动失败。可能原因：
    echo    1. PowerShell 被禁用（请联系作者）
    echo    2. 端口 5173-5189 全部被其他程序占用
    echo    3. dist 文件夹缺失或损坏
    echo  ====================================================
    pause
)
