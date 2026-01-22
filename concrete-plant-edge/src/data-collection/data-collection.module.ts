import { Module } from '@nestjs/common';
import { DataCollectionService } from './data-collection.service';
import { DataCollectionController } from './data-collection.controller';
import { PlcModule } from '../plc/plc.module';

@Module({
  imports: [PlcModule],
  controllers: [DataCollectionController],
  providers: [DataCollectionService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}