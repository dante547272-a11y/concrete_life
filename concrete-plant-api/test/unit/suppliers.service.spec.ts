import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from '../../src/suppliers/suppliers.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    suppliers: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSupplierDto = {
      name: '三一重工',
      contactPerson: '张三',
      phone: '13800138000',
      email: 'contact@sany.com',
      address: '湖南省长沙市',
      type: 'cement',
      creditRating: 'A',
      remarks: '优质供应商',
    };

    const mockSupplier = {
      id: 1,
      ...createSupplierDto,
      creator: { id: 1, username: 'admin', name: '管理员' },
    };

    it('should create supplier successfully', async () => {
      mockPrismaService.suppliers.findFirst.mockResolvedValue(null);
      mockPrismaService.suppliers.create.mockResolvedValue(mockSupplier);

      const result = await service.create(createSupplierDto, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('三一重工');
      expect(mockPrismaService.suppliers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '三一重工',
          created_by: 1,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when supplier name already exists', async () => {
      mockPrismaService.suppliers.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.create(createSupplierDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createSupplierDto, 1)).rejects.toThrow(
        '供应商名称已存在',
      );
    });
  });

  describe('findAll', () => {
    const mockSuppliers = [
      {
        id: 1,
        name: '三一重工',
        type: 'cement',
        credit_rating: 'A',
        creator: { id: 1, username: 'admin', name: '管理员' },
        _count: { materials: 5 },
      },
    ];

    it('should return paginated suppliers', async () => {
      mockPrismaService.suppliers.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.suppliers.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockSuppliers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by name', async () => {
      mockPrismaService.suppliers.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.suppliers.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, name: '三一' });

      expect(mockPrismaService.suppliers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: { contains: '三一' } }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.suppliers.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.suppliers.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, type: 'cement' });

      expect(mockPrismaService.suppliers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'cement' }),
        }),
      );
    });

    it('should filter by credit rating', async () => {
      mockPrismaService.suppliers.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.suppliers.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, creditRating: 'A' });

      expect(mockPrismaService.suppliers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ credit_rating: 'A' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockSupplier = {
      id: 1,
      name: '三一重工',
      creator: { id: 1, username: 'admin', name: '管理员' },
      materials: [],
    };

    it('should return supplier by id', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('供应商不存在');
    });
  });

  describe('update', () => {
    const mockSupplier = {
      id: 1,
      name: '三一重工',
    };

    const updateDto = {
      name: '三一重工集团',
      contactPerson: '李四',
      creditRating: 'A',
    };

    it('should update supplier successfully', async () => {
      const updatedSupplier = {
        ...mockSupplier,
        ...updateDto,
      };

      mockPrismaService.suppliers.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.suppliers.findFirst.mockResolvedValue(null);
      mockPrismaService.suppliers.update.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('三一重工集团');
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new name already exists', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.suppliers.findFirst.mockResolvedValue({ id: 2 });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        '供应商名称已存在',
      );
    });

    it('should allow updating same name', async () => {
      const dtoSameName = { ...updateDto, name: '三一重工' };
      const updatedSupplier = { ...mockSupplier };

      mockPrismaService.suppliers.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.suppliers.update.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, dtoSameName, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.suppliers.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockSupplier = {
      id: 1,
      name: '三一重工',
      _count: { materials: 0 },
    };

    it('should delete supplier successfully', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.suppliers.update.mockResolvedValue({
        ...mockSupplier,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({ message: '供应商已删除' });
      expect(mockPrismaService.suppliers.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when supplier has related materials', async () => {
      mockPrismaService.suppliers.findUnique.mockResolvedValue({
        ...mockSupplier,
        _count: { materials: 5 },
      });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      await expect(service.remove(1)).rejects.toThrow(
        '该供应商有关联的材料，不能删除',
      );
    });
  });

  describe('getStatistics', () => {
    it('should return supplier statistics', async () => {
      mockPrismaService.suppliers.count.mockResolvedValue(10);
      mockPrismaService.suppliers.groupBy
        .mockResolvedValueOnce([
          { type: 'cement', _count: 3 },
          { type: 'sand', _count: 4 },
          { type: 'stone', _count: 3 },
        ])
        .mockResolvedValueOnce([
          { credit_rating: 'A', _count: 5 },
          { credit_rating: 'B', _count: 3 },
          { credit_rating: 'C', _count: 2 },
        ]);

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalSuppliers: 10,
        suppliersByType: [
          { type: 'cement', _count: 3 },
          { type: 'sand', _count: 4 },
          { type: 'stone', _count: 3 },
        ],
        suppliersByCreditRating: [
          { credit_rating: 'A', _count: 5 },
          { credit_rating: 'B', _count: 3 },
          { credit_rating: 'C', _count: 2 },
        ],
      });
    });
  });
});


