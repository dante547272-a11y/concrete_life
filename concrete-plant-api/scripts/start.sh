#!/bin/bash

# 混凝土搅拌站管理系统 - 后端启动脚本
# Concrete Plant Management System - Backend Startup Script

echo "🚀 启动混凝土搅拌站管理系统后端服务..."
echo "================================================"

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v)
npm_version=$(npm -v)
echo "   Node.js: $node_version"
echo "   npm: $npm_version"

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env文件不存在，从.env.example复制..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env文件已创建"
    else
        echo "❌ .env.example文件不存在，请手动创建.env文件"
        exit 1
    fi
fi

# 安装依赖
echo ""
echo "📦 安装依赖包..."
npm install

# 生成Prisma客户端
echo ""
echo "🔧 生成Prisma客户端..."
npm run db:generate

# 推送数据库架构
echo ""
echo "🗄️  推送数据库架构..."
npm run db:push

# 检查数据库是否需要初始化
echo ""
echo "🔍 检查数据库初始化状态..."
if [ ! -f "dev.db" ]; then
    echo "📊 数据库文件不存在，正在初始化..."
    npm run db:seed
else
    echo "✅ 数据库文件已存在"
    
    # 询问是否重新初始化数据库
    read -p "🤔 是否重新初始化数据库？这将清除所有现有数据 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 重新初始化数据库..."
        npm run db:reset
    else
        echo "⏭️  跳过数据库初始化"
    fi
fi

echo ""
echo "🎯 启动开发服务器..."
echo "================================================"
echo "🌐 服务地址: http://localhost:3001"
echo "🔍 健康检查: http://localhost:3001/health"
echo "📊 Prisma Studio: npm run db:studio (在新终端中运行)"
echo "================================================"
echo ""

# 启动开发服务器
npm run start:dev