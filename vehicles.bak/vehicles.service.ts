import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建车辆
   */
  async create(createVehicleDto: CreateVehicleDto, userId: number) {
    // 检查车牌号是否已存在
    const existingVehicle = await this.prisma.vehicles.findFirst({
      where: {
        license_plate: createVehicleDto.licensePlate,
        site_id: createVehicleDto.siteId,
      },
    });

    if (existingVehicle) {
      throw new ConflictException('车牌号已存在');
    }

    // 检查站点是否存在
    const site = await this.prisma.sites.findUnique({
      where: { id: createVehicleDto.siteId },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    // 如果指定了负责人，检查用户是否存在
    if (createVehicleDto.responsibleUserId) {
      const user = await this.prisma.users.findUnique({
        where: { id: createVehicleDto.responsibleUserId },
      });

      if (!user) {
        throw new NotFoundException('负责人不存在');
      }
    }

    // 创建车辆
    const vehicle = await this.prisma.vehicles.create({
      data: {
        site_id: createVehicleDto.siteId,
        license_plate: createVehicleDto.licensePlate,
        vehicle_type: createVehicleDto.vehicleType as any,
        brand: createVehicleDto.brand,
        model: createVehicleDto.model,
        capacity: createVehicleDto.capacity,
        purchase_date: createVehicleDto.purchaseDate ? new Date(createVehicleDto.purchaseDate) : null,
        status: (createVehicleDto.status as any) || 'available',
        responsible_user_id: createVehicleDto.responsibleUserId,
        remarks: createVehicleDto.remarks,
        created_by: userId,
      },
      include: {
        site: true,
        responsible_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return vehicle;
  }

  /**
   * 查询车辆列表
   */
  async findAll(query: QueryVehicleDto) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.siteId) {
      where.site_id = filters.siteId;
    }

    if (filters.licensePlate) {
      where.license_plate = { contains: filters.licensePlate };
    }

    if (filters.vehicleType) {
      where.vehicle_type = filters.vehicleType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.responsibleUserId) {
      where.responsible_user_id = filters.responsibleUserId;
    }

    // 查询数据
    const [vehicles, total] = await Promise.all([
      this.prisma.vehicles.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: true,
          responsible_user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.vehicles.count({ where }),
    ]);

    return {
      data: vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个车辆
   */
  async findOne(id: number) {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id },
      include: {
        site: true,
        responsible_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        tasks: {
          include: {
            order: true,
            driver: true,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    return vehicle;
  }

  /**
   * 更新车辆
   */
  async update(id: number, updateVehicleDto: UpdateVehicleDto, userId: number) {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    // 如果修改车牌号，检查是否重复
    if (updateVehicleDto.licensePlate && updateVehicleDto.licensePlate !== vehicle.license_plate) {
      const existingVehicle = await this.prisma.vehicles.findFirst({
        where: {
          license_plate: updateVehicleDto.licensePlate,
          site_id: vehicle.site_id,
          id: { not: id },
        },
      });

      if (existingVehicle) {
        throw new ConflictException('车牌号已存在');
      }
    }

    // 如果修改负责人，检查用户是否存在
    if (updateVehicleDto.responsibleUserId) {
      const user = await this.prisma.users.findUnique({
        where: { id: updateVehicleDto.responsibleUserId },
      });

      if (!user) {
        throw new NotFoundException('负责人不存在');
      }
    }

    // 更新车辆
    const updatedVehicle = await this.prisma.vehicles.update({
      where: { id },
      data: {
        license_plate: updateVehicleDto.licensePlate,
        vehicle_type: updateVehicleDto.vehicleType as any,
        brand: updateVehicleDto.brand,
        model: updateVehicleDto.model,
        capacity: updateVehicleDto.capacity,
        purchase_date: updateVehicleDto.purchaseDate ? new Date(updateVehicleDto.purchaseDate) : undefined,
        status: updateVehicleDto.status as any,
        responsible_user_id: updateVehicleDto.responsibleUserId,
        remarks: updateVehicleDto.remarks,
        updated_at: new Date(),
      },
      include: {
        site: true,
        responsible_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedVehicle;
  }

  /**
   * 删除车辆
   */
  async remove(id: number) {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    // 检查车辆状态
    if (vehicle.status === 'in_use') {
      throw new BadRequestException('使用中的车辆不能删除');
    }

    await this.prisma.vehicles.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return { message: '车辆已删除' };
  }

  /**
   * 更新车辆状态
   */
  async updateStatus(id: number, status: string, userId: number) {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    const updatedVehicle = await this.prisma.vehicles.update({
      where: { id },
      data: {
        status: status as any,
        updated_at: new Date(),
      },
      include: {
        site: true,
        responsible_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedVehicle;
  }

  /**
   * 获取车辆统计
   */
  async getStatistics(siteId?: number) {
    const where: any = {};

    if (siteId) {
      where.site_id = siteId;
    }

    const [
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      brokenVehicles,
      mixerTrucks,
      pumpTrucks,
    ] = await Promise.all([
      this.prisma.vehicles.count({ where }),
      this.prisma.vehicles.count({ where: { ...where, status: 'available' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'in_use' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'maintenance' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'broken' } }),
      this.prisma.vehicles.count({ where: { ...where, vehicle_type: 'mixer_truck' } }),
      this.prisma.vehicles.count({ where: { ...where, vehicle_type: 'pump_truck' } }),
    ]);

    return {
      totalVehicles,
      statusCount: {
        available: availableVehicles,
        inUse: inUseVehicles,
        maintenance: maintenanceVehicles,
        broken: brokenVehicles,
      },
      typeCount: {
        mixerTruck: mixerTrucks,
        pumpTruck: pumpTrucks,
      },
    };
  }

  /**
   * 获取可用车辆列表
   */
  async getAvailableVehicles(siteId?: number) {
    const where: any = {
      status: 'available',
    };

    if (siteId) {
      where.site_id = siteId;
    }

    const vehicles = await this.prisma.vehicles.findMany({
      where,
      include: {
        site: true,
        responsible_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        license_plate: 'asc',
      },
    });

    return vehicles;
  }
}
