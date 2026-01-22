import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SyncService } from './sync.service';
import { SyncGateway } from './sync.gateway';
import { SyncController } from './sync.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    DatabaseModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncGateway],
  exports: [SyncService, SyncGateway],
})
export class SyncModule {}