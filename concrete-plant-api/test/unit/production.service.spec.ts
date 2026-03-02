import { Test, TestingModule } from '@nestjs/testing';
import { ProductionService } from '../../src/production/production.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductionService', () => {
  let service: ProductionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    orders: {
      findUnique: jest.fn(),
    },
    recipes: {
      findUnique: jest.fn(),
    },
    production_batches: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    batch_records: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    materials: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    const createBatchDto = {
      siteId: 1,
      orderId: 1,
      recipeId: 1,
      plannedQuantity: 100,
      remarks: '测试批次',
    };

    const mockOrder = {
      id: 1,
      order_number: 'ORD001',
      status: 'confirmed',
    };

    const mockRecipe = {
      id: 1,
      name: 'C30混凝土',
      status: 'published',
      details: [
        {
          id: 1,
          material_id: 1,
          quantity: 50,
          material: {
            id: 1,
            name: '水泥',
          },
        },
        {
          id: 2,
          material_id: 2,
          quantity: 30,
          material: {
            id: 2,
            name: '砂',
          },
        },
      ],
    };

    const mockBatch = {
      id: 1,
      batch_number: 'PC202601270001',
      site_id: 1,
      order_id: 1,
      recipe_id: 1,
      planned_quantity: 100,
      actual_quantity: 0,
      status: 'pending',
      operator_id: 1,
      site: { id: 1, name: '站点1' },
      order: mockOrder,
      recipe: mockRecipe,
      operator: { id: 1, username: 'admin', name: '管理员' },
      records: [],
    };

    it('should create batch successfully', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.production_batches.create.mockResolvedValue(mockBatch);
      mockPrismaService.batch_records.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);

      const result = await service.createBatch(createBatchDto, 1);

      expect(result).toBeDefined();
      expect(result.batch_number).toContain('PC');
      expect(mockPrismaService.orders.findUnique).toHaveBeenCalledWith({
        where: { id: createBatchDto.orderId },
      });
      expect(mockPrismaService.recipes.findUnique).toHaveBeenCalledWith({
        where: { id: createBatchDto.recipeId },
        include: {
          details: {
            include: {
              material: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(null);

      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        '订单不存在',
      );
    });

    it('should throw NotFoundException when recipe not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.recipes.findUnique.mockResolvedValue(null);

      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        '配方不存在',
      );
    });

    it('should throw BadRequestException when recipe is not published', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.recipes.findUnique.mockResolvedValue({
        ...mockRecipe,
        status: 'draft',
      });

      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBatch(createBatchDto, 1)).rejects.toThrow(
        '只能使用已发布的配方',
      );
    });

    it('should create batch with custom records', async () => {
      const dtoWithRecords = {
        ...createBatchDto,
        records: [
          {
            materialId: 1,
            plannedQuantity: 50,
            actualQuantity: 48,
          },
        ],
      };

      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.recipes.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.production_batches.create.mockResolvedValue(mockBatch);
      mockPrismaService.batch_records.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);

      const result = await service.createBatch(dtoWithRecords, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.batch_records.createMany).toHaveBeenCalled();
    });
  });

  describe('findAllBatches', () => {
    const mockBatches = [
      {
        id: 1,
        batch_number: 'PC202601270001',
        status: 'pending',
        site: { id: 1, name: '站点1' },
        order: { id: 1, order_number: 'ORD001' },
        recipe: { id: 1, name: 'C30混凝土' },
        operator: { id: 1, username: 'admin', name: '管理员' },
        _count: { records: 2 },
      },
    ];

    it('should return paginated batches', async () => {
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.production_batches.count.mockResolvedValue(1);

      const result = await service.findAllBatches({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockBatches,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by siteId', async () => {
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.production_batches.count.mockResolvedValue(1);

      await service.findAllBatches({ page: 1, limit: 10, siteId: 1 });

      expect(mockPrismaService.production_batches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.production_batches.count.mockResolvedValue(1);

      await service.findAllBatches({ page: 1, limit: 10, status: 'pending' });

      expect(mockPrismaService.production_batches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.production_batches.findMany.mockResolvedValue(mockBatches);
      mockPrismaService.production_batches.count.mockResolvedValue(1);

      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      await service.findAllBatches({ page: 1, limit: 10, startDate, endDate });

      expect(mockPrismaService.production_batches.findMany).toHaveBeenCalledWith(
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

  describe('findOneBatch', () => {
    const mockBatch = {
      id: 1,
      batch_number: 'PC202601270001',
      status: 'pending',
      site: { id: 1, name: '站点1' },
      order: { id: 1, order_number: 'ORD001' },
      recipe: {
        id: 1,
        name: 'C30混凝土',
        grade: { id: 1, name: 'C30' },
        details: [],
      },
      operator: { id: 1, username: 'admin', name: '管理员' },
      records: [],
    };

    it('should return batch by id', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);

      const result = await service.findOneBatch(1);

      expect(result).toEqual(mockBatch);
      expect(mockPrismaService.production_batches.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when batch not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(null);

      await expect(service.findOneBatch(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneBatch(999)).rejects.toThrow('生产批次不存在');
    });
  });

  describe('updateBatch', () => {
    const mockBatch = {
      id: 1,
      status: 'pending',
    };

    const updateDto = {
      plannedQuantity: 120,
      remarks: '更新备注',
    };

    it('should update batch successfully', async () => {
      const updatedBatch = {
        ...mockBatch,
        ...updateDto,
        site: { id: 1, name: '站点1' },
        order: { id: 1, order_number: 'ORD001' },
        recipe: { id: 1, name: 'C30混凝土' },
        records: [],
      };

      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);
      mockPrismaService.production_batches.update.mockResolvedValue(updatedBatch);

      const result = await service.updateBatch(1, updateDto, 1);

      expect(result).toEqual(updatedBatch);
      expect(mockPrismaService.production_batches.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when batch not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(null);

      await expect(service.updateBatch(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when batch is completed', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue({
        ...mockBatch,
        status: 'completed',
      });

      await expect(service.updateBatch(1, updateDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateBatch(1, updateDto, 1)).rejects.toThrow(
        '已完成的批次不能修改',
      );
    });
  });

  describe('startBatch', () => {
    const mockBatch = {
      id: 1,
      status: 'pending',
    };

    it('should start batch successfully', async () => {
      const startedBatch = {
        ...mockBatch,
        status: 'in_progress',
        start_time: new Date(),
        site: { id: 1, name: '站点1' },
        order: { id: 1, order_number: 'ORD001' },
        recipe: { id: 1, name: 'C30混凝土' },
      };

      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);
      mockPrismaService.production_batches.update.mockResolvedValue(startedBatch);

      const result = await service.startBatch(1, 1);

      expect(result.status).toBe('in_progress');
      expect(mockPrismaService.production_batches.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'in_progress',
          start_time: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when batch not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(null);

      await expect(service.startBatch(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when batch is not pending', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue({
        ...mockBatch,
        status: 'in_progress',
      });

      await expect(service.startBatch(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.startBatch(1, 1)).rejects.toThrow(
        '只能开始待生产的批次',
      );
    });
  });

  describe('completeBatch', () => {
    const mockBatch = {
      id: 1,
      status: 'in_progress',
      records: [
        { id: 1, actual_quantity: 50 },
        { id: 2, actual_quantity: 30 },
      ],
    };

    it('should complete batch successfully', async () => {
      const completedBatch = {
        ...mockBatch,
        status: 'completed',
        actual_quantity: 100,
        end_time: new Date(),
        site: { id: 1, name: '站点1' },
        order: { id: 1, order_number: 'ORD001' },
        recipe: { id: 1, name: 'C30混凝土' },
        records: mockBatch.records.map(r => ({ ...r, material: { id: 1, name: '水泥' } })),
      };

      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);
      mockPrismaService.production_batches.update.mockResolvedValue(completedBatch);

      const result = await service.completeBatch(1, 100, 1);

      expect(result.status).toBe('completed');
      expect(result.actual_quantity).toBe(100);
      expect(mockPrismaService.production_batches.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'completed',
          actual_quantity: 100,
          end_time: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when batch not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(null);

      await expect(service.completeBatch(999, 100, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when batch is not in progress', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue({
        ...mockBatch,
        status: 'pending',
      });

      await expect(service.completeBatch(1, 100, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.completeBatch(1, 100, 1)).rejects.toThrow(
        '只能完成进行中的批次',
      );
    });

    it('should throw BadRequestException when records are incomplete', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue({
        ...mockBatch,
        records: [
          { id: 1, actual_quantity: 50 },
          { id: 2, actual_quantity: 0 }, // 未完成的记录
        ],
      });

      await expect(service.completeBatch(1, 100, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.completeBatch(1, 100, 1)).rejects.toThrow(
        '还有配料记录未完成',
      );
    });
  });

  describe('createBatchRecord', () => {
    const createRecordDto = {
      batchId: 1,
      materialId: 1,
      plannedQuantity: 50,
      actualQuantity: 48,
      remarks: '测试记录',
    };

    const mockBatch = {
      id: 1,
      status: 'in_progress',
    };

    const mockMaterial = {
      id: 1,
      name: '水泥',
    };

    it('should create batch record successfully', async () => {
      const mockRecord = {
        id: 1,
        ...createRecordDto,
        deviation: -4,
        batch: mockBatch,
        material: mockMaterial,
        operator: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);
      mockPrismaService.materials.findUnique.mockResolvedValue(mockMaterial);
      mockPrismaService.batch_records.create.mockResolvedValue(mockRecord);

      const result = await service.createBatchRecord(createRecordDto, 1);

      expect(result).toBeDefined();
      expect(result.deviation).toBe(-4);
      expect(mockPrismaService.batch_records.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when batch not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(null);

      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        '生产批次不存在',
      );
    });

    it('should throw NotFoundException when material not found', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue(mockBatch);
      mockPrismaService.materials.findUnique.mockResolvedValue(null);

      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        '材料不存在',
      );
    });

    it('should throw BadRequestException when batch is completed', async () => {
      mockPrismaService.production_batches.findUnique.mockResolvedValue({
        ...mockBatch,
        status: 'completed',
      });

      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBatchRecord(createRecordDto, 1)).rejects.toThrow(
        '已完成的批次不能添加配料记录',
      );
    });
  });

  describe('updateBatchRecord', () => {
    const mockRecord = {
      id: 1,
      planned_quantity: 50,
      batch: {
        id: 1,
        status: 'in_progress',
      },
    };

    it('should update batch record successfully', async () => {
      const updatedRecord = {
        ...mockRecord,
        actual_quantity: 48,
        deviation: -4,
        material: { id: 1, name: '水泥' },
        operator: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.batch_records.findUnique.mockResolvedValue(mockRecord);
      mockPrismaService.batch_records.update.mockResolvedValue(updatedRecord);

      const result = await service.updateBatchRecord(1, 48, 1);

      expect(result.actual_quantity).toBe(48);
      expect(result.deviation).toBe(-4);
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrismaService.batch_records.findUnique.mockResolvedValue(null);

      await expect(service.updateBatchRecord(999, 48, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when batch is completed', async () => {
      mockPrismaService.batch_records.findUnique.mockResolvedValue({
        ...mockRecord,
        batch: {
          ...mockRecord.batch,
          status: 'completed',
        },
      });

      await expect(service.updateBatchRecord(1, 48, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateBatchRecord(1, 48, 1)).rejects.toThrow(
        '已完成批次的配料记录不能修改',
      );
    });
  });

  describe('getStatistics', () => {
    it('should return production statistics', async () => {
      mockPrismaService.production_batches.count
        .mockResolvedValueOnce(10) // totalBatches
        .mockResolvedValueOnce(2)  // pendingBatches
        .mockResolvedValueOnce(3)  // inProgressBatches
        .mockResolvedValueOnce(5); // completedBatches

      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: {
          actual_quantity: 500,
        },
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalBatches: 10,
        pendingBatches: 2,
        inProgressBatches: 3,
        completedBatches: 5,
        totalProduction: 500,
      });
    });

    it('should filter statistics by siteId', async () => {
      mockPrismaService.production_batches.count.mockResolvedValue(5);
      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: 250 },
      });

      await service.getStatistics(1);

      expect(mockPrismaService.production_batches.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter statistics by date range', async () => {
      mockPrismaService.production_batches.count.mockResolvedValue(3);
      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: 150 },
      });

      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      await service.getStatistics(undefined, startDate, endDate);

      expect(mockPrismaService.production_batches.count).toHaveBeenCalledWith(
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

    it('should return 0 for totalProduction when no completed batches', async () => {
      mockPrismaService.production_batches.count.mockResolvedValue(0);
      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: null },
      });

      const result = await service.getStatistics();

      expect(result.totalProduction).toBe(0);
    });
  });
});


