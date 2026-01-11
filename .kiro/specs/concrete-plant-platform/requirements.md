# Requirements Document

## Introduction

混凝土搅拌站数字生命管控平台是一套基于 Node.js + TypeScript 的综合管理系统，覆盖车辆管理、混凝土/物料管理、任务/订单管理、生产中控可视化、质量追溯与计费对账。本文档聚焦 MVP-1 阶段的核心功能：车辆管理、订单管理、基本派单与 REST API。

## Glossary

- **Platform**: 混凝土搅拌站数字生命管控平台后端服务
- **Vehicle**: 运输混凝土的车辆实体，包含车牌、司机、GPS 等信息
- **Driver**: 驾驶车辆的司机，包含档案、证件与资质信息
- **Order**: 客户下达的混凝土订单，包含方量、配送地址、优先级等
- **Task**: 由订单拆分或合并生成的运输任务，分配给具体车辆执行
- **Batch**: 一次生产批次，关联配方、称重、时间、车牌、操作员
- **User**: 系统用户，包含管理员、调度员、操作员等角色
- **JWT_Token**: JSON Web Token，用于身份验证的令牌
- **RBAC**: Role-Based Access Control，基于角色的访问控制
- **Aggregate_Bin**: 骨料仓，存储不同规格的砂石骨料（如 5-10mm、10-20mm、20-31.5mm）
- **Cement_Silo**: 水泥仓，存储水泥（如 P.O 42.5）和矿粉等�ite料
- **Additive_Tank**: 外加剂罐，存储减水剂、缓凝剂等液体外加剂
- **Weighing_Hopper**: 称重斗，用于精确称量各种原材料
- **Mixer**: 搅拌机，将称量好的原材料混合搅拌成混凝土
- **Recipe**: 配方，定义各种原材料的配比和目标重量
- **Concrete_Grade**: 混凝土强度等级，如 C30、C40 等
- **Modbus**: 工业通信协议，用于 PLC 和传感器数据采集
- **OPC_UA**: 开放平台通信统一架构，工业设备互联标准协议

## Requirements

### Requirement 1: 用户认证与授权

**User Story:** As a 系统管理员, I want to 管理用户账户和权限, so that 只有授权用户才能访问系统功能。

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Platform SHALL issue a JWT_Token with expiration time
2. WHEN a user submits invalid credentials, THE Platform SHALL return an authentication error with status code 401
3. WHEN a request contains an expired or invalid JWT_Token, THE Platform SHALL reject the request with status code 401
4. THE Platform SHALL support RBAC with at least three roles: admin, dispatcher, operator
5. WHEN a user attempts to access a resource without required permissions, THE Platform SHALL return status code 403
6. THE Platform SHALL log all authentication attempts with timestamp, user identifier, and result

### Requirement 2: 车辆档案管理

**User Story:** As a 调度员, I want to 管理车辆档案信息, so that 我可以追踪和调度所有运输车辆。

#### Acceptance Criteria

1. WHEN a dispatcher creates a vehicle record, THE Platform SHALL store vehicle plate number, type, capacity, and status
2. WHEN a dispatcher queries vehicles, THE Platform SHALL return paginated results with filtering by status and type
3. WHEN a dispatcher updates vehicle information, THE Platform SHALL validate required fields and update the record
4. WHEN a dispatcher deletes a vehicle, THE Platform SHALL perform soft delete and retain historical data
5. THE Platform SHALL enforce unique constraint on vehicle plate number
6. WHEN a vehicle record is modified, THE Platform SHALL record the modification timestamp and operator

### Requirement 3: 司机档案管理

**User Story:** As a 调度员, I want to 管理司机档案和资质信息, so that 我可以确保只有合格司机执行运输任务。

#### Acceptance Criteria

1. WHEN a dispatcher creates a driver record, THE Platform SHALL store name, phone, license number, and qualification status
2. WHEN a dispatcher queries drivers, THE Platform SHALL return paginated results with filtering by qualification status
3. WHEN a driver's qualification expires, THE Platform SHALL mark the driver as unqualified
4. THE Platform SHALL associate drivers with vehicles through assignment records
5. WHEN a driver is assigned to a vehicle, THE Platform SHALL validate driver qualification status
6. THE Platform SHALL enforce unique constraint on driver license number

### Requirement 4: 订单管理

**User Story:** As a 调度员, I want to 录入和管理客户订单, so that 我可以安排生产和配送。

#### Acceptance Criteria

1. WHEN a dispatcher creates an order, THE Platform SHALL store customer info, delivery address, concrete type, volume, and priority
2. WHEN an order is created, THE Platform SHALL generate a unique order number with timestamp prefix
3. WHEN a dispatcher queries orders, THE Platform SHALL return paginated results with filtering by status, date range, and priority
4. THE Platform SHALL support order status transitions: pending → confirmed → in_production → dispatched → delivered → completed
5. WHEN an order status changes, THE Platform SHALL record the transition timestamp and operator
6. IF an order status transition is invalid, THEN THE Platform SHALL reject the operation and return an error

### Requirement 5: 任务派单

**User Story:** As a 调度员, I want to 将订单分配给车辆执行, so that 混凝土可以按时送达客户。

#### Acceptance Criteria

1. WHEN a dispatcher creates a task from an order, THE Platform SHALL associate the task with order, vehicle, and driver
2. WHEN a task is created, THE Platform SHALL generate a unique task number and batch number
3. THE Platform SHALL support task status transitions: created → assigned → loading → in_transit → delivered → returned
4. WHEN a task status changes, THE Platform SHALL record the transition timestamp, location, and operator
5. WHEN a dispatcher queries tasks, THE Platform SHALL return paginated results with filtering by status, vehicle, and date
6. THE Platform SHALL prevent assigning tasks to vehicles with status other than available
7. THE Platform SHALL prevent assigning tasks to drivers with unqualified status

### Requirement 6: 车辆进出场管理

**User Story:** As a 操作员, I want to 记录车辆进出场时间, so that 我可以追踪车辆在场状态和排队情况。

#### Acceptance Criteria

1. WHEN a vehicle enters the plant, THE Platform SHALL record entry timestamp and update vehicle location status
2. WHEN a vehicle exits the plant, THE Platform SHALL record exit timestamp and update vehicle location status
3. THE Platform SHALL maintain a queue of vehicles waiting for loading
4. WHEN querying vehicle queue, THE Platform SHALL return vehicles ordered by entry timestamp
5. THE Platform SHALL calculate estimated waiting time based on average loading duration

### Requirement 7: REST API 规范

**User Story:** As a 开发者, I want to 通过标准化的 REST API 访问系统功能, so that 我可以集成第三方系统。

#### Acceptance Criteria

1. THE Platform SHALL expose RESTful endpoints following OpenAPI 3.0 specification
2. THE Platform SHALL return responses in JSON format with consistent structure
3. THE Platform SHALL use ISO 8601 format for all datetime fields
4. WHEN a request fails validation, THE Platform SHALL return status code 400 with detailed error messages
5. WHEN a server error occurs, THE Platform SHALL return status code 500 and log the error details
6. THE Platform SHALL support pagination with page and limit query parameters
7. THE Platform SHALL include request tracing ID in all responses for debugging

### Requirement 8: 数据持久化

**User Story:** As a 系统管理员, I want to 确保数据安全存储和可恢复, so that 业务数据不会丢失。

#### Acceptance Criteria

1. THE Platform SHALL use PostgreSQL as the primary database for business data
2. THE Platform SHALL use Redis for caching frequently accessed data
3. WHEN storing sensitive data, THE Platform SHALL encrypt the data at rest
4. THE Platform SHALL implement database migrations using versioned scripts
5. THE Platform SHALL support database connection pooling for performance
6. WHEN a database operation fails, THE Platform SHALL retry with exponential backoff

### Requirement 9: 审计日志

**User Story:** As a 系统管理员, I want to 追踪所有关键操作, so that 我可以审计系统使用情况和排查问题。

#### Acceptance Criteria

1. THE Platform SHALL log all create, update, and delete operations on business entities
2. WHEN logging an operation, THE Platform SHALL record timestamp, user, entity type, entity ID, and operation type
3. THE Platform SHALL store audit logs in append-only manner to prevent tampering
4. WHEN querying audit logs, THE Platform SHALL support filtering by entity type, user, and date range
5. THE Platform SHALL retain audit logs for at least 365 days

### Requirement 10: API 文档

**User Story:** As a 开发者, I want to 访问完整的 API 文档, so that 我可以快速理解和使用系统接口。

#### Acceptance Criteria

1. THE Platform SHALL generate Swagger/OpenAPI documentation automatically from code annotations
2. THE Platform SHALL expose Swagger UI at /api/docs endpoint
3. THE Platform SHALL include request/response examples in API documentation
4. THE Platform SHALL document all error codes and their meanings

### Requirement 11: 生产中控可视化界面

**User Story:** As a 操作员, I want to 通过可视化界面监控整个搅拌站的生产状态, so that 我可以实时掌握配料、称重、搅拌的全流程。

#### Acceptance Criteria

1. THE Platform SHALL display a visual representation of the batching plant layout including aggregate bins, cement silos, additive tanks, and mixer
2. THE Platform SHALL show real-time inventory levels for each storage bin with percentage and weight values
3. THE Platform SHALL display real-time weighing data for each scale with target value and actual value
4. THE Platform SHALL indicate equipment status using color-coded indicators (green for running, red for stopped, yellow for warning)
5. WHEN inventory level falls below configured threshold, THE Platform SHALL highlight the bin with warning color
6. THE Platform SHALL update all displayed values at least every 2 seconds

### Requirement 12: 骨料仓管理

**User Story:** As a 操作员, I want to 监控和管理骨料仓的状态, so that 我可以确保生产所需骨料充足。

#### Acceptance Criteria

1. THE Platform SHALL display multiple aggregate bins with configurable specifications (e.g., 19-31.5mm, 4.75-9.5mm, 9.5-19mm)
2. THE Platform SHALL show current inventory weight and percentage for each aggregate bin
3. THE Platform SHALL display the weighing hopper status below each bin with target and actual weight
4. WHEN aggregate is being discharged, THE Platform SHALL animate the discharge indicator
5. THE Platform SHALL support configuring low-level alarm threshold for each bin

### Requirement 13: 水泥/粉料仓管理

**User Story:** As a 操作员, I want to 监控水泥和粉料仓的库存和称重状态, so that 我可以确保配方所需粉料准确投放。

#### Acceptance Criteria

1. THE Platform SHALL display cement silos with type labels (e.g., P.O 42.5, 矿粉)
2. THE Platform SHALL show current inventory level for each silo in tons
3. THE Platform SHALL display powder scale readings with target and actual values
4. WHEN powder is being discharged to scale, THE Platform SHALL show discharge animation
5. THE Platform SHALL support multiple cement types and powder additives

### Requirement 14: 外加剂与水管理

**User Story:** As a 操作员, I want to 监控外加剂和水的投放状态, so that 我可以确保混凝土配比准确。

#### Acceptance Criteria

1. THE Platform SHALL display water tank and additive tanks with current levels
2. THE Platform SHALL show water scale and additive scale readings
3. THE Platform SHALL display target and actual values for water and each additive
4. WHEN liquid is being pumped, THE Platform SHALL indicate pump running status

### Requirement 15: 搅拌机状态监控

**User Story:** As a 操作员, I want to 监控搅拌机的运行状态, so that 我可以掌握混凝土搅拌进度。

#### Acceptance Criteria

1. THE Platform SHALL display mixer with running/stopped status indicator
2. THE Platform SHALL show current batch mixing time and remaining time
3. THE Platform SHALL display mixer load percentage
4. WHEN mixer is running, THE Platform SHALL animate the mixer blades
5. THE Platform SHALL show discharge gate status (open/closed)

### Requirement 16: 生产配方显示

**User Story:** As a 操作员, I want to 查看当前生产批次的配方信息, so that 我可以核对生产参数。

#### Acceptance Criteria

1. THE Platform SHALL display current production task number and concrete grade (e.g., C30)
2. THE Platform SHALL show target recipe with all material weights
3. THE Platform SHALL display actual weighed values alongside target values
4. THE Platform SHALL calculate and display deviation percentage for each material
5. WHEN deviation exceeds tolerance, THE Platform SHALL highlight the value in warning color

### Requirement 17: 生产记录实时显示

**User Story:** As a 操作员, I want to 查看实时生产记录, so that 我可以追踪当班的生产情况。

#### Acceptance Criteria

1. THE Platform SHALL display a production log table with recent batches
2. THE Platform SHALL show batch number, time, concrete grade, volume, and vehicle plate for each record
3. THE Platform SHALL auto-scroll to show the latest production record
4. THE Platform SHALL support filtering production records by time range and concrete grade

### Requirement 18: 设备数据采集接口

**User Story:** As a 系统集成商, I want to 通过标准协议采集现场设备数据, so that 中控界面可以显示实时数据。

#### Acceptance Criteria

1. THE Platform SHALL support Modbus TCP/RTU protocol for PLC data acquisition
2. THE Platform SHALL support OPC-UA protocol for industrial equipment integration
3. THE Platform SHALL provide configurable polling interval for data collection
4. WHEN communication with device fails, THE Platform SHALL display connection error and retry automatically
5. THE Platform SHALL cache last known values when connection is temporarily lost
6. THE Platform SHALL log all communication errors with timestamp and device identifier
