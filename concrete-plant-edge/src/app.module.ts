import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// 核心模块
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// PLC通信模块
import { PlcModule } from './plc/plc.module';

// 数据采集模块
import { DataCollectionModule } from './data-collection/data-collection.module';

// 生产控制模块
import { ProductionModule } from './production/production.module';

// 同步模块
import { SyncModule } from './sync/sync.module';

// 告警模块
import { AlarmModule } from './alarm/alarm.module';

// 安全控制模块
import { SafetyModule } from './safety/safety.module';

// Web界面模块
import { WebModule } from './web/web.module';

// 系统监控模块
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 静态文件服务（Web界面）
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web-ui', 'dist'),
      serveRoot: '/dashboard',
    }),

    // 核心模块
    DatabaseModule,
    
    // PLC通信
    PlcModule,
    
    // 数据采集
    DataCollectionModule,
    
    // 生产控制
    ProductionModule,
    
    // 数据同步
    SyncModule,
    
    // 告警管理
    AlarmModule,
    
    // 安全控制
    SafetyModule,
    
    // Web界面API
    WebModule,
    
    // 系统监控
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}