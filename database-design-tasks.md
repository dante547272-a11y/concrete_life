# 混凝土搅拌站管理系统 - 数据库表设计任务清单

## ✅ 已完成 - 数据库设计和实现

**状态**: 已完成所有数据库表设计和SQL实现
**文件**: `database-schema.sql` - 包含完整的数据库结构和初始数据

### 实现概要
- ✅ **35+张表** 覆盖所有业务模块
- ✅ **详细字段注释** 每个字段都有中文说明
- ✅ **完整关系设计** 外键约束和索引优化
- ✅ **初始数据** 站点、角色、管理员用户、数据字典
- ✅ **用户需求** 合并表结构、增强告警系统

### 主要改进
1. **用户表合并**: 将用户/员工/司机合并为单一 `users` 表，通过 `user_type` 字段区分
2. **设备表统一**: 车辆纳入 `equipment` 表，通过 `equipment_type` 字段区分
3. **库存记录合并**: 入库出库记录合并为 `material_transactions` 表
4. **告警系统增强**: 包含告警规则、通知、订阅等完整功能

---

## 1. 基础管理表

### 1.1 站点管理 (sites)
- [x] 站点基本信息表
  - id, name, code, address, status, manager, phone, created_at, updated_at

### 1.2 用户管理 (users)
- [x] 用户表（合并用户/员工/司机）
  - id, username, password_hash, email, phone, name, employee_no, department, position, user_type, license_number, license_type, license_expiry, status, join_date, avatar, site_id, created_at, updated_at
  - user_type: 'admin', 'operator', 'driver', 'quality', 'manager' 等
- [x] 角色表 (roles)
  - id, name, description, permissions, created_at, updated_at
- [x] 用户角色关联表 (user_roles)
  - user_id, role_id, site_id, created_at

## 2. 设备管理模块（包含车辆）

### 2.1 设备管理 (equipment)
- [x] 设备基本信息表（包含车辆、搅拌机、输送带等所有设备）
  - id, name, equipment_type, model, location, capacity, brand, year, plate_number, status, install_date, purchase_date, last_maintenance_date, next_maintenance_date, health_score, site_id, created_at, updated_at
  - equipment_type: 'vehicle', 'mixer', 'conveyor', 'silo', 'scale', 'pump' 等
- [x] 设备指标表 (equipment_metrics)
  - id, equipment_id, current_value, vibration_value, temperature_value, start_stop_count, total_running_hours, daily_running_hours, recorded_at
- [x] 设备配件表 (equipment_parts)
  - id, equipment_id, name, type, lifespan, used_hours, remaining_percent, status, last_replace_date, created_at, updated_at
- [x] 设备维护记录表 (equipment_maintenance)
  - id, equipment_id, maintenance_type, description, cost, maintenance_date, operator_id, site_id, created_at

### 2.2 设备分配关系 (equipment_assignments)
- [x] 设备分配表（如司机-车辆分配）
  - id, equipment_id, user_id, assigned_date, unassigned_date, status, created_at

### 2.3 排队管理 (queue)
- [x] 排队记录表
  - id, equipment_id, driver_id, task_id, queue_number, arrival_time, start_loading_time, finish_loading_time, departure_time, status, site_id, created_at

## 3. 订单任务管理模块

### 3.1 订单管理 (orders)
- [x] 订单主表
  - id, order_number, customer_name, contact_phone, concrete_grade, total_volume, unit_price, total_amount, delivery_address, required_date, status, source, site_id, created_at, updated_at
- [x] 订单明细表 (order_items)
  - id, order_id, concrete_grade, volume, unit_price, amount, delivery_date, status

### 3.2 任务派单 (tasks)
- [x] 任务表
  - id, task_number, order_id, equipment_id, driver_id, concrete_grade, volume, status, assigned_at, started_at, completed_at, site_id, created_at, updated_at

### 3.3 远端订单同步 (remote_orders)
- [x] 远端配置表
  - id, site_id, enabled, url, api_key, sync_interval, last_sync_time, created_at, updated_at
- [x] 远端订单日志表
  - id, sync_time, orders_count, success_count, error_count, error_message, site_id, created_at

## 4. 混凝土/物料管理模块

### 4.1 原材料管理 (materials)
- [x] 原材料基本信息表
  - id, name, type, specification, unit, supplier, low_threshold, site_id, created_at, updated_at
- [x] 原材料库存表 (material_stocks)
  - id, material_id, current_stock, capacity, last_update, site_id, created_at, updated_at
- [x] 库存变动记录表 (material_transactions)
  - id, material_id, transaction_type, quantity, unit_price, total_amount, supplier, batch_number, purpose, transaction_date, operator_id, site_id, created_at
  - transaction_type: 'inbound', 'outbound', 'adjustment', 'transfer'

### 4.2 混凝土等级管理 (concrete_grades)
- [x] 混凝土等级表
  - id, grade, strength_class, description, slump_range, applications, price_per_cubic, status, site_id, created_at, updated_at

### 4.3 配方管理 (recipes)
- [x] 配方主表
  - id, name, concrete_grade, slump, version, status, created_by, site_id, created_at, updated_at
- [x] 配方明细表 (recipe_items)
  - id, recipe_id, material_id, target_weight, unit, tolerance, sort_order

### 4.4 策略管理 (strategies)
- [x] 自动矫正策略表
  - id, name, type, description, enabled, priority, conditions, actions, site_id, created_at, updated_at

## 5. 生产控制模块

### 5.1 生产批次 (production_batches)
- [x] 生产批次表
  - id, batch_number, task_id, recipe_id, concrete_grade, volume, production_time, operator_id, equipment_id, status, site_id, created_at, updated_at

### 5.2 配料记录 (batching_records)
- [x] 配料记录表
  - id, batch_id, material_id, target_weight, actual_weight, deviation, tolerance_status, recorded_at

### 5.3 生产控制组件 (production_components)
- [x] 生产控制布局表
  - id, site_id, component_type, x_position, y_position, scale, properties, created_at, updated_at

## 6. 质量追溯与计费模块

### 6.1 质量检测 (quality_tests)
- [x] 质量检测记录表
  - id, batch_id, test_type, test_value, standard_value, status, test_time, operator_id, site_id, created_at, updated_at
- [x] 坍落度检测表 (slump_tests)
  - id, batch_id, target_slump, actual_slump, deviation, status, test_time, operator_id, site_id, created_at
- [x] 强度检测表 (strength_tests)
  - id, batch_id, test_age, target_strength, actual_strength, status, test_time, operator_id, site_id, created_at

### 6.2 计费管理 (billing)
- [x] 计费记录表
  - id, order_id, customer_name, concrete_grade, total_volume, unit_price, total_amount, delivery_count, delivery_date, status, site_id, created_at, updated_at
- [x] 对账记录表 (reconciliation)
  - id, month, customer_name, order_count, total_volume, total_amount, confirmed_amount, difference, status, site_id, created_at, updated_at

## 7. 日志与告警模块

### 7.1 操作日志 (operation_logs)
- [x] 操作日志表
  - id, timestamp, operator_id, module, action, target, detail, ip_address, result, site_id, created_at

### 7.2 告警管理 (alarms)
- [x] 告警记录表
  - id, alarm_type, source, message, severity, timestamp, acknowledged, acknowledged_by, acknowledged_at, resolved, resolved_at, site_id, created_at
  - severity: 'critical', 'warning', 'info'
- [x] 告警规则表 (alarm_rules)
  - id, name, rule_type, conditions, threshold_value, message_template, notification_methods, enabled, site_id, created_at, updated_at
  - rule_type: 'equipment_failure', 'material_low', 'quality_deviation', 'system_error'
- [x] 告警通知表 (alarm_notifications)
  - id, alarm_id, notification_type, recipient, content, sent_at, status, site_id, created_at
  - notification_type: 'email', 'sms', 'push', 'system'
- [x] 告警订阅表 (alarm_subscriptions)
  - id, user_id, alarm_type, notification_methods, enabled, site_id, created_at, updated_at

## 8. 系统配置模块

### 8.1 系统参数 (system_settings)
- [x] 系统配置表
  - id, site_id, setting_key, setting_value, description, created_at, updated_at

### 8.2 数据字典 (dictionaries)
- [x] 数据字典表
  - id, category, code, name, value, sort_order, status, description, created_at, updated_at

## 9. 统计分析模块

### 9.1 生产统计 (production_statistics)
- [x] 日生产统计表
  - id, site_id, date, total_batches, total_volume, concrete_grades, equipment_count, created_at
- [x] 月生产统计表
  - id, site_id, year_month, total_batches, total_volume, revenue, cost, profit, created_at

### 9.2 设备运行统计 (equipment_statistics)
- [x] 设备运行统计表
  - id, equipment_id, date, running_hours, start_stop_count, efficiency, maintenance_cost, site_id, created_at

## 10. 索引和约束设计

### 10.1 主要索引
- [x] 为所有外键字段创建索引
- [x] 为查询频繁的字段创建复合索引
- [x] 为时间字段创建索引以支持时间范围查询
- [x] 为用户表的 user_type, department, status 创建索引
- [x] 为设备表的 equipment_type, status 创建索引

### 10.2 约束设计
- [x] 外键约束
- [x] 唯一性约束（用户名、员工号、车牌号等）
- [x] 检查约束（状态枚举值、数值范围等）
- [x] 默认值设置

## 11. 数据迁移和初始化

### 11.1 基础数据
- [x] 默认站点数据
- [x] 系统角色和权限数据
- [x] 数据字典初始化
- [x] 混凝土等级标准数据
- [x] 默认告警规则

### 11.2 测试数据
- [x] 用户测试数据（包含不同类型：管理员、操作员、司机等）
- [x] 设备测试数据（包含车辆、搅拌机等）
- [x] 原材料和配方测试数据
- [x] 订单和任务测试数据

## 备注
- 所有表都包含 site_id 字段以支持多站点管理
- 所有表都包含 created_at 和 updated_at 时间戳
- 考虑软删除机制（deleted_at 字段）
- 考虑数据版本控制和审计日志
- 考虑数据备份和恢复策略
- 用户表通过 user_type 字段区分不同类型用户
- 设备表通过 equipment_type 字段区分不同类型设备
- 告警系统支持规则配置、多种通知方式和用户订阅