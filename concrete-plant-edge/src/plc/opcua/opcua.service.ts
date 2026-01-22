import { Injectable, Logger } from '@nestjs/common';
import { 
  OPCUAClient, 
  MessageSecurityMode, 
  SecurityPolicy,
  ClientSession,
  DataValue,
  Variant,
  DataType
} from 'node-opcua';

@Injectable()
export class OpcuaService {
  private readonly logger = new Logger(OpcuaService.name);
  private client: OPCUAClient;
  private session: ClientSession | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.client = OPCUAClient.create({
      applicationName: 'ConcreteEdgeNode',
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3,
        maxDelay: 10000,
      },
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      endpoint_must_exist: false,
      keepSessionAlive: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connection_lost', () => {
      this.logger.warn('OPC-UA连接丢失');
      this.isConnected = false;
      this.session = null;
      this.scheduleReconnect();
    });

    this.client.on('connection_reestablished', () => {
      this.logger.log('OPC-UA连接已重新建立');
      this.isConnected = true;
    });

    this.client.on('backoff', (retry, delay) => {
      this.logger.warn(`OPC-UA重连尝试 ${retry}, 延迟 ${delay}ms`);
    });
  }

  async connect(endpointUrl: string, username?: string, password?: string) {
    try {
      this.logger.log(`正在连接OPC-UA服务器: ${endpointUrl}`);
      
      await this.client.connect(endpointUrl);
      
      // 创建会话
      if (username && password) {
        this.session = await this.client.createSession({
          userName: username,
          password: password,
        });
      } else {
        this.session = await this.client.createSession();
      }
      
      this.isConnected = true;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.logger.log(`OPC-UA连接成功: ${endpointUrl}`);
    } catch (error) {
      this.logger.error(`OPC-UA连接失败: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(async () => {
      this.logger.log('尝试重新连接OPC-UA...');
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
      if (this.session) {
        await this.session.close();
        this.session = null;
      }
      
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        this.logger.log('OPC-UA连接已断开');
      }
    } catch (error) {
      this.logger.error(`OPC-UA断开连接失败: ${error.message}`);
    }
  }

  /**
   * 读取变量值
   */
  async readVariable(nodeId: string): Promise<any> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const dataValue: DataValue = await this.session.readVariableValue(nodeId);
      
      if (dataValue.statusCode.isGood()) {
        const value = dataValue.value.value;
        this.logger.debug(`读取OPC-UA变量: ${nodeId} = ${value}`);
        return value;
      } else {
        throw new Error(`读取失败，状态码: ${dataValue.statusCode.toString()}`);
      }
    } catch (error) {
      this.logger.error(`读取OPC-UA变量失败: ${nodeId}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量读取变量
   */
  async readMultipleVariables(nodeIds: string[]): Promise<{ [nodeId: string]: any }> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const dataValues = await this.session.readVariableValue(nodeIds);
      const results: { [nodeId: string]: any } = {};

      dataValues.forEach((dataValue, index) => {
        const nodeId = nodeIds[index];
        if (dataValue.statusCode.isGood()) {
          results[nodeId] = dataValue.value.value;
        } else {
          this.logger.warn(`读取变量失败: ${nodeId}, 状态码: ${dataValue.statusCode.toString()}`);
          results[nodeId] = null;
        }
      });

      this.logger.debug(`批量读取OPC-UA变量完成: ${nodeIds.length}个变量`);
      return results;
    } catch (error) {
      this.logger.error(`批量读取OPC-UA变量失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入变量值
   */
  async writeVariable(nodeId: string, value: any, dataType?: DataType): Promise<void> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      // 自动推断数据类型
      let inferredDataType = dataType;
      if (!inferredDataType) {
        if (typeof value === 'boolean') {
          inferredDataType = DataType.Boolean;
        } else if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            inferredDataType = DataType.Int32;
          } else {
            inferredDataType = DataType.Float;
          }
        } else if (typeof value === 'string') {
          inferredDataType = DataType.String;
        } else {
          inferredDataType = DataType.Variant;
        }
      }

      const variant = new Variant({
        dataType: inferredDataType,
        value: value,
      });

      const statusCode = await this.session.writeSingleNode(nodeId, variant);
      
      if (statusCode.isGood()) {
        this.logger.debug(`写入OPC-UA变量成功: ${nodeId} = ${value}`);
      } else {
        throw new Error(`写入失败，状态码: ${statusCode.toString()}`);
      }
    } catch (error) {
      this.logger.error(`写入OPC-UA变量失败: ${nodeId}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量写入变量
   */
  async writeMultipleVariables(writes: { nodeId: string; value: any; dataType?: DataType }[]): Promise<void> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const nodesToWrite = writes.map(write => {
        // 自动推断数据类型
        let dataType = write.dataType;
        if (!dataType) {
          if (typeof write.value === 'boolean') {
            dataType = DataType.Boolean;
          } else if (typeof write.value === 'number') {
            if (Number.isInteger(write.value)) {
              dataType = DataType.Int32;
            } else {
              dataType = DataType.Float;
            }
          } else if (typeof write.value === 'string') {
            dataType = DataType.String;
          } else {
            dataType = DataType.Variant;
          }
        }

        return {
          nodeId: write.nodeId,
          attributeId: 13, // Value attribute
          value: {
            value: new Variant({
              dataType: dataType,
              value: write.value,
            }),
          },
        };
      });

      const statusCodes = await this.session.write(nodesToWrite);
      
      statusCodes.forEach((statusCode, index) => {
        const write = writes[index];
        if (statusCode.isGood()) {
          this.logger.debug(`写入OPC-UA变量成功: ${write.nodeId} = ${write.value}`);
        } else {
          this.logger.error(`写入OPC-UA变量失败: ${write.nodeId}, 状态码: ${statusCode.toString()}`);
        }
      });

    } catch (error) {
      this.logger.error(`批量写入OPC-UA变量失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 浏览节点
   */
  async browseNode(nodeId: string = 'RootFolder'): Promise<any[]> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const browseResult = await this.session.browse(nodeId);
      
      const nodes = browseResult.references?.map(ref => ({
        nodeId: ref.nodeId.toString(),
        browseName: ref.browseName.toString(),
        displayName: ref.displayName?.text || '',
        nodeClass: ref.nodeClass,
        typeDefinition: ref.typeDefinition?.toString(),
      })) || [];

      this.logger.debug(`浏览OPC-UA节点: ${nodeId}, 找到 ${nodes.length} 个子节点`);
      return nodes;
    } catch (error) {
      this.logger.error(`浏览OPC-UA节点失败: ${nodeId}, ${error.message}`);
      throw error;
    }
  }

  /**
   * 订阅数据变化
   */
  async subscribeToDataChanges(nodeIds: string[], callback: (nodeId: string, value: any) => void): Promise<void> {
    if (!this.session) {
      throw new Error('OPC-UA会话未建立');
    }

    try {
      const subscription = await this.session.createSubscription2({
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10,
      });

      for (const nodeId of nodeIds) {
        const monitoredItem = await subscription.monitor(
          {
            nodeId: nodeId,
            attributeId: 13, // Value attribute
          },
          {
            samplingInterval: 1000,
            discardOldest: true,
            queueSize: 10,
          }
        );

        monitoredItem.on('changed', (dataValue: DataValue) => {
          if (dataValue.statusCode.isGood()) {
            callback(nodeId, dataValue.value.value);
          }
        });
      }

      this.logger.log(`OPC-UA订阅创建成功: ${nodeIds.length} 个节点`);
    } catch (error) {
      this.logger.error(`创建OPC-UA订阅失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  isConnectedStatus(): boolean {
    return this.isConnected && this.session !== null;
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      hasSession: this.session !== null,
      securityMode: this.client.securityMode,
      securityPolicy: this.client.securityPolicy,
    };
  }
}