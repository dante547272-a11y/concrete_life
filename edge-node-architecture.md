# 边缘计算节点架构设计

## 📁 项目结构

```
concrete-plant-edge/
├── src/
│   ├── plc/                    # PLC通信模块
│   │   ├── modbus/            # Modbus通信
│   │   ├── opcua/             # OPC-UA通信
│   │   └── ethernet-ip/       # Ethernet/IP通信
│   ├── controllers/           # 本地控制逻辑
│   │   ├── mixer.controller.ts      # 搅拌机控制
│   │   ├── weighing.controller.ts   # 计量控制
│   │   └── conveyor.controller.ts   # 输送控制
│   ├── services/              # 业务服务
│   │   ├── data-collector.service.ts  # 数据采集
│   │   ├── local-storage.service.ts   # 本地存储
│   │   ├── sync.service.ts           # 数据同步
│   │   └── safety.service.ts         # 安全控制
│   ├── gateway/               # 云端通信网关
│   │   ├── websocket.gateway.ts     # WebSocket通信
│   │   └── http.gateway.ts          # HTTP通信
│   └── web/                   # 本地Web界面
│       ├── dashboard/         # 本地仪表板
│       └── control/           # 本地控制界面
├── config/
│   ├── plc.config.ts         # PLC配置
│   ├── device.config.ts      # 设备配置
│   └── sync.config.ts        # 同步配置
├── docker/
│   ├── Dockerfile            # Docker镜像
│   └── docker-compose.yml    # 容器编排
└── scripts/
    ├── install.sh            # 安装脚本
    └── update.sh             # 更新脚本
```

## 🔧 PLC通信实现

### Modbus TCP通信示例

```typescript
// src/plc/modbus/modbus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import ModbusRTU from 'modbus-serial';

@Injectable()
export class ModbusService {
  private readonly logger = new Logger(ModbusService.name);
  private client: ModbusRTU;
  private isConnected = false;

  constructor() {
    this.client = new ModbusRTU();
  }

  async connect(host: string, port: number = 502) {
    try {
      await this.client.connectTCP(host, { port });
      this.client.setID(1);
      this.isConnected = true;
      this.logger.log(`Modbus连接成功: ${host}:${port}`);
    } catch (error) {
      this.logger.error(`Modbus连接失败: ${error.message}`);
      throw error;
    }
  }

  async readHoldingRegisters(address: number, length: number) {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      const data = await this.client.readHoldingRegisters(address, length);
      return data.data;
    } catch (error) {
      this.logger.error(`读取保持寄存器失败: ${error.message}`);
      throw error;
    }
  }

  async writeRegister(address: number, value: number) {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      await this.client.writeRegister(address, value);
      this.logger.debug(`写入寄存器成功: 地址${address}, 值${value}`);
    } catch (error) {
      this.logger.error(`写入寄存器失败: ${error.message}`);
      throw error;
    }
  }
}
```

### OPC-UA通信示例

```typescript
// src/plc/opcua/opcua.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OPCUAClient, MessageSecurityMode, SecurityPolicy } from 'node-opcua';

@Injectable()
export class OpcuaService {
  private readonly logger = new Logger(OpcuaService.name);
  private client: OPCUAClient;
  private session: any;

  constructor() {
    this.client = OPCUAClient.create({
      applicationName: 'ConcreteEdgeNode',
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 1
      },
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      endpoint_must_exist: false,
    });
  }

  async connect(endpointUrl: string) {
    try {
      await this.client.connect(endpointUrl);
      this.session = await this.client.createSession();
      this.logger.log(`OPC-UA连接成功: ${endpointUrl}`);
    } catch (error) {
      this.logger.error(`OPC-UA连接失败: ${error.message}`);
      throw error;
    }
  }

  async readVariable(nodeId: string) {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const dataValue = await this.session.readVariableValue(nodeId);
      return dataValue.value.value;
    } catch (error) {
      this.logger.error(`读取变量失败: ${error.message}`);
      throw error;
    }
  }

  async writeVariable(nodeId: string, value: any) {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      await this.session.writeSingleNode(nodeId, value);
      this.logger.debug(`写入变量成功: ${nodeId} = ${value}`);
    } catch (error) {
      this.logger.error(`写入变量失败: ${error.message}`);
      throw error;
    }
  }
}
```

## 📊 数据采集服务

```typescript
// src/services/data-collector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModbusService } from '../plc/modbus/modbus.service';
import { LocalStorageService } from './local-storage.service';
import { SyncService } from './sync.service';

@Injectable()
export class DataCollectorService {
  private readonly logger = new Logger(DataCollectorService.name);

  constructor(
    private readonly modbusService: ModbusService,
    private readonly localStorage: LocalStorageService,
    private readonly syncService: SyncService,
  ) {}

  // 每秒采集一次实时数据
  @Cron(CronExpression.EVERY_SECOND)
  async collectRealTimeData() {
    try {
      const data = {
        timestamp: new Date(),
        mixer: {
          status: await this.modbusService.readHoldingRegisters(1000, 1),
          speed: await this.modbusService.readHoldingRegisters(1001, 1),
          current: await this.modbusService.readHoldingRegisters(1002, 1),
          temperature: await this.modbusService.readHoldingRegisters(1003, 1),
        },
        weighing: {
          cement: await this.modbusService.readHoldingRegisters(2000, 1),
          water: await this.modbusService.readHoldingRegisters(2001, 1),
          aggregate: await this.modbusService.readHoldingRegisters(2002, 1),
          additive: await this.modbusService.readHoldingRegisters(2003, 1),
        },
        conveyor: {
          belt1_speed: await this.modbusService.readHoldingRegisters(3000, 1),
          belt2_speed: await this.modbusService.readHoldingRegisters(3001, 1),
        }
      };

      // 本地存储
      await this.localStorage.saveRealTimeData(data);

      // 检查告警
      await this.checkAlarms(data);

      // 推送到云端（如果连接）
      await this.syncService.pushRealTimeData(data);

    } catch (error) {
      this.logger.error(`数据采集失败: ${error.message}`);
    }
  }

  // 每分钟采集一次统计数据
  @Cron(CronExpression.EVERY_MINUTE)
  async collectStatisticsData() {
    try {
      const stats = {
        timestamp: new Date(),
        production: {
          batches_today: await this.localStorage.getTodayBatches(),
          volume_today: await this.localStorage.getTodayVolume(),
          efficiency: await this.calculateEfficiency(),
        },
        equipment: {
          mixer_runtime: await this.localStorage.getMixerRuntime(),
          maintenance_alerts: await this.localStorage.getMaintenanceAlerts(),
        }
      };

      await this.localStorage.saveStatisticsData(stats);
      await this.syncService.pushStatisticsData(stats);

    } catch (error) {
      this.logger.error(`统计数据采集失败: ${error.message}`);
    }
  }

  private async checkAlarms(data: any) {
    // 检查设备告警
    if (data.mixer.temperature > 80) {
      await this.localStorage.createAlarm({
        type: 'equipment_overheat',
        source: 'mixer',
        message: `搅拌机温度过高: ${data.mixer.temperature}°C`,
        severity: 'critical',
        timestamp: new Date(),
      });
    }

    // 检查计量告警
    if (data.weighing.cement < 10) {
      await this.localStorage.createAlarm({
        type: 'material_low',
        source: 'cement_silo',
        message: `水泥余量不足: ${data.weighing.cement}吨`,
        severity: 'warning',
        timestamp: new Date(),
      });
    }
  }

  private async calculateEfficiency(): Promise<number> {
    // 计算设备运行效率
    const runtime = await this.localStorage.getMixerRuntime();
    const totalTime = 24 * 60; // 一天总分钟数
    return (runtime / totalTime) * 100;
  }
}
```

## 🔄 数据同步服务

```typescript
// src/services/sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: true })
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isOnline = false;
  private syncQueue: any[] = [];

  @WebSocketServer()
  server: Server;

  constructor(private readonly httpService: HttpService) {
    this.checkConnection();
    setInterval(() => this.checkConnection(), 30000); // 每30秒检查连接
  }

  async pushRealTimeData(data: any) {
    if (this.isOnline) {
      try {
        // 实时推送到云端
        this.server.emit('realtime-data', data);
        
        // HTTP API备份
        await this.httpService.post('/api/edge/realtime', data).toPromise();
      } catch (error) {
        this.logger.warn(`实时数据推送失败，加入队列: ${error.message}`);
        this.addToQueue('realtime', data);
      }
    } else {
      this.addToQueue('realtime', data);
    }
  }

  async pushStatisticsData(data: any) {
    if (this.isOnline) {
      try {
        await this.httpService.post('/api/edge/statistics', data).toPromise();
      } catch (error) {
        this.logger.warn(`统计数据推送失败，加入队列: ${error.message}`);
        this.addToQueue('statistics', data);
      }
    } else {
      this.addToQueue('statistics', data);
    }
  }

  private async checkConnection() {
    try {
      const response = await this.httpService.get('/api/health').toPromise();
      if (response.status === 200) {
        if (!this.isOnline) {
          this.logger.log('云端连接恢复，开始同步队列数据');
          await this.syncQueuedData();
        }
        this.isOnline = true;
      }
    } catch (error) {
      if (this.isOnline) {
        this.logger.warn('云端连接断开，切换到离线模式');
      }
      this.isOnline = false;
    }
  }

  private addToQueue(type: string, data: any) {
    this.syncQueue.push({ type, data, timestamp: new Date() });
    
    // 限制队列大小，避免内存溢出
    if (this.syncQueue.length > 10000) {
      this.syncQueue = this.syncQueue.slice(-5000); // 保留最新5000条
    }
  }

  private async syncQueuedData() {
    const batchSize = 100;
    while (this.syncQueue.length > 0 && this.isOnline) {
      const batch = this.syncQueue.splice(0, batchSize);
      
      try {
        await this.httpService.post('/api/edge/batch-sync', batch).toPromise();
        this.logger.log(`同步队列数据成功: ${batch.length}条`);
      } catch (error) {
        this.logger.error(`队列数据同步失败: ${error.message}`);
        // 重新加入队列头部
        this.syncQueue.unshift(...batch);
        break;
      }
    }
  }
}
```

## 🛡️ 安全控制服务

```typescript
// src/services/safety.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ModbusService } from '../plc/modbus/modbus.service';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);
  private emergencyStop = false;

  constructor(private readonly modbusService: ModbusService) {}

  async emergencyStopAll() {
    this.logger.warn('执行紧急停机');
    this.emergencyStop = true;

    try {
      // 停止搅拌机
      await this.modbusService.writeRegister(1000, 0);
      
      // 停止输送带
      await this.modbusService.writeRegister(3000, 0);
      await this.modbusService.writeRegister(3001, 0);
      
      // 关闭所有阀门
      await this.modbusService.writeRegister(4000, 0);
      
      this.logger.log('紧急停机完成');
    } catch (error) {
      this.logger.error(`紧急停机失败: ${error.message}`);
      throw error;
    }
  }

  async resetEmergencyStop() {
    this.logger.log('重置紧急停机状态');
    this.emergencyStop = false;
  }

  isEmergencyStop(): boolean {
    return this.emergencyStop;
  }

  async checkSafetyConditions(): Promise<boolean> {
    try {
      // 检查安全门状态
      const safetyDoor = await this.modbusService.readHoldingRegisters(5000, 1);
      if (safetyDoor[0] === 0) {
        this.logger.warn('安全门未关闭');
        return false;
      }

      // 检查急停按钮状态
      const emergencyButton = await this.modbusService.readHoldingRegisters(5001, 1);
      if (emergencyButton[0] === 1) {
        this.logger.warn('急停按钮被按下');
        return false;
      }

      // 检查设备温度
      const temperature = await this.modbusService.readHoldingRegisters(1003, 1);
      if (temperature[0] > 90) {
        this.logger.warn(`设备温度过高: ${temperature[0]}°C`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`安全检查失败: ${error.message}`);
      return false;
    }
  }
}
```

## 🐳 Docker部署配置

```dockerfile
# docker/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置权限
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  edge-node:
    build: .
    container_name: concrete-edge-node
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "502:502"   # Modbus TCP
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/edge.db
      - CENTRAL_SERVER_URL=https://central.concrete-plant.com
      - SITE_ID=1
    networks:
      - plant-network
    devices:
      - "/dev/ttyUSB0:/dev/ttyUSB0"  # 串口设备（如果需要）

  redis:
    image: redis:7-alpine
    container_name: concrete-edge-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - plant-network

volumes:
  redis-data:

networks:
  plant-network:
    driver: bridge
```

## 📋 安装部署脚本

```bash
#!/bin/bash
# scripts/install.sh

echo "🚀 开始安装混凝土搅拌站边缘计算节点..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建目录结构
mkdir -p data logs config

# 复制配置文件
cp config/plc.config.example.ts config/plc.config.ts
cp config/device.config.example.ts config/device.config.ts

echo "📝 请编辑配置文件："
echo "   - config/plc.config.ts (PLC连接配置)"
echo "   - config/device.config.ts (设备配置)"
echo ""

read -p "配置完成后按回车继续..." -r

# 构建和启动服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

echo "✅ 安装完成！"
echo "🌐 本地访问地址: http://localhost:3000"
echo "📊 查看日志: docker-compose logs -f"
echo "🔧 管理服务: docker-compose [start|stop|restart]"
```