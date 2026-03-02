# API接口详细文档

## 一、API概述

### 1.1 基础信息

- **Base URL**: `http://localhost:3001/api`
- **协议**: HTTP/HTTPS
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2026-02-05T10:30:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2026-02-05T10:30:00.000Z"
}
```

### 1.3 HTTP状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或Token过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复创建） |
| 500 | 服务器内部错误 |

---

## 二、认证授权模块

### 2.1 用户注册

**接口**: `POST /auth/register`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "Password123!",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "name": "张三",
  "userType": "operator",
  "siteId": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-20字符 |
| password | string | 是 | 密码，8-20字符，需包含大小写字母、数字 |
| email | string | 否 | 邮箱地址 |
| phone | string | 否 | 手机号码 |
| name | string | 是 | 真实姓名 |
| userType | string | 是 | 用户类型：admin/operator/driver/quality/manager |
| siteId | number | 是 | 所属站点ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "name": "张三",
    "userType": "operator",
    "siteId": 1,
    "createdAt": "2026-02-05T10:30:00.000Z"
  },
  "message": "注册成功"
}
```

### 2.2 用户登录

**接口**: `POST /auth/login`

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "Password123!"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "zhangsan",
      "name": "张三",
      "userType": "operator",
      "siteId": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "登录成功"
}
```

### 2.3 获取用户信息

**接口**: `GET /auth/profile`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "name": "张三",
    "userType": "operator",
    "department": "生产部",
    "position": "操作员",
    "siteId": 1,
    "siteName": "杭州总站",
    "roles": ["operator"],
    "permissions": ["production:read", "production:write"]
  }
}
```

### 2.4 修改密码

**接口**: `PATCH /auth/change-password`

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

---

## 三、物料管理模块

### 3.1 创建物料

**接口**: `POST /materials`

**请求体**:
```json
{
  "name": "P.O 42.5水泥",
  "type": "cement",
  "specification": "普通硅酸盐水泥42.5",
  "unit": "吨",
  "supplier": "海螺水泥",
  "lowThreshold": 50,
  "unitPrice": 450,
  "siteId": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 物料名称 |
| type | string | 是 | 类型：aggregate/cement/additive/water |
| specification | string | 否 | 规格型号 |
| unit | string | 是 | 计量单位 |
| supplier | string | 否 | 供应商 |
| lowThreshold | number | 否 | 低库存阈值 |
| unitPrice | number | 否 | 单价 |
| siteId | number | 是 | 站点ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "P.O 42.5水泥",
    "type": "cement",
    "specification": "普通硅酸盐水泥42.5",
    "unit": "吨",
    "supplier": "海螺水泥",
    "lowThreshold": 50,
    "unitPrice": 450,
    "siteId": 1,
    "createdAt": "2026-02-05T10:30:00.000Z"
  },
  "message": "创建成功"
}
```

### 3.2 查询物料列表

**接口**: `GET /materials`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| type | string | 否 | 物料类型筛选 |
| siteId | number | 否 | 站点ID筛选 |
| search | string | 否 | 搜索关键词（名称/规格） |

**请求示例**:
```
GET /materials?page=1&limit=10&type=cement&siteId=1
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "P.O 42.5水泥",
        "type": "cement",
        "unit": "吨",
        "currentStock": 120.5,
        "lowThreshold": 50,
        "status": "normal"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 3.3 获取物料详情

**接口**: `GET /materials/:id`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "P.O 42.5水泥",
    "type": "cement",
    "specification": "普通硅酸盐水泥42.5",
    "unit": "吨",
    "supplier": "海螺水泥",
    "lowThreshold": 50,
    "unitPrice": 450,
    "siteId": 1,
    "stock": {
      "currentStock": 120.5,
      "capacity": 500,
      "percentage": 24.1,
      "lastUpdate": "2026-02-05T10:00:00.000Z"
    },
    "recentTransactions": [
      {
        "id": 1,
        "type": "inbound",
        "quantity": 50,
        "date": "2026-02-05T09:00:00.000Z"
      }
    ]
  }
}
```

### 3.4 更新物料

**接口**: `PATCH /materials/:id`

**请求体**:
```json
{
  "lowThreshold": 60,
  "unitPrice": 460
}
```

### 3.5 删除物料

**接口**: `DELETE /materials/:id`

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

### 3.6 低库存预警

**接口**: `GET /materials/low-stock`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "P.O 42.5水泥",
      "currentStock": 45,
      "lowThreshold": 50,
      "percentage": 9,
      "urgency": "high"
    }
  ]
}
```

---

## 四、库存管理模块

### 4.1 记录出入库

**接口**: `POST /inventory/transactions`

**请求体**:
```json
{
  "materialId": 1,
  "transactionType": "inbound",
  "quantity": 50,
  "unitPrice": 450,
  "supplier": "海螺水泥",
  "batchNumber": "20260205001",
  "transactionDate": "2026-02-05T10:00:00.000Z",
  "siteId": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| materialId | number | 是 | 物料ID |
| transactionType | string | 是 | 类型：inbound/outbound/adjustment/transfer |
| quantity | number | 是 | 数量（正数为增加，负数为减少） |
| unitPrice | number | 否 | 单价 |
| supplier | string | 否 | 供应商（入库时） |
| batchNumber | string | 否 | 批次号 |
| purpose | string | 否 | 用途说明（出库时） |
| transactionDate | string | 是 | 变动日期 |
| siteId | number | 是 | 站点ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "materialId": 1,
    "transactionType": "inbound",
    "quantity": 50,
    "beforeStock": 70.5,
    "afterStock": 120.5,
    "createdAt": "2026-02-05T10:00:00.000Z"
  },
  "message": "记录成功"
}
```

### 4.2 查询库存变动记录

**接口**: `GET /inventory/transactions`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| materialId | number | 否 | 物料ID |
| type | string | 否 | 变动类型 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

## 五、订单管理模块

### 5.1 创建订单

**接口**: `POST /orders`

**请求体**:
```json
{
  "customerName": "XX建筑公司",
  "contactPhone": "13800138000",
  "concreteGrade": "C30",
  "totalVolume": 100,
  "unitPrice": 350,
  "deliveryAddress": "杭州市西湖区XX路XX号",
  "requiredDate": "2026-02-06T08:00:00.000Z",
  "siteId": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-HZ-20260205-001",
    "customerName": "XX建筑公司",
    "concreteGrade": "C30",
    "totalVolume": 100,
    "unitPrice": 350,
    "totalAmount": 35000,
    "status": "pending",
    "createdAt": "2026-02-05T10:30:00.000Z"
  },
  "message": "订单创建成功"
}
```

### 5.2 查询订单列表

**接口**: `GET /orders`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| customerName | string | 否 | 客户名称搜索 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

### 5.3 更新订单状态

**接口**: `PATCH /orders/:id/status`

**请求体**:
```json
{
  "status": "confirmed"
}
```

**状态流转**:
```
pending → confirmed → in_progress → completed
                ↓
            cancelled
```

### 5.4 订单统计

**接口**: `GET /orders/statistics`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| siteId | number | 否 | 站点ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalVolume": 15000,
    "totalAmount": 5250000,
    "byStatus": {
      "pending": 10,
      "confirmed": 20,
      "in_progress": 30,
      "completed": 85,
      "cancelled": 5
    },
    "byGrade": {
      "C20": 3000,
      "C25": 4500,
      "C30": 6000,
      "C35": 1500
    },
    "topCustomers": [
      {
        "name": "XX建筑公司",
        "orderCount": 25,
        "totalVolume": 2500
      }
    ]
  }
}
```

---

## 六、生产管理模块

### 6.1 创建生产批次

**接口**: `POST /production/batches`

**请求体**:
```json
{
  "taskId": 1,
  "recipeId": 1,
  "concreteGrade": "C30",
  "volume": 10,
  "equipmentId": 1,
  "siteId": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batchNumber": "BATCH-20260205-001",
    "concreteGrade": "C30",
    "volume": 10,
    "status": "producing",
    "productionTime": "2026-02-05T10:30:00.000Z"
  }
}
```

### 6.2 开始生产

**接口**: `POST /production/batches/:id/start`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "producing",
    "startedAt": "2026-02-05T10:30:00.000Z"
  }
}
```

### 6.3 完成生产

**接口**: `POST /production/batches/:id/complete`

**请求体**:
```json
{
  "actualVolume": 10.2,
  "qualityScore": 95
}
```

### 6.4 记录配料数据

**接口**: `POST /production/batches/:id/batching`

**请求体**:
```json
{
  "materialId": 1,
  "targetWeight": 350,
  "actualWeight": 352,
  "deviation": 0.57
}
```

### 6.5 生产统计

**接口**: `GET /production/statistics`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| siteId | number | 否 | 站点ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalBatches": 500,
    "totalVolume": 5000,
    "avgQualityScore": 94.5,
    "byGrade": {
      "C20": 1000,
      "C25": 1500,
      "C30": 2000,
      "C35": 500
    },
    "hourlyProduction": [
      { "hour": "08:00", "volume": 200 },
      { "hour": "09:00", "volume": 250 }
    ]
  }
}
```

---

## 七、告警管理模块

### 7.1 创建告警

**接口**: `POST /alarms`

**请求体**:
```json
{
  "alarmType": "material_low",
  "source": "料仓1",
  "message": "水泥库存不足，当前9.5%",
  "severity": "warning",
  "siteId": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| alarmType | string | 是 | 告警类型 |
| source | string | 是 | 告警源 |
| message | string | 是 | 告警信息 |
| severity | string | 是 | 级别：critical/warning/info |
| siteId | number | 是 | 站点ID |

### 7.2 查询告警列表

**接口**: `GET /alarms`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| severity | string | 否 | 级别筛选 |
| acknowledged | boolean | 否 | 是否已确认 |
| resolved | boolean | 否 | 是否已解决 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 7.3 确认告警

**接口**: `PATCH /alarms/:id/acknowledge`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "acknowledged": true,
    "acknowledgedBy": 1,
    "acknowledgedAt": "2026-02-05T10:35:00.000Z"
  }
}
```

### 7.4 解决告警

**接口**: `PATCH /alarms/:id/resolve`

**请求体**:
```json
{
  "solution": "已补充水泥库存50吨"
}
```

---

## 八、WebSocket实时通信

### 8.1 连接

**URL**: `ws://localhost:3001`

**认证**: 连接时传递Token
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 8.2 订阅房间

**事件**: `subscribe`

**数据**:
```json
{
  "room": "site_1",
  "events": ["alarm", "production", "queue"]
}
```

### 8.3 接收事件

**告警事件**: `alarm:new`
```json
{
  "id": 1,
  "type": "material_low",
  "severity": "warning",
  "message": "水泥库存不足",
  "timestamp": "2026-02-05T10:30:00.000Z"
}
```

**生产事件**: `production:update`
```json
{
  "batchId": 1,
  "status": "completed",
  "volume": 10.2
}
```

**排队事件**: `queue:update`
```json
{
  "queueId": 1,
  "queueNumber": 5,
  "status": "loading"
}
```

---

## 九、错误码说明

| 错误码 | 说明 |
|-------|------|
| VALIDATION_ERROR | 参数验证失败 |
| UNAUTHORIZED | 未授权 |
| FORBIDDEN | 无权限 |
| NOT_FOUND | 资源不存在 |
| CONFLICT | 资源冲突 |
| INTERNAL_ERROR | 服务器内部错误 |
| DATABASE_ERROR | 数据库错误 |
| NETWORK_ERROR | 网络错误 |

---

**文档版本**: V1.0  
**最后更新**: 2026年2月5日

