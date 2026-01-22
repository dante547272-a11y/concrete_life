import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { SyncService } from './sync/sync.service';
import { MonitoringService } from './monitoring/monitoring.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly syncService: SyncService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  getInfo() {
    return {
      name: 'Concrete Plant Edge Node',
      version: '1.0.0',
      siteId: this.configService.get('SITE_ID'),
      siteName: this.configService.get('SITE_NAME'),
      siteCode: this.configService.get('SITE_CODE'),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getHealth() {
    const dbHealth = await this.databaseService.healthCheck();
    const syncStatus = await this.syncService.getConnectionStatus();
    const systemStatus = await this.monitoringService.getSystemStatus();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      node: {
        siteId: this.configService.get('SITE_ID'),
        siteName: this.configService.get('SITE_NAME'),
        version: '1.0.0',
      },
      database: dbHealth,
      sync: syncStatus,
      system: systemStatus,
    };
  }

  @Get('status')
  async getStatus() {
    return {
      database: await this.databaseService.getStats(),
      sync: await this.syncService.getSyncStats(),
      system: await this.monitoringService.getDetailedStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}