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
    this.logger.log('🔌 正在连接本地数据库...');
    
    try {
      await this.$connect();
      this.logger.log('✅ 本地数据库连接成功');
      
      // 检查数据库初始化状态
      await this.checkInitialization();
      
    } catch (error) {
      this.logger.error('❌ 本地数据库连接失败:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 正在断开数据库连接...');
    await this.$disconnect();
    this.logger.log('✅ 数据库连接已断开');
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
  async getStats() {
    try {
      const [
        dataPointCount,
        historyCount,
        recipeCount,
        batchCount,
        alarmCount,
        logCount,
      ] = await Promise.all([
        this.dataPoint.count(),
        this.dataHistory.count(),
        this.recipe.count(),
        this.productionTask.count(),
        this.alarm.count(),
        this.localLog.count(),
      ]);

      return {
        dataPoints: dataPointCount,
        historyRecords: historyCount,
        recipes: recipeCount,
        productionTasks: batchCount,
        alarms: alarmCount,
        logs: logCount,
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
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 清理7天前的历史数据
      const deletedHistory = await this.dataHistory.deleteMany({
        where: {
          timestamp: {
            lt: sevenDaysAgo,
          },
        },
      });

      // 清理已解决的告警（3天前）
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const deletedAlarms = await this.alarm.deleteMany({
        where: {
          status: 'resolved',
          resolvedAt: {
            lt: threeDaysAgo,
          },
        },
      });

      // 清理旧日志（7天前）
      const deletedLogs = await this.localLog.deleteMany({
        where: {
          timestamp: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(`🧹 数据清理完成: 删除了 ${deletedHistory.count} 条历史数据, ${deletedAlarms.count} 条告警, ${deletedLogs.count} 条日志`);

      return {
        deletedHistory: deletedHistory.count,
        deletedAlarms: deletedAlarms.count,
        deletedLogs: deletedLogs.count,
      };
    } catch (error) {
      this.logger.error('数据清理失败:', error);
      throw error;
    }
  }

  /**
   * 检查数据库初始化状态
   */
  private async checkInitialization() {
    try {
      // 检查是否存在配置数据
      const configCount = await this.edgeConfig.count();
      
      if (configCount === 0) {
        this.logger.warn('⚠️  数据库未初始化，请运行初始化脚本');
        this.logger.warn('   执行命令: npm run db:init');
      } else {
        this.logger.log(`📊 数据库已初始化，共有 ${configCount} 项配置`);
      }
    } catch (error) {
      this.logger.error('检查数据库初始化状态失败:', error);
    }
  }

  /**
   * 获取配置值
   */
  async getConfig(key: string): Promise<string | null> {
    try {
      const config = await this.edgeConfig.findUnique({
        where: { key },
      });
      return config?.value || null;
    } catch (error) {
      this.logger.error(`获取配置失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 设置配置值
   */
  async setConfig(key: string, value: string, description?: string): Promise<void> {
    try {
      await this.edgeConfig.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description },
      });
    } catch (error) {
      this.logger.error(`设置配置失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 记录操作日志
   */
  async logOperation(
    level: string,
    module: string,
    action: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      await this.localLog.create({
        data: {
          level,
          module,
          action,
          message,
          data: data ? JSON.stringify(data) : null,
        },
      });
    } catch (error) {
      this.logger.error('记录操作日志失败:', error);
    }
  }
}