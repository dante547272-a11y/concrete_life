#!/bin/bash

# 混凝土搅拌站管理系统 - 停止脚本 (Linux/Mac)
# Concrete Plant Management System - Stop Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  混凝土搅拌站管理系统 - 停止脚本${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# 停止进程
stop_process() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_info "停止 $service_name (PID: $pid)..."
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "进程未响应，强制停止..."
                kill -9 $pid
            fi
            rm -f "$pid_file"
            print_success "$service_name 已停止"
        else
            print_warning "$service_name 进程不存在"
            rm -f "$pid_file"
        fi
    else
        print_warning "未找到 $service_name 的 PID 文件"
    fi
}

# 主函数
main() {
    print_header
    
    # 停止后端
    stop_process "logs/backend.pid" "后端服务"
    
    # 停止前端
    stop_process "logs/frontend.pid" "前端服务"
    
    # 停止数据库 (可选)
    read -p "是否停止数据库? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v docker >/dev/null 2>&1; then
            if [ -f "docker-compose.yml" ]; then
                print_info "停止数据库..."
                docker-compose down
                print_success "数据库已停止"
            fi
        fi
    fi
    
    echo ""
    print_success "所有服务已停止"
    echo ""
}

main


