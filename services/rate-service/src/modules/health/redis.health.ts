import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to set and get a test value
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await this.cacheManager.set(testKey, testValue, 5000);
      const result = await this.cacheManager.get(testKey);

      const isHealthy = result === testValue;

      if (isHealthy) {
        // Clean up test key
        await this.cacheManager.del(testKey);
        return this.getStatus(key, true, { status: 'connected' });
      }

      throw new Error('Redis health check failed: value mismatch');
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          status: 'disconnected',
          error: error.message,
        }),
      );
    }
  }
}
