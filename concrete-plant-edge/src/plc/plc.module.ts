import { Module } from '@nestjs/common';
import { PlcService } from './plc.service';
import { ModbusService } from './modbus/modbus.service';
import { OpcuaService } from './opcua/opcua.service';
import { EthernetIpService } from './ethernet-ip/ethernet-ip.service';
import { PlcController } from './plc.controller';

@Module({
  controllers: [PlcController],
  providers: [
    PlcService,
    ModbusService,
    OpcuaService,
    EthernetIpService,
  ],
  exports: [
    PlcService,
    ModbusService,
    OpcuaService,
    EthernetIpService,
  ],
})
export class PlcModule {}