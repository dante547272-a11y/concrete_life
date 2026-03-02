@echo off
REM 混凝土搅拌站管理系统 - 停止脚本 (Windows)
REM Concrete Plant Management System - Stop Script

setlocal enabledelayedexpansion

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo.
echo ========================================
echo   混凝土搅拌站管理系统 - 停止脚本
echo ========================================
echo.

REM 停止 Node.js 进程
echo %BLUE%[INFO]%NC% 停止前端和后端服务...

REM 查找并停止所有 node 进程（包含 vite 和 nest）
for /f "tokens=2" %%i in ('tasklist ^| findstr "node.exe"') do (
    taskkill /PID %%i /F >nul 2>nul
)

echo %GREEN%[SUCCESS]%NC% Node.js 服务已停止

REM 询问是否停止数据库
set /p "stop_db=是否停止数据库? (y/N): "
if /i "%stop_db%"=="y" (
    where docker >nul 2>nul
    if %errorlevel% equ 0 (
        if exist "docker-compose.yml" (
            echo %BLUE%[INFO]%NC% 停止数据库...
            docker-compose down
            echo %GREEN%[SUCCESS]%NC% 数据库已停止
        )
    )
)

echo.
echo %GREEN%所有服务已停止%NC%
echo.
pause


