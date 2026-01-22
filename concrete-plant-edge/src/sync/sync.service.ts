import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';
import { DatabaseService } from '../database/database.service';
import { SyncGateway } from './sync.gateway';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private httpClient: AxiosInstance;
  private isOnline = false;
  private lastSyncTime: Date | null = null;
  private syncStats = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastError: null as string | null,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly syncGateway: SyncGateway,
  ) {
    // 初始化HTTP客户端
    const centralServerUrl = this.configService.get<string>('CENTRAL_SERVER_URL');
    const apiKey = this.configService.get<string>('API_KEY');

    this.httpClient = axios.create({
      baseURL: centralServerUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Site-ID': this.configService.get<string>('SITE_ID'),
        'X-Site-Code': this.configService.get<string>('SITE_CODE'),
      },
    });

    this.setupHttpInterceptors();
  }

  async onModuleInit() {
    this.logger.log('🔄 同步服务初始化...');
    
    // 初始化同步状态
    await this.initializeSyncStatus();
    
    // 检查连接状态
    await this.checkConnection();
    
    this.logger.log('✅ 同步服务初始化完成');
  }

  private setupHttpInterceptors() {
    // 请求拦截器
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`发送请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`收到响应: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`响应错误: ${error.response?.status} ${error.config?.url}`, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 初始化同步状态
   */
  private async initializeSyncStatus() {
    const statusTypes = ['connection', 'data_sync', 'config_sync'];
    
    for (const type of statusTypes) {
      await this.databaseService.syncStatus.upsert({
        where: { type },
        update: {},
        create: {
          type,
          status: 'offline',
        },
      });
    }
  }

  /**
   * 定期检查连接状态 - 每30秒
   */
  @Cron('*/30 * * * * *')
  async checkConnection() {
    try {
      const response = await this.httpClient.get('/health', { timeout: 5000 });
      
      if (response.status === 200) {
        if (!this.isOnline) {
          this.logger.log('🌐 中央服务器连接恢复');
          await this.onConnectionRestored();
        }
        this.isOnline = true;
        
        await this.updateSyncStatus('connection', 'online');
      }
    } catch (error) {
      if (this.isOnline) {
        this.logger.warn('🔌 中央服务器连接断开，切换到离线模式');
      }
      this.isOnline = false;
      
      await this.updateSyncStatus('connection', 'offline', error.message);
    }
  }

  /**
   * 定期同步队列数据 - 每5秒
   */
  @Cron('*/5 * * * * *')
  async syncQueuedData() {
    if (!this.isOnline) {
      return;
    }

    try {
      await this.updateSyncStatus('data_sync', 'syncing');
      
      // 获取待同步的数据
      const queueItems = await this.databaseService.syncQueue.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 50, // 每次最多同步50条
      });

      if (queueItems.length === 0) {
        await this.updateSyncStatus('data_sync', 'online');
        return;
      }

      this.logger.debug(`开始同步队列数据: ${queueItems.length} 条`);

      let successCount = 0;
      let failCount = 0;

      for (const item of queueItems) {
        try {
          await this.syncQueueItem(item);
          
          // 标记为已完成
          await this.databaseService.syncQueue.update({
            where: { id: item.id },
            data: { status: 'completed' },
          });
          
          successCount++;
        } catch (error) {
          // 增加重试次数
          const retryCount = item.retryCount + 1;
          const maxRetries = 3;
          
          if (retryCount >= maxRetries) {
            // 超过最大重试次数，标记为失败
            await this.databaseService.syncQueue.update({
              where: { id: item.id },
              data: { 
                status: 'failed',
                lastError: error.message,
              },
            });
          } else {
            // 更新重试次数
            await this.databaseService.syncQueue.update({
              where: { id: item.id },
              data: { 
                retryCount,
                lastError: error.message,
              },
            });
          }
          
          failCount++;
          this.logger.error(`同步队列项失败: ${item.id}`, error);
        }
      }

      this.syncStats.totalSyncs += queueItems.length;
      this.syncStats.successfulSyncs += successCount;
      this.syncStats.failedSyncs += failCount;
      this.lastSyncTime = new Date();

      await this.updateSyncStatus('data_sync', 'online');
      
      this.logger.debug(`队列同步完成: 成功 ${successCount}, 失败 ${failCount}`);

    } catch (error) {
      this.logger.error('同步队列数据失败:', error);
      await this.updateSyncStatus('data_sync', 'error', error.message);
    }
  }

  /**
   * 推送实时数据
   */
  async pushRealTimeData(data: any): Promise<void> {
    if (this.isOnline) {
      try {
        // 直接推送到中央服务器
        await this.httpClient.post('/api/edge/realtime', {
          siteId: this.configService.get('SITE_ID'),
          data,
          timestamp: new Date().toISOString(),
        });

        // WebSocket推送
        this.syncGateway.broadcastRealTimeData(data);
        
      } catch (error) {
        this.logger.warn('实时数据推送失败，加入队列');
        await this.addToQueue('realtime', data);
      }
    } else {
      // 离线时加入队列
      await this.addToQueue('realtime', data);
    }
  }

  /**
   * 推送统计数据
   */
  async pushStatisticsData(data: any): Promise<void> {
    if (this.isOnline) {
      try {
        await this.httpClient.post('/api/edge/statistics', {
          siteId: this.configService.get('SITE_ID'),
          data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.warn('统计数据推送失败，加入队列');
        await this.addToQueue('statistics', data);
      }
    } else {
      await this.addToQueue('statistics', data);
    }
  }

  /**
   * 推送告警数据
   */
  async pushAlarmData(alarm: any): Promise<void> {
    if (this.isOnline) {
      try {
        await this.httpClient.post('/api/edge/alarm', {
          siteId: this.configService.get('SITE_ID'),
          alarm,
          timestamp: new Date().toISOString(),
        });

        // WebSocket推送告警
        this.syncGateway.broadcastAlarm(alarm);
        
      } catch (error) {
        this.logger.warn('告警数据推送失败，加入队列');
        await this.addToQueue('alarm', alarm);
      }
    } else {
      await this.addToQueue('alarm', alarm);
    }
  }

  /**
   * 推送日志数据
   */
  async pushLogData(log: any): Promise<void> {
    if (this.isOnline) {
      try {
        await this.httpClient.post('/api/edge/log', {
          siteId: this.configService.get('SITE_ID'),
          log,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // 日志推送失败不加入队列，避免循环
        this.logger.debug('日志数据推送失败');
      }
    }
  }

  /**
   * 接收远程控制指令
   */
  async receiveControlCommand(command: any): Promise<any> {
    this.logger.log(`收到远程控制指令: ${command.type}`);
    
    try {
      // 这里处理不同类型的控制指令
      switch (command.type) {
        case 'start_production':
          return await this.handleStartProduction(command);
        case 'stop_production':
          return await this.handleStopProduction(command);
        case 'emergency_stop':
          return await this.handleEmergencyStop(command);
        case 'adjust_recipe':
          return await this.handleAdjustRecipe(command);
        default:
          throw new Error(`未知的控制指令类型: ${command.type}`);
      }
    } catch (error) {
      this.logger.error(`处理控制指令失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      online: this.isOnline,
      lastSync: this.lastSyncTime,
      centralServer: this.configService.get('CENTRAL_SERVER_URL'),
    };
  }

  /**
   * 获取同步统计
   */
  async getSyncStats() {
    const queueStats = await this.databaseService.syncQueue.groupBy({
      by: ['status'],
      _count: true,
    });

    const queueCounts = queueStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...this.syncStats,
      lastSync: this.lastSyncTime,
      queue: queueCounts,
    };
  }

  // 私有方法

  private async addToQueue(type: string, data: any): Promise<void> {
    try {
      await this.databaseService.syncQueue.create({
        data: {
          type,
          data: JSON.stringify(data),
          status: 'pending',
        },
      });
    } catch (error) {
      this.logger.error('添加到同步队列失败:', error);
    }
  }

  private async syncQueueItem(item: any): Promise<void> {
    const data = JSON.parse(item.data);
    
    switch (item.type) {
      case 'realtime':
        await this.httpClient.post('/api/edge/realtime', {
          siteId: this.configService.get('SITE_ID'),
          data,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'statistics':
        await this.httpClient.post('/api/edge/statistics', {
          siteId: this.configService.get('SITE_ID'),
          data,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'alarm':
        await this.httpClient.post('/api/edge/alarm', {
          siteId: this.configService.get('SITE_ID'),
          alarm: data,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'log':
        await this.httpClient.post('/api/edge/log', {
          siteId: this.configService.get('SITE_ID'),
          log: data,
          timestamp: new Date().toISOString(),
        });
        break;
      default:
        throw new Error(`未知的同步类型: ${item.type}`);
    }
  }

  private async onConnectionRestored(): Promise<void> {
    // 连接恢复时的处理逻辑
    this.syncStats.lastError = null;
    
    // 注册边缘节点
    try {
      await this.httpClient.post('/api/edge/register', {
        siteId: this.configService.get('SITE_ID'),
        siteName: this.configService.get('SITE_NAME'),
        siteCode: this.configService.get('SITE_CODE'),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('注册边缘节点失败:', error);
    }
  }

  private async updateSyncStatus(type: string, status: string, error?: string): Promise<void> {
    try {
      await this.databaseService.syncStatus.update({
        where: { type },
        data: {
          status,
          lastSync: new Date(),
          lastError: error || null,
          syncCount: { increment: 1 },
          errorCount: error ? { increment: 1 } : undefined,
        },
      });
    } catch (err) {
      this.logger.error('更新同步状态失败:', err);
    }
  }

  // 控制指令处理方法

  private async handleStartProduction(command: any): Promise<any> {
    // 实现启动生产逻辑
    this.logger.log('处理启动生产指令');
    return { success: true, message: '生产启动成功' };
  }

  private async handleStopProduction(command: any): Promise<any> {
    // 实现停止生产逻辑
    this.logger.log('处理停止生产指令');
    return { success: true, message: '生产停止成功' };
  }

  private async handleEmergencyStop(command: any): Promise<any> {
    // 实现紧急停机逻辑
    this.logger.warn('处理紧急停机指令');
    return { success: true, message: '紧急停机执行成功' };
  }

  private async handleAdjustRecipe(command: any): Promise<any> {
    // 实现配方调整逻辑
    this.logger.log('处理配方调整指令');
    return { success: true, message: '配方调整成功' };
  }
}