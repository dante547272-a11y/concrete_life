import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

export interface AlarmData {
  type: string;
  source: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);
  private activeAlarms = new Map<string, any>();

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 创建告警
   */
  async createAlarm(alarmData: AlarmData): Promise<string> {
    try {
      const alarm = await this.databaseService.alarm.create({
        data: {
          type: alarmData.type,
          source: alarmData.source,
          message: alarmData.message,
          severity: alarmData.severity,
          status: 'active',
          data: alarmData.data ? JSON.stringify(alarmData.data) : null,
          createdAt: new Date(),
        },
      });

      // 添加到活跃告警列表
      this.activeAlarms.set(alarm.id, alarm);

      this.logger.warn(`新告警: [${alarmData.severity.toUpperCase()}] ${alarmData.message}`);

      // 根据严重程度执行不同的处理
      await this.handleAlarmBySeverity(alarm);

      return alarm.id;

    } catch (error) {
      this.logger.error('创建告警失败:', error);
      throw error;
    }
  }

  /**
   * 确认告警
   */
  async acknowledgeAlarm(alarmId: string, userId?: string): Promise<void> {
    try {
      await this.databaseService.alarm.update({
        where: { id: alarmId },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
      });

      this.activeAlarms.delete(alarmId);
      this.logger.log(`告警已确认: ${alarmId}`);

    } catch (error) {
      this.logger.error('确认告警失败:', error);
      throw error;
    }
  }

  /**
   * 解决告警
   */
  async resolveAlarm(alarmId: string, userId?: string, resolution?: string): Promise<void> {
    try {
      await this.databaseService.alarm.update({
        where: { id: alarmId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: userId,
          resolution,
        },
      });

      this.activeAlarms.delete(alarmId);
      this.logger.log(`告警已解决: ${alarmId}`);

    } catch (error) {
      this.logger.error('解决告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取活跃告警
   */
  async getActiveAlarms(): Promise<any[]> {
    try {
      return await this.databaseService.alarm.findMany({
        where: {
          status: {
            in: ['active', 'acknowledged'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error('获取活跃告警失败:', error);
      return [];
    }
  }

  /**
   * 获取告警历史
   */
  async getAlarmHistory(limit = 100): Promise<any[]> {
    try {
      return await this.databaseService.alarm.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      this.logger.error('获取告警历史失败:', error);
      return [];
    }
  }

  /**
   * 获取告警统计
   */
  async getAlarmStatistics(): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalToday,
        activeCount,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
      ] = await Promise.all([
        this.databaseService.alarm.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        this.databaseService.alarm.count({
          where: {
            status: 'active',
          },
        }),
        this.databaseService.alarm.count({
          where: {
            severity: 'critical',
            status: 'active',
          },
        }),
        this.databaseService.alarm.count({
          where: {
            severity: 'high',
            status: 'active',
          },
        }),
        this.databaseService.alarm.count({
          where: {
            severity: 'medium',
            status: 'active',
          },
        }),
        this.databaseService.alarm.count({
          where: {
            severity: 'low',
            status: 'active',
          },
        }),
      ]);

      return {
        totalToday,
        active: {
          total: activeCount,
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
        },
      };

    } catch (error) {
      this.logger.error('获取告警统计失败:', error);
      return {
        totalToday: 0,
        active: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };
    }
  }

  /**
   * 根据严重程度处理告警
   */
  private async handleAlarmBySeverity(alarm: any): Promise<void> {
    switch (alarm.severity) {
      case 'critical':
        // 关键告警：立即通知，可能需要自动停机
        await this.handleCriticalAlarm(alarm);
        break;
      case 'high':
        // 高级告警：立即通知
        await this.handleHighAlarm(alarm);
        break;
      case 'medium':
        // 中级告警：记录并通知
        await this.handleMediumAlarm(alarm);
        break;
      case 'low':
        // 低级告警：仅记录
        await this.handleLowAlarm(alarm);
        break;
    }
  }

  /**
   * 处理关键告警
   */
  private async handleCriticalAlarm(alarm: any): Promise<void> {
    this.logger.error(`🚨 关键告警: ${alarm.message}`);
    
    // 关键告警可能需要自动执行安全措施
    if (alarm.type === 'emergency_stop' || alarm.type === 'safety_violation') {
      // 这里可以调用紧急停机逻辑
      this.logger.warn('关键告警触发，考虑执行安全措施');
    }

    // 发送紧急通知（这里可以集成短信、邮件等）
    await this.sendEmergencyNotification(alarm);
  }

  /**
   * 处理高级告警
   */
  private async handleHighAlarm(alarm: any): Promise<void> {
    this.logger.warn(`⚠️ 高级告警: ${alarm.message}`);
    
    // 发送即时通知
    await this.sendInstantNotification(alarm);
  }

  /**
   * 处理中级告警
   */
  private async handleMediumAlarm(alarm: any): Promise<void> {
    this.logger.warn(`⚡ 中级告警: ${alarm.message}`);
    
    // 发送常规通知
    await this.sendRegularNotification(alarm);
  }

  /**
   * 处理低级告警
   */
  private async handleLowAlarm(alarm: any): Promise<void> {
    this.logger.log(`ℹ️ 低级告警: ${alarm.message}`);
    
    // 仅记录，不发送通知
  }

  /**
   * 发送紧急通知
   */
  private async sendEmergencyNotification(alarm: any): Promise<void> {
    // 这里实现紧急通知逻辑（短信、电话、邮件等）
    this.logger.log(`发送紧急通知: ${alarm.message}`);
  }

  /**
   * 发送即时通知
   */
  private async sendInstantNotification(alarm: any): Promise<void> {
    // 这里实现即时通知逻辑
    this.logger.log(`发送即时通知: ${alarm.message}`);
  }

  /**
   * 发送常规通知
   */
  private async sendRegularNotification(alarm: any): Promise<void> {
    // 这里实现常规通知逻辑
    this.logger.log(`发送常规通知: ${alarm.message}`);
  }

  /**
   * 定期检查告警状态
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlarmStatus() {
    try {
      // 检查长时间未处理的告警
      const oldAlarms = await this.databaseService.alarm.findMany({
        where: {
          status: 'active',
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
          },
        },
      });

      for (const alarm of oldAlarms) {
        this.logger.warn(`告警长时间未处理: ${alarm.id} - ${alarm.message}`);
        
        // 可以发送提醒通知或升级告警级别
        if (alarm.severity !== 'critical') {
          await this.escalateAlarm(alarm.id);
        }
      }

    } catch (error) {
      this.logger.error('检查告警状态失败:', error);
    }
  }

  /**
   * 升级告警
   */
  private async escalateAlarm(alarmId: string): Promise<void> {
    try {
      const alarm = await this.databaseService.alarm.findUnique({
        where: { id: alarmId },
      });

      if (!alarm) return;

      let newSeverity = alarm.severity;
      switch (alarm.severity) {
        case 'low':
          newSeverity = 'medium';
          break;
        case 'medium':
          newSeverity = 'high';
          break;
        case 'high':
          newSeverity = 'critical';
          break;
      }

      if (newSeverity !== alarm.severity) {
        await this.databaseService.alarm.update({
          where: { id: alarmId },
          data: { severity: newSeverity },
        });

        this.logger.warn(`告警已升级: ${alarmId} ${alarm.severity} -> ${newSeverity}`);
      }

    } catch (error) {
      this.logger.error('升级告警失败:', error);
    }
  }

  /**
   * 清理历史告警
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldAlarms() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await this.databaseService.alarm.deleteMany({
        where: {
          status: 'resolved',
          resolvedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`清理历史告警: ${result.count} 条`);

    } catch (error) {
      this.logger.error('清理历史告警失败:', error);
    }
  }
}