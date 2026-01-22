import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { PlcService } from '../plc/plc.service';
import * as os from 'os';
import * as fs from 'fs';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private systemMetrics = {
    cpu: 0,
    memory: 0,
    disk: 0,
    temperature: 0,
    uptime: 0,
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly plcService: PlcService,
  ) {}

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<any> {
    try {
      const [
        cpuUsage,
        memoryUsage,
        diskUsage,
        plcStatus,
        databaseStatus,
      ] = await Promise.all([
        this.getCpuUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage(),
        this.getPlcStatus(),
        this.getDatabaseStatus(),
      ]);

      return {
        system: {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
          uptime: os.uptime(),
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
        },
        services: {
          plc: plcStatus,
          database: databaseStatus,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取系统状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取设备监控数据
   */
  async getEquipmentMonitoring(): Promise<any> {
    try {
      const equipmentData = {
        mixer: {
          status: await this.plcService.readDigitalInput(1000),
          speed: await this.plcService.readAnalogInput(1001),
          current: await this.plcService.readAnalogInput(1002),
          temperature: await this.plcService.readAnalogInput(1003),
          vibration: await this.plcService.readAnalogInput(1005),
          runtime: await this.getEquipmentRuntime('mixer'),
        },
        weighing: {
          cement: await this.plcService.readAnalogInput(2000),
          water: await this.plcService.readAnalogInput(2001),
          sand: await this.plcService.readAnalogInput(2002),
          gravel: await this.plcService.readAnalogInput(2003),
          additive: await this.plcService.readAnalogInput(2004),
        },
        conveyor: {
          belt1: {
            speed: await this.plcService.readAnalogInput(3000),
            status: await this.plcService.readDigitalInput(3010),
            runtime: await this.getEquipmentRuntime('belt1'),
          },
          belt2: {
            speed: await this.plcService.readAnalogInput(3001),
            status: await this.plcService.readDigitalInput(3011),
            runtime: await this.getEquipmentRuntime('belt2'),
          },
        },
        valves: {
          cement: await this.plcService.readDigitalInput(4000),
          water: await this.plcService.readDigitalInput(4001),
          additive: await this.plcService.readDigitalInput(4002),
        },
      };

      return {
        equipment: equipmentData,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取设备监控数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        todayProduction,
        todayBatches,
        avgBatchTime,
        equipmentEfficiency,
        errorRate,
      ] = await Promise.all([
        this.getTodayProduction(),
        this.getTodayBatches(),
        this.getAverageBatchTime(),
        this.getEquipmentEfficiency(),
        this.getErrorRate(),
      ]);

      return {
        production: {
          todayVolume: todayProduction,
          todayBatches,
          avgBatchTime,
          efficiency: equipmentEfficiency,
          errorRate,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取性能指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史趋势数据
   */
  async getHistoricalTrends(days = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const trends = await this.databaseService.systemMetrics.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // 按天分组数据
      const dailyData = this.groupDataByDay(trends);

      return {
        trends: dailyData,
        period: { start: startDate, end: endDate, days },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取历史趋势失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警趋势
   */
  async getAlarmTrends(days = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const alarms = await this.databaseService.alarm.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          severity: true,
          type: true,
          createdAt: true,
        },
      });

      // 按天和严重程度分组
      const alarmTrends = this.groupAlarmsByDay(alarms);

      return {
        trends: alarmTrends,
        period: { start: startDate, end: endDate, days },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取告警趋势失败:', error);
      throw error;
    }
  }

  /**
   * 定期收集系统指标
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics() {
    try {
      const metrics = {
        cpu: await this.getCpuUsage(),
        memory: await this.getMemoryUsage(),
        disk: await this.getDiskUsage(),
        temperature: await this.getSystemTemperature(),
        uptime: os.uptime(),
      };

      // 保存到数据库
      await this.databaseService.systemMetrics.create({
        data: {
          type: 'system',
          data: JSON.stringify(metrics),
          timestamp: new Date(),
        },
      });

      // 更新内存中的指标
      this.systemMetrics = metrics;

    } catch (error) {
      this.logger.error('收集系统指标失败:', error);
    }
  }

  /**
   * 定期收集设备指标
   */
  @Cron('*/30 * * * * *') // 每30秒
  async collectEquipmentMetrics() {
    try {
      const equipmentData = await this.getEquipmentMonitoring();

      // 保存到数据库
      await this.databaseService.systemMetrics.create({
        data: {
          type: 'equipment',
          data: JSON.stringify(equipmentData.equipment),
          timestamp: new Date(),
        },
      });

    } catch (error) {
      this.logger.error('收集设备指标失败:', error);
    }
  }

  // 私有方法

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 1000);
    });
  }

  private cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
    };
  }

  private async getMemoryUsage(): Promise<number> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const stats = fs.statSync('.');
      // 这里简化处理，实际应该使用更准确的磁盘使用率检测
      return 50; // 默认返回50%
    } catch (error) {
      return 0;
    }
  }

  private async getSystemTemperature(): Promise<number> {
    try {
      // 在实际环境中，这里应该读取系统温度传感器
      // 这里返回模拟数据
      return 45 + Math.random() * 10;
    } catch (error) {
      return 0;
    }
  }

  private async getPlcStatus(): Promise<any> {
    try {
      const isConnected = await this.plcService.checkCommunication();
      return {
        connected: isConnected,
        status: isConnected ? 'online' : 'offline',
        lastUpdate: new Date(),
      };
    } catch (error) {
      return {
        connected: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  private async getDatabaseStatus(): Promise<any> {
    try {
      await this.databaseService.$queryRaw`SELECT 1`;
      return {
        connected: true,
        status: 'online',
        lastUpdate: new Date(),
      };
    } catch (error) {
      return {
        connected: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  private async getEquipmentRuntime(equipment: string): Promise<number> {
    try {
      // 从数据库获取设备运行时间
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = await this.databaseService.equipmentRuntime.findMany({
        where: {
          equipmentName: equipment,
          date: {
            gte: today,
          },
        },
      });

      return records.reduce((total, record) => total + record.runtime, 0);
    } catch (error) {
      return 0;
    }
  }

  private async getTodayProduction(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await this.databaseService.productionRecord.aggregate({
        where: {
          startTime: {
            gte: today,
          },
          status: 'completed',
        },
        _sum: {
          quantity: true,
        },
      });

      return result._sum.quantity || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTodayBatches(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await this.databaseService.productionRecord.count({
        where: {
          startTime: {
            gte: today,
          },
          status: 'completed',
        },
      });
    } catch (error) {
      return 0;
    }
  }

  private async getAverageBatchTime(): Promise<number> {
    try {
      const records = await this.databaseService.productionRecord.findMany({
        where: {
          status: 'completed',
          startTime: {
            not: null,
          },
          endTime: {
            not: null,
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
        take: 100, // 最近100条记录
        orderBy: {
          startTime: 'desc',
        },
      });

      if (records.length === 0) return 0;

      const totalTime = records.reduce((sum, record) => {
        const duration = record.endTime!.getTime() - record.startTime!.getTime();
        return sum + duration;
      }, 0);

      return Math.round(totalTime / records.length / 1000 / 60); // 返回分钟
    } catch (error) {
      return 0;
    }
  }

  private async getEquipmentEfficiency(): Promise<number> {
    try {
      // 计算设备运行效率
      const totalTime = 24 * 60; // 一天总分钟数
      const runtime = await this.getEquipmentRuntime('mixer');
      return Math.round((runtime / totalTime) * 100);
    } catch (error) {
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalBatches, failedBatches] = await Promise.all([
        this.databaseService.productionRecord.count({
          where: {
            startTime: {
              gte: today,
            },
          },
        }),
        this.databaseService.productionRecord.count({
          where: {
            startTime: {
              gte: today,
            },
            status: 'failed',
          },
        }),
      ]);

      if (totalBatches === 0) return 0;
      return Math.round((failedBatches / totalBatches) * 100);
    } catch (error) {
      return 0;
    }
  }

  private groupDataByDay(data: any[]): any[] {
    const grouped = new Map();

    data.forEach(item => {
      const day = item.timestamp.toISOString().split('T')[0];
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day).push(item);
    });

    return Array.from(grouped.entries()).map(([day, items]) => ({
      date: day,
      data: items,
    }));
  }

  private groupAlarmsByDay(alarms: any[]): any[] {
    const grouped = new Map();

    alarms.forEach(alarm => {
      const day = alarm.createdAt.toISOString().split('T')[0];
      if (!grouped.has(day)) {
        grouped.set(day, {
          date: day,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        });
      }
      
      const dayData = grouped.get(day);
      dayData[alarm.severity]++;
      dayData.total++;
    });

    return Array.from(grouped.values());
  }
}