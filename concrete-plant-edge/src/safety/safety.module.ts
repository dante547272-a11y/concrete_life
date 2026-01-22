import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { DatabaseModule } from '../database/database.module';
import { PlcModule } from '../plc/plc.module';
import { AlarmModule } from '../alarm/alarm.module';

@Module({
  imports: [DatabaseModule, PlcModule, AlarmModule],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}