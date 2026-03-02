import { Controller, Get, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { QueryLogDto } from './dto/query-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Roles('admin', 'manager')
  findAll(@Query() query: QueryLogDto) {
    return this.logsService.findAll(query);
  }

  @Get('statistics')
  @Roles('admin', 'manager')
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getStatistics(startDate, endDate);
  }

  @Get('today')
  @Roles('admin', 'manager')
  getTodayStatistics() {
    return this.logsService.getTodayStatistics();
  }

  @Get('recent')
  @Roles('admin', 'manager')
  getRecent(@Query('limit') limit?: string) {
    return this.logsService.getRecent(limit ? +limit : 10);
  }

  @Get('export')
  @Roles('admin', 'manager')
  exportLogs(@Query() query: QueryLogDto) {
    return this.logsService.exportLogs(query);
  }

  @Get('user/:userId')
  @Roles('admin', 'manager')
  getUserHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.logsService.getUserHistory(+userId, limit ? +limit : 20);
  }

  @Get('module/:module')
  @Roles('admin', 'manager')
  getModuleHistory(
    @Param('module') module: string,
    @Query('limit') limit?: string,
  ) {
    return this.logsService.getModuleHistory(module, limit ? +limit : 20);
  }

  @Get(':id')
  @Roles('admin', 'manager')
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(+id);
  }

  @Delete('expired')
  @Roles('admin')
  deleteExpiredLogs(@Query('days') days?: string) {
    return this.logsService.deleteExpiredLogs(days ? +days : 90);
  }
}
