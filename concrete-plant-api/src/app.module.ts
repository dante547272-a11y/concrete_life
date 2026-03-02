import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { TasksModule } from './tasks/tasks.module';
// import { VehiclesModule } from './vehicles/vehicles.module';
import { MaterialsModule } from './materials/materials.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { InventoryModule } from './inventory/inventory.module';
import { RecipesModule } from './recipes/recipes.module';
import { GradesModule } from './grades/grades.module';
import { ProductionModule } from './production/production.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SitesModule } from './sites/sites.module';
import { AlarmsModule } from './alarms/alarms.module';
import { LogsModule } from './logs/logs.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule as SystemConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    TasksModule,
    // VehiclesModule,
    MaterialsModule,
    SuppliersModule,
    InventoryModule,
    RecipesModule,
    GradesModule,
    ProductionModule,
    DashboardModule,
    SitesModule,
    AlarmsModule,
    LogsModule,
    WebSocketModule,
    AnalyticsModule,
    ReportsModule,
    SystemConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
