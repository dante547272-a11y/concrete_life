import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { WebService } from './web.service';

@Controller('api')
export class WebController {
  private readonly logger = new Logger(WebController.name);

  constructor(private readonly webService: WebService) {}

  /**
   * 获取仪表板数据
   */
  @Get('dashboard')
  async getDashboard() {
    try {
      const data = await this.webService.getDashboardData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error('获取仪表板数据失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取实时数据
   */
  @Get('realtime')
  async getRealTimeData() {
    try {
      const data = await this.webService.getRealTimeData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error('获取实时数据失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取生产任务
   */
  @Get('production/tasks')
  async getProductionTasks() {
    try {
      const tasks = await this.webService.getProductionTasks();
      return {
        success: true,
        data: tasks,
      };
    } catch (error) {
      this.logger.error('获取生产任务失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 创建生产任务
   */
  @Post('production/tasks')
  async createProductionTask(@Body() taskData: {
    recipeId: string;
    quantity: number;
    priority?: number;
  }) {
    try {
      const task = await this.webService.createProductionTask(taskData);
      return {
        success: true,
        data: task,
        message: '生产任务创建成功',
      };
    } catch (error) {
      this.logger.error('创建生产任务失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取配方列表
   */
  @Get('recipes')
  async getRecipes() {
    try {
      const recipes = await this.webService.getRecipes();
      return {
        success: true,
        data: recipes,
      };
    } catch (error) {
      this.logger.error('获取配方列表失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取设备状态
   */
  @Get('equipment/status')
  async getEquipmentStatus() {
    try {
      const status = await this.webService.getEquipmentStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('获取设备状态失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取历史报告
   */
  @Get('reports/history')
  async getHistoricalReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const report = await this.webService.getHistoricalReport(start, end);
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      this.logger.error('获取历史报告失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}