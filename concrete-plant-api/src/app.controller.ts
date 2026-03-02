import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api/health')
  getApiHealth() {
    return this.appService.getHealth();
  }

  @Get('api/config/runtime')
  getRuntimeConfig() {
    const mode = this.configService.get('DEPLOYMENT_MODE', 'hybrid');
    const dbType = this.configService.get('DATABASE_TYPE', 'postgres');
    
    return {
      mode: mode,
      features: {
        plcCommunication: mode === 'edge',
        realtimeMonitoring: true,
        cloudSync: mode === 'edge',
        multiSiteManagement: mode === 'cloud',
        advancedAnalytics: mode === 'cloud',
        offlineMode: mode === 'edge',
        dataExport: true,
        reportGeneration: true,
        alarmNotification: true,
        remoteControl: mode === 'edge',
      },
      database: dbType,
      plc: {
        enabled: mode === 'edge',
        host: this.configService.get('PLC_HOST'),
      },
      cloudSync: {
        enabled: mode === 'edge',
        apiUrl: this.configService.get('CLOUD_API_URL'),
      },
    };
  }
}
