#!/bin/bash

# 混凝土搅拌站管理系统 - 一键启动脚本 (Linux/Mac)
# Concrete Plant Management System - Startup Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印标题
print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  混凝土搅拌站管理系统 - 启动脚本${NC}"
    echo -e "${GREEN}  Concrete Plant Management System${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# 检查依赖
check_dependencies() {
    print_info "检查系统依赖..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists docker; then
        print_warning "Docker 未安装，将无法使用 Docker 启动数据库"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "缺少以下依赖: ${missing_deps[*]}"
        print_info "请先安装这些依赖后再运行此脚本"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 检查并安装依赖
install_dependencies() {
    print_info "检查并安装项目依赖..."
    
    # 后端依赖
    if [ -d "concrete-plant-api" ]; then
        cd concrete-plant-api
        if [ ! -d "node_modules" ]; then
            print_info "安装后端依赖..."
            npm install
        else
            print_success "后端依赖已安装"
        fi
        cd ..
    fi
    
    # 前端依赖
    if [ -d "concrete-plant-web" ]; then
        cd concrete-plant-web
        if [ ! -d "node_modules" ]; then
            print_info "安装前端依赖..."
            npm install
        else
            print_success "前端依赖已安装"
        fi
        cd ..
    fi
}

# 启动数据库
start_database() {
    print_info "检查数据库状态..."
    
    if command_exists docker; then
        if docker ps | grep -q postgres; then
            print_success "PostgreSQL 数据库已在运行"
        else
            print_info "启动 PostgreSQL 数据库..."
            if [ -f "docker-compose.yml" ]; then
                docker-compose up -d postgres
                sleep 3
                print_success "数据库启动成功"
            else
                print_warning "未找到 docker-compose.yml，跳过数据库启动"
            fi
        fi
    else
        print_warning "Docker 未安装，请手动启动数据库"
    fi
}

# 启动后端
start_backend() {
    print_info "启动后端服务..."
    
    if [ -d "concrete-plant-api" ]; then
        cd concrete-plant-api
        
        # 检查端口
        if check_port 3000; then
            print_warning "端口 3000 已被占用，后端可能已在运行"
        else
            print_info "在后台启动后端服务..."
            npm run start:dev > ../logs/backend.log 2>&1 &
            echo $! > ../logs/backend.pid
            sleep 3
            print_success "后端服务启动成功 (PID: $(cat ../logs/backend.pid))"
            print_info "后端地址: http://localhost:3000"
            print_info "API 文档: http://localhost:3000/api"
        fi
        
        cd ..
    else
        print_error "未找到后端目录 concrete-plant-api"
    fi
}

# 启动前端
start_frontend() {
    print_info "启动前端服务..."
    
    if [ -d "concrete-plant-web" ]; then
        cd concrete-plant-web
        
        # 检查端口
        if check_port 5173; then
            print_warning "端口 5173 已被占用，前端可能已在运行"
        else
            print_info "在后台启动前端服务..."
            npm run dev > ../logs/frontend.log 2>&1 &
            echo $! > ../logs/frontend.pid
            sleep 3
            print_success "前端服务启动成功 (PID: $(cat ../logs/frontend.pid))"
            print_info "前端地址: http://localhost:5173"
        fi
        
        cd ..
    else
        print_error "未找到前端目录 concrete-plant-web"
    fi
}

# 显示状态
show_status() {
    echo ""
    print_header
    print_success "系统启动完成！"
    echo ""
    echo -e "${GREEN}服务地址:${NC}"
    echo -e "  前端: ${BLUE}http://localhost:5173${NC}"
    echo -e "  后端: ${BLUE}http://localhost:3000${NC}"
    echo -e "  API文档: ${BLUE}http://localhost:3000/api${NC}"
    echo ""
    echo -e "${YELLOW}日志文件:${NC}"
    echo -e "  后端日志: logs/backend.log"
    echo -e "  前端日志: logs/frontend.log"
    echo ""
    echo -e "${YELLOW}停止服务:${NC}"
    echo -e "  运行: ${BLUE}./stop.sh${NC}"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 创建日志目录
    mkdir -p logs
    
    # 检查依赖
    check_dependencies
    
    # 安装项目依赖
    install_dependencies
    
    # 启动数据库
    start_database
    
    # 启动后端
    start_backend
    
    # 启动前端
    start_frontend
    
    # 显示状态
    show_status
}

# 运行主函数
main


