import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PlcService } from './plc.service';
import { ModbusService } from './modbus/modbus.service';
import { OpcuaService } from './opcua/opcua.service';
import { EthernetIpService } from './ethernet-ip/ethernet-ip.service';

@Controller('plc')
export class PlcController {
  constructor(
    private readonly plcService: PlcService,
    private readonly modbusService: ModbusService,
    private readonly opcuaService: OpcuaService,
    private readonly ethernetIpService: EthernetIpService,
  ) {}

  @Get('status')
  getConnectionStatus() {
    return {
      connections: this.plcService.getConnectionStatus(),
      modbus: this.modbusService.getConnectionInfo(),
      opcua: this.opcuaService.getConnectionInfo(),
      ethernetIp: this.ethernetIpService.getConnectionInfo(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reconnect')
  async reconnectAll() {
    await this.plcService.reconnectAll();
    return { message: '重新连接完成', timestamp: new Date().toISOString() };
  }

  @Get('data/:tagName')
  async readDataPoint(@Param('tagName') tagName: string) {
    const result = await this.plcService.readDataPoint(tagName);
    return { data: result, timestamp: new Date().toISOString() };
  }

  @Post('data/:tagName')
  async writeDataPoint(
    @Param('tagName') tagName: string,
    @Body('value') value: any
  ) {
    const success = await this.plcService.writeDataPoint(tagName, value);
    return { 
      success, 
      message: success ? '写入成功' : '写入失败',
      timestamp: new Date().toISOString() 
    };
  }

  @Post('data/batch/read')
  async readMultipleDataPoints(@Body('tagNames') tagNames: string[]) {
    const results = await this.plcService.readMultipleDataPoints(tagNames);
    return { data: results, timestamp: new Date().toISOString() };
  }

  // Modbus专用接口
  @Get('modbus/registers/:address')
  async readModbusRegisters(
    @Param('address') address: string,
    @Query('length') length: string = '1'
  ) {
    const addr = parseInt(address);
    const len = parseInt(length);
    const data = await this.modbusService.readHoldingRegisters(addr, len);
    return { address: addr, length: len, data, timestamp: new Date().toISOString() };
  }

  @Post('modbus/registers/:address')
  async writeModbusRegister(
    @Param('address') address: string,
    @Body('value') value: number
  ) {
    const addr = parseInt(address);
    await this.modbusService.writeRegister(addr, value);
    return { 
      message: '写入成功', 
      address: addr, 
      value, 
      timestamp: new Date().toISOString() 
    };
  }

  @Get('modbus/coils/:address')
  async readModbusCoils(
    @Param('address') address: string,
    @Query('length') length: string = '1'
  ) {
    const addr = parseInt(address);
    const len = parseInt(length);
    const data = await this.modbusService.readCoils(addr, len);
    return { address: addr, length: len, data, timestamp: new Date().toISOString() };
  }

  @Post('modbus/coils/:address')
  async writeModbusCoil(
    @Param('address') address: string,
    @Body('value') value: boolean
  ) {
    const addr = parseInt(address);
    await this.modbusService.writeCoil(addr, value);
    return { 
      message: '写入成功', 
      address: addr, 
      value, 
      timestamp: new Date().toISOString() 
    };
  }

  // OPC-UA专用接口
  @Get('opcua/browse')
  async browseOpcuaNodes(@Query('nodeId') nodeId: string = 'RootFolder') {
    const nodes = await this.opcuaService.browseNode(nodeId);
    return { nodeId, nodes, timestamp: new Date().toISOString() };
  }

  @Get('opcua/read/:nodeId')
  async readOpcuaVariable(@Param('nodeId') nodeId: string) {
    const value = await this.opcuaService.readVariable(nodeId);
    return { nodeId, value, timestamp: new Date().toISOString() };
  }

  @Post('opcua/write/:nodeId')
  async writeOpcuaVariable(
    @Param('nodeId') nodeId: string,
    @Body('value') value: any
  ) {
    await this.opcuaService.writeVariable(nodeId, value);
    return { 
      message: '写入成功', 
      nodeId, 
      value, 
      timestamp: new Date().toISOString() 
    };
  }

  // Ethernet/IP专用接口
  @Get('ethernet-ip/tags')
  getAllEthernetIpTags() {
    const tags = this.ethernetIpService.getAllTagsInfo();
    return { tags, timestamp: new Date().toISOString() };
  }

  @Get('ethernet-ip/tag/:tagName')
  getEthernetIpTag(@Param('tagName') tagName: string) {
    const tagInfo = this.ethernetIpService.getTagInfo(tagName);
    return { tag: tagInfo, timestamp: new Date().toISOString() };
  }

  @Post('ethernet-ip/tag/:tagName')
  async writeEthernetIpTag(
    @Param('tagName') tagName: string,
    @Body('value') value: any
  ) {
    await this.ethernetIpService.writeTag(tagName, value);
    return { 
      message: '写入成功', 
      tagName, 
      value, 
      timestamp: new Date().toISOString() 
    };
  }

  @Post('ethernet-ip/scan')
  async scanEthernetIpController() {
    const info = await this.ethernetIpService.scanController();
    return { controllerInfo: info, timestamp: new Date().toISOString() };
  }
}