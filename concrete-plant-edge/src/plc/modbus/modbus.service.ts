import { Injectable, Logger } from '@nestjs/common';
import ModbusRTU from 'modbus-serial';

@Injectable()
export class ModbusService {
  private readonly logger = new Logger(ModbusService.name);
  private client: ModbusRTU;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new ModbusRTU();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('error', (error) => {
      this.logger.error(`Modbus连接错误: ${error.message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.client.on('close', () => {
      this.logger.warn('Modbus连接已关闭');
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  async connect(host: string, port: number = 502, unitId: number = 1) {
    try {
      await this.client.connectTCP(host, { port });
      this.client.setID(unitId);
      this.client.setTimeout(5000); // 5秒超时
      this.isConnected = true;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.logger.log(`Modbus TCP连接成功: ${host}:${port}, Unit ID: ${unitId}`);
    } catch (error) {
      this.logger.error(`Modbus TCP连接失败: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  async connectRTU(port: string, options: any = {}) {
    try {
      const defaultOptions = {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        ...options,
      };

      await this.client.connectRTUBuffered(port, defaultOptions);
      this.client.setTimeout(5000);
      this.isConnected = true;
      
      this.logger.log(`Modbus RTU连接成功: ${port}`);
    } catch (error) {
      this.logger.error(`Modbus RTU连接失败: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.logger.log('尝试重新连接Modbus...');
      // 这里需要保存连接参数以便重连
      // 实际实现中应该保存连接配置
    }, 10000); // 10秒后重连
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.isConnected) {
      this.client.close(() => {
        this.logger.log('Modbus连接已断开');
      });
      this.isConnected = false;
    }
  }

  /**
   * 读取保持寄存器
   */
  async readHoldingRegisters(address: number, length: number): Promise<number[]> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      const data = await this.client.readHoldingRegisters(address, length);
      this.logger.debug(`读取保持寄存器: 地址${address}, 长度${length}, 值[${data.data.join(',')}]`);
      return data.data;
    } catch (error) {
      this.logger.error(`读取保持寄存器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取输入寄存器
   */
  async readInputRegisters(address: number, length: number): Promise<number[]> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      const data = await this.client.readInputRegisters(address, length);
      this.logger.debug(`读取输入寄存器: 地址${address}, 长度${length}, 值[${data.data.join(',')}]`);
      return data.data;
    } catch (error) {
      this.logger.error(`读取输入寄存器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取线圈
   */
  async readCoils(address: number, length: number): Promise<boolean[]> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      const data = await this.client.readCoils(address, length);
      this.logger.debug(`读取线圈: 地址${address}, 长度${length}, 值[${data.data.join(',')}]`);
      return data.data;
    } catch (error) {
      this.logger.error(`读取线圈失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取离散输入
   */
  async readDiscreteInputs(address: number, length: number): Promise<boolean[]> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      const data = await this.client.readDiscreteInputs(address, length);
      this.logger.debug(`读取离散输入: 地址${address}, 长度${length}, 值[${data.data.join(',')}]`);
      return data.data;
    } catch (error) {
      this.logger.error(`读取离散输入失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入单个寄存器
   */
  async writeRegister(address: number, value: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      await this.client.writeRegister(address, value);
      this.logger.debug(`写入寄存器成功: 地址${address}, 值${value}`);
    } catch (error) {
      this.logger.error(`写入寄存器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入多个寄存器
   */
  async writeRegisters(address: number, values: number[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      await this.client.writeRegisters(address, values);
      this.logger.debug(`写入多个寄存器成功: 地址${address}, 值[${values.join(',')}]`);
    } catch (error) {
      this.logger.error(`写入多个寄存器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入单个线圈
   */
  async writeCoil(address: number, value: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      await this.client.writeCoil(address, value);
      this.logger.debug(`写入线圈成功: 地址${address}, 值${value}`);
    } catch (error) {
      this.logger.error(`写入线圈失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 写入多个线圈
   */
  async writeCoils(address: number, values: boolean[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Modbus未连接');
    }

    try {
      await this.client.writeCoils(address, values);
      this.logger.debug(`写入多个线圈成功: 地址${address}, 值[${values.join(',')}]`);
    } catch (error) {
      this.logger.error(`写入多个线圈失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 浮点数转寄存器（IEEE 754）
   */
  floatToRegisters(value: number): number[] {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeFloatBE(value, 0);
    return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];
  }

  /**
   * 寄存器转浮点数（IEEE 754）
   */
  registersToFloat(registers: number[]): number {
    if (registers.length < 2) {
      throw new Error('需要至少2个寄存器来转换浮点数');
    }
    
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt16BE(registers[0], 0);
    buffer.writeUInt16BE(registers[1], 2);
    return buffer.readFloatBE(0);
  }

  /**
   * 32位整数转寄存器
   */
  int32ToRegisters(value: number): number[] {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeInt32BE(value, 0);
    return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];
  }

  /**
   * 寄存器转32位整数
   */
  registersToInt32(registers: number[]): number {
    if (registers.length < 2) {
      throw new Error('需要至少2个寄存器来转换32位整数');
    }
    
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt16BE(registers[0], 0);
    buffer.writeUInt16BE(registers[1], 2);
    return buffer.readInt32BE(0);
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
      timeout: this.client.getTimeout(),
    };
  }
}