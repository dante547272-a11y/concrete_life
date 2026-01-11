# Requirements Document

## Introduction

混凝土搅拌站数字生命管控平台前端系统，提供生产中控可视化大屏、车辆管理、订单管理、任务派单等功能界面。采用工业风格深色主题设计，支持实时数据展示和设备状态监控。

## Glossary

- **Frontend**: 混凝土搅拌站管控平台的 Web 前端应用
- **Dashboard**: 生产中控可视化大屏，展示搅拌站全局状态
- **HMI**: Human-Machine Interface，人机交互界面
- **Real_Time_Data**: 通过 WebSocket 推送的实时设备数据
- **Plant_Layout**: 搅拌站设备布局图，包含骨料仓、水泥仓、搅拌机等
- **Aggregate_Bin_Widget**: 骨料仓可视化组件
- **Cement_Silo_Widget**: 水泥仓可视化组件
- **Mixer_Widget**: 搅拌机可视化组件
- **Scale_Widget**: 称重斗可视化组件

## Requirements

### Requirement 1: 系统登录与认证

**User Story:** As a 操作员, I want to 通过账号密码登录系统, so that 我可以安全地访问管控平台。

#### Acceptance Criteria

1. WHEN a user visits the application, THE Frontend SHALL display a login page with username and password fields
2. WHEN a user submits valid credentials, THE Frontend SHALL store the JWT token and redirect to the dashboard
3. WHEN a user submits invalid credentials, THE Frontend SHALL display an error message without exposing sensitive information
4. WHEN a JWT token expires, THE Frontend SHALL automatically redirect to the login page
5. THE Frontend SHALL provide a logout button that clears the token and redirects to login

### Requirement 2: 导航与布局

**User Story:** As a 用户, I want to 通过清晰的导航访问各功能模块, so that 我可以快速找到需要的功能。

#### Acceptance Criteria

1. THE Frontend SHALL display a sidebar navigation with menu items for all major modules
2. THE Frontend SHALL highlight the current active menu item
3. THE Frontend SHALL support collapsing the sidebar to maximize content area
4. THE Frontend SHALL display user information and logout option in the header
5. THE Frontend SHALL use a dark theme suitable for industrial control environments

### Requirement 3: 生产中控大屏 - 整体布局

**User Story:** As a 操作员, I want to 在一个屏幕上看到整个搅拌站的运行状态, so that 我可以全面掌握生产情况。

#### Acceptance Criteria

1. THE Frontend SHALL display a full-screen dashboard with the batching plant layout
2. THE Frontend SHALL arrange components to match the physical plant layout (aggregate bins on left, cement silos in center, mixer at bottom)
3. THE Frontend SHALL use color-coded indicators: green for running, red for stopped, yellow for warning, blue for idle
4. THE Frontend SHALL update all displayed values in real-time via WebSocket connection
5. WHEN WebSocket connection is lost, THE Frontend SHALL display a connection status indicator and attempt reconnection

### Requirement 4: 骨料仓可视化

**User Story:** As a 操作员, I want to 直观地看到每个骨料仓的库存和状态, so that 我可以及时安排补料。

#### Acceptance Criteria

1. THE Frontend SHALL display each aggregate bin as a visual container with fill level animation
2. THE Frontend SHALL show bin specification label (e.g., "5-10mm", "10-20mm")
3. THE Frontend SHALL display current weight in kg and percentage
4. THE Frontend SHALL animate the discharge indicator when material is being released
5. WHEN inventory falls below threshold, THE Frontend SHALL highlight the bin with warning color and show alarm icon
6. THE Frontend SHALL display the weighing hopper below each bin with target and actual weight

### Requirement 5: 水泥仓可视化

**User Story:** As a 操作员, I want to 监控水泥和粉料仓的状态, so that 我可以确保生产原料充足。

#### Acceptance Criteria

1. THE Frontend SHALL display cement silos as tall cylindrical containers with fill level
2. THE Frontend SHALL show material type label (e.g., "P.O 42.5", "矿粉")
3. THE Frontend SHALL display current inventory in tons
4. THE Frontend SHALL animate powder discharge when material is being released
5. THE Frontend SHALL display the powder scale with target and actual weight values

### Requirement 6: 外加剂与水可视化

**User Story:** As a 操作员, I want to 监控水和外加剂的投放状态, so that 我可以确保配比准确。

#### Acceptance Criteria

1. THE Frontend SHALL display water tank and additive tanks with current levels
2. THE Frontend SHALL show pump running status with animation
3. THE Frontend SHALL display scale readings with target and actual values
4. THE Frontend SHALL indicate deviation when actual differs significantly from target

### Requirement 7: 搅拌机可视化

**User Story:** As a 操作员, I want to 监控搅拌机的运行状态, so that 我可以掌握搅拌进度。

#### Acceptance Criteria

1. THE Frontend SHALL display the mixer with running/stopped status indicator
2. THE Frontend SHALL animate mixer blades when running
3. THE Frontend SHALL show mixing time progress bar with current and total time
4. THE Frontend SHALL display mixer load percentage
5. THE Frontend SHALL indicate discharge gate status (open/closed) with animation

### Requirement 8: 当前生产任务显示

**User Story:** As a 操作员, I want to 查看当前生产批次的详细信息, so that 我可以核对生产参数。

#### Acceptance Criteria

1. THE Frontend SHALL display current task number and concrete grade prominently
2. THE Frontend SHALL show a recipe table with material names, target weights, and actual weights
3. THE Frontend SHALL calculate and display deviation percentage for each material
4. WHEN deviation exceeds tolerance, THE Frontend SHALL highlight the value in warning color
5. THE Frontend SHALL display batch progress status (preparing, weighing, mixing, discharging)

### Requirement 9: 生产记录列表

**User Story:** As a 操作员, I want to 查看实时生产记录, so that 我可以追踪当班生产情况。

#### Acceptance Criteria

1. THE Frontend SHALL display a scrollable table with recent production records
2. THE Frontend SHALL show batch number, time, concrete grade, volume, and vehicle plate
3. THE Frontend SHALL auto-scroll to show the latest record when new data arrives
4. THE Frontend SHALL support filtering by time range and concrete grade
5. THE Frontend SHALL support exporting records to Excel

### Requirement 10: 车辆管理界面

**User Story:** As a 调度员, I want to 管理车辆档案, so that 我可以维护车队信息。

#### Acceptance Criteria

1. THE Frontend SHALL display a searchable and sortable vehicle list table
2. THE Frontend SHALL provide a form for creating and editing vehicle records
3. THE Frontend SHALL display vehicle status with color-coded badges
4. THE Frontend SHALL support filtering by vehicle type and status
5. THE Frontend SHALL confirm before deleting a vehicle record

### Requirement 11: 司机管理界面

**User Story:** As a 调度员, I want to 管理司机档案和资质, so that 我可以确保司机信息准确。

#### Acceptance Criteria

1. THE Frontend SHALL display a searchable driver list with qualification status
2. THE Frontend SHALL highlight drivers with expired or expiring qualifications
3. THE Frontend SHALL provide a form for creating and editing driver records
4. THE Frontend SHALL display driver-vehicle assignment history

### Requirement 12: 订单管理界面

**User Story:** As a 调度员, I want to 录入和管理客户订单, so that 我可以安排生产配送。

#### Acceptance Criteria

1. THE Frontend SHALL display an order list with status, customer, and delivery info
2. THE Frontend SHALL provide a form for creating orders with validation
3. THE Frontend SHALL display order status with color-coded badges and allow status transitions
4. THE Frontend SHALL show order history timeline
5. THE Frontend SHALL support filtering by status, date range, and priority

### Requirement 13: 任务派单界面

**User Story:** As a 调度员, I want to 将订单分配给车辆, so that 我可以安排配送任务。

#### Acceptance Criteria

1. THE Frontend SHALL display a task list with order info, vehicle, and status
2. THE Frontend SHALL provide a vehicle selection dialog for task assignment
3. THE Frontend SHALL only show available vehicles and qualified drivers for assignment
4. THE Frontend SHALL display task status timeline with location info
5. THE Frontend SHALL support batch task creation from orders

### Requirement 14: 车辆排队看板

**User Story:** As a 操作员, I want to 查看场内车辆排队情况, so that 我可以安排装车顺序。

#### Acceptance Criteria

1. THE Frontend SHALL display a queue board showing vehicles in order of entry time
2. THE Frontend SHALL show vehicle plate, driver name, task info, and wait time
3. THE Frontend SHALL highlight the vehicle currently being loaded
4. THE Frontend SHALL update queue in real-time when vehicles enter or exit
5. THE Frontend SHALL display estimated wait time for each vehicle

### Requirement 15: 响应式设计

**User Story:** As a 用户, I want to 在不同设备上使用系统, so that 我可以灵活地访问管控平台。

#### Acceptance Criteria

1. THE Frontend SHALL adapt layout for desktop screens (1920x1080 and above)
2. THE Frontend SHALL provide a simplified view for tablet devices
3. THE Frontend SHALL maintain readability and usability on all supported screen sizes
4. THE Frontend SHALL optimize the dashboard for large display screens (中控大屏)

### Requirement 16: 告警通知

**User Story:** As a 操作员, I want to 及时收到系统告警, so that 我可以快速响应异常情况。

#### Acceptance Criteria

1. WHEN an alarm is triggered, THE Frontend SHALL display a notification popup
2. THE Frontend SHALL play an audio alert for critical alarms
3. THE Frontend SHALL display an alarm list panel with unacknowledged alarms
4. THE Frontend SHALL allow users to acknowledge and clear alarms
5. THE Frontend SHALL show alarm history with filtering options

