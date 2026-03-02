import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建站点
   */
  async create(createSiteDto: CreateSiteDto, userId: number) {
    // 检查站点代码是否已存在
    const existingSite = await this.prisma.site.findUnique({
      where: { code: createSiteDto.code },
    });

    if (existingSite) {
      throw new ConflictException('站点代码已存在');
    }

    // 如果指定了负责人，检查负责人是否存在
    if (createSiteDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createSiteDto.managerId },
      });

      if (!manager) {
        throw new NotFoundException('负责人不存在');
      }
    }

    // 创建站点
    const site = await this.prisma.site.create({
      data: {
        code: createSiteDto.code,
        name: createSiteDto.name,
        type: createSiteDto.type as any,
        address: createSiteDto.address,
        contact_person: createSiteDto.contactPerson,
        contact_phone: createSiteDto.contactPhone,
        manager_id: createSiteDto.managerId,
        latitude: createSiteDto.latitude,
        longitude: createSiteDto.longitude,
        status: 'active',
        remarks: createSiteDto.remarks,
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return site;
  }

  /**
   * 查询站点列表
   */
  async findAll(query: QuerySiteDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }

    if (filters.name) {
      where.name = { contains: filters.name };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.managerId) {
      where.manager_id = filters.managerId;
    }

    // 查询数据
    const [sites, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take: limit,
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          _count: {
            select: {
              orders: true,
              tasks: true,
              production_batches: true,
              vehicles: true,
              materials: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      data: sites,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个站点
   */
  async findOne(id: number) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            orders: true,
            tasks: true,
            production_batches: true,
            vehicles: true,
            materials: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    return site;
  }

  /**
   * 更新站点
   */
  async update(id: number, updateSiteDto: UpdateSiteDto, userId: number) {
    const site = await this.prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    // 如果更新站点代码，检查是否与其他站点冲突
    if (updateSiteDto.code && updateSiteDto.code !== site.code) {
      const existingSite = await this.prisma.site.findUnique({
        where: { code: updateSiteDto.code },
      });

      if (existingSite) {
        throw new ConflictException('站点代码已存在');
      }
    }

    // 如果更新负责人，检查负责人是否存在
    if (updateSiteDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateSiteDto.managerId },
      });

      if (!manager) {
        throw new NotFoundException('负责人不存在');
      }
    }

    // 更新站点
    const updatedSite = await this.prisma.site.update({
      where: { id },
      data: {
        code: updateSiteDto.code,
        name: updateSiteDto.name,
        type: updateSiteDto.type as any,
        address: updateSiteDto.address,
        contact_person: updateSiteDto.contactPerson,
        contact_phone: updateSiteDto.contactPhone,
        manager_id: updateSiteDto.managerId,
        latitude: updateSiteDto.latitude,
        longitude: updateSiteDto.longitude,
        status: updateSiteDto.status as any,
        remarks: updateSiteDto.remarks,
        updatedAt: new Date(),
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedSite;
  }

  /**
   * 删除站点
   */
  async remove(id: number) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            tasks: true,
            production_batches: true,
            vehicles: true,
            materials: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    // 检查是否有关联数据
    const hasRelatedData = 
      site._count.orders > 0 ||
      site._count.tasks > 0 ||
      site._count.production_batches > 0 ||
      site._count.vehicles > 0 ||
      site._count.materials > 0;

    if (hasRelatedData) {
      throw new BadRequestException('站点存在关联数据，无法删除。请先删除或转移相关数据。');
    }

    await this.prisma.site.delete({
      where: { id },
    });

    return { message: '站点删除成功' };
  }

  /**
   * 更新站点状态
   */
  async updateStatus(id: number, status: string, userId: number) {
    const site = await this.prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    const updatedSite = await this.prisma.site.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedSite;
  }

  /**
   * 获取站点统计
   */
  async getStatistics(id?: number) {
    const where: any = id ? { id } : {};

    const [
      totalSites,
      activeSites,
      inactiveSites,
      maintenanceSites,
      totalOrders,
      totalBatches,
      totalVehicles,
      totalMaterials,
    ] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.count({ where: { ...where, status: 'active' } }),
      this.prisma.site.count({ where: { ...where, status: 'inactive' } }),
      this.prisma.site.count({ where: { ...where, status: 'maintenance' } }),
      this.prisma.orders.count({ where: id ? { siteId: id } : {} }),
      this.prisma.production_batches.count({ where: id ? { siteId: id } : {} }),
      this.prisma.vehicles.count({ where: id ? { siteId: id } : {} }),
      this.prisma.material.count({ where: id ? { siteId: id } : {} }),
    ]);

    return {
      totalSites,
      activeSites,
      inactiveSites,
      maintenanceSites,
      totalOrders,
      totalBatches,
      totalVehicles,
      totalMaterials,
    };
  }

  /**
   * 获取站点详细统计（包含业务数据）
   */
  async getDetailedStatistics(id: number) {
    const site = await this.findOne(id);

    // 获取今日数据
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayOrders,
      todayBatches,
      todayProduction,
      ordersByStatus,
      tasksByStatus,
      vehiclesByStatus,
      lowStockMaterials,
    ] = await Promise.all([
      // 今日订单数
      this.prisma.orders.count({
        where: {
          siteId: id,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // 今日批次数
      this.prisma.production_batches.count({
        where: {
          siteId: id,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // 今日产量
      this.prisma.production_batches.aggregate({
        where: {
          siteId: id,
          status: 'completed',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { actualQuantity: true },
      }),
      // 订单状态分布
      this.prisma.orders.groupBy({
        by: ['status'],
        where: { siteId: id },
        _count: true,
      }),
      // 任务状态分布
      this.prisma.task.groupBy({
        by: ['status'],
        where: { siteId: id },
        _count: true,
      }),
      // 车辆状态分布
      this.prisma.vehicles.groupBy({
        by: ['status'],
        where: { siteId: id },
        _count: true,
      }),
      // 低库存材料
      this.prisma.material.count({
        where: {
          siteId: id,
          currentStock: { lte: this.prisma.material.fields.minStock },
        },
      }),
    ]);

    return {
      site,
      today: {
        orders: todayOrders,
        batches: todayBatches,
        production: todayProduction._sum.actualQuantity || 0,
      },
      distribution: {
        orders: ordersByStatus,
        tasks: tasksByStatus,
        vehicles: vehiclesByStatus,
      },
      alerts: {
        lowStockMaterials,
      },
    };
  }

  /**
   * 获取附近的站点
   */
  async findNearby(latitude: number, longitude: number, radius: number = 50) {
    // 简单的距离计算（实际应用中可能需要更精确的地理计算）
    // 这里使用简化的方法：1度约等于111km
    const latDiff = radius / 111;
    const lonDiff = radius / (111 * Math.cos(latitude * Math.PI / 180));

    const sites = await this.prisma.site.findMany({
      where: {
        status: 'active',
        latitude: {
          gte: latitude - latDiff,
          lte: latitude + latDiff,
        },
        longitude: {
          gte: longitude - lonDiff,
          lte: longitude + lonDiff,
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    // 计算实际距离并排序
    const sitesWithDistance = sites.map(site => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        site.latitude || 0,
        site.longitude || 0,
      );
      return { ...site, distance };
    }).filter(site => site.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return sitesWithDistance;
  }

  /**
   * 计算两点之间的距离（km）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
