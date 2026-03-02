import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  /**
   * 生成日报
   */
  async generateDailyReport(siteId?: number, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const where: any = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (siteId) {
      where.siteId = siteId;
    }

    const [
      orders,
      batches,
      tasks,
      alarms,
      production,
      materials,
    ] = await Promise.all([
      // 订单统计
      this.prisma.orders.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      
      // 生产批次统计
      this.prisma.production_batches.findMany({
        where,
        include: {
          recipe: {
            include: {
              grade: true,
            },
          },
        },
      }),
      
      // 任务统计
      this.prisma.task.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      
      // 告警统计
      this.prisma.alarm.groupBy({
        by: ['level'],
        where: {
          triggered_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          ...(siteId ? { siteId: siteId } : {}),
        },
        _count: true,
      }),
      
      // 总产量
      this.prisma.production_batches.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { actualQuantity: true },
        _count: true,
      }),
      
      // 材料消耗
      this.prisma.$queryRaw`
        SELECT 
          m.name,
          m.unit,
          SUM(br.actualQuantity) as consumption
        FROM batch_records br
        JOIN materials m ON br.materialId = m.id
        JOIN production_batches pb ON br.batchId = pb.id
        WHERE pb.createdAt BETWEEN ${startOfDay} AND ${endOfDay}
        ${siteId ? this.prisma.$queryRaw`AND pb.siteId = ${siteId}` : this.prisma.$queryRaw``}
        GROUP BY m.id, m.name, m.unit
        ORDER BY consumption DESC
      `,
    ]);

    return {
      reportType: 'daily',
      date: startOfDay.toISOString().split('T')[0],
      siteId,
      summary: {
        orders: {
          total: orders.reduce((sum, item) => sum + item._count, 0),
          byStatus: orders,
        },
        production: {
          totalBatches: production._count,
          totalProduction: production._sum.actualQuantity || 0,
          batches,
        },
        tasks: {
          total: tasks.reduce((sum, item) => sum + item._count, 0),
          byStatus: tasks,
        },
        alarms: {
          total: alarms.reduce((sum, item) => sum + item._count, 0),
          byLevel: alarms,
        },
        materials,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成月报
   */
  async generateMonthlyReport(siteId?: number, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // 使用分析服务获取详细数据
    const analytics = await this.analyticsService.getComprehensiveReport(
      siteId,
      startDate.toISOString(),
      endDate.toISOString(),
    );

    // 按天统计
    const dailyStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as batch_count,
        SUM(actualQuantity) as production
      FROM production_batches
      WHERE status = 'completed'
        AND createdAt BETWEEN ${startDate} AND ${endDate}
        ${siteId ? this.prisma.$queryRaw`AND siteId = ${siteId}` : this.prisma.$queryRaw``}
      GROUP BY DATE(createdAt)
      ORDER BY date
    `;

    return {
      reportType: 'monthly',
      year: targetYear,
      month: targetMonth,
      siteId,
      analytics,
      dailyStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成年报
   */
  async generateAnnualReport(siteId?: number, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const analytics = await this.analyticsService.getComprehensiveReport(
      siteId,
      startDate.toISOString(),
      endDate.toISOString(),
    );

    // 按月统计
    const monthlyStats = await this.prisma.$queryRaw`
      SELECT 
        MONTH(createdAt) as month,
        COUNT(*) as batch_count,
        SUM(actualQuantity) as production
      FROM production_batches
      WHERE status = 'completed'
        AND YEAR(createdAt) = ${targetYear}
        ${siteId ? this.prisma.$queryRaw`AND siteId = ${siteId}` : this.prisma.$queryRaw``}
      GROUP BY MONTH(createdAt)
      ORDER BY month
    `;

    return {
      reportType: 'annual',
      year: targetYear,
      siteId,
      analytics,
      monthlyStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成自定义报表
   */
  async generateCustomReport(
    siteId?: number,
    startDate?: string,
    endDate?: string,
    metrics?: string[],
  ) {
    const result: any = {
      reportType: 'custom',
      siteId,
      startDate,
      endDate,
      metrics: {},
      generatedAt: new Date().toISOString(),
    };

    const requestedMetrics = metrics || ['production', 'efficiency', 'quality', 'material', 'order'];

    if (requestedMetrics.includes('production')) {
      result.metrics.production = await this.analyticsService.getProductionAnalytics(siteId, startDate, endDate);
    }

    if (requestedMetrics.includes('efficiency')) {
      result.metrics.efficiency = await this.analyticsService.getEfficiencyAnalytics(siteId, startDate, endDate);
    }

    if (requestedMetrics.includes('quality')) {
      result.metrics.quality = await this.analyticsService.getQualityAnalytics(siteId, startDate, endDate);
    }

    if (requestedMetrics.includes('material')) {
      result.metrics.material = await this.analyticsService.getMaterialConsumptionAnalytics(siteId, startDate, endDate);
    }

    if (requestedMetrics.includes('order')) {
      result.metrics.order = await this.analyticsService.getOrderAnalytics(siteId, startDate, endDate);
    }

    return result;
  }

  /**
   * 获取报表列表
   */
  async getReportList() {
    return [
      {
        id: 'daily',
        name: '日报',
        description: '每日生产、订单、任务统计',
        parameters: ['siteId', 'date'],
      },
      {
        id: 'monthly',
        name: '月报',
        description: '月度综合分析报告',
        parameters: ['siteId', 'year', 'month'],
      },
      {
        id: 'annual',
        name: '年报',
        description: '年度综合分析报告',
        parameters: ['siteId', 'year'],
      },
      {
        id: 'custom',
        name: '自定义报表',
        description: '根据需求自定义报表内容',
        parameters: ['siteId', 'startDate', 'endDate', 'metrics'],
      },
    ];
  }
}
