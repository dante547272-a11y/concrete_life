import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const mode = this.configService.get('NODE_ENV', 'development');
    const port = this.configService.get('PORT', 3000);
    const dbType = this.configService.get('DATABASE_TYPE', 'postgres');
    
    console.log('='.repeat(60));
    console.log('🏭 混凝土搅拌站管理系统');
    console.log('='.repeat(60));
    console.log(`📍 环境: ${mode.toUpperCase()}`);
    console.log(`🔌 端口: ${port}`);
    console.log(`💾 数据库: ${dbType.toUpperCase()}`);
    console.log('='.repeat(60));
  }

  getHealth() {
    const mode = this.configService.get('NODE_ENV', 'development');
    const port = this.configService.get('PORT', 3000);
    
    return {
      status: 'ok',
      mode: mode,
      port: port,
      timestamp: new Date().toISOString(),
      message: '混凝土搅拌站管理系统运行正常',
    };
  }
}
