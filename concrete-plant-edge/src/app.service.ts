import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('🚀 边缘计算节点服务初始化...');
    
    const siteInfo = {
      id: this.configService.get('SITE_ID'),
      name: this.configService.get('SITE_NAME'),
      code: this.configService.get('SITE_CODE'),
    };

    this.logger.log(`📍 站点信息: ${siteInfo.name} (${siteInfo.code})`);
    this.logger.log(`🔗 中央服务器: ${this.configService.get('CENTRAL_SERVER_URL')}`);
    
    // 显示PLC配置信息
    const plcConfig = {
      modbus: `${this.configService.get('MODBUS_HOST')}:${this.configService.get('MODBUS_PORT')}`,
      opcua: this.configService.get('OPCUA_ENDPOINT'),
      ethernetIp: this.configService.get('ETHERNET_IP_HOST'),
    };

    this.logger.log(`🔌 PLC配置:`);
    this.logger.log(`   Modbus TCP: ${plcConfig.modbus}`);
    this.logger.log(`   OPC-UA: ${plcConfig.opcua}`);
    this.logger.log(`   Ethernet/IP: ${plcConfig.ethernetIp}`);

    this.logger.log('✅ 边缘计算节点服务初始化完成');
  }

  getHello(): string {
    return 'Concrete Plant Edge Computing Node is running!';
  }
}