import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取仪表盘概览数据
   */
  async getOverview(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    // 获取今日日期范围
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 并行查询所有统计数据
    const [
      // 订单统计
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      
      // 生产统计
      totalBatches,
      todayBatches,
      inProgressBatches,
      todayProduction,
      
      // 任务统计
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      
      // 车辆统计
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      
      // 材料统计
      totalMaterials,
      lowStockMaterials,
      
      // 最近订单
      recentOrders,
      
      // 最近批次
      recentBatches,
      
      // 最近任务
      recentTasks,
    ] = await Promise.all([
      // 订单统计
      this.prisma.orders.count({ where }),
      this.prisma.orders.count({
        where: {
          ...where,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.orders.count({
        where: { ...where, status: 'pending' },
      }),
      this.prisma.orders.count({
        where: { ...where, status: 'completed' },
      }),
      
      // 生产统计
      this.prisma.production_batches.count({ where }),
      this.prisma.production_batches.count({
        where: {
          ...where,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.production_batches.count({
        where: { ...where, status: 'in_progress' },
      }),
      this.prisma.production_batches.aggregate({
        where: {
          ...where,
          status: 'completed',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { actualQuantity: true },
      }),
      
      // 任务统计
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: { ...where, status: 'pending' },
      }),
      this.prisma.task.count({
        where: { ...where, status: 'in_progress' },
      }),
      this.prisma.task.count({
        where: { ...where, status: 'completed' },
      }),
      
      // 车辆统计
      this.prisma.vehicles.count({ where }),
      this.prisma.vehicles.count({
        where: { ...where, status: 'available' },
      }),
      this.prisma.vehicles.count({
        where: { ...where, status: 'in_use' },
      }),
      
      // 材料统计
      this.prisma.material.count({ where }),
      this.prisma.material.count({
        where: {
          ...where,
          currentStock: { lte: this.prisma.material.fields.minStock },
        },
      }),
      
      // 最近订单（前5条）
      this.prisma.orders.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          site: true,
        },
      }),
      
      // 最近批次（前5条）
      this.prisma.production_batches.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          recipe: true,
          site: true,
        },
      }),
      
      // 最近任务（前5条）
      this.prisma.task.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          vehicle: true,
          driver: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
        completed: completedOrders,
        recent: recentOrders,
      },
      production: {
        totalBatches,
        todayBatches,
        inProgressBatches,
        todayProduction: todayProduction._sum.actualQuantity || 0,
        recent: recentBatches,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        recent: recentTasks,
      },
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        inUse: inUseVehicles,
      },
      materials: {
        total: totalMaterials,
        lowStock: lowStockMaterials,
      },
    };
  }

  /**
   * 获取生产趋势数据（最近7天）
   */
  async getProductionTrend(siteId?: number, days: number = 7) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [batchCount, production] = await Promise.all([
        this.prisma.production_batches.count({
          where: {
            ...where,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.production_batches.aggregate({
          where: {
            ...where,
            status: 'completed',
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          _sum: { actualQuantity: true },
        }),
      ]);

      result.push({
        date: startOfDay.toISOString().split('T')[0],
        batches: batchCount,
        production: production._sum.actualQuantity || 0,
      });
    }

    return result;
  }

  /**
   * 获取订单趋势数据（最近7天）
   */
  async getOrderTrend(siteId?: number, days: number = 7) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const orderCount = await this.prisma.orders.count({
        where: {
          ...where,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      result.push({
        date: startOfDay.toISOString().split('T')[0],
        orders: orderCount,
      });
    }

    return result;
  }

  /**
   * 获取订单状态分布
   */
  async getOrderStatusDistribution(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const [pending, confirmed, in_production, completed, cancelled] = await Promise.all([
      this.prisma.orders.count({ where: { ...where, status: 'pending' } }),
      this.prisma.orders.count({ where: { ...where, status: 'confirmed' } }),
      this.prisma.orders.count({ where: { ...where, status: 'in_production' } }),
      this.prisma.orders.count({ where: { ...where, status: 'completed' } }),
      this.prisma.orders.count({ where: { ...where, status: 'cancelled' } }),
    ]);

    return [
      { status: 'pending', count: pending, label: '待确认' },
      { status: 'confirmed', count: confirmed, label: '已确认' },
      { status: 'in_production', count: in_production, label: '生产中' },
      { status: 'completed', count: completed, label: '已完成' },
      { status: 'cancelled', count: cancelled, label: '已取消' },
    ];
  }

  /**
   * 获取任务状态分布
   */
  async getTaskStatusDistribution(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const [pending, assigned, in_progress, loading, transporting, unloading, completed] = await Promise.all([
      this.prisma.task.count({ where: { ...where, status: 'pending' } }),
      this.prisma.task.count({ where: { ...where, status: 'assigned' } }),
      this.prisma.task.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.task.count({ where: { ...where, status: 'loading' } }),
      this.prisma.task.count({ where: { ...where, status: 'transporting' } }),
      this.prisma.task.count({ where: { ...where, status: 'unloading' } }),
      this.prisma.task.count({ where: { ...where, status: 'completed' } }),
    ]);

    return [
      { status: 'pending', count: pending, label: '待分配' },
      { status: 'assigned', count: assigned, label: '已分配' },
      { status: 'in_progress', count: in_progress, label: '进行中' },
      { status: 'loading', count: loading, label: '装载中' },
      { status: 'transporting', count: transporting, label: '运输中' },
      { status: 'unloading', count: unloading, label: '卸载中' },
      { status: 'completed', count: completed, label: '已完成' },
    ];
  }

  /**
   * 获取车辆利用率
   */
  async getVehicleUtilization(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const [total, available, in_use, maintenance, fault] = await Promise.all([
      this.prisma.vehicles.count({ where }),
      this.prisma.vehicles.count({ where: { ...where, status: 'available' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'in_use' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'maintenance' } }),
      this.prisma.vehicles.count({ where: { ...where, status: 'fault' } }),
    ]);

    return {
      total,
      available,
      inUse: in_use,
      maintenance,
      fault,
      utilizationRate: total > 0 ? ((in_use / total) * 100).toFixed(2) : '0.00',
      availableRate: total > 0 ? ((available / total) * 100).toFixed(2) : '0.00',
    };
  }

  /**
   * 获取低库存材料列表
   */
  async getLowStockMaterials(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    // 查询库存低于最小库存的材料
    const materials = await this.prisma.material.findMany({
      where: {
        ...where,
        currentStock: {
          lte: this.prisma.material.fields.minStock,
        },
      },
      orderBy: {
        currentStock: 'asc',
      },
      take: 10,
    });

    return materials.map(material => ({
      ...material,
      stockRate: material.minStock > 0 
        ? ((material.currentStock / material.minStock) * 100).toFixed(2)
        : '0.00',
      shortage: Math.max(0, material.minStock - material.currentStock),
    }));
  }

  /**
   * 获取实时数据（用于WebSocket推送）
   */
  async getRealTimeData(siteId?: number) {
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const [
      inProgressBatches,
      inProgressTasks,
      inUseVehicles,
    ] = await Promise.all([
      this.prisma.production_batches.findMany({
        where: { ...where, status: 'in_progress' },
        include: {
          order: true,
          recipe: true,
        },
        orderBy: { startTime: 'desc' },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: { ...where, status: 'in_progress' },
        include: {
          order: true,
          vehicle: true,
          driver: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.vehicles.findMany({
        where: { ...where, status: 'in_use' },
        include: {
          tasks: {
            where: { status: 'in_progress' },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      production: inProgressBatches,
      tasks: inProgressTasks,
      vehicles: inUseVehicles,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取月度统计
   */
  async getMonthlyStatistics(siteId?: number, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (siteId) {
      where.siteId = siteId;
    }

    const [
      orderCount,
      batchCount,
      totalProduction,
      taskCount,
      completedTaskCount,
    ] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.production_batches.count({ where }),
      this.prisma.production_batches.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { actualQuantity: true },
      }),
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'completed' } }),
    ]);

    return {
      year: targetYear,
      month: targetMonth,
      orders: orderCount,
      batches: batchCount,
      production: totalProduction._sum.actualQuantity || 0,
      tasks: taskCount,
      completedTasks: completedTaskCount,
      taskCompletionRate: taskCount > 0 
        ? ((completedTaskCount / taskCount) * 100).toFixed(2)
        : '0.00',
    };
  }
}
