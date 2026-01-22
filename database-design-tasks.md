# 混凝土搅拌站管理系统 - 数据库表设计任务清单

## 1. 基础管理表

### 1.1 站点管理 (sites)
- [x] 站点基本信息表
  - id, name, code, address, status, manager, phone, created_at, updated_at

### 1.2 用户管理 (users)
- [ ] 用户表
  - id, username, password_hash, email, phone, role, status, created_at, updated_at
- [ ] 角色表 (roles)
  - id, name, description, permissions, created_at, updated_at
- [ ] 用户角色关联表 (user_roles)
  - user_id, role_id, site_id, created_at

### 1.3 员工管理 (employees)
- [ ] 员工信息表
  - id, name, employee_no, department, position, phone, status, join_date, avatar, site_id, created_at, updated_at

## 2. 车辆管理模块

### 2.1 车辆档案 (vehicles)
- [ ] 车辆基本信息表
  - id, plate_number, vehicle_type, capacity, brand, model, year, status, purchase_date, site_id, created_at, updated_at
- [ ] 车辆维护记录表 (vehicle_maintenance)
  - id, vehicle_id, maintenance_type, description, cost, maintenance_date, next_maintenance_date, operator, created_at

### 2.2 司机管理 (drivers)
- [ ] 司机信息表
  - id, name, phone, license_number, license_type, license_expiry, status, hire_date, site_id, created_at, updated_at
- [ ] 司机车辆关联表 (driver_vehicles)
  - driver_id, vehicle_id, assigned_date, status

### 2.3 排队管理 (queue)
- [ ] 排队记录表
  - id, vehicle_id, driver_id, task_id, queue_number, arrival_time, start_loading_time, finish_loading_time, departure_time, status, site_id, created_at

## 3. 订单任务管理模块

### 3.1 订单管理 (orders)
- [ ] 订单主表
  - id, order_number, customer_name, contact_phone, concrete_grade, total_volume, unit_price, total_amount, delivery_address, required_date, status, source, site_id, created_at, updated_at
- [ ] 订单明细表 (order_items)
  - id, order_id, concrete_grade, volume, unit_price, amount, delivery_date, status

### 3.2 任务派单 (tasks)
- [ ] 任务表
  - id, task_number, order_id, vehicle_id, driver_id, concrete_grade, volume, status, assigned_at, started_at, completed_at, site_id, created_at, updated_at

### 3.3 远端订单同步 (remote_orders)
- [ ] 远端配置表
  - id, site_id, enabled, url, api_key, sync_interval, last_sync_time, created_at, updated_at
- [ ] 远端订单日志表
  - id, sync_time, orders_count, success_count, error_count, error_message, site_id, created_at

## 4. 混凝土/物料管理模块

### 4.1 原材料管理 (materials)
- [ ] 原材料基本信息表
  - id, name, type, specification, unit, supplier, low_threshold, site_id, created_at, updated_at
- [ ] 原材料库存表 (material_stocks)
  - id, material_id, current_stock, capacity, last_update, site_id, created_at, updated_at
- [ ] 入库记录表 (material_inbound)
  - id, material_id, quantity, unit_price, total_amount, supplier, batch_number, inbound_date, operator, site_id, created_at
- [ ] 出库记录表 (material_outbound)
  - id, material_id, quantity, purpose, batch_number, outbound_date, operator, site_id, created_at

### 4.2 混凝土等级管理 (concrete_grades)
- [ ] 混凝土等级表
  - id, grade, strength_class, description, slump_range, applications, price_per_cubic, status, site_id, created_at, updated_at

### 4.3 配方管理 (recipes)
- [ ] 配方主表
  - id, name, concrete_grade, slump, version, status, created_by, site_id, created_at, updated_at
- [ ] 配方明细表 (recipe_items)
  - id, recipe_id, material_id, target_weight, unit, tolerance, sort_order

### 4.4 策略管理 (strategies)
- [ ] 自动矫正策略表
  - id, name, type, description, enabled, priority, conditions, actions, site_id, created_at, updated_at

### 4.5 设备管理 (equipment)
- [ ] 设备基本信息表
  - id, name, type, model, location, status, install_date, last_maintenance_date, next_maintenance_date, health_score, site_id, created_at, updated_at
- [ ] 设备指标表 (equipment_metrics)
  - id, equipment_id, current_value, vibration_value, temperature_value, start_stop_count, total_running_hours, daily_running_hours, recorded_at
- [ ] 设备配件表 (equipment_parts)
  - id, equipment_id, name, type, lifespan, used_hours, remaining_percent, status, last_replace_date, created_at, updated_at
- [ ] 设备维护记录表 (equipment_maintenance)
  - id, equipment_id, maintenance_type, description, cost, maintenance_date, operator, site_id, created_at

## 5. 生产控制模块

### 5.1 生产批次 (production_batches)
- [ ] 生产批次表
  - id, batch_number, task_id, recipe_id, concrete_grade, volume, production_time, operator, vehicle_id, status, site_id, created_at, updated_at

### 5.2 配料记录 (batching_records)
- [ ] 配料记录表
  - id, batch_id, material_id, target_weight, actual_weight, deviation, tolerance_status, recorded_at

### 5.3 生产控制组件 (production_components)
- [ ] 生产控制布局表
  - id, site_id, component_type, x_position, y_position, scale, properties, created_at, updated_at

## 6. 质量追溯与计费模块

### 6.1 质量检测 (quality_tests)
- [ ] 质量检测记录表
  - id, batch_id, test_type, test_value, standard_value, status, test_time, operator, site_id, created_at, updated_at
- [ ] 坍落度检测表 (slump_tests)
  - id, batch_id, target_slump, actual_slump, deviation, status, test_time, operator, site_id, created_at
- [ ] 强度检测表 (strength_tests)
  - id, batch_id, test_age, target_strength, actual_strength, status, test_time, operator, site_id, created_at

### 6.2 计费管理 (billing)
- [ ] 计费记录表
  - id, order_id, customer_name, concrete_grade, total_volume, unit_price, total_amount, delivery_count, delivery_date, status, site_id, created_at, updated_at
- [ ] 对账记录表 (reconciliation)
  - id, month, customer_name, order_count, total_volume, total_amount, confirmed_amount, difference, status, site_id, created_at, updated_at

## 7. 日志与告警模块

### 7.1 操作日志 (operation_logs)
- [ ] 操作日志表
  - id, timestamp, operator, module, action, target, detail, ip_address, result, site_id, created_at

### 7.2 告警管理 (alarms)
- [ ] 告警记录表
  - id, type, source, message, timestamp, acknowledged, acknowledged_by, acknowledged_at, resolved, resolved_at, site_id, created_at

## 8. 系统配置模块

### 8.1 系统参数 (system_settings)
- [ ] 系统配置表
  - id, site_id, setting_key, setting_value, description, created_at, updated_at

### 8.2 数据字典 (dictionaries)
- [ ] 数据字典表
  - id, category, code, name, value, sort_order, status, description, created_at, updated_at

## 9. 统计分析模块

### 9.1 生产统计 (production_statistics)
- [ ] 日生产统计表
  - id, site_id, date, total_batches, total_volume, concrete_grades, vehicle_count, created_at
- [ ] 月生产统计表
  - id, site_id, year_month, total_batches, total_volume, revenue, cost, profit, created_at

### 9.2 设备运行统计 (equipment_statistics)
- [ ] 设备运行统计表
  - id, equipment_id, date, running_hours, start_stop_count, efficiency, maintenance_cost, site_id, created_at

## 10. 索引和约束设计

### 10.1 主要索引
- [ ] 为所有外键字段创建索引
- [ ] 为查询频繁的字段创建复合索引
- [ ] 为时间字段创建索引以支持时间范围查询

### 10.2 约束设计
- [ ] 外键约束
- [ ] 唯一性约束
- [ ] 检查约束
- [ ] 默认值设置

## 11. 数据迁移和初始化

### 11.1 基础数据
- [ ] 默认站点数据
- [ ] 系统角色和权限数据
- [ ] 数据字典初始化
- [ ] 混凝土等级标准数据

### 11.2 测试数据
- [ ] 员工测试数据
- [ ] 车辆和司机测试数据
- [ ] 原材料和配方测试数据
- [ ] 订单和任务测试数据

## 备注
- 所有表都包含 site_id 字段以支持多站点管理
- 所有表都包含 created_at 和 updated_at 时间戳
- 考虑软删除机制（deleted_at 字段）
- 考虑数据版本控制和审计日志
- 考虑数据备份和恢复策略