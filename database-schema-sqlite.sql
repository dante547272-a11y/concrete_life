-- 混凝土搅拌站管理系统数据库表结构 (SQLite版本)
-- Database Schema for Concrete Plant Management System (SQLite)
-- Created: 2024-01-21

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. 基础管理表
-- ============================================================================

-- 1.1 站点管理表
CREATE TABLE sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 站点ID，主键
    name TEXT NOT NULL, -- 站点名称
    code TEXT NOT NULL UNIQUE, -- 站点编码，唯一标识
    address TEXT, -- 站点详细地址
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')), -- 站点状态：active-运营中，inactive-已停用，maintenance-维护中
    manager TEXT, -- 站点负责人姓名
    phone TEXT, -- 联系电话
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 更新时间
);

-- 创建索引
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_code ON sites(code);

-- 1.2 用户表（合并用户/员工/司机）
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 用户ID，主键
    username TEXT NOT NULL UNIQUE, -- 用户名，登录账号
    password_hash TEXT NOT NULL, -- 密码哈希值
    email TEXT, -- 邮箱地址
    phone TEXT, -- 手机号码
    name TEXT NOT NULL, -- 真实姓名
    employee_no TEXT, -- 员工工号，员工类型用户必填
    department TEXT, -- 所属部门
    position TEXT, -- 职位
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'operator', 'driver', 'quality', 'manager', 'maintenance')), -- 用户类型：admin-管理员，operator-操作员，driver-司机，quality-质检员，manager-经理，maintenance-维修工
    license_number TEXT, -- 驾驶证号，司机类型用户必填
    license_type TEXT, -- 驾驶证类型，如A2、B2等
    license_expiry DATE, -- 驾驶证有效期
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'leave')), -- 用户状态：active-在职，inactive-离职，leave-请假
    join_date DATE, -- 入职日期
    avatar TEXT, -- 头像文件路径
    site_id INTEGER NOT NULL, -- 所属站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_users_employee_no ON users(employee_no);
CREATE INDEX idx_users_site_type ON users(site_id, user_type);

-- 1.3 角色表
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 角色ID，主键
    name TEXT NOT NULL, -- 角色名称
    description TEXT, -- 角色描述
    permissions TEXT, -- 权限配置，JSON格式存储
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 更新时间
);

-- 创建索引
CREATE INDEX idx_roles_name ON roles(name);

-- 1.4 用户角色关联表
CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 关联ID，主键
    user_id INTEGER NOT NULL, -- 用户ID
    role_id INTEGER NOT NULL, -- 角色ID
    site_id INTEGER NOT NULL, -- 站点ID，用户在特定站点的角色
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 分配时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id, site_id)
);

-- 创建索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_site_id ON user_roles(site_id);

-- ============================================================================
-- 2. 设备管理模块（包含车辆）
-- ============================================================================

-- 2.1 设备基本信息表
CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 设备ID，主键
    name TEXT NOT NULL, -- 设备名称
    equipment_type TEXT NOT NULL CHECK (equipment_type IN ('vehicle', 'mixer', 'conveyor', 'silo', 'scale', 'pump', 'valve', 'sensor')), -- 设备类型：vehicle-车辆，mixer-搅拌机，conveyor-输送带，silo-料仓，scale-秤，pump-泵，valve-阀门，sensor-传感器
    model TEXT, -- 设备型号
    location TEXT, -- 设备位置
    capacity REAL, -- 设备容量（车辆为载重量m³，料仓为容量吨等）
    brand TEXT, -- 品牌
    year INTEGER, -- 生产年份
    plate_number TEXT, -- 车牌号（仅车辆类型）
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'maintenance', 'offline')), -- 设备状态：normal-正常，warning-警告，critical-严重，maintenance-维护中，offline-离线
    install_date DATE, -- 安装日期
    purchase_date DATE, -- 采购日期
    last_maintenance_date DATE, -- 上次维护日期
    next_maintenance_date DATE, -- 下次维护日期
    health_score INTEGER DEFAULT 100, -- 健康度评分（0-100）
    site_id INTEGER NOT NULL, -- 所属站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_equipment_type ON equipment(equipment_type);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_site_id ON equipment(site_id);
CREATE INDEX idx_equipment_plate_number ON equipment(plate_number);
CREATE INDEX idx_equipment_site_type ON equipment(site_id, equipment_type);

-- 2.2 设备指标表
CREATE TABLE equipment_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 指标记录ID，主键
    equipment_id INTEGER NOT NULL, -- 设备ID
    current_value REAL, -- 电流值（安培）
    vibration_value REAL, -- 振动值（mm/s）
    temperature_value REAL, -- 温度值（摄氏度）
    start_stop_count INTEGER DEFAULT 0, -- 启停次数
    total_running_hours REAL DEFAULT 0, -- 累计运行小时数
    daily_running_hours REAL DEFAULT 0, -- 日运行小时数
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 记录时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_equipment_metrics_equipment_id ON equipment_metrics(equipment_id);
CREATE INDEX idx_equipment_metrics_recorded_at ON equipment_metrics(recorded_at);

-- 2.3 设备配件表
CREATE TABLE equipment_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配件ID，主键
    equipment_id INTEGER NOT NULL, -- 所属设备ID
    name TEXT NOT NULL, -- 配件名称
    type TEXT NOT NULL CHECK (type IN ('part', 'consumable')), -- 配件类型：part-配件，consumable-耗材
    lifespan INTEGER NOT NULL, -- 预期寿命（小时）
    used_hours INTEGER DEFAULT 0, -- 已使用小时数
    remaining_percent REAL DEFAULT 100, -- 剩余寿命百分比
    status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'replace')), -- 配件状态：good-良好，warning-需关注，replace-需更换
    last_replace_date DATE, -- 上次更换日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_equipment_parts_equipment_id ON equipment_parts(equipment_id);
CREATE INDEX idx_equipment_parts_status ON equipment_parts(status);

-- 2.4 设备维护记录表
CREATE TABLE equipment_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 维护记录ID，主键
    equipment_id INTEGER NOT NULL, -- 设备ID
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'upgrade', 'inspection')), -- 维护类型：routine-例行维护，repair-故障维修，upgrade-升级改造，inspection-检查
    description TEXT, -- 维护描述
    cost REAL, -- 维护费用
    maintenance_date DATE NOT NULL, -- 维护日期
    operator_id INTEGER, -- 维护操作员ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_equipment_maintenance_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_date ON equipment_maintenance(maintenance_date);
CREATE INDEX idx_equipment_maintenance_operator_id ON equipment_maintenance(operator_id);

-- 2.5 设备分配关系表
CREATE TABLE equipment_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 分配记录ID，主键
    equipment_id INTEGER NOT NULL, -- 设备ID
    user_id INTEGER NOT NULL, -- 用户ID（如司机）
    assigned_date DATE NOT NULL, -- 分配日期
    unassigned_date DATE, -- 取消分配日期
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 分配状态：active-有效，inactive-已取消
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_equipment_assignments_equipment_id ON equipment_assignments(equipment_id);
CREATE INDEX idx_equipment_assignments_user_id ON equipment_assignments(user_id);
CREATE INDEX idx_equipment_assignments_status ON equipment_assignments(status);

-- 2.6 排队管理表
CREATE TABLE queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 排队记录ID，主键
    equipment_id INTEGER NOT NULL, -- 车辆设备ID
    driver_id INTEGER NOT NULL, -- 司机用户ID
    task_id INTEGER, -- 关联任务ID
    queue_number INTEGER NOT NULL, -- 排队号码
    arrival_time DATETIME, -- 到达时间
    start_loading_time DATETIME, -- 开始装车时间
    finish_loading_time DATETIME, -- 装车完成时间
    departure_time DATETIME, -- 离场时间
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'loading', 'completed', 'cancelled')), -- 排队状态：waiting-等待中，loading-装车中，completed-已完成，cancelled-已取消
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_queue_equipment_id ON queue(equipment_id);
CREATE INDEX idx_queue_driver_id ON queue(driver_id);
CREATE INDEX idx_queue_status ON queue(status);
CREATE INDEX idx_queue_number ON queue(queue_number);

-- ============================================================================
-- 3. 订单任务管理模块
-- ============================================================================

-- 3.1 订单主表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 订单ID，主键
    order_number TEXT NOT NULL UNIQUE, -- 订单号，唯一标识
    customer_name TEXT NOT NULL, -- 客户名称
    contact_phone TEXT, -- 联系电话
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    total_volume REAL NOT NULL, -- 总方量（立方米）
    unit_price REAL, -- 单价（元/立方米）
    total_amount REAL, -- 总金额（元）
    delivery_address TEXT NOT NULL, -- 配送地址
    required_date DATE NOT NULL, -- 需求日期
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')), -- 订单状态：pending-待确认，confirmed-已确认，in_progress-生产中，completed-已完成，cancelled-已取消
    source TEXT DEFAULT 'local' CHECK (source IN ('local', 'remote')), -- 订单来源：local-本地创建，remote-远端同步
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_required_date ON orders(required_date);
CREATE INDEX idx_orders_site_id ON orders(site_id);
CREATE INDEX idx_orders_site_status ON orders(site_id, status);
-- 3.2 订单明细表
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 订单明细ID，主键
    order_id INTEGER NOT NULL, -- 订单ID
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    volume REAL NOT NULL, -- 方量（立方米）
    unit_price REAL NOT NULL, -- 单价（元/立方米）
    amount REAL NOT NULL, -- 金额（元）
    delivery_date DATE, -- 配送日期
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'producing', 'completed')), -- 明细状态：pending-待生产，producing-生产中，completed-已完成
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- 3.3 任务表
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 任务ID，主键
    task_number TEXT NOT NULL UNIQUE, -- 任务号，唯一标识
    order_id INTEGER NOT NULL, -- 关联订单ID
    equipment_id INTEGER, -- 分配的车辆设备ID
    driver_id INTEGER, -- 分配的司机用户ID
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    volume REAL NOT NULL, -- 方量（立方米）
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'loading', 'delivering', 'completed', 'cancelled')), -- 任务状态：pending-待分配，assigned-已分配，loading-装车中，delivering-配送中，completed-已完成，cancelled-已取消
    assigned_at DATETIME, -- 分配时间
    started_at DATETIME, -- 开始时间
    completed_at DATETIME, -- 完成时间
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_tasks_task_number ON tasks(task_number);
CREATE INDEX idx_tasks_order_id ON tasks(order_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_equipment_id ON tasks(equipment_id);
CREATE INDEX idx_tasks_driver_id ON tasks(driver_id);
CREATE INDEX idx_tasks_site_status ON tasks(site_id, status);

-- 3.4 远端配置表
CREATE TABLE remote_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配置ID，主键
    site_id INTEGER NOT NULL, -- 站点ID
    enabled INTEGER DEFAULT 0, -- 是否启用远端同步 (0=false, 1=true)
    url TEXT NOT NULL, -- 远端API地址
    api_key TEXT, -- API密钥
    sync_interval INTEGER DEFAULT 5, -- 同步间隔（分钟）
    last_sync_time DATETIME, -- 上次同步时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id)
);

-- 3.5 远端订单日志表
CREATE TABLE remote_order_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 日志ID，主键
    site_id INTEGER NOT NULL, -- 站点ID
    sync_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 同步时间
    orders_count INTEGER DEFAULT 0, -- 同步订单总数
    success_count INTEGER DEFAULT 0, -- 成功同步数量
    error_count INTEGER DEFAULT 0, -- 失败数量
    error_message TEXT, -- 错误信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_remote_order_logs_site_id ON remote_order_logs(site_id);
CREATE INDEX idx_remote_order_logs_sync_time ON remote_order_logs(sync_time);

-- ============================================================================
-- 4. 混凝土/物料管理模块
-- ============================================================================

-- 4.1 原材料基本信息表
CREATE TABLE materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 原材料ID，主键
    name TEXT NOT NULL, -- 原材料名称
    type TEXT NOT NULL CHECK (type IN ('aggregate', 'cement', 'additive', 'water')), -- 原材料类型：aggregate-骨料，cement-粉料，additive-外加剂，water-水
    specification TEXT, -- 规格型号
    unit TEXT NOT NULL, -- 计量单位（如：吨、升、千克）
    supplier TEXT, -- 供应商名称
    low_threshold REAL, -- 低库存阈值
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_materials_site_id ON materials(site_id);

-- 4.2 原材料库存表
CREATE TABLE material_stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 库存记录ID，主键
    material_id INTEGER NOT NULL, -- 原材料ID
    current_stock REAL DEFAULT 0, -- 当前库存数量
    capacity REAL, -- 最大容量
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后更新时间
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(material_id, site_id)
);

-- 创建索引
CREATE INDEX idx_material_stocks_material_id ON material_stocks(material_id);

-- 4.3 库存变动记录表
CREATE TABLE material_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 变动记录ID，主键
    material_id INTEGER NOT NULL, -- 原材料ID
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('inbound', 'outbound', 'adjustment', 'transfer')), -- 变动类型：inbound-入库，outbound-出库，adjustment-调整，transfer-调拨
    quantity REAL NOT NULL, -- 变动数量（正数为增加，负数为减少）
    unit_price REAL, -- 单价
    total_amount REAL, -- 总金额
    supplier TEXT, -- 供应商（入库时）
    batch_number TEXT, -- 批次号
    purpose TEXT, -- 用途说明（出库时）
    transaction_date DATE NOT NULL, -- 变动日期
    operator_id INTEGER, -- 操作员ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_material_transactions_material_id ON material_transactions(material_id);
CREATE INDEX idx_material_transactions_type ON material_transactions(transaction_type);
CREATE INDEX idx_material_transactions_date ON material_transactions(transaction_date);
CREATE INDEX idx_material_transactions_operator_id ON material_transactions(operator_id);

-- 4.4 混凝土等级表
CREATE TABLE concrete_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 等级ID，主键
    grade TEXT NOT NULL, -- 等级标识（如C30、C40）
    strength_class TEXT NOT NULL, -- 强度等级（如30MPa）
    description TEXT, -- 等级描述
    slump_range TEXT, -- 坍落度范围（如160-200mm）
    applications TEXT, -- 应用场景，JSON数组格式
    price_per_cubic REAL, -- 单价（元/立方米）
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 状态：active-启用，inactive-禁用
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_concrete_grades_grade ON concrete_grades(grade);
CREATE INDEX idx_concrete_grades_status ON concrete_grades(status);
CREATE INDEX idx_concrete_grades_site_id ON concrete_grades(site_id);

-- 4.5 配方主表
CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配方ID，主键
    name TEXT NOT NULL, -- 配方名称
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    slump TEXT, -- 坍落度要求
    version TEXT DEFAULT 'v1.0', -- 配方版本号
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')), -- 配方状态：active-启用，draft-草稿，archived-已归档
    created_by INTEGER, -- 创建人用户ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_recipes_concrete_grade ON recipes(concrete_grade);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_site_id ON recipes(site_id);

-- 4.6 配方明细表
CREATE TABLE recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配方明细ID，主键
    recipe_id INTEGER NOT NULL, -- 配方ID
    material_id INTEGER NOT NULL, -- 原材料ID
    target_weight REAL NOT NULL, -- 目标重量
    unit TEXT NOT NULL, -- 计量单位
    tolerance REAL DEFAULT 2.0, -- 允许误差百分比
    sort_order INTEGER DEFAULT 0, -- 排序序号
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_recipe_items_recipe_id ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_material_id ON recipe_items(material_id);

-- 4.7 自动矫正策略表
CREATE TABLE strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 策略ID，主键
    name TEXT NOT NULL, -- 策略名称
    type TEXT NOT NULL CHECK (type IN ('moisture', 'slump', 'temperature', 'strength', 'aggregate', 'ai')), -- 策略类型：moisture-含水率矫正，slump-坍落度矫正，temperature-温度补偿，strength-强度调整，aggregate-骨料配比，ai-AI智能策略
    description TEXT, -- 策略描述
    enabled INTEGER DEFAULT 1, -- 是否启用 (0=false, 1=true)
    priority INTEGER DEFAULT 0, -- 优先级（0为最高）
    conditions TEXT, -- 触发条件，JSON格式
    actions TEXT, -- 执行动作，JSON格式
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_strategies_type ON strategies(type);
CREATE INDEX idx_strategies_enabled ON strategies(enabled);
CREATE INDEX idx_strategies_priority ON strategies(priority);
CREATE INDEX idx_strategies_site_id ON strategies(site_id);

-- ============================================================================
-- 5. 生产控制模块
-- ============================================================================

-- 5.1 生产批次表
CREATE TABLE production_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 批次ID，主键
    batch_number TEXT NOT NULL UNIQUE, -- 批次号，唯一标识
    task_id INTEGER, -- 关联任务ID
    recipe_id INTEGER NOT NULL, -- 使用的配方ID
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    volume REAL NOT NULL, -- 生产方量（立方米）
    production_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 生产时间
    operator_id INTEGER, -- 操作员ID
    equipment_id INTEGER, -- 使用的设备ID（如搅拌机）
    status TEXT DEFAULT 'producing' CHECK (status IN ('producing', 'completed', 'failed')), -- 批次状态：producing-生产中，completed-已完成，failed-失败
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_production_batches_batch_number ON production_batches(batch_number);
CREATE INDEX idx_production_batches_task_id ON production_batches(task_id);
CREATE INDEX idx_production_batches_production_time ON production_batches(production_time);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_production_batches_site_time ON production_batches(site_id, production_time);

-- 5.2 配料记录表
CREATE TABLE batching_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配料记录ID，主键
    batch_id INTEGER NOT NULL, -- 生产批次ID
    material_id INTEGER NOT NULL, -- 原材料ID
    target_weight REAL NOT NULL, -- 目标重量
    actual_weight REAL NOT NULL, -- 实际重量
    deviation REAL, -- 偏差百分比
    tolerance_status TEXT DEFAULT 'pass' CHECK (tolerance_status IN ('pass', 'warning', 'fail')), -- 误差状态：pass-合格，warning-警告，fail-超差
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 记录时间
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
);

-- 创建索引
CREATE INDEX idx_batching_records_batch_id ON batching_records(batch_id);
CREATE INDEX idx_batching_records_material_id ON batching_records(material_id);
CREATE INDEX idx_batching_records_tolerance_status ON batching_records(tolerance_status);

-- 5.3 生产控制布局表
CREATE TABLE production_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 组件ID，主键
    site_id INTEGER NOT NULL, -- 站点ID
    component_type TEXT NOT NULL, -- 组件类型（如aggregate-bin、mixer等）
    x_position REAL NOT NULL, -- X坐标位置
    y_position REAL NOT NULL, -- Y坐标位置
    scale REAL DEFAULT 1.0, -- 缩放比例
    properties TEXT, -- 组件属性配置，JSON格式
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_production_components_site_id ON production_components(site_id);
CREATE INDEX idx_production_components_type ON production_components(component_type);

-- ============================================================================
-- 6. 质量追溯与计费模块
-- ============================================================================

-- 6.1 质量检测记录表
CREATE TABLE quality_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 检测记录ID，主键
    batch_id INTEGER NOT NULL, -- 生产批次ID
    test_type TEXT NOT NULL CHECK (test_type IN ('slump', 'strength', 'temperature', 'air_content')), -- 检测类型：slump-坍落度，strength-强度，temperature-温度，air_content-含气量
    test_value REAL NOT NULL, -- 检测值
    standard_value REAL, -- 标准值
    status TEXT DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'warning')), -- 检测结果：pass-合格，fail-不合格，warning-警告
    test_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 检测时间
    operator_id INTEGER, -- 检测员ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_quality_tests_batch_id ON quality_tests(batch_id);
CREATE INDEX idx_quality_tests_test_type ON quality_tests(test_type);
CREATE INDEX idx_quality_tests_status ON quality_tests(status);
CREATE INDEX idx_quality_tests_test_time ON quality_tests(test_time);

-- 6.2 坍落度检测表
CREATE TABLE slump_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 坍落度检测ID，主键
    batch_id INTEGER NOT NULL, -- 生产批次ID
    target_slump REAL NOT NULL, -- 目标坍落度（mm）
    actual_slump REAL NOT NULL, -- 实际坍落度（mm）
    deviation REAL, -- 偏差值（mm）
    status TEXT DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'warning')), -- 检测结果
    test_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 检测时间
    operator_id INTEGER, -- 检测员ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_slump_tests_batch_id ON slump_tests(batch_id);
CREATE INDEX idx_slump_tests_status ON slump_tests(status);
CREATE INDEX idx_slump_tests_test_time ON slump_tests(test_time);

-- 6.3 强度检测表
CREATE TABLE strength_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 强度检测ID，主键
    batch_id INTEGER NOT NULL, -- 生产批次ID
    test_age INTEGER NOT NULL, -- 检测龄期（天）
    target_strength REAL NOT NULL, -- 目标强度（MPa）
    actual_strength REAL, -- 实际强度（MPa）
    status TEXT DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'pending')), -- 检测结果：pending-待检测
    test_time DATETIME, -- 检测时间
    operator_id INTEGER, -- 检测员ID
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_strength_tests_batch_id ON strength_tests(batch_id);
CREATE INDEX idx_strength_tests_test_age ON strength_tests(test_age);
CREATE INDEX idx_strength_tests_status ON strength_tests(status);
CREATE INDEX idx_strength_tests_test_time ON strength_tests(test_time);

-- 6.4 计费记录表
CREATE TABLE billing_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 计费记录ID，主键
    order_id INTEGER NOT NULL, -- 订单ID
    customer_name TEXT NOT NULL, -- 客户名称
    concrete_grade TEXT NOT NULL, -- 混凝土等级
    total_volume REAL NOT NULL, -- 总方量（立方米）
    unit_price REAL NOT NULL, -- 单价（元/立方米）
    total_amount REAL NOT NULL, -- 总金额（元）
    delivery_count INTEGER DEFAULT 1, -- 配送次数
    delivery_date DATE NOT NULL, -- 配送日期
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'invoiced', 'paid')), -- 计费状态：pending-待确认，confirmed-已确认，invoiced-已开票，paid-已付款
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_billing_records_order_id ON billing_records(order_id);
CREATE INDEX idx_billing_records_customer_name ON billing_records(customer_name);
CREATE INDEX idx_billing_records_status ON billing_records(status);
CREATE INDEX idx_billing_records_delivery_date ON billing_records(delivery_date);

-- 6.5 对账记录表
CREATE TABLE reconciliation_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 对账记录ID，主键
    month TEXT NOT NULL, -- 对账月份（YYYY-MM格式）
    customer_name TEXT NOT NULL, -- 客户名称
    order_count INTEGER DEFAULT 0, -- 订单数量
    total_volume REAL DEFAULT 0, -- 总方量（立方米）
    total_amount REAL DEFAULT 0, -- 应收金额（元）
    confirmed_amount REAL DEFAULT 0, -- 确认金额（元）
    difference REAL DEFAULT 0, -- 差额（元）
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')), -- 对账状态：pending-待确认，confirmed-已确认，disputed-有争议
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_reconciliation_records_month ON reconciliation_records(month);
CREATE INDEX idx_reconciliation_records_customer_name ON reconciliation_records(customer_name);
CREATE INDEX idx_reconciliation_records_status ON reconciliation_records(status);
CREATE INDEX idx_reconciliation_records_site_id ON reconciliation_records(site_id);

-- ============================================================================
-- 7. 日志与告警模块
-- ============================================================================

-- 7.1 操作日志表
CREATE TABLE operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 日志ID，主键
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- 操作时间
    operator_id INTEGER, -- 操作员ID
    module TEXT NOT NULL, -- 操作模块（如vehicle、order、task等）
    action TEXT NOT NULL, -- 操作动作（如create、update、delete等）
    target TEXT, -- 操作目标（如订单号、车牌号等）
    detail TEXT, -- 操作详情描述
    ip_address TEXT, -- 操作IP地址
    result TEXT DEFAULT 'success' CHECK (result IN ('success', 'failure')), -- 操作结果：success-成功，failure-失败
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_operation_logs_timestamp ON operation_logs(timestamp);
CREATE INDEX idx_operation_logs_operator_id ON operation_logs(operator_id);
CREATE INDEX idx_operation_logs_module ON operation_logs(module);
CREATE INDEX idx_operation_logs_result ON operation_logs(result);
CREATE INDEX idx_operation_logs_site_id ON operation_logs(site_id);
CREATE INDEX idx_operation_logs_site_time ON operation_logs(site_id, timestamp);

-- 7.2 告警记录表
CREATE TABLE alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 告警ID，主键
    alarm_type TEXT NOT NULL, -- 告警类型（如equipment_failure、material_low等）
    source TEXT NOT NULL, -- 告警源（设备名称、系统模块等）
    message TEXT NOT NULL, -- 告警信息
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')), -- 告警级别：critical-严重，warning-警告，info-信息
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- 告警时间
    acknowledged INTEGER DEFAULT 0, -- 是否已确认 (0=false, 1=true)
    acknowledged_by INTEGER, -- 确认人ID
    acknowledged_at DATETIME, -- 确认时间
    resolved INTEGER DEFAULT 0, -- 是否已解决 (0=false, 1=true)
    resolved_at DATETIME, -- 解决时间
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_alarms_alarm_type ON alarms(alarm_type);
CREATE INDEX idx_alarms_severity ON alarms(severity);
CREATE INDEX idx_alarms_timestamp ON alarms(timestamp);
CREATE INDEX idx_alarms_acknowledged ON alarms(acknowledged);
CREATE INDEX idx_alarms_resolved ON alarms(resolved);
CREATE INDEX idx_alarms_site_id ON alarms(site_id);
CREATE INDEX idx_alarms_site_severity ON alarms(site_id, severity);

-- 7.3 告警规则表
CREATE TABLE alarm_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 规则ID，主键
    name TEXT NOT NULL, -- 规则名称
    rule_type TEXT NOT NULL CHECK (rule_type IN ('equipment_failure', 'material_low', 'quality_deviation', 'system_error')), -- 规则类型：equipment_failure-设备故障，material_low-物料不足，quality_deviation-质量偏差，system_error-系统错误
    conditions TEXT NOT NULL, -- 触发条件，JSON格式
    threshold_value REAL, -- 阈值
    message_template TEXT, -- 告警信息模板
    notification_methods TEXT, -- 通知方式，JSON数组格式
    enabled INTEGER DEFAULT 1, -- 是否启用 (0=false, 1=true)
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_alarm_rules_rule_type ON alarm_rules(rule_type);
CREATE INDEX idx_alarm_rules_enabled ON alarm_rules(enabled);
CREATE INDEX idx_alarm_rules_site_id ON alarm_rules(site_id);

-- 7.4 告警通知表
CREATE TABLE alarm_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 通知ID，主键
    alarm_id INTEGER NOT NULL, -- 告警ID
    notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push', 'system')), -- 通知类型：email-邮件，sms-短信，push-推送，system-系统内
    recipient TEXT NOT NULL, -- 接收人（邮箱、手机号或用户ID）
    content TEXT, -- 通知内容
    sent_at DATETIME, -- 发送时间
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')), -- 发送状态：pending-待发送，sent-已发送，failed-发送失败
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (alarm_id) REFERENCES alarms(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_alarm_notifications_alarm_id ON alarm_notifications(alarm_id);
CREATE INDEX idx_alarm_notifications_type ON alarm_notifications(notification_type);
CREATE INDEX idx_alarm_notifications_status ON alarm_notifications(status);
CREATE INDEX idx_alarm_notifications_sent_at ON alarm_notifications(sent_at);

-- 7.5 告警订阅表
CREATE TABLE alarm_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 订阅ID，主键
    user_id INTEGER NOT NULL, -- 用户ID
    alarm_type TEXT NOT NULL, -- 告警类型
    notification_methods TEXT, -- 通知方式，JSON数组格式
    enabled INTEGER DEFAULT 1, -- 是否启用订阅 (0=false, 1=true)
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(user_id, alarm_type, site_id)
);

-- 创建索引
CREATE INDEX idx_alarm_subscriptions_user_id ON alarm_subscriptions(user_id);
CREATE INDEX idx_alarm_subscriptions_alarm_type ON alarm_subscriptions(alarm_type);
CREATE INDEX idx_alarm_subscriptions_enabled ON alarm_subscriptions(enabled);

-- ============================================================================
-- 8. 系统配置模块
-- ============================================================================

-- 8.1 系统配置表
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 配置ID，主键
    site_id INTEGER, -- 站点ID，NULL表示全局配置
    setting_key TEXT NOT NULL, -- 配置键名
    setting_value TEXT, -- 配置值
    description TEXT, -- 配置描述
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, setting_key)
);

-- 创建索引
CREATE INDEX idx_system_settings_setting_key ON system_settings(setting_key);

-- 8.2 数据字典表
CREATE TABLE dictionaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 字典ID，主键
    category TEXT NOT NULL, -- 字典分类（如user_type、equipment_type等）
    code TEXT NOT NULL, -- 字典编码
    name TEXT NOT NULL, -- 字典名称
    value TEXT, -- 字典值
    sort_order INTEGER DEFAULT 0, -- 排序序号
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 状态：active-启用，inactive-禁用
    description TEXT, -- 描述
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    UNIQUE(category, code)
);

-- 创建索引
CREATE INDEX idx_dictionaries_category ON dictionaries(category);
CREATE INDEX idx_dictionaries_status ON dictionaries(status);

-- ============================================================================
-- 9. 统计分析模块
-- ============================================================================

-- 9.1 日生产统计表
CREATE TABLE daily_production_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 统计ID，主键
    site_id INTEGER NOT NULL, -- 站点ID
    stat_date DATE NOT NULL, -- 统计日期
    total_batches INTEGER DEFAULT 0, -- 总批次数
    total_volume REAL DEFAULT 0, -- 总产量（立方米）
    concrete_grades TEXT, -- 各等级产量统计，JSON格式
    equipment_count INTEGER DEFAULT 0, -- 使用设备数量
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, stat_date)
);

-- 创建索引
CREATE INDEX idx_daily_production_stats_stat_date ON daily_production_stats(stat_date);

-- 9.2 月生产统计表
CREATE TABLE monthly_production_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 统计ID，主键
    site_id INTEGER NOT NULL, -- 站点ID
    year_month TEXT NOT NULL, -- 统计年月（YYYY-MM格式）
    total_batches INTEGER DEFAULT 0, -- 总批次数
    total_volume REAL DEFAULT 0, -- 总产量（立方米）
    revenue REAL DEFAULT 0, -- 营业收入（元）
    cost REAL DEFAULT 0, -- 生产成本（元）
    profit REAL DEFAULT 0, -- 利润（元）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, year_month)
);

-- 创建索引
CREATE INDEX idx_monthly_production_stats_year_month ON monthly_production_stats(year_month);

-- 9.3 设备运行统计表
CREATE TABLE equipment_daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 统计ID，主键
    equipment_id INTEGER NOT NULL, -- 设备ID
    stat_date DATE NOT NULL, -- 统计日期
    running_hours REAL DEFAULT 0, -- 运行小时数
    start_stop_count INTEGER DEFAULT 0, -- 启停次数
    efficiency REAL DEFAULT 0, -- 运行效率百分比
    maintenance_cost REAL DEFAULT 0, -- 维护费用（元）
    site_id INTEGER NOT NULL, -- 站点ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(equipment_id, stat_date)
);

-- 创建索引
CREATE INDEX idx_equipment_daily_stats_stat_date ON equipment_daily_stats(stat_date);
CREATE INDEX idx_equipment_daily_stats_site_id ON equipment_daily_stats(site_id);

-- ============================================================================
-- 初始化数据
-- ============================================================================

-- 插入默认站点
INSERT INTO sites (name, code, address, status, manager, phone) VALUES
('杭州总站', 'HZ001', '浙江省杭州市余杭区良渚街道', 'active', '张三', '13800138001'),
('宁波分站', 'NB001', '浙江省宁波市鄞州区', 'active', '李四', '13800138002'),
('温州分站', 'WZ001', '浙江省温州市龙湾区', 'active', '王五', '13800138003');

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
('超级管理员', '系统超级管理员，拥有所有权限', '["*"]'),
('站点管理员', '站点管理员，管理单个站点的所有业务', '["site.*"]'),
('生产操作员', '生产操作员，负责生产控制和质量检测', '["production.*", "quality.*"]'),
('调度员', '调度员，负责订单和任务管理', '["order.*", "task.*", "queue.*"]'),
('司机', '司机，查看自己的任务和排队信息', '["task.view", "queue.view"]');

-- 插入默认管理员用户
INSERT INTO users (username, password_hash, email, phone, name, user_type, status, site_id) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', '13800138000', '系统管理员', 'admin', 'active', 1);

-- 插入数据字典
INSERT INTO dictionaries (category, code, name, value, sort_order, description) VALUES
('user_type', 'admin', '管理员', 'admin', 1, '系统管理员'),
('user_type', 'operator', '操作员', 'operator', 2, '生产操作员'),
('user_type', 'driver', '司机', 'driver', 3, '车辆司机'),
('user_type', 'quality', '质检员', 'quality', 4, '质量检测员'),
('user_type', 'manager', '经理', 'manager', 5, '部门经理'),
('equipment_type', 'vehicle', '车辆', 'vehicle', 1, '搅拌车等车辆'),
('equipment_type', 'mixer', '搅拌机', 'mixer', 2, '混凝土搅拌机'),
('equipment_type', 'conveyor', '输送带', 'conveyor', 3, '皮带输送机'),
('equipment_type', 'silo', '料仓', 'silo', 4, '水泥仓、骨料仓等'),
('equipment_type', 'scale', '秤', 'scale', 5, '各种计量秤'),
('material_type', 'aggregate', '骨料', 'aggregate', 1, '砂石骨料'),
('material_type', 'cement', '粉料', 'cement', 2, '水泥、矿粉等'),
('material_type', 'additive', '外加剂', 'additive', 3, '减水剂等外加剂'),
('material_type', 'water', '水', 'water', 4, '拌合用水');

-- 创建更新时间触发器（SQLite不支持ON UPDATE CURRENT_TIMESTAMP，需要用触发器实现）
CREATE TRIGGER update_sites_updated_at 
    AFTER UPDATE ON sites
    FOR EACH ROW
    BEGIN
        UPDATE sites SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_roles_updated_at 
    AFTER UPDATE ON roles
    FOR EACH ROW
    BEGIN
        UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_equipment_updated_at 
    AFTER UPDATE ON equipment
    FOR EACH ROW
    BEGIN
        UPDATE equipment SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_equipment_parts_updated_at 
    AFTER UPDATE ON equipment_parts
    FOR EACH ROW
    BEGIN
        UPDATE equipment_parts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_orders_updated_at 
    AFTER UPDATE ON orders
    FOR EACH ROW
    BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_tasks_updated_at 
    AFTER UPDATE ON tasks
    FOR EACH ROW
    BEGIN
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_remote_configs_updated_at 
    AFTER UPDATE ON remote_configs
    FOR EACH ROW
    BEGIN
        UPDATE remote_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_materials_updated_at 
    AFTER UPDATE ON materials
    FOR EACH ROW
    BEGIN
        UPDATE materials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_material_stocks_updated_at 
    AFTER UPDATE ON material_stocks
    FOR EACH ROW
    BEGIN
        UPDATE material_stocks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_concrete_grades_updated_at 
    AFTER UPDATE ON concrete_grades
    FOR EACH ROW
    BEGIN
        UPDATE concrete_grades SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_recipes_updated_at 
    AFTER UPDATE ON recipes
    FOR EACH ROW
    BEGIN
        UPDATE recipes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_strategies_updated_at 
    AFTER UPDATE ON strategies
    FOR EACH ROW
    BEGIN
        UPDATE strategies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_production_batches_updated_at 
    AFTER UPDATE ON production_batches
    FOR EACH ROW
    BEGIN
        UPDATE production_batches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_production_components_updated_at 
    AFTER UPDATE ON production_components
    FOR EACH ROW
    BEGIN
        UPDATE production_components SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_quality_tests_updated_at 
    AFTER UPDATE ON quality_tests
    FOR EACH ROW
    BEGIN
        UPDATE quality_tests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_billing_records_updated_at 
    AFTER UPDATE ON billing_records
    FOR EACH ROW
    BEGIN
        UPDATE billing_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_reconciliation_records_updated_at 
    AFTER UPDATE ON reconciliation_records
    FOR EACH ROW
    BEGIN
        UPDATE reconciliation_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_alarm_rules_updated_at 
    AFTER UPDATE ON alarm_rules
    FOR EACH ROW
    BEGIN
        UPDATE alarm_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_alarm_subscriptions_updated_at 
    AFTER UPDATE ON alarm_subscriptions
    FOR EACH ROW
    BEGIN
        UPDATE alarm_subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_system_settings_updated_at 
    AFTER UPDATE ON system_settings
    FOR EACH ROW
    BEGIN
        UPDATE system_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_dictionaries_updated_at 
    AFTER UPDATE ON dictionaries
    FOR EACH ROW
    BEGIN
        UPDATE dictionaries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;