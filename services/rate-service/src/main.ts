import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  const corsOrigins = configService.get<string[]>('app.corsOrigins');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = configService.get<number>('app.port');
  const environment = configService.get<string>('app.environment');
  const serviceName = configService.get<string>('app.serviceName');

  await app.listen(port);

  logger.log(`${serviceName} is running on port ${port} in ${environment} mode`);
  logger.log(`Health check available at: http://localhost:${port}/health`);
}

bootstrap();
