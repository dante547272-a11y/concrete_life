import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogDto } from './dto/query-log.dto';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建操作日志
   */
  async create(
    userId: number,
    action: string,
    module: string,
    description: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const log = await this.prisma.operation_logs.create({
      data: {
        userId: userId,
        action,
        module,
        description,
        details: details ? JSON.stringify(details) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return log;
  }

  /**
   * 查询日志列表
   */
  async findAll(query: QueryLogDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = { contains: filters.action };
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // 查询数据
    const [logs, total] = await Promise.all([
      this.prisma.operation_logs.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.operation_logs.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个日志
   */
  async findOne(id: number) {
    const log = await this.prisma.operation_logs.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return log;
  }

  /**
   * 获取日志统计
   */
  async getStatistics(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalLogs,
      logsByModule,
      logsByAction,
      topUsers,
    ] = await Promise.all([
      this.prisma.operation_logs.count({ where }),
      this.prisma.operation_logs.groupBy({
        by: ['module'],
        where,
        _count: true,
        orderBy: {
          _count: {
            module: 'desc',
          },
        },
        take: 10,
      }),
      this.prisma.operation_logs.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      this.prisma.operation_logs.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // 获取用户信息
    const userIds = topUsers.map(item => item.userId);
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        username: true,
        name: true,
      },
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    return {
      total: totalLogs,
      byModule: logsByModule.map(item => ({
        module: item.module,
        count: item._count,
      })),
      byAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count,
      })),
      topUsers: topUsers.map(item => ({
        userId: item.userId,
        user: usersMap.get(item.userId),
        count: item._count,
      })),
    };
  }

  /**
   * 获取用户操作历史
   */
  async getUserHistory(userId: number, limit: number = 20) {
    const logs = await this.prisma.operation_logs.findMany({
      where: {
        userId: userId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs;
  }

  /**
   * 获取模块操作历史
   */
  async getModuleHistory(module: string, limit: number = 20) {
    const logs = await this.prisma.operation_logs.findMany({
      where: {
        module,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * 删除过期日志
   */
  async deleteExpiredLogs(days: number = 90) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - days);

    const result = await this.prisma.operation_logs.deleteMany({
      where: {
        createdAt: {
          lt: expiryDate,
        },
      },
    });

    return {
      message: `成功删除 ${result.count} 条过期日志`,
      count: result.count,
    };
  }

  /**
   * 导出日志
   */
  async exportLogs(query: QueryLogDto) {
    const { sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;

    // 构建查询条件
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = { contains: filters.action };
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // 查询所有符合条件的日志
    const logs = await this.prisma.operation_logs.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return logs;
  }

  /**
   * 获取最近日志
   */
  async getRecent(limit: number = 10) {
    const logs = await this.prisma.operation_logs.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * 获取今日日志统计
   */
  async getTodayStatistics() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalLogs,
      logsByModule,
      activeUsers,
    ] = await Promise.all([
      this.prisma.operation_logs.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.operation_logs.groupBy({
        by: ['module'],
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: true,
      }),
      this.prisma.operation_logs.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: true,
      }),
    ]);

    return {
      total: totalLogs,
      byModule: logsByModule.map(item => ({
        module: item.module,
        count: item._count,
      })),
      activeUsers: activeUsers.length,
    };
  }
}
