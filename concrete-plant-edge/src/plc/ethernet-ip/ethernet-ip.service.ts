import { Injectable, Logger } from '@nestjs/common';

// 注意：ethernet-ip库的类型定义可能不完整，这里使用any类型
const { Controller } = require('ethernet-ip');

@Injectable()
export class EthernetIpService {
  private readonly logger = new Logger(EthernetIpService.name);
  private controller: any;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private tags = new Map<string, any>();

  constructor() {
    this.controller = new Controller();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.controller.on('connect', () => {
      this.logger.log('Ethernet/IP连接成功');
      this.isConnected = true;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.controller.on('disconnect', () => {
      this.logger.warn('Ethernet/IP连接断开');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.controller.on('error', (error: Error) => {
      this.logger.error(`Ethernet/IP错误: ${error.message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  async connect(host: string, slot: number = 0) {
    try {
      this.logger.log(`正在连接Ethernet/IP控制器: ${host}, Slot: ${slot}`);
      
      await this.controller.connect(host, slot);
      this.isConnected = true;
      
      this.logger.log(`Ethernet/IP连接成功: ${host}:${slot}`);
    } catch (error) {
      this.logger.error(`Ethernet/IP连接失败: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(async () => {
      this.logger.log('尝试重新连接Ethernet/IP...');
      // 这里需要保存连接参数以便重连
      // 实际实现中应该保存连接配置
      this.reconnectTimer = null;
    }, 10000); // 10秒后重连
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    try {
      if (this.isConnected) {
        await this.controller.destroy();
        this.isConnected = false;
        this.logger.log('Ethernet/IP连接已断开');
      }
    } catch (error) {
      this.logger.error(`Ethernet/IP断开连接失败: ${error.message}`);
    }
  }

  /**
   * 添加标签
   */
  addTag(tagName: string, program?: string): void {
    try {
      const tag = this.controller.newTag(tagName, program);
      this.tags.set(tagName, tag);
      this.logger.debug(`添加Ethernet/IP标签: ${tagName}`);
    } catch (error) {
      this.logger.error(`添加标签失败: ${tagName}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取标签值
   */
  async readTag(tagName: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Ethernet/IP未连接');
    }

    try {
      const tag = this.tags.get(tagName);
      if (!tag) {
        // 如果标签不存在，尝试创建
        this.addTag(tagName);
      }

      await this.controller.readTag(tagName);
      const value = this.controller.getTag(tagName).value;
      
      this.logger.debug(`读取Ethernet/IP标签: ${tagName} = ${value}`);
      return value;
    } catch (error) {
      this.logger.error(`读取标签失败: ${tagName}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量读取标签
   */
  async readMultipleTags(tagNames: string[]): Promise<{ [tagName: string]: any }> {
    if (!this.isConnected) {
      throw new Error('Ethernet/IP未连接');
    }

    try {
      // 确保所有标签都已添加
      for (const tagName of tagNames) {
        if (!this.tags.has(tagName)) {
          this.addTag(tagName);
        }
      }

      await this.controller.readTagGroup(tagNames);
      
      const results: { [tagName: string]: any } = {};
      for (const tagName of tagNames) {
        try {
          results[tagName] = this.controller.getTag(tagName).value;
        } catch (error) {
          this.logger.warn(`获取标签值失败: ${tagName}`);
          results[tagName] = null;
        }
      }

      this.logger.debug(`批量读取Ethernet/IP标签完成: ${tagNames.length}个标签`);
      return results;
    } catch (error) {
      this.logger.error(`批量读取标签失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入标签值
   */
  async writeTag(tagName: string, value: any, dataType?: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Ethernet/IP未连接');
    }

    try {
      let tag = this.tags.get(tagName);
      if (!tag) {
        // 如果标签不存在，尝试创建
        this.addTag(tagName);
        tag = this.tags.get(tagName);
      }

      // 设置标签值
      tag.value = value;
      
      await this.controller.writeTag(tagName);
      
      this.logger.debug(`写入Ethernet/IP标签成功: ${tagName} = ${value}`);
    } catch (error) {
      this.logger.error(`写入标签失败: ${tagName}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量写入标签
   */
  async writeMultipleTags(writes: { tagName: string; value: any }[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Ethernet/IP未连接');
    }

    try {
      // 设置所有标签值
      for (const write of writes) {
        let tag = this.tags.get(write.tagName);
        if (!tag) {
          this.addTag(write.tagName);
          tag = this.tags.get(write.tagName);
        }
        tag.value = write.value;
      }

      // 批量写入
      const tagNames = writes.map(w => w.tagName);
      await this.controller.writeTagGroup(tagNames);
      
      this.logger.debug(`批量写入Ethernet/IP标签完成: ${writes.length}个标签`);
    } catch (error) {
      this.logger.error(`批量写入标签失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取标签信息
   */
  getTagInfo(tagName: string): any {
    const tag = this.tags.get(tagName);
    if (!tag) {
      return null;
    }

    return {
      name: tag.name,
      value: tag.value,
      type: tag.type,
      program: tag.program,
      timestamp: tag.timestamp,
    };
  }

  /**
   * 获取所有标签信息
   */
  getAllTagsInfo(): { [tagName: string]: any } {
    const info: { [tagName: string]: any } = {};
    
    this.tags.forEach((tag, tagName) => {
      info[tagName] = {
        name: tag.name,
        value: tag.value,
        type: tag.type,
        program: tag.program,
        timestamp: tag.timestamp,
      };
    });

    return info;
  }

  /**
   * 扫描控制器信息
   */
  async scanController(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Ethernet/IP未连接');
    }

    try {
      const info = await this.controller.getControllerProps();
      this.logger.log('控制器信息扫描完成');
      return info;
    } catch (error) {
      this.logger.error(`扫描控制器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      tagCount: this.tags.size,
      tags: Array.from(this.tags.keys()),
    };
  }

  /**
   * 清除所有标签
   */
  clearAllTags(): void {
    this.tags.clear();
    this.logger.log('已清除所有Ethernet/IP标签');
  }

  /**
   * 移除标签
   */
  removeTag(tagName: string): boolean {
    const removed = this.tags.delete(tagName);
    if (removed) {
      this.logger.debug(`移除Ethernet/IP标签: ${tagName}`);
    }
    return removed;
  }
}