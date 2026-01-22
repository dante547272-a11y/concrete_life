# Concrete Plant Management System (混凝土搅拌站管理系统)

一个全栈的混凝土搅拌站生产管理系统，用于管理生产调度、订单、车辆、质量控制等业务流程。

## 技术栈

### 后端 (concrete-plant-api)
- NestJS 11 - Node.js 框架
- Prisma - ORM 数据库访问
- PostgreSQL 15 - 关系型数据库
- Redis 7 - 缓存与消息队列
- Docker - 容器化部署

### 前端 (concrete-plant-web)
- React 19 + TypeScript
- Vite 7 - 构建工具
- Ant Design 6 - UI 组件库
- TailwindCSS 4 - 样式框架
- Zustand - 状态管理
- React Query - 数据请求
- ECharts - 数据可视化
- Leaflet - 地图组件
- Socket.IO - 实时通信
- Playwright - E2E 测试

## 功能模块

- 仪表盘 (Dashboard) - 生产数据概览
- 设备管理 - 统一设备管理中心
  - 生产中控 (Production Control) - 生产线实时监控与控制
  - 车辆设备 (Vehicles) - 搅拌车、泵车定位与管理
  - 生产设备 (Production Equipment) - 搅拌机、皮带机等设备及配件生命周期管理
  - 零排放污水管理 (Wastewater) - 污水收集、沉淀、回用水池及水泵监控
- 司机/排队管理
  - 司机管理 (Drivers) - 司机信息与调度
  - 排队看板 (Queue) - 车辆排队调度
- 订单管理 (Orders) - 客户订单处理
- 任务派单 (Tasks) - 生产任务调度
- 配方管理 (Recipes) - 混凝土配方
- 混凝土标号 (Concrete Grades) - 产品规格
- 原材料管理 (Materials) - 原材料库存
- 质量控制 (Quality) - 质量检测记录
- 日志及告警
  - 告警中心 (Alarms) - 异常报警
  - 告警配置 (Alarm Config) - 告警规则与通知方式配置
  - 操作日志 (Logs) - 系统操作日志
- 计费管理 (Billing) - 订单计费
- 站点管理 (Sites) - 多站点管理
- 员工管理 (Employees) - 人员管理
- 策略配置 (Strategies) - 业务策略

## 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- npm 或 yarn

### 后端启动

```bash
cd concrete-plant-api

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env

# 启动数据库和 Redis (Docker)
docker-compose up -d postgres redis

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

### 前端启动

```bash
cd concrete-plant-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### Docker 一键启动

```bash
cd concrete-plant-api
docker-compose up -d
```

## 项目结构

```
├── concrete-plant-api/     # 后端 API 服务
│   ├── src/
│   │   ├── prisma/         # Prisma 数据库模块
│   │   └── redis/          # Redis 缓存模块
│   ├── prisma/             # Prisma Schema
│   └── docker-compose.yml  # Docker 编排
│
└── concrete-plant-web/     # 前端 Web 应用
    ├── src/
    │   ├── components/     # 通用组件
    │   ├── pages/          # 页面组件
    │   ├── hooks/          # 自定义 Hooks
    │   ├── stores/         # Zustand 状态
    │   ├── styles/         # 样式文件
    │   └── utils/          # 工具函数
    └── e2e/                # E2E 测试
```

## 开发命令

### 后端
```bash
npm run start:dev    # 开发模式
npm run build        # 构建
npm run test         # 单元测试
npm run lint         # 代码检查
```

### 前端
```bash
npm run dev          # 开发模式
npm run build        # 构建
npm run lint         # 代码检查
npm run test:e2e     # E2E 测试
```

## License

UNLICENSED
