import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { ChannelRate } from '../entities/channel-rate.entity';
import { PlatformRateConfig } from '../entities/platform-rate-config.entity';
import { MerchantRateConfig } from '../entities/merchant-rate-config.entity';
import { RateQuoteLock } from '../entities/rate-quote-lock.entity';

export default registerAs(
  'database',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'fx_platform',
    entities: [ChannelRate, PlatformRateConfig, MerchantRateConfig, RateQuoteLock],
    synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in dev only
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || '2000',
        10,
      ),
    },
  }),
);
