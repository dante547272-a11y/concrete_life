import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModbusService } from './modbus/modbus.service';
import { OpcuaService } from './opcua/opcua.service';
import { EthernetIpService } from './ethernet-ip/ethernet-ip.service';
import { DatabaseService } from '../database/database.service';

export interface PlcDataPoint {
  tagName: string;
  deviceId: string;
  address: string;
  dataType: 'int' | 'float' | 'bool' | 'string';
  value: any;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: Date;
}

@Injectable()
export class PlcService implements OnModuleInit {
  private readonly logger = new Logger(PlcService.name);
  private connectionStatus = new Map<string, boolean>();

  constructor(
    private readonly configService: ConfigService,
    private readonly modbusService: ModbusService,
    private readonly opcuaService: OpcuaService,
    private readonly ethernetIpService: EthernetIpService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔌 初始化PLC连接...');
    await this.initializeConnections();
  }

  /**
   * 初始化所有PLC连接
   */
  private async initializeConnections() {
    // 初始化Modbus连接
    try {
      const modbusHost = this.configService.get<string>('MODBUS_HOST');
      const modbusPort = this.configService.get<number>('MODBUS_PORT', 502);
      
      if (modbusHost) {
        await this.modbusService.connect(modbusHost, modbusPort);
        this.connectionStatus.set('modbus', true);
        this.logger.log(`✅ Modbus连接成功: ${modbusHost}:${modbusPort}`);
      }
    } catch (error) {
      this.logger.error(`❌ Modbus连接失败: ${error.message}`);
      this.connectionStatus.set('modbus', false);
    }

    // 初始化OPC-UA连接
    try {
      const opcuaEndpoint = this.configService.get<string>('OPCUA_ENDPOINT');
      
      if (opcuaEndpoint) {
        await this.opcuaService.connect(opcuaEndpoint);
        this.connectionStatus.set('opcua', true);
        this.logger.log(`✅ OPC-UA连接成功: ${opcuaEndpoint}`);
      }
    } catch (error) {
      this.logger.error(`❌ OPC-UA连接失败: ${error.message}`);
      this.connectionStatus.set('opcua', false);
    }

    // 初始化Ethernet/IP连接
    try {
      const ethernetIpHost = this.configService.get<string>('ETHERNET_IP_HOST');
      
      if (ethernetIpHost) {
        await this.ethernetIpService.connect(ethernetIpHost);
        this.connectionStatus.set('ethernet_ip', true);
        this.logger.log(`✅ Ethernet/IP连接成功: ${ethernetIpHost}`);
      }
    } catch (error) {
      this.logger.error(`❌ Ethernet/IP连接失败: ${error.message}`);
      this.connectionStatus.set('ethernet_ip', false);
    }
  }

  /**
   * 读取数据点
   */
  async readDataPoint(tagName: string): Promise<PlcDataPoint | null> {
    try {
      // 从数据库获取数据点配置
      const dataPoint = await this.databaseService.dataPoint.findUnique({
        where: { tagName_deviceId: { tagName, deviceId: 'default' } },
      });

      if (!dataPoint) {
        this.logger.warn(`数据点不存在: ${tagName}`);
        return null;
      }

      let value: any;
      let quality: 'good' | 'bad' | 'uncertain' = 'good';

      // 根据设备类型读取数据
      if (dataPoint.deviceId.startsWith('modbus')) {
        if (!this.connectionStatus.get('modbus')) {
          quality = 'bad';
          value = null;
        } else {
          value = await this.readModbusValue(dataPoint.address, dataPoint.dataType);
        }
      } else if (dataPoint.deviceId.startsWith('opcua')) {
        if (!this.connectionStatus.get('opcua')) {
          quality = 'bad';
          value = null;
        } else {
          value = await this.readOpcuaValue(dataPoint.address);
        }
      } else if (dataPoint.deviceId.startsWith('ethernet_ip')) {
        if (!this.connectionStatus.get('ethernet_ip')) {
          quality = 'bad';
          value = null;
        } else {
          value = await this.readEthernetIpValue(dataPoint.address);
        }
      }

      // 更新数据点值
      await this.databaseService.dataPoint.update({
        where: { id: dataPoint.id },
        data: {
          value: value?.toString() || '',
          quality,
          timestamp: new Date(),
        },
      });

      // 记录历史数据
      await this.databaseService.dataHistory.create({
        data: {
          pointId: dataPoint.id,
          value: value?.toString() || '',
          quality,
          timestamp: new Date(),
        },
      });

      return {
        tagName: dataPoint.tagName,
        deviceId: dataPoint.deviceId,
        address: dataPoint.address,
        dataType: dataPoint.dataType as any,
        value,
        quality,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error(`读取数据点失败: ${tagName}`, error);
      return null;
    }
  }

  /**
   * 写入数据点
   */
  async writeDataPoint(tagName: string, value: any): Promise<boolean> {
    try {
      // 从数据库获取数据点配置
      const dataPoint = await this.databaseService.dataPoint.findUnique({
        where: { tagName_deviceId: { tagName, deviceId: 'default' } },
      });

      if (!dataPoint) {
        this.logger.warn(`数据点不存在: ${tagName}`);
        return false;
      }

      let success = false;

      // 根据设备类型写入数据
      if (dataPoint.deviceId.startsWith('modbus')) {
        if (this.connectionStatus.get('modbus')) {
          success = await this.writeModbusValue(dataPoint.address, value, dataPoint.dataType);
        }
      } else if (dataPoint.deviceId.startsWith('opcua')) {
        if (this.connectionStatus.get('opcua')) {
          success = await this.writeOpcuaValue(dataPoint.address, value);
        }
      } else if (dataPoint.deviceId.startsWith('ethernet_ip')) {
        if (this.connectionStatus.get('ethernet_ip')) {
          success = await this.writeEthernetIpValue(dataPoint.address, value);
        }
      }

      if (success) {
        // 更新数据点值
        await this.databaseService.dataPoint.update({
          where: { id: dataPoint.id },
          data: {
            value: value.toString(),
            quality: 'good',
            timestamp: new Date(),
          },
        });

        this.logger.debug(`写入数据点成功: ${tagName} = ${value}`);
      }

      return success;

    } catch (error) {
      this.logger.error(`写入数据点失败: ${tagName}`, error);
      return false;
    }
  }

  /**
   * 批量读取数据点
   */
  async readMultipleDataPoints(tagNames: string[]): Promise<PlcDataPoint[]> {
    const results: PlcDataPoint[] = [];

    for (const tagName of tagNames) {
      const result = await this.readDataPoint(tagName);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): Record<string, boolean> {
    return Object.fromEntries(this.connectionStatus);
  }

  /**
   * 重新连接所有设备
   */
  async reconnectAll(): Promise<void> {
    this.logger.log('🔄 重新连接所有PLC设备...');
    await this.initializeConnections();
  }

  // 私有方法：Modbus读写
  private async readModbusValue(address: string, dataType: string): Promise<any> {
    const addr = parseInt(address);
    
    switch (dataType) {
      case 'int':
        const intData = await this.modbusService.readHoldingRegisters(addr, 1);
        return intData[0];
      case 'float':
        const floatData = await this.modbusService.readHoldingRegisters(addr, 2);
        return this.modbusService.registersToFloat(floatData);
      case 'bool':
        const boolData = await this.modbusService.readCoils(addr, 1);
        return boolData[0];
      default:
        return null;
    }
  }

  private async writeModbusValue(address: string, value: any, dataType: string): Promise<boolean> {
    try {
      const addr = parseInt(address);
      
      switch (dataType) {
        case 'int':
          await this.modbusService.writeRegister(addr, parseInt(value));
          return true;
        case 'float':
          const registers = this.modbusService.floatToRegisters(parseFloat(value));
          await this.modbusService.writeRegisters(addr, registers);
          return true;
        case 'bool':
          await this.modbusService.writeCoil(addr, Boolean(value));
          return true;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Modbus写入失败: ${error.message}`);
      return false;
    }
  }

  // 私有方法：OPC-UA读写
  private async readOpcuaValue(nodeId: string): Promise<any> {
    return await this.opcuaService.readVariable(nodeId);
  }

  private async writeOpcuaValue(nodeId: string, value: any): Promise<boolean> {
    try {
      await this.opcuaService.writeVariable(nodeId, value);
      return true;
    } catch (error) {
      this.logger.error(`OPC-UA写入失败: ${error.message}`);
      return false;
    }
  }

  // 私有方法：Ethernet/IP读写
  private async readEthernetIpValue(tag: string): Promise<any> {
    return await this.ethernetIpService.readTag(tag);
  }

  private async writeEthernetIpValue(tag: string, value: any): Promise<boolean> {
    try {
      await this.ethernetIpService.writeTag(tag, value);
      return true;
    } catch (error) {
      this.logger.error(`Ethernet/IP写入失败: ${error.message}`);
      return false;
    }
  }
}