import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { DatabaseModule } from '../database/database.module';
import { PlcModule } from '../plc/plc.module';

@Module({
  imports: [DatabaseModule, PlcModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}