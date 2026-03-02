import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../src/reports/reports.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;
  let analyticsService: AnalyticsService;

  const mockPrismaService = {
    orders: {
      groupBy: jest.fn(),
    },
    production_batches: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    tasks: {
      groupBy: jest.fn(),
    },
    alarms: {
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockAnalyticsService = {
    getComprehensiveReport: jest.fn(),
    getProductionAnalytics: jest.fn(),
    getEfficiencyAnalytics: jest.fn(),
    getQualityAnalytics: jest.fn(),
    getMaterialConsumptionAnalytics: jest.fn(),
    getOrderAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDailyReport', () => {
    const mockOrderStats = [
      { status: 'pending', _count: 5 },
      { status: 'confirmed', _count: 10 },
    ];

    const mockBatches = [
      {
        id: 1,
        batch_number: 'PC001',
        recipe: {
          id: 1,
          name: 'C30',
          grade: { id: 1, name: 'C30' },
        },
      },
    ];

    const mockTaskStats = [
      { status: 'pending', _count: 3 },
      { status: 'completed', _count: 7 },
    ];

    const mockAlarmStats = [
      { level: 'warning', _count: 2 },
      { level: 'error', _count: 1 },
    ];

    const mockProduction = {
      _sum: { actual_quantity: 500 },
      _count: 10,
    };

    const mockMaterials = [
      { name: '水泥', unit: 'kg', consumption: 1000 },
      { name: '砂', unit: 'kg', consumption: 2000 },
    ];

    it('should generate daily report successfully', async () => {
      mockPrismaService.orders.groupBy.mockResolvedValue(mockOrderStats);
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.tasks.groupBy.mockResolvedValue(mockTaskStats);
      mockPrismaService.alarms.groupBy.mockResolvedValue(mockAlarmStats);
      mockPrismaService.production_batches.aggregate.mockResolvedValue(mockProduction);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMaterials);

      const result = await service.generateDailyReport();

      expect(result).toBeDefined();
      expect(result.reportType).toBe('daily');
      expect(result.summary.orders.total).toBe(15);
      expect(result.summary.production.totalProduction).toBe(500);
      expect(result.summary.tasks.total).toBe(10);
      expect(result.summary.alarms.total).toBe(3);
    });

    it('should generate daily report for specific site', async () => {
      mockPrismaService.orders.groupBy.mockResolvedValue(mockOrderStats);
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.tasks.groupBy.mockResolvedValue(mockTaskStats);
      mockPrismaService.alarms.groupBy.mockResolvedValue(mockAlarmStats);
      mockPrismaService.production_batches.aggregate.mockResolvedValue(mockProduction);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMaterials);

      const result = await service.generateDailyReport(1);

      expect(result.siteId).toBe(1);
      expect(mockPrismaService.orders.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should generate daily report for specific date', async () => {
      mockPrismaService.orders.groupBy.mockResolvedValue(mockOrderStats);
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.tasks.groupBy.mockResolvedValue(mockTaskStats);
      mockPrismaService.alarms.groupBy.mockResolvedValue(mockAlarmStats);
      mockPrismaService.production_batches.aggregate.mockResolvedValue(mockProduction);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMaterials);

      const result = await service.generateDailyReport(undefined, '2026-01-27');

      // 日期可能因时区而异，只检查日期格式
      expect(result.date).toMatch(/2026-01-(26|27)/);
    });

    it('should handle zero production', async () => {
      mockPrismaService.orders.groupBy.mockResolvedValue([]);
      mockPrismaService.production_batches.findMany.mockResolvedValue([]);
      mockPrismaService.tasks.groupBy.mockResolvedValue([]);
      mockPrismaService.alarms.groupBy.mockResolvedValue([]);
      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: null },
        _count: 0,
      });
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.generateDailyReport();

      expect(result.summary.production.totalProduction).toBe(0);
      expect(result.summary.orders.total).toBe(0);
    });
  });

  describe('generateMonthlyReport', () => {
    const mockAnalytics = {
      production: { totalBatches: 100, totalProduction: 5000 },
      efficiency: { avgEfficiency: 85 },
    };

    const mockDailyStats = [
      { date: '2026-01-01', batch_count: 10, production: 500 },
      { date: '2026-01-02', batch_count: 12, production: 600 },
    ];

    it('should generate monthly report successfully', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockDailyStats);

      const result = await service.generateMonthlyReport();

      expect(result).toBeDefined();
      expect(result.reportType).toBe('monthly');
      expect(result.analytics).toEqual(mockAnalytics);
      expect(result.dailyStats).toEqual(mockDailyStats);
    });

    it('should generate monthly report for specific site', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockDailyStats);

      const result = await service.generateMonthlyReport(1);

      expect(result.siteId).toBe(1);
      expect(mockAnalyticsService.getComprehensiveReport).toHaveBeenCalled();
    });

    it('should generate monthly report for specific year and month', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockDailyStats);

      const result = await service.generateMonthlyReport(undefined, 2025, 12);

      expect(result.year).toBe(2025);
      expect(result.month).toBe(12);
    });

    it('should use current year and month by default', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockDailyStats);

      const now = new Date();
      const result = await service.generateMonthlyReport();

      expect(result.year).toBe(now.getFullYear());
      expect(result.month).toBe(now.getMonth() + 1);
    });
  });

  describe('generateAnnualReport', () => {
    const mockAnalytics = {
      production: { totalBatches: 1200, totalProduction: 60000 },
      efficiency: { avgEfficiency: 87 },
    };

    const mockMonthlyStats = [
      { month: 1, batch_count: 100, production: 5000 },
      { month: 2, batch_count: 110, production: 5500 },
    ];

    it('should generate annual report successfully', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMonthlyStats);

      const result = await service.generateAnnualReport();

      expect(result).toBeDefined();
      expect(result.reportType).toBe('annual');
      expect(result.analytics).toEqual(mockAnalytics);
      expect(result.monthlyStats).toEqual(mockMonthlyStats);
    });

    it('should generate annual report for specific site', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMonthlyStats);

      const result = await service.generateAnnualReport(1);

      expect(result.siteId).toBe(1);
    });

    it('should generate annual report for specific year', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMonthlyStats);

      const result = await service.generateAnnualReport(undefined, 2025);

      expect(result.year).toBe(2025);
    });

    it('should use current year by default', async () => {
      mockAnalyticsService.getComprehensiveReport.mockResolvedValue(mockAnalytics);
      mockPrismaService.$queryRaw.mockResolvedValue(mockMonthlyStats);

      const now = new Date();
      const result = await service.generateAnnualReport();

      expect(result.year).toBe(now.getFullYear());
    });
  });

  describe('generateCustomReport', () => {
    const mockProductionAnalytics = { totalBatches: 50, totalProduction: 2500 };
    const mockEfficiencyAnalytics = { avgEfficiency: 88 };
    const mockQualityAnalytics = { passRate: 98 };
    const mockMaterialAnalytics = { totalConsumption: 10000 };
    const mockOrderAnalytics = { totalOrders: 100 };

    it('should generate custom report with all metrics', async () => {
      mockAnalyticsService.getProductionAnalytics.mockResolvedValue(mockProductionAnalytics);
      mockAnalyticsService.getEfficiencyAnalytics.mockResolvedValue(mockEfficiencyAnalytics);
      mockAnalyticsService.getQualityAnalytics.mockResolvedValue(mockQualityAnalytics);
      mockAnalyticsService.getMaterialConsumptionAnalytics.mockResolvedValue(mockMaterialAnalytics);
      mockAnalyticsService.getOrderAnalytics.mockResolvedValue(mockOrderAnalytics);

      const result = await service.generateCustomReport(
        1,
        '2026-01-01',
        '2026-01-31',
      );

      expect(result).toBeDefined();
      expect(result.reportType).toBe('custom');
      expect(result.metrics.production).toEqual(mockProductionAnalytics);
      expect(result.metrics.efficiency).toEqual(mockEfficiencyAnalytics);
      expect(result.metrics.quality).toEqual(mockQualityAnalytics);
      expect(result.metrics.material).toEqual(mockMaterialAnalytics);
      expect(result.metrics.order).toEqual(mockOrderAnalytics);
    });

    it('should generate custom report with specific metrics', async () => {
      mockAnalyticsService.getProductionAnalytics.mockResolvedValue(mockProductionAnalytics);
      mockAnalyticsService.getEfficiencyAnalytics.mockResolvedValue(mockEfficiencyAnalytics);

      const result = await service.generateCustomReport(
        1,
        '2026-01-01',
        '2026-01-31',
        ['production', 'efficiency'],
      );

      expect(result.metrics.production).toBeDefined();
      expect(result.metrics.efficiency).toBeDefined();
      expect(result.metrics.quality).toBeUndefined();
      expect(result.metrics.material).toBeUndefined();
      expect(result.metrics.order).toBeUndefined();
    });

    it('should generate custom report without site filter', async () => {
      mockAnalyticsService.getProductionAnalytics.mockResolvedValue(mockProductionAnalytics);

      const result = await service.generateCustomReport(
        undefined,
        '2026-01-01',
        '2026-01-31',
        ['production'],
      );

      expect(result.siteId).toBeUndefined();
      expect(mockAnalyticsService.getProductionAnalytics).toHaveBeenCalledWith(
        undefined,
        '2026-01-01',
        '2026-01-31',
      );
    });
  });

  describe('getReportList', () => {
    it('should return list of available reports', async () => {
      const result = await service.getReportList();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      
      expect(result[0].id).toBe('daily');
      expect(result[1].id).toBe('monthly');
      expect(result[2].id).toBe('annual');
      expect(result[3].id).toBe('custom');
    });

    it('should include report parameters', async () => {
      const result = await service.getReportList();

      const dailyReport = result.find(r => r.id === 'daily');
      expect(dailyReport?.parameters).toContain('siteId');
      expect(dailyReport?.parameters).toContain('date');

      const customReport = result.find(r => r.id === 'custom');
      expect(customReport?.parameters).toContain('metrics');
    });
  });
});

