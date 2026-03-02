#!/bin/bash

# 批量修复测试脚本
# Batch Fix Tests Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  批量修复测试脚本${NC}"
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

# 进入后端目录
cd concrete-plant-api

print_header

print_info "开始批量修复测试..."

# 运行测试并保存结果
print_info "运行测试以识别问题..."
npm test > ../test-results-before.txt 2>&1 || true

# 统计失败的测试
FAILED_BEFORE=$(grep -c "FAIL" ../test-results-before.txt || echo "0")
print_warning "修复前失败的测试套件: $FAILED_BEFORE"

echo ""
print_info "修复建议:"
echo ""
echo "由于测试修复需要逐个文件分析和调整，建议采用以下策略："
echo ""
echo "1. ${YELLOW}优先修复高影响问题${NC}"
echo "   - auth.service.spec.ts (已修复 PrismaService mock)"
echo "   - orders/materials/dashboard/analytics (需要添加完整的 Prisma mock)"
echo ""
echo "2. ${YELLOW}调整测试预期${NC}"
echo "   - recipes/sites/users/vehicles (测试逻辑需要匹配实际代码)"
echo ""
echo "3. ${YELLOW}使用通用 Mock 工具${NC}"
echo "   - 已创建 test/utils/prisma-mock.ts"
echo "   - 在测试中导入并使用: import { createMockPrismaService } from '../utils/prisma-mock'"
echo ""

# 提供快速修复选项
echo ""
echo "快速修复选项:"
echo "1) 仅修复 Prisma mock 问题 (推荐)"
echo "2) 修复所有测试 (需要较长时间)"
echo "3) 生成详细的修复报告"
echo "4) 跳过自动修复，手动处理"
echo ""
read -p "请选择 (1-4): " choice

case $choice in
    1)
        print_info "修复 Prisma mock 问题..."
        
        # 这里可以添加自动化的 sed 命令来批量修复
        # 但由于每个文件的结构不同，建议手动修复或使用更智能的工具
        
        print_warning "由于每个测试文件结构不同，建议手动修复"
        print_info "参考 auth.service.spec.ts 的修复方式"
        ;;
    2)
        print_info "完整修复需要较长时间..."
        print_warning "建议使用 IDE 的重构工具或手动修复"
        ;;
    3)
        print_info "生成详细修复报告..."
        
        # 分析每个失败的测试
        npm test 2>&1 | grep -A 5 "FAIL" > ../test-failures-detail.txt
        
        print_success "详细报告已生成: test-failures-detail.txt"
        ;;
    4)
        print_info "跳过自动修复"
        ;;
    *)
        print_error "无效选项"
        ;;
esac

echo ""
print_info "测试修复指南:"
echo ""
echo "对于 Prisma mock 问题:"
echo "  1. 导入 PrismaService"
echo "  2. 创建 mockPrismaService 对象"
echo "  3. 在 providers 中提供 mock"
echo ""
echo "示例代码:"
echo "  import { PrismaService } from '../../src/prisma/prisma.service';"
echo "  "
echo "  const mockPrismaService = {"
echo "    tableName: {"
echo "      findFirst: jest.fn(),"
echo "      findMany: jest.fn(),"
echo "      create: jest.fn(),"
echo "      update: jest.fn(),"
echo "      delete: jest.fn(),"
echo "    },"
echo "  };"
echo "  "
echo "  providers: ["
echo "    ServiceName,"
echo "    { provide: PrismaService, useValue: mockPrismaService },"
echo "  ]"
echo ""

cd ..

print_success "批量修复脚本执行完成"
echo ""
print_info "下一步:"
echo "  1. 查看生成的报告文件"
echo "  2. 根据建议逐个修复测试文件"
echo "  3. 运行 'npm test' 验证修复结果"
echo ""


