import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { WebService } from './web.service';
import { DatabaseModule } from '../database/database.module';
import { ProductionModule } from '../production/production.module';
import { AlarmModule } from '../alarm/alarm.module';
import { SafetyModule } from '../safety/safety.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    DatabaseModule,
    ProductionModule,
    AlarmModule,
    SafetyModule,
    MonitoringModule,
    SyncModule,
  ],
  controllers: [WebController],
  providers: [WebService],
  exports: [WebService],
})
export class WebModule {}