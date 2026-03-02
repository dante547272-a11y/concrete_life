import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from '../../src/logs/logs.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('LogsService', () => {
  let service: LogsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    operation_logs: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create log successfully', async () => {
      const mockLog = {
        id: 1,
        user_id: 1,
        action: 'create',
        module: 'orders',
        description: '创建订单',
        details: '{"orderId": 1}',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
      };

      mockPrismaService.operation_logs.create.mockResolvedValue(mockLog);

      const result = await service.create(
        1,
        'create',
        'orders',
        '创建订单',
        { orderId: 1 },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result).toEqual(mockLog);
      expect(mockPrismaService.operation_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          action: 'create',
          module: 'orders',
          description: '创建订单',
        }),
      });
    });

    it('should create log without optional fields', async () => {
      const mockLog = {
        id: 1,
        user_id: 1,
        action: 'view',
        module: 'dashboard',
        description: '查看仪表盘',
        details: null,
        ip_address: null,
        user_agent: null,
      };

      mockPrismaService.operation_logs.create.mockResolvedValue(mockLog);

      const result = await service.create(1, 'view', 'dashboard', '查看仪表盘');

      expect(result).toBeDefined();
      expect(result.details).toBeNull();
    });
  });

  describe('findAll', () => {
    const mockLogs = [
      {
        id: 1,
        action: 'create',
        module: 'orders',
        user: { id: 1, username: 'admin', name: '管理员', role: { id: 1, name: '管理员' } },
      },
    ];

    it('should return paginated logs', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.operation_logs.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockLogs,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by userId', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.operation_logs.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, userId: 1 });

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 1 }),
        }),
      );
    });

    it('should filter by action', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.operation_logs.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, action: 'create' });

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: { contains: 'create' } }),
        }),
      );
    });

    it('should filter by module', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.operation_logs.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, module: 'orders' });

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ module: 'orders' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.operation_logs.count.mockResolvedValue(1);

      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      await service.findAll({ page: 1, limit: 10, startDate, endDate });

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockLog = {
      id: 1,
      action: 'create',
      module: 'orders',
      user: {
        id: 1,
        username: 'admin',
        name: '管理员',
        role: { id: 1, name: '管理员' },
        email: 'admin@example.com',
        phone: '13800138000',
      },
    };

    it('should return log by id', async () => {
      mockPrismaService.operation_logs.findUnique.mockResolvedValue(mockLog);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLog);
    });
  });

  describe('getStatistics', () => {
    it('should return log statistics', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', name: '管理员' },
        { id: 2, username: 'user', name: '用户' },
      ];

      mockPrismaService.operation_logs.count.mockResolvedValue(100);
      mockPrismaService.operation_logs.groupBy
        .mockResolvedValueOnce([
          { module: 'orders', _count: 30 },
          { module: 'production', _count: 25 },
        ])
        .mockResolvedValueOnce([
          { action: 'create', _count: 40 },
          { action: 'update', _count: 35 },
        ])
        .mockResolvedValueOnce([
          { user_id: 1, _count: 50 },
          { user_id: 2, _count: 30 },
        ]);
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.byModule).toHaveLength(2);
      expect(result.byAction).toHaveLength(2);
      expect(result.topUsers).toHaveLength(2);
      expect(result.topUsers[0].user).toEqual(mockUsers[0]);
    });

    it('should filter statistics by date range', async () => {
      mockPrismaService.operation_logs.count.mockResolvedValue(50);
      mockPrismaService.operation_logs.groupBy.mockResolvedValue([]);
      mockPrismaService.users.findMany.mockResolvedValue([]);

      await service.getStatistics('2026-01-01', '2026-01-31');

      expect(mockPrismaService.operation_logs.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('getUserHistory', () => {
    const mockLogs = [
      { id: 1, action: 'create', module: 'orders' },
      { id: 2, action: 'update', module: 'orders' },
    ];

    it('should return user operation history', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      const result = await service.getUserHistory(1);

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        take: 20,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should respect custom limit', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      await service.getUserHistory(1, 50);

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('getModuleHistory', () => {
    const mockLogs = [
      {
        id: 1,
        action: 'create',
        module: 'orders',
        user: { id: 1, username: 'admin', name: '管理员' },
      },
    ];

    it('should return module operation history', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      const result = await service.getModuleHistory('orders');

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith({
        where: { module: 'orders' },
        take: 20,
        orderBy: { created_at: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should respect custom limit', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      await service.getModuleHistory('orders', 100);

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('deleteExpiredLogs', () => {
    it('should delete expired logs successfully', async () => {
      mockPrismaService.operation_logs.deleteMany.mockResolvedValue({ count: 50 });

      const result = await service.deleteExpiredLogs(90);

      expect(result).toEqual({
        message: '成功删除 50 条过期日志',
        count: 50,
      });
      expect(mockPrismaService.operation_logs.deleteMany).toHaveBeenCalled();
    });

    it('should use custom retention days', async () => {
      mockPrismaService.operation_logs.deleteMany.mockResolvedValue({ count: 100 });

      await service.deleteExpiredLogs(30);

      expect(mockPrismaService.operation_logs.deleteMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should return zero count when no logs deleted', async () => {
      mockPrismaService.operation_logs.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteExpiredLogs();

      expect(result.count).toBe(0);
    });
  });

  describe('exportLogs', () => {
    const mockLogs = [
      {
        id: 1,
        action: 'create',
        module: 'orders',
        user: { id: 1, username: 'admin', name: '管理员', role: { id: 1, name: '管理员' } },
      },
    ];

    it('should export all logs matching criteria', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportLogs({ module: 'orders' });

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ module: 'orders' }),
        }),
      );
    });

    it('should export logs with date filter', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      await service.exportLogs({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('getRecent', () => {
    const mockLogs = [
      {
        id: 1,
        action: 'create',
        module: 'orders',
        user: { id: 1, username: 'admin', name: '管理员' },
      },
    ];

    it('should return recent logs', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecent();

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should respect custom limit', async () => {
      mockPrismaService.operation_logs.findMany.mockResolvedValue(mockLogs);

      await service.getRecent(50);

      expect(mockPrismaService.operation_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('getTodayStatistics', () => {
    it('should return today statistics', async () => {
      mockPrismaService.operation_logs.count.mockResolvedValue(50);
      mockPrismaService.operation_logs.groupBy
        .mockResolvedValueOnce([
          { module: 'orders', _count: 20 },
          { module: 'production', _count: 15 },
        ])
        .mockResolvedValueOnce([
          { user_id: 1, _count: 30 },
          { user_id: 2, _count: 20 },
        ]);

      const result = await service.getTodayStatistics();

      expect(result.total).toBe(50);
      expect(result.byModule).toHaveLength(2);
      expect(result.activeUsers).toBe(2);
    });
  });
});


