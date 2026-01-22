@echo off
chcp 65001 >nul

REM 混凝土搅拌站管理系统 - 后端启动脚本
REM Concrete Plant Management System - Backend Startup Script

echo 🚀 启动混凝土搅拌站管理系统后端服务...
echo ================================================

REM 检查Node.js版本
echo 📋 检查环境...
for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
for /f "tokens=*" %%i in ('npm -v') do set npm_version=%%i
echo    Node.js: %node_version%
echo    npm: %npm_version%

REM 检查是否存在.env文件
if not exist ".env" (
    echo ⚠️  .env文件不存在，从.env.example复制...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env文件已创建
    ) else (
        echo ❌ .env.example文件不存在，请手动创建.env文件
        pause
        exit /b 1
    )
)

REM 安装依赖
echo.
echo 📦 安装依赖包...
call npm install

REM 生成Prisma客户端
echo.
echo 🔧 生成Prisma客户端...
call npm run db:generate

REM 推送数据库架构
echo.
echo 🗄️  推送数据库架构...
call npm run db:push

REM 检查数据库是否需要初始化
echo.
echo 🔍 检查数据库初始化状态...
if not exist "dev.db" (
    echo 📊 数据库文件不存在，正在初始化...
    call npm run db:seed
) else (
    echo ✅ 数据库文件已存在
    
    REM 询问是否重新初始化数据库
    set /p "reinit=🤔 是否重新初始化数据库？这将清除所有现有数据 (y/N): "
    if /i "%reinit%"=="y" (
        echo 🔄 重新初始化数据库...
        call npm run db:reset
    ) else (
        echo ⏭️  跳过数据库初始化
    )
)

echo.
echo 🎯 启动开发服务器...
echo ================================================
echo 🌐 服务地址: http://localhost:3001
echo 🔍 健康检查: http://localhost:3001/health
echo 📊 Prisma Studio: npm run db:studio (在新终端中运行)
echo ================================================
echo.

REM 启动开发服务器
call npm run start:dev

pause