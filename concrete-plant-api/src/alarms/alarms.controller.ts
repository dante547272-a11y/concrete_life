import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { QueryAlarmDto } from './dto/query-alarm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('alarms')
@UseGuards(JwtAuthGuard)
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() createAlarmDto: CreateAlarmDto, @Request() req: any) {
    return this.alarmsService.create(createAlarmDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: QueryAlarmDto) {
    return this.alarmsService.findAll(query);
  }

  @Get('statistics')
  getStatistics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.alarmsService.getStatistics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('recent')
  getRecent(
    @Query('limit') limit?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.alarmsService.getRecent(
      limit ? +limit : 10,
      siteId ? +siteId : undefined,
    );
  }

  @Post('check')
  @Roles('admin', 'manager')
  checkAndCreateAlarms() {
    return this.alarmsService.checkAndCreateAlarms();
  }

  @Post('batch-acknowledge')
  @Roles('admin', 'manager', 'operator')
  batchAcknowledge(
    @Body('ids') ids: number[],
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.alarmsService.batchAcknowledge(ids, req.user.userId, remarks);
  }

  @Post('batch-resolve')
  @Roles('admin', 'manager', 'operator')
  batchResolve(
    @Body('ids') ids: number[],
    @Body('solution') solution: string,
    @Request() req: any,
  ) {
    return this.alarmsService.batchResolve(ids, req.user.userId, solution);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alarmsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateAlarmDto: UpdateAlarmDto, @Request() req: any) {
    return this.alarmsService.update(+id, updateAlarmDto, req.user.userId);
  }

  @Post(':id/acknowledge')
  @Roles('admin', 'manager', 'operator')
  acknowledge(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.alarmsService.acknowledge(+id, req.user.userId, remarks);
  }

  @Post(':id/resolve')
  @Roles('admin', 'manager', 'operator')
  resolve(
    @Param('id') id: string,
    @Body('solution') solution: string,
    @Request() req: any,
  ) {
    return this.alarmsService.resolve(+id, req.user.userId, solution);
  }

  @Post(':id/ignore')
  @Roles('admin', 'manager')
  ignore(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.alarmsService.ignore(+id, req.user.userId, reason);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.alarmsService.remove(+id);
  }
}
