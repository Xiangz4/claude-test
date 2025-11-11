import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import { OrderModule } from './modules/order/order.module';
import { QuoteLockModule } from './modules/quote-lock/quote-lock.module';
import { EventsModule } from './modules/events/events.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    // Feature modules
    HealthModule,
    OrderModule,
    QuoteLockModule,
    EventsModule,
  ],
})
export class AppModule {}
