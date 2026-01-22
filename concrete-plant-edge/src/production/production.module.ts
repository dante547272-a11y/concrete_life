import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { DatabaseModule } from '../database/database.module';
import { PlcModule } from '../plc/plc.module';
import { AlarmModule } from '../alarm/alarm.module';

@Module({
  imports: [DatabaseModule, PlcModule, AlarmModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}