import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../../src/tasks/tasks.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    orders: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vehicles: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    drivers: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tasks: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto = {
      orderId: 1,
      vehicleId: 1,
      driverId: 1,
      deliveryVolume: 10,
      deliveryAddress: '测试地址',
      scheduledTime: '2026-01-27T10:00:00Z',
      priority: 'normal',
      remarks: '测试任务',
    };

    const mockOrder = {
      id: 1,
      order_number: 'ORD001',
      status: 'confirmed',
      site_id: 1,
      construction_site: '工地地址',
      order_items: [],
    };

    const mockVehicle = {
      id: 1,
      license_plate: '粤A12345',
      status: 'available',
    };

    const mockDriver = {
      id: 1,
      name: '张三',
      status: 'available',
    };

    const mockTask = {
      id: 1,
      task_no: 'TASK202601270001',
      order_id: 1,
      vehicle_id: 1,
      driver_id: 1,
      status: 'pending',
      order: mockOrder,
      vehicle: mockVehicle,
      driver: mockDriver,
      site: { id: 1, name: '站点1' },
      creator: { id: 1, username: 'admin', name: '管理员' },
    };

    it('should create task successfully', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue(mockDriver);
      mockPrismaService.tasks.create.mockResolvedValue(mockTask);
      mockPrismaService.tasks.count.mockResolvedValue(0);
      mockPrismaService.vehicles.update.mockResolvedValue({ ...mockVehicle, status: 'in_use' });
      mockPrismaService.drivers.update.mockResolvedValue({ ...mockDriver, status: 'on_duty' });
      mockPrismaService.orders.update.mockResolvedValue({ ...mockOrder, status: 'in_production' });

      const result = await service.create(createTaskDto, 1);

      expect(result).toBeDefined();
      expect(result.task_no).toContain('TASK');
      expect(mockPrismaService.tasks.create).toHaveBeenCalled();
      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'in_use' },
      });
      expect(mockPrismaService.drivers.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'on_duty' },
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(null);

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '订单不存在',
      );
    });

    it('should throw BadRequestException when order status is invalid', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'pending',
      });

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '只能为已确认或生产中的订单创建任务',
      );
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(null);

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '车辆不存在',
      );
    });

    it('should throw BadRequestException when vehicle is not available', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vehicles.findUnique.mockResolvedValue({
        ...mockVehicle,
        status: 'in_use',
      });

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '车辆当前不可用',
      );
    });

    it('should throw NotFoundException when driver not found', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue(null);

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '司机不存在',
      );
    });

    it('should throw BadRequestException when driver is not available', async () => {
      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue({
        ...mockDriver,
        status: 'on_duty',
      });

      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTaskDto, 1)).rejects.toThrow(
        '司机当前不可用',
      );
    });

    it('should create task without vehicle and driver', async () => {
      const dtoWithoutVehicleDriver = {
        ...createTaskDto,
        vehicleId: undefined,
        driverId: undefined,
      };

      mockPrismaService.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.tasks.create.mockResolvedValue(mockTask);
      mockPrismaService.tasks.count.mockResolvedValue(0);
      mockPrismaService.orders.update.mockResolvedValue({ ...mockOrder, status: 'in_production' });

      const result = await service.create(dtoWithoutVehicleDriver, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.vehicles.update).not.toHaveBeenCalled();
      expect(mockPrismaService.drivers.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockTasks = [
      {
        id: 1,
        task_no: 'TASK202601270001',
        status: 'pending',
        order: { id: 1, order_number: 'ORD001', order_items: [] },
        vehicle: { id: 1, license_plate: '粤A12345' },
        driver: { id: 1, name: '张三' },
        site: { id: 1, name: '站点1' },
        creator: { id: 1, username: 'admin', name: '管理员' },
      },
    ];

    it('should return paginated tasks', async () => {
      mockPrismaService.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.tasks.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockTasks,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by siteId', async () => {
      mockPrismaService.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.tasks.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, siteId: 1 });

      expect(mockPrismaService.tasks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.tasks.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'pending' });

      expect(mockPrismaService.tasks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.tasks.count.mockResolvedValue(1);

      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      await service.findAll({ page: 1, limit: 10, startDate, endDate });

      expect(mockPrismaService.tasks.findMany).toHaveBeenCalledWith(
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
    const mockTask = {
      id: 1,
      task_no: 'TASK202601270001',
      order: { id: 1, order_number: 'ORD001', order_items: [] },
      vehicle: { id: 1, license_plate: '粤A12345' },
      driver: { id: 1, name: '张三' },
      site: { id: 1, name: '站点1' },
      creator: { id: 1, username: 'admin', name: '管理员' },
      production_batches: [],
    };

    it('should return task by id', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('任务不存在');
    });
  });

  describe('update', () => {
    const mockTask = {
      id: 1,
      status: 'pending',
      vehicle_id: null,
      driver_id: null,
    };

    const updateDto = {
      vehicleId: 1,
      driverId: 1,
      deliveryVolume: 15,
      remarks: '更新备注',
    };

    const mockVehicle = { id: 1, status: 'available' };
    const mockDriver = { id: 1, status: 'available' };

    it('should update task successfully', async () => {
      const updatedTask = {
        ...mockTask,
        ...updateDto,
        order: { id: 1, order_number: 'ORD001' },
        vehicle: mockVehicle,
        driver: mockDriver,
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue(mockDriver);
      mockPrismaService.vehicles.update.mockResolvedValue({ ...mockVehicle, status: 'in_use' });
      mockPrismaService.drivers.update.mockResolvedValue({ ...mockDriver, status: 'on_duty' });
      mockPrismaService.tasks.update.mockResolvedValue(updatedTask);

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
      expect(mockPrismaService.tasks.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when task is completed', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue({
        ...mockTask,
        status: 'completed',
      });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        '已完成或已取消的任务不能修改',
      );
    });

    it('should release old vehicle when changing vehicle', async () => {
      const taskWithVehicle = { ...mockTask, vehicle_id: 2 };
      
      mockPrismaService.tasks.findUnique.mockResolvedValue(taskWithVehicle);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue(mockDriver);
      mockPrismaService.vehicles.update.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.update.mockResolvedValue(mockDriver);
      mockPrismaService.tasks.update.mockResolvedValue({});

      await service.update(1, updateDto, 1);

      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'available' },
      });
    });
  });

  describe('assign', () => {
    const mockTask = {
      id: 1,
      status: 'pending',
    };

    const assignDto = {
      vehicleId: 1,
      driverId: 1,
      scheduledTime: '2026-01-27T10:00:00Z',
    };

    const mockVehicle = { id: 1, status: 'available' };
    const mockDriver = { id: 1, status: 'available' };

    it('should assign task successfully', async () => {
      const assignedTask = {
        ...mockTask,
        status: 'assigned',
        vehicle_id: 1,
        driver_id: 1,
        order: { id: 1, order_number: 'ORD001' },
        vehicle: mockVehicle,
        driver: mockDriver,
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.vehicles.findUnique.mockResolvedValue(mockVehicle);
      mockPrismaService.drivers.findUnique.mockResolvedValue(mockDriver);
      mockPrismaService.tasks.update.mockResolvedValue(assignedTask);
      mockPrismaService.vehicles.update.mockResolvedValue({ ...mockVehicle, status: 'in_use' });
      mockPrismaService.drivers.update.mockResolvedValue({ ...mockDriver, status: 'on_duty' });

      const result = await service.assign(1, assignDto, 1);

      expect(result.status).toBe('assigned');
      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'in_use' },
      });
      expect(mockPrismaService.drivers.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'on_duty' },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(null);

      await expect(service.assign(999, assignDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when task is not pending', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue({
        ...mockTask,
        status: 'assigned',
      });

      await expect(service.assign(1, assignDto, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assign(1, assignDto, 1)).rejects.toThrow(
        '只能分配待分配状态的任务',
      );
    });
  });

  describe('updateStatus', () => {
    const mockTask = {
      id: 1,
      status: 'pending',
      vehicle_id: 1,
      driver_id: 1,
      vehicle: { id: 1, status: 'in_use' },
      driver: { id: 1, status: 'on_duty' },
    };

    it('should update status from pending to assigned', async () => {
      const updatedTask = {
        ...mockTask,
        status: 'assigned',
        order: { id: 1, order_number: 'ORD001' },
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.tasks.update.mockResolvedValue(updatedTask);

      const result = await service.updateStatus(1, 'assigned', 1);

      expect(result.status).toBe('assigned');
    });

    it('should update status from assigned to in_transit', async () => {
      const taskAssigned = { ...mockTask, status: 'assigned' };
      const updatedTask = {
        ...taskAssigned,
        status: 'in_transit',
        departure_time: new Date(),
        order: { id: 1, order_number: 'ORD001' },
        vehicle: mockTask.vehicle,
        driver: mockTask.driver,
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.tasks.findUnique.mockResolvedValue(taskAssigned);
      mockPrismaService.tasks.update.mockResolvedValue(updatedTask);

      const result = await service.updateStatus(1, 'in_transit', 1);

      expect(result.status).toBe('in_transit');
      expect(mockPrismaService.tasks.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'in_transit',
          departure_time: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should release resources when task completed', async () => {
      const taskUnloading = { ...mockTask, status: 'unloading' };
      const completedTask = {
        ...taskUnloading,
        status: 'completed',
        completion_time: new Date(),
        order: { id: 1, order_number: 'ORD001' },
        vehicle: mockTask.vehicle,
        driver: mockTask.driver,
        site: { id: 1, name: '站点1' },
      };

      mockPrismaService.tasks.findUnique.mockResolvedValue(taskUnloading);
      mockPrismaService.tasks.update.mockResolvedValue(completedTask);
      mockPrismaService.vehicles.update.mockResolvedValue({ id: 1, status: 'available' });
      mockPrismaService.drivers.update.mockResolvedValue({ id: 1, status: 'available' });

      const result = await service.updateStatus(1, 'completed', 1);

      expect(result.status).toBe('completed');
      expect(mockPrismaService.vehicles.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'available' },
      });
      expect(mockPrismaService.drivers.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'available' },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'assigned', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);

      await expect(service.updateStatus(1, 'completed', 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateStatus(1, 'completed', 1)).rejects.toThrow(
        /任务状态不能从/,
      );
    });
  });

  describe('remove', () => {
    const mockTask = {
      id: 1,
      status: 'pending',
      vehicle_id: 1,
      driver_id: 1,
    };

    it('should delete task successfully', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.vehicles.update.mockResolvedValue({ id: 1, status: 'available' });
      mockPrismaService.drivers.update.mockResolvedValue({ id: 1, status: 'available' });
      mockPrismaService.tasks.update.mockResolvedValue({
        ...mockTask,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({ message: '任务已删除' });
      expect(mockPrismaService.vehicles.update).toHaveBeenCalled();
      expect(mockPrismaService.drivers.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when task is in progress', async () => {
      mockPrismaService.tasks.findUnique.mockResolvedValue({
        ...mockTask,
        status: 'in_transit',
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow('进行中的任务不能删除');
    });
  });

  describe('getStatistics', () => {
    it('should return task statistics', async () => {
      mockPrismaService.tasks.count
        .mockResolvedValueOnce(20) // totalTasks
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(5)  // assigned
        .mockResolvedValueOnce(4)  // in_transit
        .mockResolvedValueOnce(2)  // arrived
        .mockResolvedValueOnce(1)  // unloading
        .mockResolvedValueOnce(4)  // completed
        .mockResolvedValueOnce(1); // cancelled

      mockPrismaService.tasks.aggregate.mockResolvedValue({
        _sum: { delivery_volume: 200 },
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalTasks: 20,
        statusCount: {
          pending: 3,
          assigned: 5,
          inTransit: 4,
          arrived: 2,
          unloading: 1,
          completed: 4,
          cancelled: 1,
        },
        totalVolume: 200,
      });
    });

    it('should filter statistics by siteId', async () => {
      mockPrismaService.tasks.count.mockResolvedValue(10);
      mockPrismaService.tasks.aggregate.mockResolvedValue({
        _sum: { delivery_volume: 100 },
      });

      await service.getStatistics(1);

      expect(mockPrismaService.tasks.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ site_id: 1 }),
        }),
      );
    });

    it('should return 0 for totalVolume when no tasks', async () => {
      mockPrismaService.tasks.count.mockResolvedValue(0);
      mockPrismaService.tasks.aggregate.mockResolvedValue({
        _sum: { delivery_volume: null },
      });

      const result = await service.getStatistics();

      expect(result.totalVolume).toBe(0);
    });
  });
});


