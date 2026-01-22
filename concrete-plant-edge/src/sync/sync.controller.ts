import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  /**
   * 获取连接状态
   */
  @Get('status')
  getConnectionStatus() {
    return this.syncService.getConnectionStatus();
  }

  /**
   * 获取同步统计
   */
  @Get('stats')
  async getSyncStats() {
    return await this.syncService.getSyncStats();
  }

  /**
   * 手动触发同步
   */
  @Post('trigger')
  async triggerSync() {
    try {
      await this.syncService.syncQueuedData();
      return {
        success: true,
        message: '同步触发成功',
      };
    } catch (error) {
      this.logger.error('手动同步失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 接收远程控制指令
   */
  @Post('control')
  async receiveControlCommand(@Body() command: any) {
    try {
      const result = await this.syncService.receiveControlCommand(command);
      return {
        success: true,
        result,
      };
    } catch (error) {
      this.logger.error('处理控制指令失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 测试连接
   */
  @Post('test-connection')
  async testConnection() {
    try {
      await this.syncService.checkConnection();
      return {
        success: true,
        message: '连接测试成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}