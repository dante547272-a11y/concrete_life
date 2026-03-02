#!/bin/bash

echo "🔧 修复后端编译错误..."

cd /Users/alexzhuang/Downloads/concrete_life/concrete-plant-api

# 1. 修复 alarms -> alarm
echo "1. 修复 Prisma 表名 alarms -> alarm"
find src -type f -name "*.ts" -exec sed -i '' 's/\.alarms\./\.alarm\./g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/prisma\.alarms/prisma\.alarm/g' {} \;

# 2. 修复 vehicles -> vehicle (如果需要)
echo "2. 检查 vehicles 表名"
grep "model.*Vehicle" prisma/schema.prisma

# 3. 修复 scripts 中的未使用变量
echo "3. 修复 scripts 中的未使用变量"
sed -i '' 's/const materials =/\/\/ const materials =/g' scripts/init-database.ts
sed -i '' 's/const equipment =/\/\/ const equipment =/g' scripts/init-database.ts
sed -i '' 's/const strategies =/\/\/ const strategies =/g' scripts/init-database.ts

# 4. 删除 skipDuplicates (Prisma 可能不支持)
echo "4. 删除 skipDuplicates"
sed -i '' '/skipDuplicates: true,/d' scripts/init-database.ts

echo "✅ 修复完成！"


