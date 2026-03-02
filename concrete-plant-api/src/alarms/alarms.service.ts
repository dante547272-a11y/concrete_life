import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { QueryAlarmDto } from './dto/query-alarm.dto';

@Injectable()
export class AlarmsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建告警
   */
  async create(createAlarmDto: CreateAlarmDto, userId?: number) {
    const alarm = await this.prisma.alarm.create({
      data: {
        type: createAlarmDto.type as any,
        level: createAlarmDto.level as any,
        title: createAlarmDto.title,
        message: createAlarmDto.message,
        source: createAlarmDto.source,
        source_id: createAlarmDto.sourceId,
        siteId: createAlarmDto.siteId,
        status: 'pending',
        triggered_at: new Date(),
        data: createAlarmDto.data ? JSON.stringify(createAlarmDto.data) : null,
      },
    });

    // TODO: 触发通知（邮件、短信、推送等）
    // await this.sendNotification(alarm);

    return alarm;
  }

  /**
   * 查询告警列表
   */
  async findAll(query: QueryAlarmDto) {
    const { page = 1, limit = 10, sortBy = 'triggered_at', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.startDate && filters.endDate) {
      where.triggered_at = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // 查询数据
    const [alarms, total] = await Promise.all([
      this.prisma.alarm.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: true,
          acknowledged_by_user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          resolved_by_user: {
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
      this.prisma.alarm.count({ where }),
    ]);

    return {
      data: alarms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个告警
   */
  async findOne(id: number) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
      include: {
        site: true,
        acknowledged_by_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        resolved_by_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    return alarm;
  }

  /**
   * 更新告警
   */
  async update(id: number, updateAlarmDto: UpdateAlarmDto, userId: number) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    const updatedAlarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        title: updateAlarmDto.title,
        message: updateAlarmDto.message,
        level: updateAlarmDto.level as any,
        status: updateAlarmDto.status as any,
        data: updateAlarmDto.data ? JSON.stringify(updateAlarmDto.data) : undefined,
      },
      include: {
        site: true,
      },
    });

    return updatedAlarm;
  }

  /**
   * 确认告警
   */
  async acknowledge(id: number, userId: number, remarks?: string) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    if (alarm.status !== 'pending') {
      throw new BadRequestException('只能确认待处理的告警');
    }

    const updatedAlarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
        remarks: remarks || alarm.remarks,
      },
      include: {
        site: true,
        acknowledged_by_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedAlarm;
  }

  /**
   * 解决告警
   */
  async resolve(id: number, userId: number, solution?: string) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    if (alarm.status === 'resolved') {
      throw new BadRequestException('告警已解决');
    }

    const updatedAlarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date(),
        solution: solution || alarm.solution,
      },
      include: {
        site: true,
        resolved_by_user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return updatedAlarm;
  }

  /**
   * 忽略告警
   */
  async ignore(id: number, userId: number, reason?: string) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    const updatedAlarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        status: 'ignored',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
        remarks: reason || alarm.remarks,
      },
      include: {
        site: true,
      },
    });

    return updatedAlarm;
  }

  /**
   * 删除告警
   */
  async remove(id: number) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
    });

    if (!alarm) {
      throw new NotFoundException('告警不存在');
    }

    await this.prisma.alarm.delete({
      where: { id },
    });

    return { message: '告警删除成功' };
  }

  /**
   * 获取告警统计
   */
  async getStatistics(siteId?: number, startDate?: string, endDate?: string) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    if (startDate && endDate) {
      where.triggered_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalAlarms,
      pendingAlarms,
      acknowledgedAlarms,
      resolvedAlarms,
      ignoredAlarms,
      criticalAlarms,
      highAlarms,
      mediumAlarms,
      lowAlarms,
      alarmsByType,
    ] = await Promise.all([
      this.prisma.alarm.count({ where }),
      this.prisma.alarm.count({ where: { ...where, status: 'pending' } }),
      this.prisma.alarm.count({ where: { ...where, status: 'acknowledged' } }),
      this.prisma.alarm.count({ where: { ...where, status: 'resolved' } }),
      this.prisma.alarm.count({ where: { ...where, status: 'ignored' } }),
      this.prisma.alarm.count({ where: { ...where, level: 'critical' } }),
      this.prisma.alarm.count({ where: { ...where, level: 'high' } }),
      this.prisma.alarm.count({ where: { ...where, level: 'medium' } }),
      this.prisma.alarm.count({ where: { ...where, level: 'low' } }),
      this.prisma.alarm.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
    ]);

    return {
      total: totalAlarms,
      byStatus: {
        pending: pendingAlarms,
        acknowledged: acknowledgedAlarms,
        resolved: resolvedAlarms,
        ignored: ignoredAlarms,
      },
      byLevel: {
        critical: criticalAlarms,
        high: highAlarms,
        medium: mediumAlarms,
        low: lowAlarms,
      },
      byType: alarmsByType.map(item => ({
        type: item.type,
        count: item._count,
      })),
    };
  }

  /**
   * 获取最近告警
   */
  async getRecent(limit: number = 10, siteId?: number) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    const alarms = await this.prisma.alarm.findMany({
      where,
      take: limit,
      orderBy: {
        triggered_at: 'desc',
      },
      include: {
        site: true,
      },
    });

    return alarms;
  }

  /**
   * 批量确认告警
   */
  async batchAcknowledge(ids: number[], userId: number, remarks?: string) {
    const result = await this.prisma.alarm.updateMany({
      where: {
        id: { in: ids },
        status: 'pending',
      },
      data: {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
        remarks,
      },
    });

    return {
      message: `成功确认 ${result.count} 条告警`,
      count: result.count,
    };
  }

  /**
   * 批量解决告警
   */
  async batchResolve(ids: number[], userId: number, solution?: string) {
    const result = await this.prisma.alarm.updateMany({
      where: {
        id: { in: ids },
        status: { in: ['pending', 'acknowledged'] },
      },
      data: {
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date(),
        solution,
      },
    });

    return {
      message: `成功解决 ${result.count} 条告警`,
      count: result.count,
    };
  }

  /**
   * 自动检查并创建告警
   */
  async checkAndCreateAlarms() {
    const alarms = [];

    // 1. 检查低库存材料
    const lowStockMaterials = await this.prisma.material.findMany({
      where: {
        currentStock: {
          lte: this.prisma.material.fields.minStock,
        },
      },
      include: {
        site: true,
      },
    });

    for (const material of lowStockMaterials) {
      // 检查是否已存在相同的未处理告警
      const existingAlarm = await this.prisma.alarm.findFirst({
        where: {
          type: 'low_stock',
          source: 'material',
          source_id: material.id,
          status: { in: ['pending', 'acknowledged'] },
        },
      });

      if (!existingAlarm) {
        const alarm = await this.create({
          type: 'low_stock',
          level: material.currentStock <= material.minStock * 0.5 ? 'high' : 'medium',
          title: '材料库存不足',
          message: `材料 ${material.name} 库存不足，当前库存：${material.currentStock}${material.unit}，最小库存：${material.minStock}${material.unit}`,
          source: 'material',
          sourceId: material.id,
          siteId: material.siteId,
          data: {
            materialId: material.id,
            materialName: material.name,
            currentStock: material.currentStock,
            minStock: material.minStock,
            unit: material.unit,
          },
        });
        alarms.push(alarm);
      }
    }

    // 2. 检查车辆故障
    const faultVehicles = await this.prisma.vehicles.findMany({
      where: {
        status: 'fault',
      },
      include: {
        site: true,
      },
    });

    for (const vehicle of faultVehicles) {
      const existingAlarm = await this.prisma.alarm.findFirst({
        where: {
          type: 'vehicle_fault',
          source: 'vehicle',
          source_id: vehicle.id,
          status: { in: ['pending', 'acknowledged'] },
        },
      });

      if (!existingAlarm) {
        const alarm = await this.create({
          type: 'vehicle_fault',
          level: 'high',
          title: '车辆故障',
          message: `车辆 ${vehicle.plate_number} 发生故障`,
          source: 'vehicle',
          sourceId: vehicle.id,
          siteId: vehicle.siteId,
          data: {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plate_number,
            vehicleType: vehicle.type,
          },
        });
        alarms.push(alarm);
      }
    }

    // 3. 检查超时任务
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4小时前

    const timeoutTasks = await this.prisma.task.findMany({
      where: {
        status: { in: ['assigned', 'in_progress', 'loading', 'transporting', 'unloading'] },
        createdAt: {
          lt: timeoutThreshold,
        },
      },
      include: {
        order: true,
        site: true,
      },
    });

    for (const task of timeoutTasks) {
      const existingAlarm = await this.prisma.alarm.findFirst({
        where: {
          type: 'task_timeout',
          source: 'task',
          source_id: task.id,
          status: { in: ['pending', 'acknowledged'] },
        },
      });

      if (!existingAlarm) {
        const alarm = await this.create({
          type: 'task_timeout',
          level: 'medium',
          title: '任务超时',
          message: `任务 #${task.id} 执行超时，已超过4小时`,
          source: 'task',
          sourceId: task.id,
          siteId: task.siteId,
          data: {
            taskId: task.id,
            orderId: task.orderId,
            status: task.status,
            createdAt: task.createdAt,
          },
        });
        alarms.push(alarm);
      }
    }

    return {
      message: `自动检查完成，创建了 ${alarms.length} 条新告警`,
      count: alarms.length,
      alarms,
    };
  }
}
