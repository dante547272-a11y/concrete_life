# Implementation Plan: 混凝土搅拌站数字生命管控平台

## Overview

本实现计划基于 MVP-1 范围，采用增量开发方式，每个任务构建在前一个任务之上。使用 NestJS + TypeScript + PostgreSQL + Redis 技术栈。

## Tasks

- [x] 1. 项目初始化与基础设施
  - [x] 1.1 创建 NestJS 项目结构
    - 使用 `@nestjs/cli` 创建项目
    - 配置 TypeScript 严格模式
    - 设置 ESLint + Prettier
    - _Requirements: 7.1_

  - [x] 1.2 配置数据库连接
    - 安装 Prisma 并初始化
    - 创建 PostgreSQL 连接配置
    - 创建 Redis 连接配置
    - 设置环境变量管理 (.env)
    - _Requirements: 8.1, 8.2_

  - [x] 1.3 创建 Docker 开发环境
    - 编写 docker-compose.yml (PostgreSQL + Redis)
    - 编写 Dockerfile
    - _Requirements: 8.1, 8.2_

- [ ] 2. 数据模型与迁移
  - [ ] 2.1 创建 Prisma Schema - 用户与权限
    - User, Role, Permission, UserRole, RolePermission 模型
    - _Requirements: 1.4_

  - [ ] 2.2 创建 Prisma Schema - 车辆与司机
    - Vehicle, Driver, YardRecord 模型
    - VehicleStatus, DriverQualificationStatus 枚举
    - _Requirements: 2.1, 2.2, 3.1, 6.1_

  - [ ] 2.3 创建 Prisma Schema - 订单与任务
    - Order, Task, OrderStatusHistory, TaskStatusHistory 模型
    - OrderStatus, TaskStatus 枚举
    - _Requirements: 4.1, 5.1_

  - [ ] 2.4 创建 Prisma Schema - 生产与配方
    - Recipe, RecipeItem, Batch, WeighingRecord 模型
    - _Requirements: 16.1, 16.2_

  - [ ] 2.5 创建 Prisma Schema - 审计日志
    - AuditLog 模型
    - _Requirements: 9.1_

  - [ ] 2.6 运行数据库迁移
    - 执行 `prisma migrate dev`
    - 创建种子数据脚本
    - _Requirements: 8.4_

- [ ] 3. 认证授权模块 (AuthModule)
  - [ ] 3.1 实现用户认证服务
    - 实现 login() 方法 - JWT 签发
    - 实现 validateToken() 方法
    - 实现 refreshToken() 方法
    - 实现密码哈希与验证
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 3.2 编写属性测试 - JWT Token 签发
    - **Property 1: JWT Token Issuance**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 编写属性测试 - 无效凭证拒绝
    - **Property 2: Invalid Credentials Rejection**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 编写属性测试 - 无效 Token 拒绝
    - **Property 3: Invalid Token Rejection**
    - **Validates: Requirements 1.3**

  - [ ] 3.5 实现 RBAC 权限服务
    - 实现 checkPermission() 方法
    - 实现 getUserRoles() 方法
    - 创建权限守卫 (PermissionGuard)
    - _Requirements: 1.4, 1.5_

  - [ ]* 3.6 编写属性测试 - 权限执行
    - **Property 4: Permission Enforcement**
    - **Validates: Requirements 1.5**

  - [ ] 3.7 创建认证 REST API 端点
    - POST /auth/login
    - POST /auth/refresh
    - POST /auth/logout
    - GET /auth/me
    - _Requirements: 7.1_

- [ ] 4. Checkpoint - 认证模块完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 5. 车辆管理模块 (VehicleModule)
  - [ ] 5.1 实现车辆服务
    - 实现 create(), findById(), findAll(), update(), softDelete()
    - 实现车牌唯一性验证
    - 实现分页与过滤查询
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 5.2 编写属性测试 - 实体创建完整性
    - **Property 6: Entity Creation Completeness**
    - **Validates: Requirements 2.1**

  - [ ]* 5.3 编写属性测试 - 查询过滤正确性
    - **Property 7: Query Filtering Correctness**
    - **Validates: Requirements 2.2**

  - [ ]* 5.4 编写属性测试 - 唯一约束执行
    - **Property 9: Unique Constraint Enforcement**
    - **Validates: Requirements 2.5**

  - [ ] 5.5 实现司机服务
    - 实现 create(), findById(), findAll(), update()
    - 实现资质状态检查
    - 实现司机-车辆关联
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 5.6 实现进出场服务
    - 实现 recordEntry(), recordExit()
    - 实现 getQueue() - 按入场时间排序
    - 实现 estimateWaitTime()
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.7 编写属性测试 - 进出场记录完整性
    - **Property 13: Yard Record Completeness**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 5.8 编写属性测试 - 队列排序
    - **Property 14: Queue Ordering**
    - **Validates: Requirements 6.4**

  - [ ] 5.9 创建车辆管理 REST API 端点
    - CRUD: /vehicles, /vehicles/:id
    - CRUD: /drivers, /drivers/:id
    - POST /yard/entry, POST /yard/exit
    - GET /yard/queue
    - _Requirements: 7.1_

- [ ] 6. Checkpoint - 车辆模块完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 7. 订单管理模块 (OrderModule)
  - [ ] 7.1 实现订单服务
    - 实现 create() - 生成唯一订单号
    - 实现 findById(), findAll(), update()
    - 实现分页与过滤查询
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 7.2 实现订单状态机
    - 定义状态转换规则
    - 实现 transitionStatus() - 验证转换有效性
    - 创建状态历史记录
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 7.3 编写属性测试 - 订单状态机有效性
    - **Property 10: Order State Machine Validity**
    - **Validates: Requirements 4.4, 4.5, 4.6**

  - [ ] 7.4 创建订单管理 REST API 端点
    - CRUD: /orders, /orders/:id
    - PATCH /orders/:id/status
    - GET /orders/:id/history
    - _Requirements: 7.1_

- [ ] 8. 任务派单模块 (TaskModule)
  - [ ] 8.1 实现任务服务
    - 实现 createFromOrder() - 生成任务号和批次号
    - 实现 findById(), findAll()
    - 实现分页与过滤查询
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 8.2 实现任务分配
    - 实现 assignVehicle() - 验证车辆可用性
    - 验证司机资质状态
    - _Requirements: 5.6, 5.7_

  - [ ]* 8.3 编写属性测试 - 任务分配验证
    - **Property 12: Task Assignment Validation**
    - **Validates: Requirements 5.6, 5.7, 3.5**

  - [ ] 8.4 实现任务状态机
    - 定义状态转换规则
    - 实现 transitionStatus()
    - 创建状态历史记录
    - _Requirements: 5.3, 5.4_

  - [ ]* 8.5 编写属性测试 - 任务状态机有效性
    - **Property 11: Task State Machine Validity**
    - **Validates: Requirements 5.3, 5.4**

  - [ ] 8.6 创建任务派单 REST API 端点
    - POST /tasks (从订单创建)
    - GET /tasks, GET /tasks/:id
    - PATCH /tasks/:id/assign
    - PATCH /tasks/:id/status
    - _Requirements: 7.1_

- [ ] 9. Checkpoint - 订单与任务模块完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 10. 审计日志模块 (AuditModule)
  - [ ] 10.1 实现审计服务
    - 实现 log() - 记录操作日志
    - 实现 query() - 支持过滤查询
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 10.2 创建审计拦截器
    - 自动记录 CRUD 操作
    - 捕获 oldValue 和 newValue
    - _Requirements: 9.1, 9.2_

  - [ ]* 10.3 编写属性测试 - 审计日志完整性
    - **Property 17: Audit Log Completeness**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 10.4 编写属性测试 - 认证日志
    - **Property 5: Authentication Logging**
    - **Validates: Requirements 1.6**

  - [ ] 10.5 创建审计日志 REST API 端点
    - GET /audit-logs
    - _Requirements: 9.4_

- [ ] 11. API 通用功能
  - [ ] 11.1 实现统一响应格式
    - 创建响应拦截器
    - 统一成功/错误响应结构
    - 添加 traceId
    - _Requirements: 7.2, 7.7_

  - [ ] 11.2 实现全局异常处理
    - 创建异常过滤器
    - 统一错误码定义
    - _Requirements: 7.4, 7.5_

  - [ ]* 11.3 编写属性测试 - API 响应一致性
    - **Property 15: API Response Consistency**
    - **Validates: Requirements 7.2, 7.3, 7.6, 7.7**

  - [ ]* 11.4 编写属性测试 - 验证错误响应
    - **Property 16: Validation Error Response**
    - **Validates: Requirements 7.4**

  - [ ] 11.5 配置 Swagger 文档
    - 安装 @nestjs/swagger
    - 添加 API 装饰器
    - 配置 /api/docs 端点
    - _Requirements: 10.1, 10.2_

- [ ] 12. Checkpoint - MVP-1 核心功能完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 13. 生产中控模块 (ProductionModule) - 基础
  - [ ] 13.1 实现配方服务
    - 实现 create(), findById(), findByGrade()
    - 实现 update(), activate()
    - 实现配方版本控制
    - _Requirements: 16.1, 16.2_

  - [ ] 13.2 实现设备状态服务
    - 实现 getPlantStatus()
    - 实现 getBinStatus(), getAllBinsStatus()
    - 实现 getScaleReading(), getMixerStatus()
    - _Requirements: 11.2, 11.3, 12.2, 13.2, 14.1, 15.1_

  - [ ]* 13.3 编写属性测试 - 设备状态完整性
    - **Property 18: Plant Status Completeness**
    - **Validates: Requirements 11.2, 11.3, 12.2, 13.2, 14.1, 15.1-15.5**

  - [ ] 13.4 实现库存告警逻辑
    - 实现低库存阈值检查
    - 设置 lowLevelAlarm 标志
    - _Requirements: 11.5, 12.5_

  - [ ]* 13.5 编写属性测试 - 低库存告警
    - **Property 19: Low Inventory Alarm**
    - **Validates: Requirements 11.5, 12.5**

  - [ ] 13.6 实现称重偏差计算
    - 计算偏差百分比
    - 设置超差警告标志
    - _Requirements: 16.4, 16.5_

  - [ ]* 13.7 编写属性测试 - 偏差计算
    - **Property 20: Deviation Calculation**
    - **Validates: Requirements 16.4, 16.5**

  - [ ] 13.8 实现生产记录服务
    - 实现 getProductionLog()
    - 支持时间范围和等级过滤
    - _Requirements: 17.1, 17.2, 17.4_

  - [ ]* 13.9 编写属性测试 - 生产日志完整性
    - **Property 21: Production Log Completeness**
    - **Validates: Requirements 17.1, 17.2, 17.4**

  - [ ] 13.10 创建生产中控 REST API 端点
    - GET /production/status
    - GET /production/bins, GET /production/bins/:id
    - GET /production/scales/:id
    - GET /production/mixer
    - GET /production/logs
    - CRUD: /recipes
    - _Requirements: 7.1_

- [ ] 14. WebSocket 实时推送
  - [ ] 14.1 配置 Socket.io
    - 安装 @nestjs/websockets, socket.io
    - 创建 WebSocket Gateway
    - 实现认证中间件
    - _Requirements: 11.6_

  - [ ] 14.2 实现设备状态推送
    - 实现 plant:status 事件
    - 实现 bin:update, scale:update, mixer:update 事件
    - _Requirements: 11.6_

  - [ ] 14.3 实现车辆事件推送
    - 实现 vehicle:entered, vehicle:exited 事件
    - 实现 queue:updated 事件
    - _Requirements: 6.1, 6.2_

- [ ] 15. 边缘网关模块 (EdgeGatewayModule) - 模拟
  - [ ] 15.1 创建设备模拟器
    - 模拟 Modbus 数据点
    - 生成随机设备数据
    - _Requirements: 18.1_

  - [ ] 15.2 实现数据采集服务
    - 实现轮询机制
    - 实现数据点映射
    - _Requirements: 18.3_

  - [ ] 15.3 实现离线缓存
    - 实现 store(), getUnsynced(), markSynced()
    - 使用 Redis 存储
    - _Requirements: 18.5_

  - [ ] 15.4 实现错误处理与重试
    - 实现连接失败检测
    - 实现自动重试机制
    - 实现错误日志记录
    - _Requirements: 18.4, 18.6_

  - [ ]* 15.5 编写属性测试 - 设备错误处理
    - **Property 22: Device Error Handling**
    - **Validates: Requirements 18.4, 18.5, 18.6**

- [ ] 16. Checkpoint - 生产中控模块完成
  - 确保所有测试通过，如有问题请询问用户

- [ ] 17. 集成测试与文档
  - [ ] 17.1 编写集成测试
    - 完整业务流程测试：下单→派单→装车→交付→回单
    - API 端点集成测试
    - _Requirements: 验收标准_

  - [ ] 17.2 完善 Swagger 文档
    - 添加所有请求/响应示例
    - 添加错误码说明
    - _Requirements: 10.3, 10.4_

  - [ ] 17.3 创建 Postman 集合
    - 导出所有 API 端点
    - 添加测试脚本
    - _Requirements: 交付物_

- [ ] 18. 部署配置
  - [ ] 18.1 完善 Docker 配置
    - 优化 Dockerfile (多阶段构建)
    - 完善 docker-compose.yml (生产配置)
    - _Requirements: 交付物_

  - [ ] 18.2 创建 Kubernetes 部署清单
    - Deployment, Service, ConfigMap, Secret
    - Ingress 配置
    - _Requirements: 交付物_

  - [ ] 18.3 配置 CI/CD
    - GitHub Actions 工作流
    - 自动测试、构建、部署
    - _Requirements: 交付物_

- [ ] 19. Final Checkpoint - MVP-1 完成
  - 确保所有测试通过
  - 验证完整业务流程
  - 如有问题请询问用户

## Notes

- 标记 `*` 的任务为可选的属性测试任务，可跳过以加快 MVP 交付
- 每个 Checkpoint 确保增量功能可用
- 属性测试验证通用正确性，单元测试验证具体示例
- 所有 API 端点需要 JWT 认证（除 /auth/login）
