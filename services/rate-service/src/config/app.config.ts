import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  environment: process.env.NODE_ENV || 'development',
  serviceName: 'rate-service',
  version: process.env.npm_package_version || '1.0.0',

  // Rate fetching configuration
  rateFetchInterval: parseInt(process.env.RATE_FETCH_INTERVAL || '60000', 10), // 1 minute
  rateValidityDuration: parseInt(process.env.RATE_VALIDITY_DURATION || '300000', 10), // 5 minutes

  // Quote lock configuration
  quoteLockDuration: parseInt(process.env.QUOTE_LOCK_DURATION || '30', 10), // 30 seconds

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
}));
