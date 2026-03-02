#!/bin/bash

echo "🔧 开始批量修复字段名 (snake_case -> camelCase)..."

cd /Users/alexzhuang/Downloads/concrete_life/concrete-plant-api

# 常用字段名映射
declare -A field_map=(
    ["password_hash"]="passwordHash"
    ["created_at"]="createdAt"
    ["updated_at"]="updatedAt"
    ["deleted_at"]="deletedAt"
    ["user_type"]="userType"
    ["employee_no"]="employeeNo"
    ["site_id"]="siteId"
    ["role_id"]="roleId"
    ["user_id"]="userId"
    ["order_id"]="orderId"
    ["task_id"]="taskId"
    ["material_id"]="materialId"
    ["recipe_id"]="recipeId"
    ["batch_id"]="batchId"
    ["equipment_id"]="equipmentId"
    ["supplier_id"]="supplierId"
    ["customer_name"]="customerName"
    ["customer_phone"]="customerPhone"
    ["delivery_address"]="deliveryAddress"
    ["delivery_time"]="deliveryTime"
    ["total_price"]="totalPrice"
    ["total_volume"]="totalVolume"
    ["order_number"]="orderNumber"
    ["batch_number"]="batchNumber"
    ["license_plate"]="licensePlate"
    ["vehicle_type"]="vehicleType"
    ["current_stock"]="currentStock"
    ["min_stock"]="minStock"
    ["max_stock"]="maxStock"
    ["unit_price"]="unitPrice"
    ["low_threshold"]="lowThreshold"
    ["actual_quantity"]="actualQuantity"
    ["planned_quantity"]="plannedQuantity"
    ["start_time"]="startTime"
    ["end_time"]="endTime"
    ["alarm_level"]="alarmLevel"
    ["alarm_type"]="alarmType"
    ["is_active"]="isActive"
    ["is_deleted"]="isDeleted"
    ["phone_number"]="phoneNumber"
    ["email_address"]="emailAddress"
)

echo "📝 修复字段名..."
for snake in "${!field_map[@]}"; do
    camel="${field_map[$snake]}"
    echo "  $snake -> $camel"
    find src -type f -name "*.ts" -exec sed -i '' "s/${snake}/${camel}/g" {} \;
done

echo "✅ 字段名修复完成！"
echo ""
echo "🔍 检查剩余错误..."


