import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { AlarmService, AlarmData } from './alarm.service';

@Controller('alarm')
export class AlarmController {
  private readonly logger = new Logger(AlarmController.name);

  constructor(private readonly alarmService: AlarmService) {}

  /**
   * 获取活跃告警
   */
  @Get('active')
  async getActiveAlarms() {
    try {
      const alarms = await this.alarmService.getActiveAlarms();
      return {
        success: true,
        data: alarms,
      };
    } catch (error) {
      this.logger.error('获取活跃告警失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取告警历史
   */
  @Get('history')
  async getAlarmHistory(@Query('limit') limit?: string) {
    try {
      const alarms = await this.alarmService.getAlarmHistory(
        limit ? parseInt(limit) : 100
      );
      return {
        success: true,
        data: alarms,
      };
    } catch (error) {
      this.logger.error('获取告警历史失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取告警统计
   */
  @Get('statistics')
  async getAlarmStatistics() {
    try {
      const stats = await this.alarmService.getAlarmStatistics();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('获取告警统计失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 创建告警
   */
  @Post('create')
  async createAlarm(@Body() alarmData: AlarmData) {
    try {
      const alarmId = await this.alarmService.createAlarm(alarmData);
      return {
        success: true,
        data: { alarmId },
        message: '告警创建成功',
      };
    } catch (error) {
      this.logger.error('创建告警失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 确认告警
   */
  @Post('acknowledge/:alarmId')
  async acknowledgeAlarm(
    @Param('alarmId') alarmId: string,
    @Body() body: { userId?: string }
  ) {
    try {
      await this.alarmService.acknowledgeAlarm(alarmId, body.userId);
      return {
        success: true,
        message: '告警确认成功',
      };
    } catch (error) {
      this.logger.error('确认告警失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 解决告警
   */
  @Post('resolve/:alarmId')
  async resolveAlarm(
    @Param('alarmId') alarmId: string,
    @Body() body: { userId?: string; resolution?: string }
  ) {
    try {
      await this.alarmService.resolveAlarm(alarmId, body.userId, body.resolution);
      return {
        success: true,
        message: '告警解决成功',
      };
    } catch (error) {
      this.logger.error('解决告警失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}