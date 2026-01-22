import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SafetyService } from './safety.service';

@Controller('safety')
export class SafetyController {
  private readonly logger = new Logger(SafetyController.name);

  constructor(private readonly safetyService: SafetyService) {}

  /**
   * 获取安全状态
   */
  @Get('status')
  async getSafetyStatus() {
    try {
      const status = await this.safetyService.checkSafetyStatus();
      return {
        success: true,
        data: {
          ...status,
          emergencyStopActive: this.safetyService.isEmergencyStopActive(),
        },
      };
    } catch (error) {
      this.logger.error('获取安全状态失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取安全统计
   */
  @Get('statistics')
  async getSafetyStatistics() {
    try {
      const stats = await this.safetyService.getSafetyStatistics();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('获取安全统计失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取安全事件历史
   */
  @Get('events')
  async getSafetyEvents() {
    try {
      const events = await this.safetyService.getSafetyEventHistory();
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger.error('获取安全事件失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 执行紧急停机
   */
  @Post('emergency-stop')
  async executeEmergencyStop(@Body() body: { reason: string }) {
    try {
      await this.safetyService.executeEmergencyStop(body.reason);
      return {
        success: true,
        message: '紧急停机执行成功',
      };
    } catch (error) {
      this.logger.error('执行紧急停机失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 重置紧急停机状态
   */
  @Post('reset-emergency-stop')
  async resetEmergencyStop(@Body() body: { userId?: string }) {
    try {
      await this.safetyService.resetEmergencyStop(body.userId);
      return {
        success: true,
        message: '紧急停机状态重置成功',
      };
    } catch (error) {
      this.logger.error('重置紧急停机失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 执行全面安全检查
   */
  @Post('comprehensive-check')
  async performComprehensiveSafetyCheck() {
    try {
      const result = await this.safetyService.performComprehensiveSafetyCheck();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('全面安全检查失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}