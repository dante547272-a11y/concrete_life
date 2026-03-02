import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query('siteId') siteId?: string) {
    return this.dashboardService.getOverview(siteId ? +siteId : undefined);
  }

  @Get('production-trend')
  getProductionTrend(
    @Query('siteId') siteId?: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getProductionTrend(
      siteId ? +siteId : undefined,
      days ? +days : 7,
    );
  }

  @Get('order-trend')
  getOrderTrend(
    @Query('siteId') siteId?: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getOrderTrend(
      siteId ? +siteId : undefined,
      days ? +days : 7,
    );
  }

  @Get('order-status-distribution')
  getOrderStatusDistribution(@Query('siteId') siteId?: string) {
    return this.dashboardService.getOrderStatusDistribution(
      siteId ? +siteId : undefined,
    );
  }

  @Get('task-status-distribution')
  getTaskStatusDistribution(@Query('siteId') siteId?: string) {
    return this.dashboardService.getTaskStatusDistribution(
      siteId ? +siteId : undefined,
    );
  }

  @Get('vehicle-utilization')
  getVehicleUtilization(@Query('siteId') siteId?: string) {
    return this.dashboardService.getVehicleUtilization(
      siteId ? +siteId : undefined,
    );
  }

  @Get('low-stock-materials')
  getLowStockMaterials(@Query('siteId') siteId?: string) {
    return this.dashboardService.getLowStockMaterials(
      siteId ? +siteId : undefined,
    );
  }

  @Get('realtime')
  getRealTimeData(@Query('siteId') siteId?: string) {
    return this.dashboardService.getRealTimeData(
      siteId ? +siteId : undefined,
    );
  }

  @Get('monthly-statistics')
  getMonthlyStatistics(
    @Query('siteId') siteId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.dashboardService.getMonthlyStatistics(
      siteId ? +siteId : undefined,
      year ? +year : undefined,
      month ? +month : undefined,
    );
  }
}
