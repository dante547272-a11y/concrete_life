import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    production_batches: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    batch_records: {
      findMany: jest.fn(),
    },
    orders: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    materials: {
      findMany: jest.fn(),
    },
    inventory_transactions: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    tasks: {
      count: jest.fn(),
    },
    alarms: {
      count: jest.fn(),
    },
    vehicles: {
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductionAnalytics', () => {
    it('should return production analytics data', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPrismaService.production_batches.count
        .mockResolvedValueOnce(10)  // totalBatches
        .mockResolvedValueOnce(8);  // completedBatches

      mockPrismaService.production_batches.findMany.mockResolvedValue([
        {
          id: 1,
          actual_quantity: 100,
          planned_quantity: 100,
          created_at: new Date('2026-01-15'),
        },
        {
          id: 2,
          actual_quantity: 95,
          planned_quantity: 100,
          created_at: new Date('2026-01-20'),
        },
      ]);

      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: 195, planned_quantity: 200 },
        _avg: { actual_quantity: 97.5 },
      });

      const result = await service.getProductionAnalytics(startDate, endDate);

      // 验证返回了数据结构
      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalProduction');
      expect(result.summary.totalProduction).toBe(195);
    });
  });

  describe('getEfficiencyAnalytics', () => {
    it('should calculate efficiency metrics', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPrismaService.production_batches.findMany.mockResolvedValue([
        {
          id: 1,
          actual_quantity: 100,
          planned_quantity: 100,
          start_time: new Date('2026-01-15T08:00:00'),
          end_time: new Date('2026-01-15T10:00:00'),
        },
        {
          id: 2,
          actual_quantity: 95,
          planned_quantity: 100,
          start_time: new Date('2026-01-20T08:00:00'),
          end_time: new Date('2026-01-20T10:30:00'),
        },
      ]);

      mockPrismaService.tasks.count.mockResolvedValue(50);
      mockPrismaService.$queryRaw.mockResolvedValue([{ avg_duration: 120 }]);
      mockPrismaService.vehicles.groupBy.mockResolvedValue([
        { status: 'available', _count: 5 },
        { status: 'in_use', _count: 3 },
      ]);

      const result = await service.getEfficiencyAnalytics(startDate, endDate);

      // 验证返回了数据结构
      expect(result).toBeDefined();
      expect(result).toHaveProperty('production');
      expect(result).toHaveProperty('tasks');
    });
  });

  describe('getQualityAnalytics', () => {
    it('should return quality analytics data', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPrismaService.batch_records.findMany.mockResolvedValue([
        {
          id: 1,
          planned_quantity: 100,
          actual_quantity: 100,
          deviation: 0,
        },
        {
          id: 2,
          planned_quantity: 100,
          actual_quantity: 98,
          deviation: -2,
        },
      ]);

      mockPrismaService.alarms.count.mockResolvedValue(5);
      mockPrismaService.$queryRaw.mockResolvedValue([{ avg_duration: 120 }]);

      const result = await service.getQualityAnalytics(startDate, endDate);

      // 验证返回了数据结构
      expect(result).toBeDefined();
      expect(result).toHaveProperty('qualityAlarms');
      expect(result.qualityAlarms).toBe(5);
    });
  });

  describe('getMaterialConsumption', () => {
    it('should return material consumption data', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPrismaService.inventory_transactions.findMany.mockResolvedValue([
        {
          id: 1,
          material_id: 1,
          quantity: -100,
          type: 'out',
          material: { id: 1, name: '水泥', unit: 'kg' },
        },
        {
          id: 2,
          material_id: 1,
          quantity: -150,
          type: 'out',
          material: { id: 1, name: '水泥', unit: 'kg' },
        },
      ]);

      mockPrismaService.inventory_transactions.aggregate.mockResolvedValue({
        _sum: { quantity: -250 },
      });

      const result = await service.getMaterialConsumption(startDate, endDate);

      // 验证返回了数据（可能是数组或对象）
      expect(result).toBeDefined();
    });
  });
});
