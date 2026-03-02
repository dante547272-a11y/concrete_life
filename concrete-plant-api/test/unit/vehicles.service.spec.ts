import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from '../../src/vehicles/vehicles.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    vehicles: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    sites: {
      findUnique: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createVehicleDto = {
      siteId: 1,
      licensePlate: '粤A12345',
      vehicleType: 'mixer_truck',
      brand: '三一重工',
      model: 'SY5310GJB',
      capacity: 10,
      purchaseDate: '2024-01-01',
      status: 'available',
      responsibleUserId: 1,
      remarks: '测试车辆',
    };

    const mockSite = { id: 1, name: '站点1' };
    const mockUser = { id: 1, username: 'admin', name: '管理员' };
    const mockVehicle = {
      id: 1,
      ...createVehicleDto,
      site: mockSite,
      responsible_user: mockUser,
      creator: mockUser,
    };

    it('should create vehicle successfully', async () => {
      mockPrismaService.vehicles.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.vehicles.create.mockResolvedValue(mockVehicle);

      const result = await service.create(createVehicleDto, 1);

      expect(result).toBeDefined();
      expect(result.license_plate).toBe('粤A12345');
      expect(mockPrismaService.vehicles.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          license_plate: '粤A12345',
          vehicle_type: 'mixer_truck',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when license plate already exists', async () => {
      mockPrismaService.vehicles.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        '车牌号已存在',
      );
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.vehicles.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(null);

      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        '站点不存在',
      );
    });

    it('should throw NotFoundException when responsible user not found', async () => {
      mockPrismaService.vehicles.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createVehicleDto, 1)).rejects.toThrow(
        '负责人不存在',
      );
    });

    it('should create vehicle without responsible user', async () => {
      const dtoWithoutUser = { ...createVehicleDto, responsibleUserId: undefined };

      mockPrismaService.vehicles.findFirst.mockResolvedValue(null);
      mockPrismaService.sites.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.vehicles.create.mockResolvedValue(mockVehicle);

      const result = await service.create(dtoWithoutUser, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.users.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockVehicles = [
      {
        id: 1,
        license_plate: '粤A12345',
        vehicle_type: 'mixer_truck',
        status: 'available',
        site: { id: 1, name: '站点1' },
        responsible_user: { id: 1, username: 'admin', name: '管理员' },
        creator: { id: 1, username: 'admin', name: '管理员' },
      },
    ];

    it('should return paginated vehicles', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockPrismaService.vehicles.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockVehicles,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by siteId', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockPrismaService.vehicles.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, siteId: 1 });

      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter by license plate', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockPrismaService.vehicles.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, licensePlate: '粤A' });

      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ license_plate: { contains: '粤A' } }),
        }),
      );
    });

    it('should filter by vehicle type', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockPrismaService.vehicles.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, vehicleType: 'mixer_truck' });

      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vehicle_type: 'mixer_truck' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockPrismaService.vehicles.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'available' });

      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'available' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockVehicle = {
      id: 1,
      license_plate: '粤A12345',
      site: { id: 1, name: '站点1' },
      responsible_user: { id: 1, username: 'admin', name: '管理员' },
      creator: { id: 1, username: 'admin', name: '管理员' },
      tasks: [],
    };

    it('should return vehicle by id', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockVehicle);
      expect(mockPrismaService.vehicles.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('车辆不存在');
    });
  });

  describe('update', () => {
    const mockVehicle = {
      id: 1,
      license_plate: '粤A12345',
      site_id: 1,
      status: 'available',
    };

    const updateDto = {
      licensePlate: '粤A54321',
      brand: '中联重科',
      capacity: 12,
      remarks: '更新备注',
    };

    it('should update vehicle successfully', async () => {
      const updatedVehicle = {
        ...mockVehicle,
        ...updateDto,
        site: { id: 1, name: '站点1' },
        responsible_user: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicles.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicles.update.mockResolvedValue(updatedVehicle);

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.vehicles.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new license plate already exists', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicles.findFirst.mockResolvedValue({ id: 2 });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        '车牌号已存在',
      );
    });

    it('should throw NotFoundException when new responsible user not found', async () => {
      const dtoWithUser = { ...updateDto, responsibleUserId: 999 };

      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.update(1, dtoWithUser, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, dtoWithUser, 1)).rejects.toThrow(
        '负责人不存在',
      );
    });

    it('should allow updating same license plate', async () => {
      const dtoSamePlate = { ...updateDto, licensePlate: '粤A12345' };
      const updatedVehicle = {
        ...mockVehicle,
        site: { id: 1, name: '站点1' },
        responsible_user: null,
      };

      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicles.update.mockResolvedValue(updatedVehicle);

      const result = await service.update(1, dtoSamePlate, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.vehicles.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockVehicle = {
      id: 1,
      license_plate: '粤A12345',
      status: 'available',
    };

    it('should delete vehicle successfully', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicles.update.mockResolvedValue({
        ...mockVehicle,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({ message: '车辆已删除' });
      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when vehicle is in use', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue({
        ...mockVehicle,
        status: 'in_use',
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow('使用中的车辆不能删除');
    });
  });

  describe('updateStatus', () => {
    const mockVehicle = {
      id: 1,
      license_plate: '粤A12345',
      status: 'available',
    };

    it('should update vehicle status successfully', async () => {
      const updatedVehicle = {
        ...mockVehicle,
        status: 'in_use',
        site: { id: 1, name: '站点1' },
        responsible_user: { id: 1, username: 'admin', name: '管理员' },
      };

      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicles.update.mockResolvedValue(updatedVehicle);

      const result = await service.updateStatus(1, 'in_use', 1);

      expect(result.status).toBe('in_use');
      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'in_use',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockPrismaService.vehicles.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'in_use', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return vehicle statistics', async () => {
      mockPrismaService.vehicles.count
        .mockResolvedValueOnce(20) // totalVehicles
        .mockResolvedValueOnce(10) // available
        .mockResolvedValueOnce(5)  // in_use
        .mockResolvedValueOnce(3)  // maintenance
        .mockResolvedValueOnce(2)  // broken
        .mockResolvedValueOnce(15) // mixer_truck
        .mockResolvedValueOnce(5); // pump_truck

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalVehicles: 20,
        statusCount: {
          available: 10,
          inUse: 5,
          maintenance: 3,
          broken: 2,
        },
        typeCount: {
          mixerTruck: 15,
          pumpTruck: 5,
        },
      });
    });

    it('should filter statistics by siteId', async () => {
      mockPrismaService.vehicles.count.mockResolvedValue(10);

      await service.getStatistics(1);

      expect(mockPrismaService.vehicles.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });
  });

  describe('getAvailableVehicles', () => {
    const mockVehicles = [
      {
        id: 1,
        license_plate: '粤A12345',
        status: 'available',
        site: { id: 1, name: '站点1' },
        responsible_user: { id: 1, username: 'admin', name: '管理员' },
      },
      {
        id: 2,
        license_plate: '粤A54321',
        status: 'available',
        site: { id: 1, name: '站点1' },
        responsible_user: null,
      },
    ];

    it('should return all available vehicles', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);

      const result = await service.getAvailableVehicles();

      expect(result).toEqual(mockVehicles);
      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith({
        where: { status: 'available' },
        include: expect.any(Object),
        orderBy: { license_plate: 'asc' },
      });
    });

    it('should filter available vehicles by siteId', async () => {
      mockPrismaService.vehicles.findMany.mockResolvedValue(mockVehicles);

      await service.getAvailableVehicles(1);

      expect(mockPrismaService.vehicles.findMany).toHaveBeenCalledWith({
        where: { status: 'available', site_id: 1 },
        include: expect.any(Object),
        orderBy: { license_plate: 'asc' },
      });
    });
  });
});


