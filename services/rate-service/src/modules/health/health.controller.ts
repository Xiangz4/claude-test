import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check database connection
      () => this.db.pingCheck('database'),

      // Check Redis connection
      () => this.redis.isHealthy('redis'),

      // Check memory heap usage (should be below 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Check memory RSS usage (should be below 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('live')
  alive() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'rate-service',
    };
  }
}
