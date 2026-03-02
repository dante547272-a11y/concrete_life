import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('list')
  @Roles('admin', 'manager')
  getReportList() {
    return this.reportsService.getReportList();
  }

  @Get('daily')
  @Roles('admin', 'manager')
  generateDailyReport(
    @Query('siteId') siteId?: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.generateDailyReport(
      siteId ? +siteId : undefined,
      date,
    );
  }

  @Get('monthly')
  @Roles('admin', 'manager')
  generateMonthlyReport(
    @Query('siteId') siteId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.reportsService.generateMonthlyReport(
      siteId ? +siteId : undefined,
      year ? +year : undefined,
      month ? +month : undefined,
    );
  }

  @Get('annual')
  @Roles('admin', 'manager')
  generateAnnualReport(
    @Query('siteId') siteId?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.generateAnnualReport(
      siteId ? +siteId : undefined,
      year ? +year : undefined,
    );
  }

  @Get('custom')
  @Roles('admin', 'manager')
  generateCustomReport(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metrics') metrics?: string,
  ) {
    const metricsArray = metrics ? metrics.split(',') : undefined;
    return this.reportsService.generateCustomReport(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
      metricsArray,
    );
  }
}
