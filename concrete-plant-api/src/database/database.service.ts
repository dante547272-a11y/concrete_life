import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // 监听数据库事件
    this.$on('query', (e) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Params: ${e.params}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });

    this.$on('error', (e) => {
      this.logger.error('Database error:', e);
    });

    this.$on('info', (e) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 正在连接数据库...');
    
    try {
      await this.$connect();
      this.logger.log('✅ 数据库连接成功');
      
      // 检查数据库是否已初始化
      await this.checkDatabaseInitialization();
      
    } catch (error) {
      this.logger.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 正在断开数据库连接...');
    await this.$disconnect();
    this.logger.log('✅ 数据库连接已断开');
  }

  /**
   * 检查数据库是否已初始化
   */
  private async checkDatabaseInitialization() {
    try {
      // 检查是否存在站点数据
      const siteCount = await this.site.count();
      
      if (siteCount === 0) {
        this.logger.warn('⚠️  数据库未初始化，请运行初始化脚本');
        this.logger.warn('   执行命令: npm run db:init');
      } else {
        this.logger.log(`📊 数据库已初始化，共有 ${siteCount} 个站点`);
      }
    } catch (error) {
      this.logger.error('检查数据库初始化状态失败:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; database: string; timestamp: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('数据库健康检查失败:', error);
      return {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats() {
    try {
      const [
        siteCount,
        userCount,
        equipmentCount,
        orderCount,
        taskCount,
        materialCount,
      ] = await Promise.all([
        this.site.count(),
        this.user.count(),
        this.equipment.count(),
        this.orders.count(),
        this.task.count(),
        this.material.count(),
      ]);

      return {
        sites: siteCount,
        users: userCount,
        equipment: equipmentCount,
        orders: orderCount,
        tasks: taskCount,
        materials: materialCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('获取数据库统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 清理30天前的操作日志
      const deletedLogs = await this.operationLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // 清理已解决的告警（7天前）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedAlarms = await this.alarm.deleteMany({
        where: {
          resolved: true,
          resolvedAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(`🧹 数据清理完成: 删除了 ${deletedLogs.count} 条日志, ${deletedAlarms.count} 条告警`);

      return {
        deletedLogs: deletedLogs.count,
        deletedAlarms: deletedAlarms.count,
      };
    } catch (error) {
      this.logger.error('数据清理失败:', error);
      throw error;
    }
  }
}