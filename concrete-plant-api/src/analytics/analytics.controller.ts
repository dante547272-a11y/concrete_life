import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('production')
  @Roles('admin', 'manager')
  getProductionAnalytics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getProductionAnalytics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('efficiency')
  @Roles('admin', 'manager')
  getEfficiencyAnalytics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getEfficiencyAnalytics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('quality')
  @Roles('admin', 'manager')
  getQualityAnalytics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getQualityAnalytics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('material-consumption')
  @Roles('admin', 'manager')
  getMaterialConsumptionAnalytics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getMaterialConsumptionAnalytics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('orders')
  @Roles('admin', 'manager')
  getOrderAnalytics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getOrderAnalytics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }

  @Get('comprehensive')
  @Roles('admin', 'manager')
  getComprehensiveReport(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getComprehensiveReport(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }
}
