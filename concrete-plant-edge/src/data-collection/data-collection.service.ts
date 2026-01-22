import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlcService } from '../plc/plc.service';
import { DatabaseService } from '../database/database.service';
import { SyncService } from '../sync/sync.service';

export interface CollectedData {
  timestamp: Date;
  mixer: {
    status: number;
    speed: number;
    current: number;
    temperature: number;
    vibration: number;
  };
  weighing: {
    cement: number;
    water: number;
    aggregate1: number;
    aggregate2: number;
    additive: number;
  };
  conveyor: {
    belt1_speed: number;
    belt2_speed: number;
    belt1_status: boolean;
    belt2_status: boolean;
  };
  silo: {
    cement_level: number;
    aggregate1_level: number;
    aggregate2_level: number;
    additive_level: number;
  };
  system: {
    air_pressure: number;
    water_pressure: number;
    hydraulic_pressure: number;
    emergency_stop: boolean;
    safety_door: boolean;
  };
}

@Injectable()
export class DataCollectionService implements OnModuleInit {
  private readonly logger = new Logger(DataCollectionService.name);
  private isCollecting = false;
  private collectionEnabled = true;
  private dataBuffer: CollectedData[] = [];
  private readonly maxBufferSize = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly databaseService: DatabaseService,
    private readonly syncService: SyncService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 数据采集服务初始化...');
    
    // 初始化数据点配置
    await this.initializeDataPoints();
    
    this.logger.log('✅ 数据采集服务初始化完成');
  }

  /**
   * 初始化数据点配置
   */
  private async initializeDataPoints() {
    const dataPoints = [
      // 搅拌机数据点
      { tagName: 'mixer_status', deviceId: 'modbus_1', address: '1000', dataType: 'int', description: '搅拌机状态' },
      { tagName: 'mixer_speed', deviceId: 'modbus_1', address: '1001', dataType: 'int', description: '搅拌机转速' },
      { tagName: 'mixer_current', deviceId: 'modbus_1', address: '1002', dataType: 'float', description: '搅拌机电流' },
      { tagName: 'mixer_temperature', deviceId: 'modbus_1', address: '1003', dataType: 'float', description: '搅拌机温度' },
      { tagName: 'mixer_vibration', deviceId: 'modbus_1', address: '1004', dataType: 'float', description: '搅拌机振动' },
      
      // 计量系统数据点
      { tagName: 'weight_cement', deviceId: 'modbus_1', address: '2000', dataType: 'float', description: '水泥重量' },
      { tagName: 'weight_water', deviceId: 'modbus_1', address: '2001', dataType: 'float', description: '水重量' },
      { tagName: 'weight_aggregate1', deviceId: 'modbus_1', address: '2002', dataType: 'float', description: '骨料1重量' },
      { tagName: 'weight_aggregate2', deviceId: 'modbus_1', address: '2003', dataType: 'float', description: '骨料2重量' },
      { tagName: 'weight_additive', deviceId: 'modbus_1', address: '2004', dataType: 'float', description: '外加剂重量' },
      
      // 输送系统数据点
      { tagName: 'belt1_speed', deviceId: 'modbus_1', address: '3000', dataType: 'int', description: '皮带1速度' },
      { tagName: 'belt2_speed', deviceId: 'modbus_1', address: '3001', dataType: 'int', description: '皮带2速度' },
      { tagName: 'belt1_status', deviceId: 'modbus_1', address: '3010', dataType: 'bool', description: '皮带1状态' },
      { tagName: 'belt2_status', deviceId: 'modbus_1', address: '3011', dataType: 'bool', description: '皮带2状态' },
      
      // 料仓液位数据点
      { tagName: 'silo_cement_level', deviceId: 'modbus_1', address: '4000', dataType: 'float', description: '水泥仓液位' },
      { tagName: 'silo_aggregate1_level', deviceId: 'modbus_1', address: '4001', dataType: 'float', description: '骨料1仓液位' },
      { tagName: 'silo_aggregate2_level', deviceId: 'modbus_1', address: '4002', dataType: 'float', description: '骨料2仓液位' },
      { tagName: 'silo_additive_level', deviceId: 'modbus_1', address: '4003', dataType: 'float', description: '外加剂仓液位' },
      
      // 系统状态数据点
      { tagName: 'air_pressure', deviceId: 'modbus_1', address: '5000', dataType: 'float', description: '气压' },
      { tagName: 'water_pressure', deviceId: 'modbus_1', address: '5001', dataType: 'float', description: '水压' },
      { tagName: 'hydraulic_pressure', deviceId: 'modbus_1', address: '5002', dataType: 'float', description: '液压' },
      { tagName: 'emergency_stop', deviceId: 'modbus_1', address: '5010', dataType: 'bool', description: '急停状态' },
      { tagName: 'safety_door', deviceId: 'modbus_1', address: '5011', dataType: 'bool', description: '安全门状态' },
    ];

    for (const point of dataPoints) {
      try {
        await this.databaseService.dataPoint.upsert({
          where: {
            tagName_deviceId: {
              tagName: point.tagName,
              deviceId: point.deviceId,
            },
          },
          update: {
            address: point.address,
            dataType: point.dataType,
            description: point.description,
          },
          create: {
            tagName: point.tagName,
            deviceId: point.deviceId,
            address: point.address,
            dataType: point.dataType,
            value: '0',
            description: point.description,
          },
        });
      } catch (error) {
        this.logger.error(`初始化数据点失败: ${point.tagName}`, error);
      }
    }

    this.logger.log(`📊 数据点初始化完成: ${dataPoints.length} 个数据点`);
  }

  /**
   * 实时数据采集 - 每秒执行
   */
  @Cron(CronExpression.EVERY_SECOND)
  async collectRealTimeData() {
    if (!this.collectionEnabled || this.isCollecting) {
      return;
    }

    this.isCollecting = true;

    try {
      const data = await this.collectAllData();
      
      if (data) {
        // 添加到缓冲区
        this.dataBuffer.push(data);
        
        // 限制缓冲区大小
        if (this.dataBuffer.length > this.maxBufferSize) {
          this.dataBuffer = this.dataBuffer.slice(-this.maxBufferSize / 2);
        }

        // 存储到本地数据库
        await this.storeRealTimeData(data);

        // 推送到同步服务
        await this.syncService.pushRealTimeData(data);

        // 检查告警条件
        await this.checkAlarmConditions(data);
      }

    } catch (error) {
      this.logger.error(`实时数据采集失败: ${error.message}`);
      await this.databaseService.logOperation('error', 'data_collection', 'collect_realtime', error.message);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 统计数据采集 - 每分钟执行
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectStatisticsData() {
    try {
      const stats = await this.calculateStatistics();
      
      // 存储统计数据
      await this.storeStatisticsData(stats);
      
      // 推送到同步服务
      await this.syncService.pushStatisticsData(stats);

      this.logger.debug('统计数据采集完成');

    } catch (error) {
      this.logger.error(`统计数据采集失败: ${error.message}`);
    }
  }

  /**
   * 采集所有数据
   */
  private async collectAllData(): Promise<CollectedData | null> {
    try {
      const tagNames = [
        'mixer_status', 'mixer_speed', 'mixer_current', 'mixer_temperature', 'mixer_vibration',
        'weight_cement', 'weight_water', 'weight_aggregate1', 'weight_aggregate2', 'weight_additive',
        'belt1_speed', 'belt2_speed', 'belt1_status', 'belt2_status',
        'silo_cement_level', 'silo_aggregate1_level', 'silo_aggregate2_level', 'silo_additive_level',
        'air_pressure', 'water_pressure', 'hydraulic_pressure', 'emergency_stop', 'safety_door'
      ];

      const dataPoints = await this.plcService.readMultipleDataPoints(tagNames);
      
      if (dataPoints.length === 0) {
        return null;
      }

      // 将数据点转换为结构化数据
      const getValue = (tagName: string, defaultValue: any = 0) => {
        const point = dataPoints.find(p => p.tagName === tagName);
        return point ? point.value : defaultValue;
      };

      const data: CollectedData = {
        timestamp: new Date(),
        mixer: {
          status: getValue('mixer_status', 0),
          speed: getValue('mixer_speed', 0),
          current: getValue('mixer_current', 0),
          temperature: getValue('mixer_temperature', 0),
          vibration: getValue('mixer_vibration', 0),
        },
        weighing: {
          cement: getValue('weight_cement', 0),
          water: getValue('weight_water', 0),
          aggregate1: getValue('weight_aggregate1', 0),
          aggregate2: getValue('weight_aggregate2', 0),
          additive: getValue('weight_additive', 0),
        },
        conveyor: {
          belt1_speed: getValue('belt1_speed', 0),
          belt2_speed: getValue('belt2_speed', 0),
          belt1_status: getValue('belt1_status', false),
          belt2_status: getValue('belt2_status', false),
        },
        silo: {
          cement_level: getValue('silo_cement_level', 0),
          aggregate1_level: getValue('silo_aggregate1_level', 0),
          aggregate2_level: getValue('silo_aggregate2_level', 0),
          additive_level: getValue('silo_additive_level', 0),
        },
        system: {
          air_pressure: getValue('air_pressure', 0),
          water_pressure: getValue('water_pressure', 0),
          hydraulic_pressure: getValue('hydraulic_pressure', 0),
          emergency_stop: getValue('emergency_stop', false),
          safety_door: getValue('safety_door', false),
        },
      };

      return data;

    } catch (error) {
      this.logger.error(`采集数据失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 存储实时数据
   */
  private async storeRealTimeData(data: CollectedData) {
    // 这里可以选择性存储关键数据点的历史记录
    // 避免存储所有数据导致数据库过大
    
    const keyDataPoints = [
      { tag: 'mixer_temperature', value: data.mixer.temperature },
      { tag: 'mixer_current', value: data.mixer.current },
      { tag: 'weight_cement', value: data.weighing.cement },
      { tag: 'weight_water', value: data.weighing.water },
      { tag: 'silo_cement_level', value: data.silo.cement_level },
    ];

    for (const point of keyDataPoints) {
      try {
        const dataPoint = await this.databaseService.dataPoint.findFirst({
          where: { tagName: point.tag },
        });

        if (dataPoint) {
          await this.databaseService.dataHistory.create({
            data: {
              pointId: dataPoint.id,
              value: point.value.toString(),
              quality: 'good',
              timestamp: data.timestamp,
            },
          });
        }
      } catch (error) {
        this.logger.error(`存储历史数据失败: ${point.tag}`, error);
      }
    }
  }

  /**
   * 计算统计数据
   */
  private async calculateStatistics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 从缓冲区获取最近一小时的数据
    const recentData = this.dataBuffer.filter(d => d.timestamp > oneHourAgo);

    if (recentData.length === 0) {
      return null;
    }

    // 计算平均值
    const avgTemperature = recentData.reduce((sum, d) => sum + d.mixer.temperature, 0) / recentData.length;
    const avgCurrent = recentData.reduce((sum, d) => sum + d.mixer.current, 0) / recentData.length;
    const avgSpeed = recentData.reduce((sum, d) => sum + d.mixer.speed, 0) / recentData.length;

    // 计算运行时间
    const runningTime = recentData.filter(d => d.mixer.status > 0).length;
    const efficiency = (runningTime / recentData.length) * 100;

    return {
      timestamp: now,
      period: '1hour',
      mixer: {
        avgTemperature,
        avgCurrent,
        avgSpeed,
        runningTime,
        efficiency,
      },
      dataPoints: recentData.length,
    };
  }

  /**
   * 存储统计数据
   */
  private async storeStatisticsData(stats: any) {
    if (!stats) return;

    try {
      // 这里可以存储到专门的统计表
      await this.databaseService.logOperation(
        'info',
        'data_collection',
        'statistics',
        '统计数据计算完成',
        stats
      );
    } catch (error) {
      this.logger.error('存储统计数据失败:', error);
    }
  }

  /**
   * 检查告警条件
   */
  private async checkAlarmConditions(data: CollectedData) {
    const alarms = [];

    // 温度告警
    if (data.mixer.temperature > 80) {
      alarms.push({
        alarmType: 'equipment_overheat',
        source: 'mixer',
        message: `搅拌机温度过高: ${data.mixer.temperature}°C`,
        severity: 'critical',
      });
    }

    // 电流告警
    if (data.mixer.current > 100) {
      alarms.push({
        alarmType: 'equipment_overcurrent',
        source: 'mixer',
        message: `搅拌机电流过大: ${data.mixer.current}A`,
        severity: 'warning',
      });
    }

    // 料位告警
    if (data.silo.cement_level < 10) {
      alarms.push({
        alarmType: 'material_low',
        source: 'cement_silo',
        message: `水泥料位过低: ${data.silo.cement_level}%`,
        severity: 'warning',
      });
    }

    // 安全告警
    if (data.system.emergency_stop) {
      alarms.push({
        alarmType: 'safety_emergency',
        source: 'system',
        message: '紧急停机按钮被按下',
        severity: 'critical',
      });
    }

    // 创建告警记录
    for (const alarm of alarms) {
      try {
        await this.databaseService.localAlarm.create({
          data: {
            ...alarm,
            timestamp: data.timestamp,
          },
        });
      } catch (error) {
        this.logger.error('创建告警记录失败:', error);
      }
    }
  }

  /**
   * 获取实时数据
   */
  getRealTimeData(): CollectedData | null {
    return this.dataBuffer.length > 0 ? this.dataBuffer[this.dataBuffer.length - 1] : null;
  }

  /**
   * 获取历史数据
   */
  getHistoryData(minutes: number = 60): CollectedData[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.dataBuffer.filter(d => d.timestamp > cutoff);
  }

  /**
   * 启用/禁用数据采集
   */
  setCollectionEnabled(enabled: boolean) {
    this.collectionEnabled = enabled;
    this.logger.log(`数据采集${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 获取采集状态
   */
  getCollectionStatus() {
    return {
      enabled: this.collectionEnabled,
      collecting: this.isCollecting,
      bufferSize: this.dataBuffer.length,
      lastCollection: this.dataBuffer.length > 0 ? this.dataBuffer[this.dataBuffer.length - 1].timestamp : null,
    };
  }

  /**
   * 清空数据缓冲区
   */
  clearBuffer() {
    this.dataBuffer = [];
    this.logger.log('数据缓冲区已清空');
  }
}