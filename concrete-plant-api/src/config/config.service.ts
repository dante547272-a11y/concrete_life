import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有配置
   */
  async findAll(category?: string) {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }

    const configs = await this.prisma.system_configs.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // 按分类分组
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }

  /**
   * 获取单个配置
   */
  async findOne(key: string) {
    const config = await this.prisma.system_configs.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return config;
  }

  /**
   * 获取配置值
   */
  async getValue(key: string): Promise<any> {
    const config = await this.findOne(key);
    
    try {
      return JSON.parse(config.value);
    } catch {
      return config.value;
    }
  }

  /**
   * 创建配置
   */
  async create(createConfigDto: CreateConfigDto, userId: number) {
    const config = await this.prisma.system_configs.create({
      data: {
        key: createConfigDto.key,
        value: typeof createConfigDto.value === 'string' 
          ? createConfigDto.value 
          : JSON.stringify(createConfigDto.value),
        category: createConfigDto.category,
        description: createConfigDto.description,
        is_public: createConfigDto.isPublic ?? false,
      },
    });

    return config;
  }

  /**
   * 更新配置
   */
  async update(key: string, updateConfigDto: UpdateConfigDto, userId: number) {
    const config = await this.findOne(key);

    const updated = await this.prisma.system_configs.update({
      where: { key },
      data: {
        value: updateConfigDto.value !== undefined
          ? (typeof updateConfigDto.value === 'string' 
              ? updateConfigDto.value 
              : JSON.stringify(updateConfigDto.value))
          : undefined,
        description: updateConfigDto.description,
        is_public: updateConfigDto.isPublic,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * 删除配置
   */
  async remove(key: string) {
    await this.findOne(key);

    await this.prisma.system_configs.delete({
      where: { key },
    });

    return { message: '配置删除成功' };
  }

  /**
   * 批量更新配置
   */
  async batchUpdate(configs: Array<{ key: string; value: any }>, userId: number) {
    const results = [];

    for (const config of configs) {
      try {
        const updated = await this.update(config.key, { value: config.value }, userId);
        results.push({ key: config.key, success: true, data: updated });
      } catch (error) {
        results.push({ key: config.key, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 获取公开配置（不需要认证）
   */
  async getPublicConfigs() {
    const configs = await this.prisma.system_configs.findMany({
      where: { is_public: true },
      select: {
        key: true,
        value: true,
        category: true,
        description: true,
      },
    });

    return configs.reduce((acc, config) => {
      try {
        acc[config.key] = JSON.parse(config.value);
      } catch {
        acc[config.key] = config.value;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * 初始化默认配置
   */
  async initializeDefaultConfigs() {
    const defaultConfigs = [
      // 系统配置
      {
        key: 'system.name',
        value: '混凝土搅拌站管理系统',
        category: 'system',
        description: '系统名称',
        is_public: true,
      },
      {
        key: 'system.version',
        value: '1.0.0',
        category: 'system',
        description: '系统版本',
        is_public: true,
      },
      {
        key: 'system.maintenance_mode',
        value: 'false',
        category: 'system',
        description: '维护模式',
        is_public: false,
      },
      
      // 业务配置
      {
        key: 'business.order_auto_confirm',
        value: 'false',
        category: 'business',
        description: '订单自动确认',
        is_public: false,
      },
      {
        key: 'business.task_timeout_hours',
        value: '4',
        category: 'business',
        description: '任务超时时间（小时）',
        is_public: false,
      },
      {
        key: 'business.low_stock_threshold',
        value: '0.5',
        category: 'business',
        description: '低库存阈值（比例）',
        is_public: false,
      },
      
      // 告警配置
      {
        key: 'alarm.check_interval',
        value: '3600',
        category: 'alarm',
        description: '告警检查间隔（秒）',
        is_public: false,
      },
      {
        key: 'alarm.notification_enabled',
        value: 'true',
        category: 'alarm',
        description: '启用告警通知',
        is_public: false,
      },
      
      // 日志配置
      {
        key: 'log.retention_days',
        value: '90',
        category: 'log',
        description: '日志保留天数',
        is_public: false,
      },
    ];

    const results = [];

    for (const config of defaultConfigs) {
      try {
        const existing = await this.prisma.system_configs.findUnique({
          where: { key: config.key },
        });

        if (!existing) {
          const created = await this.prisma.system_configs.create({
            data: config,
          });
          results.push({ key: config.key, action: 'created', data: created });
        } else {
          results.push({ key: config.key, action: 'skipped', message: '配置已存在' });
        }
      } catch (error) {
        results.push({ key: config.key, action: 'failed', error: error.message });
      }
    }

    return results;
  }
}
