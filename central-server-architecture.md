# 集中监控服务器架构设计

## 🏗️ 架构扩展

在现有的 `concrete-plant-api` 基础上，扩展以下模块：

```
concrete-plant-api/
├── src/
│   ├── edge/                   # 边缘节点管理
│   │   ├── edge.module.ts
│   │   ├── edge.controller.ts
│   │   ├── edge.service.ts
│   │   └── edge.gateway.ts
│   ├── realtime/              # 实时数据处理
│   │   ├── realtime.module.ts
│   │   ├── realtime.service.ts
│   │   └── timeseries.service.ts
│   ├── remote-control/        # 远程控制
│   │   ├── control.module.ts
│   │   ├── control.controller.ts
│   │   └── control.service.ts
│   ├── analytics/             # 数据分析
│   │   ├── analytics.module.ts
│   │   ├── analytics.service.ts
│   │   └── report.service.ts
│   └── notification/          # 通知服务
│       ├── notification.module.ts
│       ├── notification.service.ts
│       ├── email.service.ts
│       ├── sms.service.ts
│       └── websocket.service.ts
```

## 🔄 边缘节点管理模块

```typescript
// src/edge/edge.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ 
  cors: true,
  namespace: '/edge'
})
export class EdgeService {
  private readonly logger = new Logger(EdgeService.name);
  private connectedNodes = new Map<string, any>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly db: DatabaseService) {}

  // 边缘节点注册
  async registerEdgeNode(nodeId: string, nodeInfo: any) {
    this.connectedNodes.set(nodeId, {
      ...nodeInfo,
      lastHeartbeat: new Date(),
      status: 'online'
    });

    // 更新数据库中的节点状态
    await this.db.site.update({
      where: { id: parseInt(nodeId) },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    });

    this.logger.log(`边缘节点注册: ${nodeId}`);
  }

  // 处理边缘节点心跳
  async handleHeartbeat(nodeId: string) {
    const node = this.connectedNodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = new Date();
      node.status = 'online';
    }
  }

  // 接收实时数据
  async receiveRealTimeData(nodeId: string, data: any) {
    try {
      // 存储到时序数据库
      await this.storeTimeSeriesData(nodeId, data);

      // 广播给前端
      this.server.emit('realtime-update', {
        siteId: nodeId,
        data: data,
        timestamp: new Date()
      });

      // 检查告警
      await this.checkAlarms(nodeId, data);

    } catch (error) {
      this.logger.error(`处理实时数据失败: ${error.message}`);
    }
  }

  // 批量同步离线数据
  async syncBatchData(nodeId: string, batchData: any[]) {
    try {
      for (const item of batchData) {
        await this.storeTimeSeriesData(nodeId, item.data);
      }
      
      this.logger.log(`批量同步完成: 节点${nodeId}, ${batchData.length}条数据`);
    } catch (error) {
      this.logger.error(`批量同步失败: ${error.message}`);
      throw error;
    }
  }

  // 发送远程控制指令
  async sendControlCommand(nodeId: string, command: any) {
    const node = this.connectedNodes.get(nodeId);
    if (!node || node.status !== 'online') {
      throw new Error(`节点${nodeId}离线，无法发送指令`);
    }

    try {
      // 通过WebSocket发送指令
      this.server.to(nodeId).emit('control-command', command);
      
      // 记录操作日志
      await this.db.operationLog.create({
        data: {
          module: 'remote_control',
          action: 'send_command',
          target: nodeId,
          detail: JSON.stringify(command),
          siteId: parseInt(nodeId),
          timestamp: new Date()
        }
      });

      this.logger.log(`发送控制指令: 节点${nodeId}, 指令${command.type}`);
    } catch (error) {
      this.logger.error(`发送控制指令失败: ${error.message}`);
      throw error;
    }
  }

  // 获取节点状态
  getNodeStatus(nodeId: string) {
    return this.connectedNodes.get(nodeId) || { status: 'offline' };
  }

  // 获取所有节点状态
  getAllNodesStatus() {
    const status = {};
    this.connectedNodes.forEach((node, nodeId) => {
      status[nodeId] = {
        status: node.status,
        lastHeartbeat: node.lastHeartbeat,
        info: node
      };
    });
    return status;
  }

  private async storeTimeSeriesData(nodeId: string, data: any) {
    // 这里可以集成InfluxDB或其他时序数据库
    // 暂时存储到PostgreSQL
    await this.db.equipmentMetric.create({
      data: {
        equipmentId: data.equipmentId || 1,
        currentValue: data.mixer?.current?.[0],
        vibrationValue: data.mixer?.vibration?.[0],
        temperatureValue: data.mixer?.temperature?.[0],
        recordedAt: new Date(data.timestamp)
      }
    });
  }

  private async checkAlarms(nodeId: string, data: any) {
    // 检查集中告警规则
    const rules = await this.db.alarmRule.findMany({
      where: { 
        siteId: parseInt(nodeId),
        enabled: true 
      }
    });

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions);
      if (this.evaluateAlarmCondition(data, conditions)) {
        await this.createAlarm(nodeId, rule, data);
      }
    }
  }

  private evaluateAlarmCondition(data: any, conditions: any): boolean {
    // 简单的条件评估逻辑
    if (conditions.temperature && data.mixer?.temperature?.[0] > conditions.temperature) {
      return true;
    }
    if (conditions.current && data.mixer?.current?.[0] > conditions.current) {
      return true;
    }
    return false;
  }

  private async createAlarm(nodeId: string, rule: any, data: any) {
    await this.db.alarm.create({
      data: {
        alarmType: rule.ruleType,
        source: `edge_node_${nodeId}`,
        message: rule.messageTemplate || '设备异常',
        severity: 'warning',
        siteId: parseInt(nodeId),
        timestamp: new Date()
      }
    });
  }
}
```

## 📊 实时数据处理模块

```typescript
// src/realtime/realtime.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ 
  cors: true,
  namespace: '/realtime'
})
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private dataBuffer = new Map<string, any[]>();

  @WebSocketServer()
  server: Server;

  // 处理实时数据流
  async processRealtimeData(siteId: string, data: any) {
    // 数据缓冲
    if (!this.dataBuffer.has(siteId)) {
      this.dataBuffer.set(siteId, []);
    }
    
    const buffer = this.dataBuffer.get(siteId);
    buffer.push({
      ...data,
      timestamp: new Date()
    });

    // 保持缓冲区大小
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 500);
    }

    // 实时推送给前端
    this.server.emit('data-update', {
      siteId,
      data,
      timestamp: new Date()
    });

    // 数据聚合和分析
    await this.aggregateData(siteId, data);
  }

  // 获取实时数据
  getRealtimeData(siteId: string, limit: number = 100) {
    const buffer = this.dataBuffer.get(siteId) || [];
    return buffer.slice(-limit);
  }

  // 数据聚合
  private async aggregateData(siteId: string, data: any) {
    // 计算1分钟平均值
    const buffer = this.dataBuffer.get(siteId) || [];
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    const recentData = buffer.filter(item => 
      new Date(item.timestamp) > oneMinuteAgo
    );

    if (recentData.length > 0) {
      const avgTemperature = recentData.reduce((sum, item) => 
        sum + (item.mixer?.temperature?.[0] || 0), 0
      ) / recentData.length;

      const avgCurrent = recentData.reduce((sum, item) => 
        sum + (item.mixer?.current?.[0] || 0), 0
      ) / recentData.length;

      // 推送聚合数据
      this.server.emit('aggregated-data', {
        siteId,
        avgTemperature,
        avgCurrent,
        timestamp: new Date()
      });
    }
  }
}
```

## 🎮 远程控制模块

```typescript
// src/remote-control/control.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EdgeService } from '../edge/edge.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ControlService {
  private readonly logger = new Logger(ControlService.name);

  constructor(
    private readonly edgeService: EdgeService,
    private readonly db: DatabaseService
  ) {}

  // 远程启动生产
  async startProduction(siteId: string, recipeId: number, userId: number) {
    try {
      // 检查权限
      await this.checkPermission(userId, siteId, 'production.start');

      // 获取配方
      const recipe = await this.db.recipe.findUnique({
        where: { id: recipeId },
        include: { recipeItems: { include: { material: true } } }
      });

      if (!recipe) {
        throw new Error('配方不存在');
      }

      // 发送启动指令
      const command = {
        type: 'start_production',
        recipe: recipe,
        timestamp: new Date(),
        operator: userId
      };

      await this.edgeService.sendControlCommand(siteId, command);

      // 创建生产批次记录
      await this.db.productionBatch.create({
        data: {
          batchNumber: this.generateBatchNumber(),
          recipeId: recipeId,
          concreteGrade: recipe.concreteGrade,
          volume: 1.0, // 默认1方
          operatorId: userId,
          siteId: parseInt(siteId),
          status: 'producing'
        }
      });

      this.logger.log(`远程启动生产: 站点${siteId}, 配方${recipeId}`);
    } catch (error) {
      this.logger.error(`远程启动生产失败: ${error.message}`);
      throw error;
    }
  }

  // 远程停止生产
  async stopProduction(siteId: string, userId: number) {
    try {
      await this.checkPermission(userId, siteId, 'production.stop');

      const command = {
        type: 'stop_production',
        timestamp: new Date(),
        operator: userId
      };

      await this.edgeService.sendControlCommand(siteId, command);
      this.logger.log(`远程停止生产: 站点${siteId}`);
    } catch (error) {
      this.logger.error(`远程停止生产失败: ${error.message}`);
      throw error;
    }
  }

  // 紧急停机
  async emergencyStop(siteId: string, userId: number) {
    try {
      await this.checkPermission(userId, siteId, 'production.emergency_stop');

      const command = {
        type: 'emergency_stop',
        timestamp: new Date(),
        operator: userId
      };

      await this.edgeService.sendControlCommand(siteId, command);

      // 创建紧急停机告警
      await this.db.alarm.create({
        data: {
          alarmType: 'emergency_stop',
          source: 'remote_control',
          message: `用户${userId}执行了紧急停机`,
          severity: 'critical',
          siteId: parseInt(siteId),
          timestamp: new Date()
        }
      });

      this.logger.warn(`紧急停机: 站点${siteId}, 操作员${userId}`);
    } catch (error) {
      this.logger.error(`紧急停机失败: ${error.message}`);
      throw error;
    }
  }

  // 调整配方参数
  async adjustRecipe(siteId: string, adjustments: any, userId: number) {
    try {
      await this.checkPermission(userId, siteId, 'production.adjust');

      const command = {
        type: 'adjust_recipe',
        adjustments: adjustments,
        timestamp: new Date(),
        operator: userId
      };

      await this.edgeService.sendControlCommand(siteId, command);
      this.logger.log(`调整配方: 站点${siteId}, 调整${JSON.stringify(adjustments)}`);
    } catch (error) {
      this.logger.error(`调整配方失败: ${error.message}`);
      throw error;
    }
  }

  private async checkPermission(userId: number, siteId: string, permission: string) {
    const userRoles = await this.db.userRole.findMany({
      where: {
        userId: userId,
        siteId: parseInt(siteId)
      },
      include: { role: true }
    });

    const hasPermission = userRoles.some(userRole => {
      const permissions = JSON.parse(userRole.role.permissions);
      return permissions.includes('*') || permissions.includes(permission);
    });

    if (!hasPermission) {
      throw new Error('权限不足');
    }
  }

  private generateBatchNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `B${dateStr}${timeStr}`;
  }
}
```

## 📈 数据分析模块

```typescript
// src/analytics/analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly db: DatabaseService) {}

  // 生产效率分析
  async getProductionEfficiency(siteId: number, startDate: Date, endDate: Date) {
    const batches = await this.db.productionBatch.findMany({
      where: {
        siteId: siteId,
        productionTime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalBatches = batches.length;
    const completedBatches = batches.filter(b => b.status === 'completed').length;
    const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);

    return {
      totalBatches,
      completedBatches,
      efficiency: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      totalVolume,
      averageVolume: totalBatches > 0 ? totalVolume / totalBatches : 0
    };
  }

  // 设备健康度分析
  async getEquipmentHealth(siteId: number) {
    const equipment = await this.db.equipment.findMany({
      where: { siteId: siteId },
      include: {
        equipmentMetrics: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      }
    });

    return equipment.map(eq => ({
      id: eq.id,
      name: eq.name,
      type: eq.equipmentType,
      healthScore: eq.healthScore,
      status: eq.status,
      lastMetrics: eq.equipmentMetrics[0] || null
    }));
  }

  // 质量趋势分析
  async getQualityTrend(siteId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const qualityTests = await this.db.qualityTest.findMany({
      where: {
        siteId: siteId,
        testTime: { gte: startDate }
      },
      orderBy: { testTime: 'asc' }
    });

    // 按天分组统计
    const dailyStats = {};
    qualityTests.forEach(test => {
      const day = test.testTime.toISOString().slice(0, 10);
      if (!dailyStats[day]) {
        dailyStats[day] = { total: 0, pass: 0, fail: 0 };
      }
      dailyStats[day].total++;
      if (test.status === 'pass') {
        dailyStats[day].pass++;
      } else {
        dailyStats[day].fail++;
      }
    });

    return Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
      date,
      total: stats.total,
      passRate: (stats.pass / stats.total) * 100,
      failRate: (stats.fail / stats.total) * 100
    }));
  }

  // 成本分析
  async getCostAnalysis(siteId: number, month: string) {
    // 原材料成本
    const materialCosts = await this.db.materialTransaction.aggregate({
      where: {
        siteId: siteId,
        transactionType: 'inbound',
        transactionDate: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-31`)
        }
      },
      _sum: { totalAmount: true }
    });

    // 维护成本
    const maintenanceCosts = await this.db.equipmentMaintenance.aggregate({
      where: {
        siteId: siteId,
        maintenanceDate: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-31`)
        }
      },
      _sum: { cost: true }
    });

    // 生产收入
    const revenue = await this.db.billingRecord.aggregate({
      where: {
        siteId: siteId,
        deliveryDate: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-31`)
        }
      },
      _sum: { totalAmount: true }
    });

    return {
      materialCost: materialCosts._sum.totalAmount || 0,
      maintenanceCost: maintenanceCosts._sum.cost || 0,
      revenue: revenue._sum.totalAmount || 0,
      profit: (revenue._sum.totalAmount || 0) - 
              (materialCosts._sum.totalAmount || 0) - 
              (maintenanceCosts._sum.cost || 0)
    };
  }
}
```

## 🔔 通知服务模块

```typescript
// src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WebsocketService } from './websocket.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly websocketService: WebsocketService
  ) {}

  // 发送告警通知
  async sendAlarmNotification(alarm: any) {
    try {
      // 获取订阅用户
      const subscriptions = await this.getAlarmSubscriptions(alarm.alarmType, alarm.siteId);

      for (const subscription of subscriptions) {
        const methods = JSON.parse(subscription.notificationMethods || '[]');

        // 发送邮件通知
        if (methods.includes('email') && subscription.user.email) {
          await this.emailService.sendAlarmEmail(
            subscription.user.email,
            alarm
          );
        }

        // 发送短信通知
        if (methods.includes('sms') && subscription.user.phone) {
          await this.smsService.sendAlarmSms(
            subscription.user.phone,
            alarm
          );
        }

        // 发送WebSocket通知
        if (methods.includes('push')) {
          await this.websocketService.sendNotification(
            subscription.userId,
            alarm
          );
        }
      }

      this.logger.log(`告警通知发送完成: ${alarm.id}`);
    } catch (error) {
      this.logger.error(`发送告警通知失败: ${error.message}`);
    }
  }

  // 发送系统通知
  async sendSystemNotification(type: string, message: string, siteId?: number) {
    try {
      // 系统级通知发送给所有管理员
      const admins = await this.getSystemAdmins(siteId);

      for (const admin of admins) {
        await this.websocketService.sendNotification(admin.id, {
          type: 'system',
          message: message,
          timestamp: new Date()
        });

        if (admin.email) {
          await this.emailService.sendSystemEmail(admin.email, type, message);
        }
      }

      this.logger.log(`系统通知发送完成: ${type}`);
    } catch (error) {
      this.logger.error(`发送系统通知失败: ${error.message}`);
    }
  }

  private async getAlarmSubscriptions(alarmType: string, siteId: number) {
    // 实现获取告警订阅逻辑
    return [];
  }

  private async getSystemAdmins(siteId?: number) {
    // 实现获取系统管理员逻辑
    return [];
  }
}
```