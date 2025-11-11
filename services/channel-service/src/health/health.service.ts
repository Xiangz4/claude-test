import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthCheckDto } from './dto/health-check.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthCheckDto> {
    const startTime = Date.now();
    const checks = {
      database: await this.checkDatabase(),
    };

    const isHealthy = Object.values(checks).every((check) => check.status === 'up');
    const status = isHealthy ? 'ok' : 'degraded';
    const responseTime = Date.now() - startTime;

    return {
      status,
      timestamp: new Date().toISOString(),
      service: 'channel-service',
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime,
      checks,
    };
  }

  async readinessCheck(): Promise<{ status: string; ready: boolean }> {
    const dbCheck = await this.checkDatabase();
    const ready = dbCheck.status === 'up';

    return {
      status: ready ? 'ready' : 'not ready',
      ready,
    };
  }

  async livenessCheck(): Promise<{ status: string; alive: boolean }> {
    return {
      status: 'alive',
      alive: true,
    };
  }

  private async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }
}
