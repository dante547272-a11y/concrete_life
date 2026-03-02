import { Test, TestingModule } from '@nestjs/testing';
import { SitesService } from '../../src/sites/sites.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('SitesService', () => {
  let service: SitesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sites: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
    orders: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    production_batches: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    vehicles: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    materials: {
      count: jest.fn(),
      fields: {
        min_stock: 'min_stock',
      },
    },
    tasks: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSiteDto = {
      code: 'SITE001',
      name: '测试站点',
      type: 'production',
      address: '广东省广州市天河区',
      contactPerson: '张三',
      contactPhone: '13800138000',
      managerId: 1,
      latitude: 23.1291,
      longitude: 113.2644,
      remarks: '测试站点',
    };

    const mockManager = { id: 1, username: 'admin', name: '管理员' };
    const mockSite = {
      id: 1,
      ...createSiteDto,
      status: 'active',
      manager: mockManager,
    };

    it('should create site successfully', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);
      mockPrismaService.users.findUnique.mockResolvedValue(mockManager);
      mockPrismaService.sites.create.mockResolvedValue(mockSite);

      const result = await service.create(createSiteDto, 1);

      expect(result).toBeDefined();
      expect(result.code).toBe('SITE001');
      expect(mockPrismaService.sites.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'SITE001',
          status: 'active',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when site code already exists', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.create(createSiteDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createSiteDto, 1)).rejects.toThrow(
        '站点代码已存在',
      );
    });

    it('should throw NotFoundException when manager not found', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.create(createSiteDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createSiteDto, 1)).rejects.toThrow(
        '负责人不存在',
      );
    });

    it('should create site without manager', async () => {
      const dtoWithoutManager = { ...createSiteDto, managerId: undefined };

      mockPrismaService.sites.findUnique.mockResolvedValue(null);
      mockPrismaService.sites.create.mockResolvedValue(mockSite);

      const result = await service.create(dtoWithoutManager, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.users.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockSites = [
      {
        id: 1,
        code: 'SITE001',
        name: '站点1',
        type: 'production',
        status: 'active',
        manager: { id: 1, username: 'admin', name: '管理员' },
        _count: {
          orders: 10,
          tasks: 5,
          production_batches: 8,
          vehicles: 3,
          materials: 15,
        },
      },
    ];

    it('should return paginated sites', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);
      mockPrismaService.sites.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockSites,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by code', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);
      mockPrismaService.sites.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, code: 'SITE' });

      expect(mockPrismaService.sites.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ code: { contains: 'SITE' } }),
        }),
      );
    });

    it('should filter by name', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);
      mockPrismaService.sites.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, name: '站点' });

      expect(mockPrismaService.sites.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: { contains: '站点' } }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);
      mockPrismaService.sites.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, type: 'production' });

      expect(mockPrismaService.sites.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'production' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);
      mockPrismaService.sites.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'active' });

      expect(mockPrismaService.sites.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockSite = {
      id: 1,
      code: 'SITE001',
      name: '站点1',
      manager: { id: 1, username: 'admin', name: '管理员', phone: '13800138000', email: 'admin@example.com' },
      _count: {
        orders: 10,
        tasks: 5,
        production_batches: 8,
        vehicles: 3,
        materials: 15,
      },
    };

    it('should return site by id', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSite);
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('站点不存在');
    });
  });

  describe('update', () => {
    const mockSite = {
      id: 1,
      code: 'SITE001',
      name: '站点1',
      status: 'active',
    };

    const updateDto = {
      name: '更新站点',
      address: '新地址',
      contactPerson: '李四',
      remarks: '更新备注',
    };

    it('should update site successfully', async () => {
      const updatedSite = {
        ...mockSite,
        ...updateDto,
        manager: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.sites.update.mockResolvedValue(updatedSite);

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('更新站点');
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new code already exists', async () => {
      const dtoWithCode = { ...updateDto, code: 'SITE002' };

      mockPrismaService.sites.findUnique
        .mockResolvedValueOnce(mockSite)
        .mockResolvedValueOnce({ id: 2, code: 'SITE002' });

      await expect(service.update(1, dtoWithCode, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, dtoWithCode, 1)).rejects.toThrow(
        '站点代码已存在',
      );
    });

    it('should throw NotFoundException when new manager not found', async () => {
      const dtoWithManager = { ...updateDto, managerId: 999 };

      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.update(1, dtoWithManager, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, dtoWithManager, 1)).rejects.toThrow(
        '负责人不存在',
      );
    });

    it('should allow updating same code', async () => {
      const dtoSameCode = { ...updateDto, code: 'SITE001' };
      const updatedSite = {
        ...mockSite,
        manager: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.sites.update.mockResolvedValue(updatedSite);

      const result = await service.update(1, dtoSameCode, 1);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    const mockSite = {
      id: 1,
      code: 'SITE001',
      _count: {
        orders: 0,
        tasks: 0,
        production_batches: 0,
        vehicles: 0,
        materials: 0,
      },
    };

    it('should delete site successfully', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.sites.delete.mockResolvedValue(mockSite);

      const result = await service.remove(1);

      expect(result).toEqual({ message: '站点删除成功' });
      expect(mockPrismaService.sites.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when site has related orders', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue({
        ...mockSite,
        _count: { ...mockSite._count, orders: 5 },
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow(
        '站点存在关联数据，无法删除',
      );
    });

    it('should throw BadRequestException when site has related vehicles', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue({
        ...mockSite,
        _count: { ...mockSite._count, vehicles: 3 },
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const mockSite = {
      id: 1,
      code: 'SITE001',
      status: 'active',
    };

    it('should update site status successfully', async () => {
      const updatedSite = {
        ...mockSite,
        status: 'inactive',
        manager: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.sites.update.mockResolvedValue(updatedSite);

      const result = await service.updateStatus(1, 'inactive', 1);

      expect(result.status).toBe('inactive');
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'inactive', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return overall statistics', async () => {
      mockPrismaService.sites.count
        .mockResolvedValueOnce(10) // totalSites
        .mockResolvedValueOnce(7)  // activeSites
        .mockResolvedValueOnce(2)  // inactiveSites
        .mockResolvedValueOnce(1); // maintenanceSites

      mockPrismaService.orders.count.mockResolvedValue(50);
      mockPrismaService.production_batches.count.mockResolvedValue(30);
      mockPrismaService.vehicles.count.mockResolvedValue(15);
      mockPrismaService.materials.count.mockResolvedValue(100);

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalSites: 10,
        activeSites: 7,
        inactiveSites: 2,
        maintenanceSites: 1,
        totalOrders: 50,
        totalBatches: 30,
        totalVehicles: 15,
        totalMaterials: 100,
      });
    });

    it('should return statistics for specific site', async () => {
      mockPrismaService.sites.count.mockResolvedValue(1);
      mockPrismaService.orders.count.mockResolvedValue(10);
      mockPrismaService.production_batches.count.mockResolvedValue(5);
      mockPrismaService.vehicles.count.mockResolvedValue(3);
      mockPrismaService.materials.count.mockResolvedValue(20);

      await service.getStatistics(1);

      expect(mockPrismaService.sites.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  });

  describe('getDetailedStatistics', () => {
    const mockSite = {
      id: 1,
      code: 'SITE001',
      name: '站点1',
      manager: { id: 1, username: 'admin', name: '管理员', phone: '13800138000', email: 'admin@example.com' },
      _count: {
        orders: 10,
        tasks: 5,
        production_batches: 8,
        vehicles: 3,
        materials: 15,
      },
    };

    it('should return detailed statistics', async () => {
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.orders.count.mockResolvedValue(5);
      mockPrismaService.production_batches.count.mockResolvedValue(3);
      mockPrismaService.production_batches.aggregate.mockResolvedValue({
        _sum: { actual_quantity: 150 },
      });
      mockPrismaService.orders.groupBy.mockResolvedValue([
        { status: 'pending', _count: 2 },
        { status: 'confirmed', _count: 3 },
      ]);
      mockPrismaService.tasks.groupBy.mockResolvedValue([
        { status: 'pending', _count: 1 },
        { status: 'in_transit', _count: 2 },
      ]);
      mockPrismaService.vehicles.groupBy.mockResolvedValue([
        { status: 'available', _count: 2 },
        { status: 'in_use', _count: 1 },
      ]);
      mockPrismaService.materials.count.mockResolvedValue(3);

      const result = await service.getDetailedStatistics(1);

      expect(result).toBeDefined();
      expect(result.site).toEqual(mockSite);
      expect(result.today).toEqual({
        orders: 5,
        batches: 3,
        production: 150,
      });
      expect(result.alerts).toEqual({
        lowStockMaterials: 3,
      });
    });
  });

  describe('findNearby', () => {
    const mockSites = [
      {
        id: 1,
        code: 'SITE001',
        name: '站点1',
        latitude: 23.1291,
        longitude: 113.2644,
        status: 'active',
        manager: { id: 1, username: 'admin', name: '管理员' },
      },
      {
        id: 2,
        code: 'SITE002',
        name: '站点2',
        latitude: 23.1500,
        longitude: 113.2800,
        status: 'active',
        manager: { id: 2, username: 'manager', name: '经理' },
      },
    ];

    it('should return nearby sites within radius', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);

      const result = await service.findNearby(23.1291, 113.2644, 50);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('distance');
    });

    it('should sort sites by distance', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);

      const result = await service.findNearby(23.1291, 113.2644, 50);

      // Check if sorted by distance
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].distance).toBeLessThanOrEqual(result[i + 1].distance);
      }
    });

    it('should filter sites beyond radius', async () => {
      mockPrismaService.sites.findMany.mockResolvedValue(mockSites);

      const result = await service.findNearby(23.1291, 113.2644, 1);

      // All returned sites should be within 1km
      result.forEach(site => {
        expect(site.distance).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance correctly', () => {
      // 使用反射访问私有方法进行测试
      const distance = (service as any).calculateDistance(
        23.1291, 113.2644, // 广州
        39.9042, 116.4074  // 北京
      );

      // 广州到北京大约1900km
      expect(distance).toBeGreaterThan(1800);
      expect(distance).toBeLessThan(2000);
    });

    it('should return 0 for same location', () => {
      const distance = (service as any).calculateDistance(
        23.1291, 113.2644,
        23.1291, 113.2644
      );

      expect(distance).toBe(0);
    });
  });
});


