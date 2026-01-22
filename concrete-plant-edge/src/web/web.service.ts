import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProductionService } from '../production/production.service';
import { AlarmService } from '../alarm/alarm.service';
import { SafetyService } from '../safety/safety.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class WebService {
  private readonly logger = new Logger(WebService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productionService: ProductionService,
    private readonly alarmService: AlarmService,
    private readonly safetyService: SafetyService,
    private readonly monitoringService: MonitoringService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * 获取仪表板数据
   */
  async getDashboardData(): Promise<any> {
    try {
      const [
        productionStatus,
        safetyStatus,
        alarmStats,
        systemStatus,
        syncStatus,
        performanceMetrics,
      ] = await Promise.all([
        this.productionService.getProductionStatus(),
        this.safetyService.checkSafetyStatus(),
        this.alarmService.getAlarmStatistics(),
        this.monitoringService.getSystemStatus(),
        this.syncService.getConnectionStatus(),
        this.monitoringService.getPerformanceMetrics(),
      ]);

      return {
        production: productionStatus,
        safety: {
          ...safetyStatus,
          emergencyStopActive: this.safetyService.isEmergencyStopActive(),
        },
        alarms: alarmStats,
        system: systemStatus,
        sync: syncStatus,
        performance: performanceMetrics,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取仪表板数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时数据
   */
  async getRealTimeData(): Promise<any> {
    try {
      const [
        equipmentData,
        productionStatus,
        activeAlarms,
      ] = await Promise.all([
        this.monitoringService.getEquipmentMonitoring(),
        this.productionService.getProductionStatus(),
        this.alarmService.getActiveAlarms(),
      ]);

      return {
        equipment: equipmentData.equipment,
        production: productionStatus,
        alarms: activeAlarms.slice(0, 5), // 最新5条告警
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('获取实时数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取生产任务列表
   */
  async getProductionTasks(): Promise<any> {
    try {
      const tasks = await this.databaseService.productionTask.findMany({
        include: {
          recipe: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return tasks;

    } catch (error) {
      this.logger.error('获取生产任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取配方列表
   */
  async getRecipes(): Promise<any> {
    try {
      const recipes = await this.databaseService.recipe.findMany({
        where: {
          enabled: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return recipes;

    } catch (error) {
      this.logger.error('获取配方列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建生产任务
   */
  async createProductionTask(taskData: {
    recipeId: string;
    quantity: number;
    priority?: number;
  }): Promise<any> {
    try {
      const task = await this.databaseService.productionTask.create({
        data: {
          recipeId: taskData.recipeId,
          quantity: taskData.quantity,
          priority: taskData.priority || 1,
          status: 'pending',
          createdAt: new Date(),
        },
        include: {
          recipe: true,
        },
      });

      this.logger.log(`创建生产任务: ${task.recipe.name} x ${task.quantity}`);
      return task;

    } catch (error) {
      this.logger.error('创建生产任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取设备状态
   */
  async getEquipmentStatus(): Promise<any> {
    try {
      const equipmentData = await this.monitoringService.getEquipmentMonitoring();
      
      // 计算设备健康状态
      const healthStatus = this.calculateEquipmentHealth(equipmentData.equipment);

      return {
        ...equipmentData.equipment,
        health: healthStatus,
      };

    } catch (error) {
      this.logger.error('获取设备状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史报告
   */
  async getHistoricalReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [
        productionRecords,
        alarmHistory,
        safetyEvents,
        systemMetrics,
      ] = await Promise.all([
        this.getProductionHistory(startDate, endDate),
        this.getAlarmHistory(startDate, endDate),
        this.getSafetyEventHistory(startDate, endDate),
        this.getSystemMetricsHistory(startDate, endDate),
      ]);

      return {
        period: { start: startDate, end: endDate },
        production: productionRecords,
        alarms: alarmHistory,
        safety: safetyEvents,
        system: systemMetrics,
        summary: this.generateReportSummary(productionRecords, alarmHistory, safetyEvents),
      };

    } catch (error) {
      this.logger.error('获取历史报告失败:', error);
      throw error;
    }
  }

  // 私有方法

  private calculateEquipmentHealth(equipment: any): any {
    const health = {
      mixer: this.calculateSingleEquipmentHealth(equipment.mixer),
      weighing: 'good', // 计量系统通常比较稳定
      conveyor: {
        belt1: this.calculateSingleEquipmentHealth(equipment.conveyor.belt1),
        belt2: this.calculateSingleEquipmentHealth(equipment.conveyor.belt2),
      },
      valves: 'good', // 阀门系统
      overall: 'good',
    };

    // 计算整体健康状态
    const healthScores = [
      health.mixer,
      health.conveyor.belt1,
      health.conveyor.belt2,
    ];

    const criticalCount = healthScores.filter(h => h === 'critical').length;
    const warningCount = healthScores.filter(h => h === 'warning').length;

    if (criticalCount > 0) {
      health.overall = 'critical';
    } else if (warningCount > 1) {
      health.overall = 'warning';
    } else if (warningCount > 0) {
      health.overall = 'caution';
    }

    return health;
  }

  private calculateSingleEquipmentHealth(equipmentData: any): string {
    if (!equipmentData) return 'unknown';

    // 基于温度、振动等参数判断设备健康状态
    if (equipmentData.temperature > 85) return 'critical';
    if (equipmentData.temperature > 75) return 'warning';
    if (equipmentData.vibration > 4) return 'warning';
    if (equipmentData.current > 80) return 'caution';

    return 'good';
  }

  private async getProductionHistory(startDate: Date, endDate: Date): Promise<any> {
    return await this.databaseService.productionRecord.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        recipe: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  private async getAlarmHistory(startDate: Date, endDate: Date): Promise<any> {
    return await this.databaseService.alarm.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getSafetyEventHistory(startDate: Date, endDate: Date): Promise<any> {
    return await this.databaseService.safetyEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getSystemMetricsHistory(startDate: Date, endDate: Date): Promise<any> {
    return await this.databaseService.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  private generateReportSummary(production: any[], alarms: any[], safety: any[]): any {
    const totalBatches = production.length;
    const completedBatches = production.filter(p => p.status === 'completed').length;
    const failedBatches = production.filter(p => p.status === 'failed').length;
    
    const totalVolume = production
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.quantity, 0);

    const criticalAlarms = alarms.filter(a => a.severity === 'critical').length;
    const emergencyStops = safety.filter(s => s.type === 'emergency_stop').length;

    return {
      production: {
        totalBatches,
        completedBatches,
        failedBatches,
        totalVolume,
        successRate: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      },
      safety: {
        totalAlarms: alarms.length,
        criticalAlarms,
        emergencyStops,
        safetyEvents: safety.length,
      },
    };
  }
}