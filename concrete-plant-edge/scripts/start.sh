#!/bin/bash

# 混凝土搅拌站边缘计算节点启动脚本
# Concrete Plant Edge Node Startup Script

echo "🚀 启动混凝土搅拌站边缘计算节点..."

# 检查Node.js版本
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请安装Node.js 18或更高版本"
    exit 1
fi

echo "✅ Node.js版本: $NODE_VERSION"

# 检查npm
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未安装npm"
    exit 1
fi

echo "✅ npm版本: $NPM_VERSION"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env文件不存在，复制示例文件..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已创建.env文件，请根据需要修改配置"
    else
        echo "❌ 错误: .env.example文件不存在"
        exit 1
    fi
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查数据库文件
if [ ! -f "data/edge.db" ]; then
    echo "🗄️ 初始化数据库..."
    mkdir -p data
    npm run db:generate
    npm run db:push
    npm run db:init
    if [ $? -ne 0 ]; then
        echo "❌ 数据库初始化失败"
        exit 1
    fi
    echo "✅ 数据库初始化完成"
fi

# 构建应用
echo "🔨 构建应用..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 应用构建失败"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动应用
echo "🚀 启动边缘计算节点..."
echo "📊 本地监控界面: http://localhost:3000"
echo "🔧 API接口: http://localhost:3000/api"
echo "📝 日志文件: logs/edge-node.log"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"

# 启动服务
npm run start:prod

echo "👋 边缘计算节点已停止"