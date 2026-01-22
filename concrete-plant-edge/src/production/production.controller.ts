import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  private readonly logger = new Logger(ProductionController.name);

  constructor(private readonly productionService: ProductionService) {}

  /**
   * 获取生产状态
   */
  @Get('status')
  getProductionStatus() {
    return this.productionService.getProductionStatus();
  }

  /**
   * 启动生产任务
   */
  @Post('start/:taskId')
  async startProduction(@Param('taskId') taskId: string) {
    try {
      await this.productionService.startProduction(taskId);
      return {
        success: true,
        message: '生产任务启动成功',
      };
    } catch (error) {
      this.logger.error('启动生产失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 暂停生产
   */
  @Post('pause')
  async pauseProduction() {
    try {
      await this.productionService.pauseProduction();
      return {
        success: true,
        message: '生产任务已暂停',
      };
    } catch (error) {
      this.logger.error('暂停生产失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 恢复生产
   */
  @Post('resume')
  async resumeProduction() {
    try {
      await this.productionService.resumeProduction();
      return {
        success: true,
        message: '生产任务已恢复',
      };
    } catch (error) {
      this.logger.error('恢复生产失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 停止生产
   */
  @Post('stop')
  async stopProduction() {
    try {
      await this.productionService.stopProduction();
      return {
        success: true,
        message: '生产任务已停止',
      };
    } catch (error) {
      this.logger.error('停止生产失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 紧急停机
   */
  @Post('emergency-stop')
  async emergencyStop() {
    try {
      await this.productionService.emergencyStop();
      return {
        success: true,
        message: '紧急停机执行成功',
      };
    } catch (error) {
      this.logger.error('紧急停机失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}