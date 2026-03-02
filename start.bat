@echo off
REM 混凝土搅拌站管理系统 - 一键启动脚本 (Windows)
REM Concrete Plant Management System - Startup Script

setlocal enabledelayedexpansion

REM 颜色定义 (Windows 10+)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印标题
echo.
echo ========================================
echo   混凝土搅拌站管理系统 - 启动脚本
echo   Concrete Plant Management System
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%NC% Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%NC% npm 未安装，请先安装 npm
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% 依赖检查通过
echo.

REM 创建日志目录
if not exist "logs" mkdir logs

REM 检查并安装后端依赖
if exist "concrete-plant-api" (
    cd concrete-plant-api
    if not exist "node_modules" (
        echo %BLUE%[INFO]%NC% 安装后端依赖...
        call npm install
    ) else (
        echo %GREEN%[SUCCESS]%NC% 后端依赖已安装
    )
    cd ..
)

REM 检查并安装前端依赖
if exist "concrete-plant-web" (
    cd concrete-plant-web
    if not exist "node_modules" (
        echo %BLUE%[INFO]%NC% 安装前端依赖...
        call npm install
    ) else (
        echo %GREEN%[SUCCESS]%NC% 前端依赖已安装
    )
    cd ..
)

REM 检查 Docker
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo %BLUE%[INFO]%NC% 检查数据库状态...
    docker ps | findstr postgres >nul 2>nul
    if %errorlevel% neq 0 (
        if exist "docker-compose.yml" (
            echo %BLUE%[INFO]%NC% 启动 PostgreSQL 数据库...
            docker-compose up -d postgres
            timeout /t 3 /nobreak >nul
            echo %GREEN%[SUCCESS]%NC% 数据库启动成功
        )
    ) else (
        echo %GREEN%[SUCCESS]%NC% PostgreSQL 数据库已在运行
    )
) else (
    echo %YELLOW%[WARNING]%NC% Docker 未安装，请手动启动数据库
)

REM 启动后端
if exist "concrete-plant-api" (
    echo %BLUE%[INFO]%NC% 启动后端服务...
    cd concrete-plant-api
    start "Concrete Plant API" cmd /k "npm run start:dev"
    cd ..
    timeout /t 3 /nobreak >nul
    echo %GREEN%[SUCCESS]%NC% 后端服务启动成功
) else (
    echo %RED%[ERROR]%NC% 未找到后端目录 concrete-plant-api
)

REM 启动前端
if exist "concrete-plant-web" (
    echo %BLUE%[INFO]%NC% 启动前端服务...
    cd concrete-plant-web
    start "Concrete Plant Web" cmd /k "npm run dev"
    cd ..
    timeout /t 3 /nobreak >nul
    echo %GREEN%[SUCCESS]%NC% 前端服务启动成功
) else (
    echo %RED%[ERROR]%NC% 未找到前端目录 concrete-plant-web
)

REM 显示状态
echo.
echo ========================================
echo %GREEN%系统启动完成！%NC%
echo.
echo 服务地址:
echo   前端: http://localhost:5173
echo   后端: http://localhost:3000
echo   API文档: http://localhost:3000/api
echo.
echo 提示:
echo   - 前端和后端服务在独立的命令行窗口中运行
echo   - 关闭对应的命令行窗口即可停止服务
echo   - 或运行 stop.bat 停止所有服务
echo ========================================
echo.

pause


