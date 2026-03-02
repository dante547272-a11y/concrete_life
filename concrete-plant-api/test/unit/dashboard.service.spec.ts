import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../src/dashboard/dashboard.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    orders: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    production_batches: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    materials: {
      count: jest.fn(),
      findMany: jest.fn(),
      fields: {
        min_stock: 'min_stock',
      },
    },
    alarms: {
      count: jest.fn(),
    },
    vehicles: {
      count: jest.fn(),
    },
    tasks: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview data', async () => {
      mockPrismaService.orders.count
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(10)  // pendingOrders
        .mockResolvedValueOnce(50); // completedOrders

      mockPrismaService.orders.aggregate.mockResolvedValue({
        _sum: { total_price: 500000 },
      });

      mockPrismaService.production_batches.count
        .mockResolvedValueOnce(80)  // totalBatches
        .mockResolvedValueOnce(5);  // inProgressBatches

      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: 1000 },
      });

      mockPrismaService.materials.count
        .mockResolvedValueOnce(50)  // totalMaterials
        .mockResolvedValueOnce(3);  // lowStockMaterials

      mockPrismaService.materials.findMany.mockResolvedValue([
        { id: 1, current_stock: 500, min_stock: 1000 },
      ]);

      mockPrismaService.alarms.count
        .mockResolvedValueOnce(20)  // totalAlarms
        .mockResolvedValueOnce(5);  // pendingAlarms

      mockPrismaService.vehicles.count
        .mockResolvedValueOnce(10)  // totalVehicles
        .mockResolvedValueOnce(8);  // activeVehicles

      mockPrismaService.tasks.count
        .mockResolvedValueOnce(30)  // totalTasks
        .mockResolvedValueOnce(10); // pendingTasks

      mockPrismaService.orders.findMany.mockResolvedValue([]);
      mockPrismaService.production_batches.findMany.mockResolvedValue([]);
      mockPrismaService.tasks.findMany.mockResolvedValue([]);

      const result = await service.getOverview();

      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('production');
      expect(result).toHaveProperty('materials');
      expect(result).toHaveProperty('alarms');
      expect(result).toHaveProperty('vehicles');
      expect(result.orders.total).toBe(100);
      expect(result.production.totalBatches).toBe(80);
    });
  });

  describe('getProductionTrend', () => {
    it('should return production trend data', async () => {
      const mockTrendData = [
        { date: '2026-01-20', _sum: { actual_quantity: 100 } },
        { date: '2026-01-21', _sum: { actual_quantity: 120 } },
        { date: '2026-01-22', _sum: { actual_quantity: 110 } },
      ];

      mockPrismaService.production_batches.findMany.mockResolvedValue(
        mockTrendData.map(d => ({
          created_at: new Date(d.date),
          actual_quantity: d._sum.actual_quantity,
        })),
      );

      const result = await service.getProductionTrend(7);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getOrderStatistics', () => {
    it('should return order statistics by status', async () => {
      mockPrismaService.orders.count
        .mockResolvedValueOnce(10)  // pending
        .mockResolvedValueOnce(20)  // confirmed
        .mockResolvedValueOnce(15)  // in_production
        .mockResolvedValueOnce(5)   // delivering
        .mockResolvedValueOnce(50)  // completed
        .mockResolvedValueOnce(2);  // cancelled

      const result = await service.getOrderStatistics();

      expect(result).toHaveProperty('byStatus');
      expect(result.byStatus).toHaveProperty('pending');
      expect(result.byStatus).toHaveProperty('completed');
      expect(result.byStatus.pending).toBe(10);
      expect(result.byStatus.completed).toBe(50);
    });
  });
});
