import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { createLogger } from './common/logger/winston.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // 创建应用实例
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger(createLogger()),
    });

    // 获取配置服务
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const siteId = configService.get<string>('SITE_ID', '1');
    const siteName = configService.get<string>('SITE_NAME', '边缘节点');

    // 全局验证管道
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // 启用CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // 启动应用
    await app.listen(port);

    logger.log(`🚀 边缘计算节点启动成功`);
    logger.log(`📍 站点信息: ${siteName} (ID: ${siteId})`);
    logger.log(`🌐 服务地址: http://localhost:${port}`);
    logger.log(`🔍 健康检查: http://localhost:${port}/health`);
    logger.log(`📊 本地界面: http://localhost:${port}/dashboard`);
    
  } catch (error) {
    logger.error(`❌ 应用启动失败: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在优雅关闭...');
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在优雅关闭...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

bootstrap();