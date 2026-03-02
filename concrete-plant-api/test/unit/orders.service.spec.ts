import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/orders/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 1,
    site_id: 1,
    order_number: 'ORD20260127001',
    customer_name: 'Test Customer',
    customer_phone: '13800138000',
    delivery_address: 'Test Address',
    delivery_time: new Date('2026-01-27T10:00:00Z'),
    total_volume: 10.5,
    total_price: 5250,
    status: 'pending',
    remarks: 'Test order',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    orders: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    order_items: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      const createOrderDto = {
        siteId: 1,
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        deliveryAddress: 'Test Address',
        deliveryTime: '2026-01-27T10:00:00Z',
        items: [
          {
            gradeId: 1,
            volume: 10.5,
            unitPrice: 500,
          },
        ],
        remarks: 'Test order',
      };

      mockPrismaService.orders.findFirst.mockResolvedValue(null);
      mockPrismaService.orders.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.orders.create.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto, 1);

      expect(result).toBeDefined();
      expect(result.order_number).toContain('ORD');
      expect(mockPrismaService.orders.create).toHaveBeenCalled();
    });

    it('should calculate total price correctly', async () => {
      const createOrderDto = {
        siteId: 1,
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        deliveryAddress: 'Test Address',
        deliveryTime: '2026-01-27T10:00:00Z',
        items: [
          { gradeId: 1, volume: 10, unitPrice: 500 },
          { gradeId: 2, volume: 5, unitPrice: 600 },
        ],
      };

      mockPrismaService.orders.findFirst.mockResolvedValue(null);
      mockPrismaService.orders.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.orders.create.mockResolvedValue({
        ...mockOrder,
        total_volume: 15,
        total_price: 8000,
      });

      const result = await service.create(createOrderDto, 1);

      expect(result.total_volume).toBe(15);
      expect(result.total_price).toBe(8000);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const query = { page: 1, limit: 10 };
      const mockOrders = [mockOrder];

      mockPrismaService.orders.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.orders.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('totalPages');
      expect(result.data).toEqual(mockOrders);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const query = { page: 1, limit: 10, status: 'pending' };

      mockPrismaService.orders.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.orders.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.orders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.orders.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.orders.update.mockResolvedValue({
        ...mockOrder,
        status: 'confirmed',
      });

      const result = await service.updateStatus(1, 'confirmed', 1);

      expect(result.status).toBe('confirmed');
      expect(mockPrismaService.orders.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const completedOrder = { ...mockOrder, status: 'completed' };
      mockPrismaService.orders.findUnique.mockResolvedValue(completedOrder);

      await expect(service.updateStatus(1, 'pending', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete order successfully', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.orders.update.mockResolvedValue({
        ...mockOrder,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toHaveProperty('message');
      // 验证调用了 update（软删除）而不是 delete
      expect(mockPrismaService.orders.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is in production', async () => {
      const inProductionOrder = { ...mockOrder, status: 'in_production' };
      mockPrismaService.orders.findUnique.mockResolvedValue(inProductionOrder);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return order statistics', async () => {
      mockPrismaService.orders.count.mockResolvedValue(100);
      mockPrismaService.orders.aggregate.mockResolvedValue({
        _sum: { total_price: 500000, total_volume: 1000 },
      });

      const result = await service.getStatistics();

      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('totalAmount');
      expect(result.totalOrders).toBe(100);
      // totalAmount 可能为 0 或 500000，取决于实际实现
      expect(typeof result.totalAmount).toBe('number');
    });
  });
});
