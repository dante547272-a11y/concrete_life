@echo off
chcp 65001 >nul

REM 混凝土搅拌站边缘计算节点启动脚本
REM Concrete Plant Edge Node Startup Script

echo 🚀 启动混凝土搅拌站边缘计算节点...

REM 检查Node.js版本
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Node.js
    echo 请安装Node.js 18或更高版本
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%

REM 检查npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm版本: %NPM_VERSION%

REM 检查环境变量文件
if not exist ".env" (
    echo ⚠️  警告: .env文件不存在，复制示例文件...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ 已创建.env文件，请根据需要修改配置
    ) else (
        echo ❌ 错误: .env.example文件不存在
        pause
        exit /b 1
    )
)

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查数据库文件
if not exist "data\edge.db" (
    echo 🗄️ 初始化数据库...
    if not exist "data" mkdir data
    npm run db:generate
    npm run db:push
    npm run db:init
    if %errorlevel% neq 0 (
        echo ❌ 数据库初始化失败
        pause
        exit /b 1
    )
    echo ✅ 数据库初始化完成
)

REM 构建应用
echo 🔨 构建应用...
npm run build
if %errorlevel% neq 0 (
    echo ❌ 应用构建失败
    pause
    exit /b 1
)

REM 创建日志目录
if not exist "logs" mkdir logs

REM 启动应用
echo 🚀 启动边缘计算节点...
echo 📊 本地监控界面: http://localhost:3000
echo 🔧 API接口: http://localhost:3000/api
echo 📝 日志文件: logs\edge-node.log
echo.
echo 按 Ctrl+C 停止服务
echo ================================

REM 启动服务
npm run start:prod

echo 👋 边缘计算节点已停止
pause