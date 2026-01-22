import { Controller, Get, Query, Logger } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * 获取系统状态
   */
  @Get('system')
  async getSystemStatus() {
    try {
      const status = await this.monitoringService.getSystemStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('获取系统状态失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取设备监控数据
   */
  @Get('equipment')
  async getEquipmentMonitoring() {
    try {
      const data = await this.monitoringService.getEquipmentMonitoring();
      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error('获取设备监控数据失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取性能指标
   */
  @Get('performance')
  async getPerformanceMetrics() {
    try {
      const metrics = await this.monitoringService.getPerformanceMetrics();
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('获取性能指标失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取历史趋势
   */
  @Get('trends')
  async getHistoricalTrends(@Query('days') days?: string) {
    try {
      const trends = await this.monitoringService.getHistoricalTrends(
        days ? parseInt(days) : 7
      );
      return {
        success: true,
        data: trends,
      };
    } catch (error) {
      this.logger.error('获取历史趋势失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取告警趋势
   */
  @Get('alarm-trends')
  async getAlarmTrends(@Query('days') days?: string) {
    try {
      const trends = await this.monitoringService.getAlarmTrends(
        days ? parseInt(days) : 7
      );
      return {
        success: true,
        data: trends,
      };
    } catch (error) {
      this.logger.error('获取告警趋势失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}