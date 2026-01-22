import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { PlcService } from '../plc/plc.service';
import { AlarmService } from '../alarm/alarm.service';

export interface SafetyRule {
  id: string;
  name: string;
  type: 'temperature' | 'pressure' | 'vibration' | 'door' | 'emergency' | 'custom';
  condition: string;
  threshold: number;
  action: 'alarm' | 'stop' | 'emergency_stop';
  enabled: boolean;
}

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);
  private emergencyStopActive = false;
  private safetyRules: SafetyRule[] = [];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly plcService: PlcService,
    private readonly alarmService: AlarmService,
  ) {
    this.initializeSafetyRules();
  }

  /**
   * 初始化安全规则
   */
  private async initializeSafetyRules() {
    try {
      // 从数据库加载安全规则
      const rules = await this.databaseService.safetyRule.findMany({
        where: { enabled: true },
      });

      this.safetyRules = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        type: rule.type as any,
        condition: rule.condition,
        threshold: rule.threshold,
        action: rule.action as any,
        enabled: rule.enabled,
      }));

      this.logger.log(`加载安全规则: ${this.safetyRules.length} 条`);

    } catch (error) {
      this.logger.error('初始化安全规则失败:', error);
      
      // 使用默认安全规则
      this.safetyRules = this.getDefaultSafetyRules();
    }
  }

  /**
   * 获取默认安全规则
   */
  private getDefaultSafetyRules(): SafetyRule[] {
    return [
      {
        id: 'temp_high',
        name: '设备温度过高',
        type: 'temperature',
        condition: 'greater_than',
        threshold: 80,
        action: 'alarm',
        enabled: true,
      },
      {
        id: 'temp_critical',
        name: '设备温度危险',
        type: 'temperature',
        condition: 'greater_than',
        threshold: 90,
        action: 'stop',
        enabled: true,
      },
      {
        id: 'pressure_high',
        name: '压力过高',
        type: 'pressure',
        condition: 'greater_than',
        threshold: 10,
        action: 'alarm',
        enabled: true,
      },
      {
        id: 'vibration_high',
        name: '振动异常',
        type: 'vibration',
        condition: 'greater_than',
        threshold: 5,
        action: 'alarm',
        enabled: true,
      },
      {
        id: 'safety_door',
        name: '安全门未关闭',
        type: 'door',
        condition: 'equals',
        threshold: 0,
        action: 'stop',
        enabled: true,
      },
      {
        id: 'emergency_button',
        name: '急停按钮激活',
        type: 'emergency',
        condition: 'equals',
        threshold: 1,
        action: 'emergency_stop',
        enabled: true,
      },
    ];
  }

  /**
   * 执行紧急停机
   */
  async executeEmergencyStop(reason: string): Promise<void> {
    if (this.emergencyStopActive) {
      this.logger.warn('紧急停机已激活');
      return;
    }

    this.logger.error(`🚨 执行紧急停机: ${reason}`);
    this.emergencyStopActive = true;

    try {
      // 立即停止所有设备
      await this.plcService.emergencyStopAll();

      // 记录紧急停机事件
      await this.databaseService.safetyEvent.create({
        data: {
          type: 'emergency_stop',
          description: `紧急停机: ${reason}`,
          severity: 'critical',
          data: JSON.stringify({ reason, timestamp: new Date() }),
          createdAt: new Date(),
        },
      });

      // 创建关键告警
      await this.alarmService.createAlarm({
        type: 'emergency_stop',
        source: 'safety_system',
        message: `紧急停机执行: ${reason}`,
        severity: 'critical',
        data: { reason },
      });

      this.logger.error('紧急停机执行完成');

    } catch (error) {
      this.logger.error('紧急停机执行失败:', error);
      throw error;
    }
  }

  /**
   * 重置紧急停机状态
   */
  async resetEmergencyStop(userId?: string): Promise<void> {
    if (!this.emergencyStopActive) {
      throw new Error('紧急停机未激活');
    }

    try {
      // 检查安全条件
      const safetyCheck = await this.performComprehensiveSafetyCheck();
      if (!safetyCheck.safe) {
        throw new Error(`安全检查失败: ${safetyCheck.reasons.join(', ')}`);
      }

      // 重置PLC紧急停机状态
      await this.plcService.resetEmergencyStop();

      this.emergencyStopActive = false;

      // 记录重置事件
      await this.databaseService.safetyEvent.create({
        data: {
          type: 'emergency_reset',
          description: '紧急停机状态已重置',
          severity: 'medium',
          data: JSON.stringify({ userId, timestamp: new Date() }),
          createdAt: new Date(),
        },
      });

      this.logger.log('紧急停机状态已重置');

    } catch (error) {
      this.logger.error('重置紧急停机失败:', error);
      throw error;
    }
  }

  /**
   * 检查安全状态
   */
  async checkSafetyStatus(): Promise<{ safe: boolean; violations: string[] }> {
    const violations: string[] = [];

    try {
      // 检查紧急停机状态
      if (this.emergencyStopActive) {
        violations.push('紧急停机激活');
      }

      // 检查急停按钮
      const emergencyButton = await this.plcService.readDigitalInput(5001);
      if (emergencyButton) {
        violations.push('急停按钮被按下');
      }

      // 检查安全门
      const safetyDoor = await this.plcService.readDigitalInput(5000);
      if (!safetyDoor) {
        violations.push('安全门未关闭');
      }

      // 检查设备温度
      const temperature = await this.plcService.readAnalogInput(1003);
      if (temperature > 90) {
        violations.push(`设备温度过高: ${temperature}°C`);
      }

      // 检查压力
      const pressure = await this.plcService.readAnalogInput(1004);
      if (pressure > 10) {
        violations.push(`压力过高: ${pressure}bar`);
      }

      return {
        safe: violations.length === 0,
        violations,
      };

    } catch (error) {
      this.logger.error('安全状态检查失败:', error);
      return {
        safe: false,
        violations: ['安全系统检查失败'],
      };
    }
  }

  /**
   * 执行全面安全检查
   */
  async performComprehensiveSafetyCheck(): Promise<{ safe: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    try {
      // 基础安全检查
      const basicCheck = await this.checkSafetyStatus();
      if (!basicCheck.safe) {
        reasons.push(...basicCheck.violations);
      }

      // 设备状态检查
      const equipmentStatus = await this.plcService.getEquipmentStatus();
      if (equipmentStatus.hasError) {
        reasons.push('设备存在故障');
      }

      // 通信状态检查
      const communicationOk = await this.plcService.checkCommunication();
      if (!communicationOk) {
        reasons.push('PLC通信异常');
      }

      return {
        safe: reasons.length === 0,
        reasons,
      };

    } catch (error) {
      this.logger.error('全面安全检查失败:', error);
      return {
        safe: false,
        reasons: ['安全检查系统故障'],
      };
    }
  }

  /**
   * 获取紧急停机状态
   */
  isEmergencyStopActive(): boolean {
    return this.emergencyStopActive;
  }

  /**
   * 获取安全事件历史
   */
  async getSafetyEventHistory(limit = 100): Promise<any[]> {
    try {
      return await this.databaseService.safetyEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error('获取安全事件历史失败:', error);
      return [];
    }
  }

  /**
   * 获取安全统计
   */
  async getSafetyStatistics(): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalEventsToday,
        emergencyStopsToday,
        totalEmergencyStops,
        lastEmergencyStop,
      ] = await Promise.all([
        this.databaseService.safetyEvent.count({
          where: {
            createdAt: { gte: today },
          },
        }),
        this.databaseService.safetyEvent.count({
          where: {
            type: 'emergency_stop',
            createdAt: { gte: today },
          },
        }),
        this.databaseService.safetyEvent.count({
          where: {
            type: 'emergency_stop',
          },
        }),
        this.databaseService.safetyEvent.findFirst({
          where: {
            type: 'emergency_stop',
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      return {
        eventsToday: totalEventsToday,
        emergencyStopsToday,
        totalEmergencyStops,
        lastEmergencyStop: lastEmergencyStop?.createdAt,
        currentStatus: this.emergencyStopActive ? 'emergency' : 'normal',
      };

    } catch (error) {
      this.logger.error('获取安全统计失败:', error);
      return {
        eventsToday: 0,
        emergencyStopsToday: 0,
        totalEmergencyStops: 0,
        lastEmergencyStop: null,
        currentStatus: 'unknown',
      };
    }
  }

  /**
   * 定期安全检查
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async performPeriodicSafetyCheck() {
    try {
      // 执行安全规则检查
      for (const rule of this.safetyRules) {
        if (!rule.enabled) continue;

        await this.checkSafetyRule(rule);
      }

    } catch (error) {
      this.logger.error('定期安全检查失败:', error);
    }
  }

  /**
   * 检查单个安全规则
   */
  private async checkSafetyRule(rule: SafetyRule): Promise<void> {
    try {
      let currentValue: number;

      // 根据规则类型读取相应的值
      switch (rule.type) {
        case 'temperature':
          currentValue = await this.plcService.readAnalogInput(1003);
          break;
        case 'pressure':
          currentValue = await this.plcService.readAnalogInput(1004);
          break;
        case 'vibration':
          currentValue = await this.plcService.readAnalogInput(1005);
          break;
        case 'door':
          currentValue = await this.plcService.readDigitalInput(5000) ? 1 : 0;
          break;
        case 'emergency':
          currentValue = await this.plcService.readDigitalInput(5001) ? 1 : 0;
          break;
        default:
          return;
      }

      // 检查条件
      let violated = false;
      switch (rule.condition) {
        case 'greater_than':
          violated = currentValue > rule.threshold;
          break;
        case 'less_than':
          violated = currentValue < rule.threshold;
          break;
        case 'equals':
          violated = currentValue === rule.threshold;
          break;
      }

      if (violated) {
        await this.handleSafetyViolation(rule, currentValue);
      }

    } catch (error) {
      this.logger.error(`检查安全规则失败 ${rule.name}:`, error);
    }
  }

  /**
   * 处理安全违规
   */
  private async handleSafetyViolation(rule: SafetyRule, currentValue: number): Promise<void> {
    const message = `安全规则违规: ${rule.name} (当前值: ${currentValue}, 阈值: ${rule.threshold})`;
    
    this.logger.warn(message);

    // 记录安全事件
    await this.databaseService.safetyEvent.create({
      data: {
        type: 'rule_violation',
        description: message,
        severity: rule.action === 'emergency_stop' ? 'critical' : 'high',
        data: JSON.stringify({
          rule: rule.name,
          currentValue,
          threshold: rule.threshold,
          action: rule.action,
        }),
        createdAt: new Date(),
      },
    });

    // 执行相应的动作
    switch (rule.action) {
      case 'alarm':
        await this.alarmService.createAlarm({
          type: 'safety_violation',
          source: 'safety_system',
          message,
          severity: 'high',
          data: { rule: rule.name, currentValue, threshold: rule.threshold },
        });
        break;

      case 'stop':
        await this.alarmService.createAlarm({
          type: 'safety_violation',
          source: 'safety_system',
          message,
          severity: 'critical',
          data: { rule: rule.name, currentValue, threshold: rule.threshold },
        });
        // 这里可以调用生产停止逻辑
        break;

      case 'emergency_stop':
        await this.executeEmergencyStop(message);
        break;
    }
  }
}