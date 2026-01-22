import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DataCollectionService } from './data-collection.service';

@Controller('data')
export class DataCollectionController {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  @Get('realtime')
  getRealTimeData() {
    const data = this.dataCollectionService.getRealTimeData();
    return {
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('history')
  getHistoryData(@Query('minutes') minutes: string = '60') {
    const mins = parseInt(minutes);
    const data = this.dataCollectionService.getHistoryData(mins);
    return {
      data,
      period: `${mins} minutes`,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  getCollectionStatus() {
    return {
      status: this.dataCollectionService.getCollectionStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('control')
  controlCollection(@Body('enabled') enabled: boolean) {
    this.dataCollectionService.setCollectionEnabled(enabled);
    return {
      message: `数据采集已${enabled ? '启用' : '禁用'}`,
      enabled,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('clear-buffer')
  clearBuffer() {
    this.dataCollectionService.clearBuffer();
    return {
      message: '数据缓冲区已清空',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('collect-now')
  async collectNow() {
    // 手动触发一次数据采集
    await this.dataCollectionService.collectRealTimeData();
    return {
      message: '手动数据采集完成',
      timestamp: new Date().toISOString(),
    };
  }
}