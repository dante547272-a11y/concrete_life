-- 混凝土搅拌站管理系统数据库表结构
-- Database Schema for Concrete Plant Management System
-- Created: 2024-01-21

-- ============================================================================
-- 1. 基础管理表
-- ============================================================================

-- 1.1 站点管理表
CREATE TABLE sites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '站点ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '站点名称',
    code VARCHAR(20) NOT NULL UNIQUE COMMENT '站点编码，唯一标识',
    address TEXT COMMENT '站点详细地址',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active' COMMENT '站点状态：active-运营中，inactive-已停用，maintenance-维护中',
    manager VARCHAR(50) COMMENT '站点负责人姓名',
    phone VARCHAR(20) COMMENT '联系电话',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点基本信息表';

-- 1.2 用户表（合并用户/员工/司机）
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID，主键',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，登录账号',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值',
    email VARCHAR(100) COMMENT '邮箱地址',
    phone VARCHAR(20) COMMENT '手机号码',
    name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    employee_no VARCHAR(20) COMMENT '员工工号，员工类型用户必填',
    department VARCHAR(50) COMMENT '所属部门',
    position VARCHAR(50) COMMENT '职位',
    user_type ENUM('admin', 'operator', 'driver', 'quality', 'manager', 'maintenance') NOT NULL COMMENT '用户类型：admin-管理员，operator-操作员，driver-司机，quality-质检员，manager-经理，maintenance-维修工',
    license_number VARCHAR(30) COMMENT '驾驶证号，司机类型用户必填',
    license_type VARCHAR(10) COMMENT '驾驶证类型，如A2、B2等',
    license_expiry DATE COMMENT '驾驶证有效期',
    status ENUM('active', 'inactive', 'leave') DEFAULT 'active' COMMENT '用户状态：active-在职，inactive-离职，leave-请假',
    join_date DATE COMMENT '入职日期',
    avatar VARCHAR(255) COMMENT '头像文件路径',
    site_id BIGINT NOT NULL COMMENT '所属站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_site_id (site_id),
    INDEX idx_employee_no (employee_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表（包含员工和司机）';

-- 1.3 角色表
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID，主键',
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description TEXT COMMENT '角色描述',
    permissions JSON COMMENT '权限配置，JSON格式存储',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限表';

-- 1.4 用户角色关联表
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID，主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    site_id BIGINT NOT NULL COMMENT '站点ID，用户在特定站点的角色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_role_site (user_id, role_id, site_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ============================================================================
-- 2. 设备管理模块（包含车辆）
-- ============================================================================

-- 2.1 设备基本信息表
CREATE TABLE equipment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '设备ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    equipment_type ENUM('vehicle', 'mixer', 'conveyor', 'silo', 'scale', 'pump', 'valve', 'sensor') NOT NULL COMMENT '设备类型：vehicle-车辆，mixer-搅拌机，conveyor-输送带，silo-料仓，scale-秤，pump-泵，valve-阀门，sensor-传感器',
    model VARCHAR(50) COMMENT '设备型号',
    location VARCHAR(100) COMMENT '设备位置',
    capacity DECIMAL(10,2) COMMENT '设备容量（车辆为载重量m³，料仓为容量吨等）',
    brand VARCHAR(50) COMMENT '品牌',
    year YEAR COMMENT '生产年份',
    plate_number VARCHAR(20) COMMENT '车牌号（仅车辆类型）',
    status ENUM('normal', 'warning', 'critical', 'maintenance', 'offline') DEFAULT 'normal' COMMENT '设备状态：normal-正常，warning-警告，critical-严重，maintenance-维护中，offline-离线',
    install_date DATE COMMENT '安装日期',
    purchase_date DATE COMMENT '采购日期',
    last_maintenance_date DATE COMMENT '上次维护日期',
    next_maintenance_date DATE COMMENT '下次维护日期',
    health_score TINYINT DEFAULT 100 COMMENT '健康度评分（0-100）',
    site_id BIGINT NOT NULL COMMENT '所属站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_equipment_type (equipment_type),
    INDEX idx_status (status),
    INDEX idx_site_id (site_id),
    INDEX idx_plate_number (plate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备基本信息表（包含车辆）';

-- 2.2 设备指标表
CREATE TABLE equipment_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '指标记录ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    current_value DECIMAL(8,2) COMMENT '电流值（安培）',
    vibration_value DECIMAL(8,2) COMMENT '振动值（mm/s）',
    temperature_value DECIMAL(8,2) COMMENT '温度值（摄氏度）',
    start_stop_count INT DEFAULT 0 COMMENT '启停次数',
    total_running_hours DECIMAL(10,2) DEFAULT 0 COMMENT '累计运行小时数',
    daily_running_hours DECIMAL(8,2) DEFAULT 0 COMMENT '日运行小时数',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备运行指标表';

-- 2.3 设备配件表
CREATE TABLE equipment_parts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配件ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '所属设备ID',
    name VARCHAR(100) NOT NULL COMMENT '配件名称',
    type ENUM('part', 'consumable') NOT NULL COMMENT '配件类型：part-配件，consumable-耗材',
    lifespan INT NOT NULL COMMENT '预期寿命（小时）',
    used_hours INT DEFAULT 0 COMMENT '已使用小时数',
    remaining_percent DECIMAL(5,2) DEFAULT 100 COMMENT '剩余寿命百分比',
    status ENUM('good', 'warning', 'replace') DEFAULT 'good' COMMENT '配件状态：good-良好，warning-需关注，replace-需更换',
    last_replace_date DATE COMMENT '上次更换日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备配件耗材表';

-- 2.4 设备维护记录表
CREATE TABLE equipment_maintenance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '维护记录ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    maintenance_type ENUM('routine', 'repair', 'upgrade', 'inspection') NOT NULL COMMENT '维护类型：routine-例行维护，repair-故障维修，upgrade-升级改造，inspection-检查',
    description TEXT COMMENT '维护描述',
    cost DECIMAL(10,2) COMMENT '维护费用',
    maintenance_date DATE NOT NULL COMMENT '维护日期',
    operator_id BIGINT COMMENT '维护操作员ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_maintenance_date (maintenance_date),
    INDEX idx_operator_id (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备维护记录表';

-- 2.5 设备分配关系表
CREATE TABLE equipment_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分配记录ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    user_id BIGINT NOT NULL COMMENT '用户ID（如司机）',
    assigned_date DATE NOT NULL COMMENT '分配日期',
    unassigned_date DATE COMMENT '取消分配日期',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '分配状态：active-有效，inactive-已取消',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备分配关系表';

-- 2.6 排队管理表
CREATE TABLE queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '排队记录ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '车辆设备ID',
    driver_id BIGINT NOT NULL COMMENT '司机用户ID',
    task_id BIGINT COMMENT '关联任务ID',
    queue_number INT NOT NULL COMMENT '排队号码',
    arrival_time TIMESTAMP COMMENT '到达时间',
    start_loading_time TIMESTAMP COMMENT '开始装车时间',
    finish_loading_time TIMESTAMP COMMENT '装车完成时间',
    departure_time TIMESTAMP COMMENT '离场时间',
    status ENUM('waiting', 'loading', 'completed', 'cancelled') DEFAULT 'waiting' COMMENT '排队状态：waiting-等待中，loading-装车中，completed-已完成，cancelled-已取消',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status),
    INDEX idx_queue_number (queue_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆排队管理表';

-- ============================================================================
-- 3. 订单任务管理模块
-- ============================================================================

-- 3.1 订单主表
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID，主键',
    order_number VARCHAR(30) NOT NULL UNIQUE COMMENT '订单号，唯一标识',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    total_volume DECIMAL(10,2) NOT NULL COMMENT '总方量（立方米）',
    unit_price DECIMAL(10,2) COMMENT '单价（元/立方米）',
    total_amount DECIMAL(12,2) COMMENT '总金额（元）',
    delivery_address TEXT NOT NULL COMMENT '配送地址',
    required_date DATE NOT NULL COMMENT '需求日期',
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态：pending-待确认，confirmed-已确认，in_progress-生产中，completed-已完成，cancelled-已取消',
    source ENUM('local', 'remote') DEFAULT 'local' COMMENT '订单来源：local-本地创建，remote-远端同步',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_required_date (required_date),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- 3.2 订单明细表
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单明细ID，主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    volume DECIMAL(10,2) NOT NULL COMMENT '方量（立方米）',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价（元/立方米）',
    amount DECIMAL(12,2) NOT NULL COMMENT '金额（元）',
    delivery_date DATE COMMENT '配送日期',
    status ENUM('pending', 'producing', 'completed') DEFAULT 'pending' COMMENT '明细状态：pending-待生产，producing-生产中，completed-已完成',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- 3.3 任务表
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID，主键',
    task_number VARCHAR(30) NOT NULL UNIQUE COMMENT '任务号，唯一标识',
    order_id BIGINT NOT NULL COMMENT '关联订单ID',
    equipment_id BIGINT COMMENT '分配的车辆设备ID',
    driver_id BIGINT COMMENT '分配的司机用户ID',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    volume DECIMAL(10,2) NOT NULL COMMENT '方量（立方米）',
    status ENUM('pending', 'assigned', 'loading', 'delivering', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态：pending-待分配，assigned-已分配，loading-装车中，delivering-配送中，completed-已完成，cancelled-已取消',
    assigned_at TIMESTAMP COMMENT '分配时间',
    started_at TIMESTAMP COMMENT '开始时间',
    completed_at TIMESTAMP COMMENT '完成时间',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_task_number (task_number),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_driver_id (driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务派单表';

-- 3.4 远端配置表
CREATE TABLE remote_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID，主键',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用远端同步',
    url VARCHAR(255) NOT NULL COMMENT '远端API地址',
    api_key VARCHAR(255) COMMENT 'API密钥',
    sync_interval INT DEFAULT 5 COMMENT '同步间隔（分钟）',
    last_sync_time TIMESTAMP COMMENT '上次同步时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='远端订单同步配置表';

-- 3.5 远端订单日志表
CREATE TABLE remote_order_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID，主键',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间',
    orders_count INT DEFAULT 0 COMMENT '同步订单总数',
    success_count INT DEFAULT 0 COMMENT '成功同步数量',
    error_count INT DEFAULT 0 COMMENT '失败数量',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_id (site_id),
    INDEX idx_sync_time (sync_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='远端订单同步日志表';

-- ============================================================================
-- 4. 混凝土/物料管理模块
-- ============================================================================

-- 4.1 原材料基本信息表
CREATE TABLE materials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '原材料ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '原材料名称',
    type ENUM('aggregate', 'cement', 'additive', 'water') NOT NULL COMMENT '原材料类型：aggregate-骨料，cement-粉料，additive-外加剂，water-水',
    specification VARCHAR(100) COMMENT '规格型号',
    unit VARCHAR(10) NOT NULL COMMENT '计量单位（如：吨、升、千克）',
    supplier VARCHAR(100) COMMENT '供应商名称',
    low_threshold DECIMAL(10,2) COMMENT '低库存阈值',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_type (type),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料基本信息表';

-- 4.2 原材料库存表
CREATE TABLE material_stocks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '库存记录ID，主键',
    material_id BIGINT NOT NULL COMMENT '原材料ID',
    current_stock DECIMAL(12,2) DEFAULT 0 COMMENT '当前库存数量',
    capacity DECIMAL(12,2) COMMENT '最大容量',
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_material_site (material_id, site_id),
    INDEX idx_material_id (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料库存表';

-- 4.3 库存变动记录表
CREATE TABLE material_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '变动记录ID，主键',
    material_id BIGINT NOT NULL COMMENT '原材料ID',
    transaction_type ENUM('inbound', 'outbound', 'adjustment', 'transfer') NOT NULL COMMENT '变动类型：inbound-入库，outbound-出库，adjustment-调整，transfer-调拨',
    quantity DECIMAL(12,2) NOT NULL COMMENT '变动数量（正数为增加，负数为减少）',
    unit_price DECIMAL(10,2) COMMENT '单价',
    total_amount DECIMAL(12,2) COMMENT '总金额',
    supplier VARCHAR(100) COMMENT '供应商（入库时）',
    batch_number VARCHAR(50) COMMENT '批次号',
    purpose VARCHAR(200) COMMENT '用途说明（出库时）',
    transaction_date DATE NOT NULL COMMENT '变动日期',
    operator_id BIGINT COMMENT '操作员ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_material_id (material_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_operator_id (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存变动记录表';

-- 4.4 混凝土等级表
CREATE TABLE concrete_grades (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '等级ID，主键',
    grade VARCHAR(20) NOT NULL COMMENT '等级标识（如C30、C40）',
    strength_class VARCHAR(20) NOT NULL COMMENT '强度等级（如30MPa）',
    description TEXT COMMENT '等级描述',
    slump_range VARCHAR(50) COMMENT '坍落度范围（如160-200mm）',
    applications JSON COMMENT '应用场景，JSON数组格式',
    price_per_cubic DECIMAL(10,2) COMMENT '单价（元/立方米）',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态：active-启用，inactive-禁用',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='混凝土等级管理表';

-- 4.5 配方主表
CREATE TABLE recipes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配方ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '配方名称',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    slump VARCHAR(50) COMMENT '坍落度要求',
    version VARCHAR(20) DEFAULT 'v1.0' COMMENT '配方版本号',
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft' COMMENT '配方状态：active-启用，draft-草稿，archived-已归档',
    created_by BIGINT COMMENT '创建人用户ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_concrete_grade (concrete_grade),
    INDEX idx_status (status),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配方主表';

-- 4.6 配方明细表
CREATE TABLE recipe_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配方明细ID，主键',
    recipe_id BIGINT NOT NULL COMMENT '配方ID',
    material_id BIGINT NOT NULL COMMENT '原材料ID',
    target_weight DECIMAL(10,2) NOT NULL COMMENT '目标重量',
    unit VARCHAR(10) NOT NULL COMMENT '计量单位',
    tolerance DECIMAL(5,2) DEFAULT 2.0 COMMENT '允许误差百分比',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    INDEX idx_recipe_id (recipe_id),
    INDEX idx_material_id (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配方明细表';

-- 4.7 自动矫正策略表
CREATE TABLE strategies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '策略ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '策略名称',
    type ENUM('moisture', 'slump', 'temperature', 'strength', 'aggregate', 'ai') NOT NULL COMMENT '策略类型：moisture-含水率矫正，slump-坍落度矫正，temperature-温度补偿，strength-强度调整，aggregate-骨料配比，ai-AI智能策略',
    description TEXT COMMENT '策略描述',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    priority INT DEFAULT 0 COMMENT '优先级（0为最高）',
    conditions JSON COMMENT '触发条件，JSON格式',
    actions JSON COMMENT '执行动作，JSON格式',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_type (type),
    INDEX idx_enabled (enabled),
    INDEX idx_priority (priority),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自动矫正策略表';

-- ============================================================================
-- 5. 生产控制模块
-- ============================================================================

-- 5.1 生产批次表
CREATE TABLE production_batches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '批次ID，主键',
    batch_number VARCHAR(30) NOT NULL UNIQUE COMMENT '批次号，唯一标识',
    task_id BIGINT COMMENT '关联任务ID',
    recipe_id BIGINT NOT NULL COMMENT '使用的配方ID',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    volume DECIMAL(10,2) NOT NULL COMMENT '生产方量（立方米）',
    production_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生产时间',
    operator_id BIGINT COMMENT '操作员ID',
    equipment_id BIGINT COMMENT '使用的设备ID（如搅拌机）',
    status ENUM('producing', 'completed', 'failed') DEFAULT 'producing' COMMENT '批次状态：producing-生产中，completed-已完成，failed-失败',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_batch_number (batch_number),
    INDEX idx_task_id (task_id),
    INDEX idx_production_time (production_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产批次表';

-- 5.2 配料记录表
CREATE TABLE batching_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配料记录ID，主键',
    batch_id BIGINT NOT NULL COMMENT '生产批次ID',
    material_id BIGINT NOT NULL COMMENT '原材料ID',
    target_weight DECIMAL(10,2) NOT NULL COMMENT '目标重量',
    actual_weight DECIMAL(10,2) NOT NULL COMMENT '实际重量',
    deviation DECIMAL(5,2) COMMENT '偏差百分比',
    tolerance_status ENUM('pass', 'warning', 'fail') DEFAULT 'pass' COMMENT '误差状态：pass-合格，warning-警告，fail-超差',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
    INDEX idx_batch_id (batch_id),
    INDEX idx_material_id (material_id),
    INDEX idx_tolerance_status (tolerance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配料记录表';

-- 5.3 生产控制布局表
CREATE TABLE production_components (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '组件ID，主键',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    component_type VARCHAR(50) NOT NULL COMMENT '组件类型（如aggregate-bin、mixer等）',
    x_position DECIMAL(8,2) NOT NULL COMMENT 'X坐标位置',
    y_position DECIMAL(8,2) NOT NULL COMMENT 'Y坐标位置',
    scale DECIMAL(3,2) DEFAULT 1.0 COMMENT '缩放比例',
    properties JSON COMMENT '组件属性配置，JSON格式',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_site_id (site_id),
    INDEX idx_component_type (component_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产控制布局表';

-- ============================================================================
-- 6. 质量追溯与计费模块
-- ============================================================================

-- 6.1 质量检测记录表
CREATE TABLE quality_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '检测记录ID，主键',
    batch_id BIGINT NOT NULL COMMENT '生产批次ID',
    test_type ENUM('slump', 'strength', 'temperature', 'air_content') NOT NULL COMMENT '检测类型：slump-坍落度，strength-强度，temperature-温度，air_content-含气量',
    test_value DECIMAL(10,2) NOT NULL COMMENT '检测值',
    standard_value DECIMAL(10,2) COMMENT '标准值',
    status ENUM('pass', 'fail', 'warning') DEFAULT 'pass' COMMENT '检测结果：pass-合格，fail-不合格，warning-警告',
    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
    operator_id BIGINT COMMENT '检测员ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_test_type (test_type),
    INDEX idx_status (status),
    INDEX idx_test_time (test_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量检测记录表';

-- 6.2 坍落度检测表
CREATE TABLE slump_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '坍落度检测ID，主键',
    batch_id BIGINT NOT NULL COMMENT '生产批次ID',
    target_slump DECIMAL(5,1) NOT NULL COMMENT '目标坍落度（mm）',
    actual_slump DECIMAL(5,1) NOT NULL COMMENT '实际坍落度（mm）',
    deviation DECIMAL(5,1) COMMENT '偏差值（mm）',
    status ENUM('pass', 'fail', 'warning') DEFAULT 'pass' COMMENT '检测结果',
    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
    operator_id BIGINT COMMENT '检测员ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_status (status),
    INDEX idx_test_time (test_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='坍落度检测表';

-- 6.3 强度检测表
CREATE TABLE strength_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '强度检测ID，主键',
    batch_id BIGINT NOT NULL COMMENT '生产批次ID',
    test_age TINYINT NOT NULL COMMENT '检测龄期（天）',
    target_strength DECIMAL(5,1) NOT NULL COMMENT '目标强度（MPa）',
    actual_strength DECIMAL(5,1) COMMENT '实际强度（MPa）',
    status ENUM('pass', 'fail', 'pending') DEFAULT 'pending' COMMENT '检测结果：pending-待检测',
    test_time TIMESTAMP COMMENT '检测时间',
    operator_id BIGINT COMMENT '检测员ID',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_test_age (test_age),
    INDEX idx_status (status),
    INDEX idx_test_time (test_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='强度检测表';

-- 6.4 计费记录表
CREATE TABLE billing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '计费记录ID，主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    concrete_grade VARCHAR(20) NOT NULL COMMENT '混凝土等级',
    total_volume DECIMAL(10,2) NOT NULL COMMENT '总方量（立方米）',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价（元/立方米）',
    total_amount DECIMAL(12,2) NOT NULL COMMENT '总金额（元）',
    delivery_count INT DEFAULT 1 COMMENT '配送次数',
    delivery_date DATE NOT NULL COMMENT '配送日期',
    status ENUM('pending', 'confirmed', 'invoiced', 'paid') DEFAULT 'pending' COMMENT '计费状态：pending-待确认，confirmed-已确认，invoiced-已开票，paid-已付款',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_customer_name (customer_name),
    INDEX idx_status (status),
    INDEX idx_delivery_date (delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计费记录表';

-- 6.5 对账记录表
CREATE TABLE reconciliation_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '对账记录ID，主键',
    month VARCHAR(7) NOT NULL COMMENT '对账月份（YYYY-MM格式）',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    order_count INT DEFAULT 0 COMMENT '订单数量',
    total_volume DECIMAL(12,2) DEFAULT 0 COMMENT '总方量（立方米）',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT '应收金额（元）',
    confirmed_amount DECIMAL(15,2) DEFAULT 0 COMMENT '确认金额（元）',
    difference DECIMAL(15,2) DEFAULT 0 COMMENT '差额（元）',
    status ENUM('pending', 'confirmed', 'disputed') DEFAULT 'pending' COMMENT '对账状态：pending-待确认，confirmed-已确认，disputed-有争议',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_month (month),
    INDEX idx_customer_name (customer_name),
    INDEX idx_status (status),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对账记录表';

-- ============================================================================
-- 7. 日志与告警模块
-- ============================================================================

-- 7.1 操作日志表
CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID，主键',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    operator_id BIGINT COMMENT '操作员ID',
    module VARCHAR(50) NOT NULL COMMENT '操作模块（如vehicle、order、task等）',
    action VARCHAR(50) NOT NULL COMMENT '操作动作（如create、update、delete等）',
    target VARCHAR(100) COMMENT '操作目标（如订单号、车牌号等）',
    detail TEXT COMMENT '操作详情描述',
    ip_address VARCHAR(45) COMMENT '操作IP地址',
    result ENUM('success', 'failure') DEFAULT 'success' COMMENT '操作结果：success-成功，failure-失败',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_timestamp (timestamp),
    INDEX idx_operator_id (operator_id),
    INDEX idx_module (module),
    INDEX idx_result (result),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 7.2 告警记录表
CREATE TABLE alarms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '告警ID，主键',
    alarm_type VARCHAR(50) NOT NULL COMMENT '告警类型（如equipment_failure、material_low等）',
    source VARCHAR(100) NOT NULL COMMENT '告警源（设备名称、系统模块等）',
    message TEXT NOT NULL COMMENT '告警信息',
    severity ENUM('critical', 'warning', 'info') NOT NULL COMMENT '告警级别：critical-严重，warning-警告，info-信息',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '告警时间',
    acknowledged BOOLEAN DEFAULT FALSE COMMENT '是否已确认',
    acknowledged_by BIGINT COMMENT '确认人ID',
    acknowledged_at TIMESTAMP COMMENT '确认时间',
    resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
    resolved_at TIMESTAMP COMMENT '解决时间',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_alarm_type (alarm_type),
    INDEX idx_severity (severity),
    INDEX idx_timestamp (timestamp),
    INDEX idx_acknowledged (acknowledged),
    INDEX idx_resolved (resolved),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警记录表';

-- 7.3 告警规则表
CREATE TABLE alarm_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '规则ID，主键',
    name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_type ENUM('equipment_failure', 'material_low', 'quality_deviation', 'system_error') NOT NULL COMMENT '规则类型：equipment_failure-设备故障，material_low-物料不足，quality_deviation-质量偏差，system_error-系统错误',
    conditions JSON NOT NULL COMMENT '触发条件，JSON格式',
    threshold_value DECIMAL(10,2) COMMENT '阈值',
    message_template TEXT COMMENT '告警信息模板',
    notification_methods JSON COMMENT '通知方式，JSON数组格式',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_rule_type (rule_type),
    INDEX idx_enabled (enabled),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则配置表';

-- 7.4 告警通知表
CREATE TABLE alarm_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID，主键',
    alarm_id BIGINT NOT NULL COMMENT '告警ID',
    notification_type ENUM('email', 'sms', 'push', 'system') NOT NULL COMMENT '通知类型：email-邮件，sms-短信，push-推送，system-系统内',
    recipient VARCHAR(100) NOT NULL COMMENT '接收人（邮箱、手机号或用户ID）',
    content TEXT COMMENT '通知内容',
    sent_at TIMESTAMP COMMENT '发送时间',
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending' COMMENT '发送状态：pending-待发送，sent-已发送，failed-发送失败',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (alarm_id) REFERENCES alarms(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    INDEX idx_alarm_id (alarm_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警通知记录表';

-- 7.5 告警订阅表
CREATE TABLE alarm_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订阅ID，主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    alarm_type VARCHAR(50) NOT NULL COMMENT '告警类型',
    notification_methods JSON COMMENT '通知方式，JSON数组格式',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用订阅',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_alarm_site (user_id, alarm_type, site_id),
    INDEX idx_user_id (user_id),
    INDEX idx_alarm_type (alarm_type),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户告警订阅表';

-- ============================================================================
-- 8. 系统配置模块
-- ============================================================================

-- 8.1 系统配置表
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID，主键',
    site_id BIGINT COMMENT '站点ID，NULL表示全局配置',
    setting_key VARCHAR(100) NOT NULL COMMENT '配置键名',
    setting_value TEXT COMMENT '配置值',
    description TEXT COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_site_key (site_id, setting_key),
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置参数表';

-- 8.2 数据字典表
CREATE TABLE dictionaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '字典ID，主键',
    category VARCHAR(50) NOT NULL COMMENT '字典分类（如user_type、equipment_type等）',
    code VARCHAR(50) NOT NULL COMMENT '字典编码',
    name VARCHAR(100) NOT NULL COMMENT '字典名称',
    value VARCHAR(200) COMMENT '字典值',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态：active-启用，inactive-禁用',
    description TEXT COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_category_code (category, code),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据字典表';

-- ============================================================================
-- 9. 统计分析模块
-- ============================================================================

-- 9.1 日生产统计表
CREATE TABLE daily_production_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID，主键',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    total_batches INT DEFAULT 0 COMMENT '总批次数',
    total_volume DECIMAL(12,2) DEFAULT 0 COMMENT '总产量（立方米）',
    concrete_grades JSON COMMENT '各等级产量统计，JSON格式',
    equipment_count INT DEFAULT 0 COMMENT '使用设备数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_site_date (site_id, stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日生产统计表';

-- 9.2 月生产统计表
CREATE TABLE monthly_production_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID，主键',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    year_month VARCHAR(7) NOT NULL COMMENT '统计年月（YYYY-MM格式）',
    total_batches INT DEFAULT 0 COMMENT '总批次数',
    total_volume DECIMAL(12,2) DEFAULT 0 COMMENT '总产量（立方米）',
    revenue DECIMAL(15,2) DEFAULT 0 COMMENT '营业收入（元）',
    cost DECIMAL(15,2) DEFAULT 0 COMMENT '生产成本（元）',
    profit DECIMAL(15,2) DEFAULT 0 COMMENT '利润（元）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_site_month (site_id, year_month),
    INDEX idx_year_month (year_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='月生产统计表';

-- 9.3 设备运行统计表
CREATE TABLE equipment_daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID，主键',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    running_hours DECIMAL(8,2) DEFAULT 0 COMMENT '运行小时数',
    start_stop_count INT DEFAULT 0 COMMENT '启停次数',
    efficiency DECIMAL(5,2) DEFAULT 0 COMMENT '运行效率百分比',
    maintenance_cost DECIMAL(10,2) DEFAULT 0 COMMENT '维护费用（元）',
    site_id BIGINT NOT NULL COMMENT '站点ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE KEY uk_equipment_date (equipment_id, stat_date),
    INDEX idx_stat_date (stat_date),
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备日运行统计表';

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

-- 创建索引优化查询性能
CREATE INDEX idx_users_site_type ON users(site_id, user_type);
CREATE INDEX idx_equipment_site_type ON equipment(site_id, equipment_type);
CREATE INDEX idx_orders_site_status ON orders(site_id, status);
CREATE INDEX idx_tasks_site_status ON tasks(site_id, status);
CREATE INDEX idx_batches_site_time ON production_batches(site_id, production_time);
CREATE INDEX idx_alarms_site_severity ON alarms(site_id, severity);
CREATE INDEX idx_logs_site_time ON operation_logs(site_id, timestamp);