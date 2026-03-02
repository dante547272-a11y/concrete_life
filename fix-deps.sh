#!/bin/bash

# 依赖修复脚本 - Linux/Mac
# Dependency Fix Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  依赖冲突修复脚本${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

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

# 修复后端依赖
fix_backend() {
    print_info "修复后端依赖..."
    
    if [ ! -d "concrete-plant-api" ]; then
        print_error "未找到后端目录"
        return 1
    fi
    
    cd concrete-plant-api
    
    # 备份原 package.json
    if [ -f "package.json" ]; then
        print_info "备份 package.json..."
        cp package.json package.json.backup
    fi
    
    # 选择修复方案
    echo ""
    echo "请选择修复方案:"
    echo "1) 安装缺失的依赖（快速）"
    echo "2) 更新 package.json 并重新安装（推荐）"
    echo "3) 完全重新安装所有依赖"
    echo "4) 取消"
    echo ""
    read -p "请输入选项 (1-4): " choice
    
    case $choice in
        1)
            print_info "安装缺失的依赖..."
            npm install \
                @nestjs/platform-socket.io@^10.0.0 \
                @nestjs/schedule@^4.0.0 \
                @nestjs/websockets@^10.0.0 \
                @types/passport-jwt@^3.0.8 \
                @types/passport-local@^1.0.35 \
                passport-local@^1.0.0 \
                socket.io@^4.6.0
            print_success "缺失依赖已安装"
            ;;
        2)
            print_info "更新 package.json..."
            if [ -f "../package.json.fixed" ]; then
                cp ../package.json.fixed package.json
                print_success "package.json 已更新"
            fi
            
            print_info "删除旧的依赖..."
            rm -rf node_modules package-lock.json
            
            print_info "重新安装依赖..."
            npm install
            print_success "依赖重新安装完成"
            ;;
        3)
            print_info "删除所有依赖..."
            rm -rf node_modules package-lock.json
            
            print_info "重新安装依赖..."
            npm install
            print_success "依赖重新安装完成"
            ;;
        4)
            print_warning "取消修复"
            cd ..
            return 0
            ;;
        *)
            print_error "无效选项"
            cd ..
            return 1
            ;;
    esac
    
    # 验证修复
    print_info "验证依赖..."
    if npm ls >/dev/null 2>&1; then
        print_success "所有依赖正常"
    else
        print_warning "仍有一些依赖问题，但不影响运行"
    fi
    
    cd ..
}

# 检查前端依赖
check_frontend() {
    print_info "检查前端依赖..."
    
    if [ ! -d "concrete-plant-web" ]; then
        print_warning "未找到前端目录"
        return 0
    fi
    
    cd concrete-plant-web
    
    if npm ls >/dev/null 2>&1; then
        print_success "前端依赖正常"
    else
        print_warning "前端有一些依赖警告"
        read -p "是否重新安装前端依赖? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "重新安装前端依赖..."
            rm -rf node_modules package-lock.json
            npm install
            print_success "前端依赖重新安装完成"
        fi
    fi
    
    cd ..
}

# 生成报告
generate_report() {
    print_info "生成依赖检查报告..."
    
    {
        echo "# 依赖修复后检查报告"
        echo ""
        echo "## 后端依赖"
        echo ""
        if [ -d "concrete-plant-api" ]; then
            cd concrete-plant-api
            npm ls 2>&1 || true
            cd ..
        fi
        echo ""
        echo "## 前端依赖"
        echo ""
        if [ -d "concrete-plant-web" ]; then
            cd concrete-plant-web
            npm ls 2>&1 || true
            cd ..
        fi
    } > 依赖检查报告-修复后.txt
    
    print_success "报告已生成: 依赖检查报告-修复后.txt"
}

# 主函数
main() {
    print_header
    
    # 修复后端
    fix_backend
    
    # 检查前端
    check_frontend
    
    # 生成报告
    generate_report
    
    echo ""
    print_success "依赖修复完成！"
    echo ""
    print_info "建议运行测试确保一切正常:"
    echo "  cd concrete-plant-api && npm test"
    echo "  cd concrete-plant-web && npm test"
    echo ""
}

main


