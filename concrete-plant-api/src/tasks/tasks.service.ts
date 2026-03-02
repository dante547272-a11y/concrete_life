import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建任务
   */
  async create(createTaskDto: CreateTaskDto, userId: number) {
    const { orderId, vehicleId, driverId, ...taskData } = createTaskDto;

    // 检查订单是否存在
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单状态
    if (order.status !== 'confirmed' && order.status !== 'in_production') {
      throw new BadRequestException('只能为已确认或生产中的订单创建任务');
    }

    // 如果指定了车辆，检查车辆是否存在且可用
    if (vehicleId) {
      const vehicle = await this.prisma.vehicles.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('车辆不存在');
      }

      if (vehicle.status !== 'available') {
        throw new BadRequestException('车辆当前不可用');
      }
    }

    // 如果指定了司机，检查司机是否存在且可用
    if (driverId) {
      const driver = await this.prisma.drivers.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException('司机不存在');
      }

      if (driver.status !== 'available') {
        throw new BadRequestException('司机当前不可用');
      }
    }

    // 生成任务编号
    const taskNo = await this.generateTaskNo(order.siteId);

    // 创建任务
    const task = await this.prisma.task.create({
      data: {
        task_no: taskNo,
        orderId: orderId,
        siteId: order.siteId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        delivery_volume: taskData.deliveryVolume,
        deliveryAddress: taskData.deliveryAddress || order.construction_site,
        scheduled_time: taskData.scheduledTime ? new Date(taskData.scheduledTime) : null,
        priority: (taskData.priority as any) || 'normal',
        status: 'pending',
        remarks: taskData.remarks,
        created_by: userId,
      },
      include: {
        order: {
          include: {
            order_items: {
              include: {
                recipe: {
                  include: {
                    grade: true,
                  },
                },
              },
            },
          },
        },
        vehicle: true,
        driver: true,
        site: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    // 如果分配了车辆，更新车辆状态
    if (vehicleId) {
      await this.prisma.vehicles.update({
        where: { id: vehicleId },
        data: { status: 'in_use' },
      });
    }

    // 如果分配了司机，更新司机状态
    if (driverId) {
      await this.prisma.drivers.update({
        where: { id: driverId },
        data: { status: 'on_duty' },
      });
    }

    // 更新订单状态为生产中
    if (order.status === 'confirmed') {
      await this.prisma.orders.update({
        where: { id: orderId },
        data: { status: 'in_production' },
      });
    }

    return task;
  }

  /**
   * 查询任务列表
   */
  async findAll(query: QueryTaskDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.taskNo) {
      where.task_no = { contains: filters.taskNo };
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.vehicleId) {
      where.vehicle_id = filters.vehicleId;
    }

    if (filters.driverId) {
      where.driver_id = filters.driverId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // 查询数据
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            include: {
              order_items: {
                include: {
                  recipe: {
                    include: {
                      grade: true,
                    },
                  },
                },
              },
            },
          },
          vehicle: true,
          driver: true,
          site: true,
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
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个任务
   */
  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            order_items: {
              include: {
                recipe: {
                  include: {
                    grade: true,
                    recipe_items: {
                      include: {
                        material: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        vehicle: true,
        driver: true,
        site: true,
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        production_batches: true,
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task;
  }

  /**
   * 更新任务
   */
  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 检查任务状态是否允许修改
    if (task.status === 'completed' || task.status === 'cancelled') {
      throw new BadRequestException('已完成或已取消的任务不能修改');
    }

    const { vehicleId, driverId, ...taskData } = updateTaskDto;

    // 如果修改车辆
    if (vehicleId !== undefined && vehicleId !== task.vehicle_id) {
      if (vehicleId) {
        const vehicle = await this.prisma.vehicles.findUnique({
          where: { id: vehicleId },
        });

        if (!vehicle) {
          throw new NotFoundException('车辆不存在');
        }

        if (vehicle.status !== 'available') {
          throw new BadRequestException('车辆当前不可用');
        }
      }

      // 释放原车辆
      if (task.vehicle_id) {
        await this.prisma.vehicles.update({
          where: { id: task.vehicle_id },
          data: { status: 'available' },
        });
      }

      // 占用新车辆
      if (vehicleId) {
        await this.prisma.vehicles.update({
          where: { id: vehicleId },
          data: { status: 'in_use' },
        });
      }
    }

    // 如果修改司机
    if (driverId !== undefined && driverId !== task.driver_id) {
      if (driverId) {
        const driver = await this.prisma.drivers.findUnique({
          where: { id: driverId },
        });

        if (!driver) {
          throw new NotFoundException('司机不存在');
        }

        if (driver.status !== 'available') {
          throw new BadRequestException('司机当前不可用');
        }
      }

      // 释放原司机
      if (task.driver_id) {
        await this.prisma.drivers.update({
          where: { id: task.driver_id },
          data: { status: 'available' },
        });
      }

      // 占用新司机
      if (driverId) {
        await this.prisma.drivers.update({
          where: { id: driverId },
          data: { status: 'on_duty' },
        });
      }
    }

    // 更新任务
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        vehicle_id: vehicleId,
        driver_id: driverId,
        delivery_volume: taskData.deliveryVolume,
        deliveryAddress: taskData.deliveryAddress,
        scheduled_time: taskData.scheduledTime ? new Date(taskData.scheduledTime) : undefined,
        priority: taskData.priority as any,
        status: taskData.status as any,
        remarks: taskData.remarks,
        updatedAt: new Date(),
      },
      include: {
        order: true,
        vehicle: true,
        driver: true,
        site: true,
      },
    });

    return updatedTask;
  }

  /**
   * 分配任务（分配车辆和司机）
   */
  async assign(id: number, assignTaskDto: AssignTaskDto, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.status !== 'pending') {
      throw new BadRequestException('只能分配待分配状态的任务');
    }

    const { vehicleId, driverId, scheduledTime } = assignTaskDto;

    // 检查车辆
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    if (vehicle.status !== 'available') {
      throw new BadRequestException('车辆当前不可用');
    }

    // 检查司机
    const driver = await this.prisma.drivers.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('司机不存在');
    }

    if (driver.status !== 'available') {
      throw new BadRequestException('司机当前不可用');
    }

    // 更新任务
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        vehicle_id: vehicleId,
        driver_id: driverId,
        scheduled_time: scheduledTime ? new Date(scheduledTime) : undefined,
        status: 'assigned',
        updatedAt: new Date(),
      },
      include: {
        order: true,
        vehicle: true,
        driver: true,
        site: true,
      },
    });

    // 更新车辆状态
    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: { status: 'in_use' },
    });

    // 更新司机状态
    await this.prisma.drivers.update({
      where: { id: driverId },
      data: { status: 'on_duty' },
    });

    return updatedTask;
  }

  /**
   * 更新任务状态
   */
  async updateStatus(id: number, status: string, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 验证状态流转
    const validTransitions = {
      pending: ['assigned', 'cancelled'],
      assigned: ['in_transit', 'cancelled'],
      in_transit: ['arrived', 'cancelled'],
      arrived: ['unloading', 'cancelled'],
      unloading: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      throw new BadRequestException(`任务状态不能从 ${task.status} 变更为 ${status}`);
    }

    // 更新任务状态
    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    // 记录时间戳
    if (status === 'in_transit') {
      updateData.departure_time = new Date();
    } else if (status === 'arrived') {
      updateData.arrival_time = new Date();
    } else if (status === 'completed') {
      updateData.completion_time = new Date();
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
        vehicle: true,
        driver: true,
        site: true,
      },
    });

    // 如果任务完成或取消，释放车辆和司机
    if (status === 'completed' || status === 'cancelled') {
      if (task.vehicle_id) {
        await this.prisma.vehicles.update({
          where: { id: task.vehicle_id },
          data: { status: 'available' },
        });
      }

      if (task.driver_id) {
        await this.prisma.drivers.update({
          where: { id: task.driver_id },
          data: { status: 'available' },
        });
      }
    }

    return updatedTask;
  }

  /**
   * 删除任务
   */
  async remove(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 检查任务状态
    if (task.status === 'in_transit' || task.status === 'arrived' || task.status === 'unloading') {
      throw new BadRequestException('进行中的任务不能删除');
    }

    // 释放车辆和司机
    if (task.vehicle_id) {
      await this.prisma.vehicles.update({
        where: { id: task.vehicle_id },
        data: { status: 'available' },
      });
    }

    if (task.driver_id) {
      await this.prisma.drivers.update({
        where: { id: task.driver_id },
        data: { status: 'available' },
      });
    }

    await this.prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: '任务已删除' };
  }

  /**
   * 获取任务统计
   */
  async getStatistics(siteId?: number, startDate?: string, endDate?: string) {
    const where: any = {};

    if (siteId) {
      where.siteId = siteId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalTasks,
      pendingTasks,
      assignedTasks,
      inTransitTasks,
      arrivedTasks,
      unloadingTasks,
      completedTasks,
      cancelledTasks,
      totalVolume,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'pending' } }),
      this.prisma.task.count({ where: { ...where, status: 'assigned' } }),
      this.prisma.task.count({ where: { ...where, status: 'in_transit' } }),
      this.prisma.task.count({ where: { ...where, status: 'arrived' } }),
      this.prisma.task.count({ where: { ...where, status: 'unloading' } }),
      this.prisma.task.count({ where: { ...where, status: 'completed' } }),
      this.prisma.task.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.task.aggregate({
        where,
        _sum: { delivery_volume: true },
      }),
    ]);

    return {
      totalTasks,
      statusCount: {
        pending: pendingTasks,
        assigned: assignedTasks,
        inTransit: inTransitTasks,
        arrived: arrivedTasks,
        unloading: unloadingTasks,
        completed: completedTasks,
        cancelled: cancelledTasks,
      },
      totalVolume: totalVolume._sum.delivery_volume || 0,
    };
  }

  /**
   * 生成任务编号
   */
  private async generateTaskNo(siteId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await this.prisma.task.count({
      where: {
        siteId: siteId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `TASK${dateStr}${sequence}`;
  }
}
