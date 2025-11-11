import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    return {
      status: 'ok',
      service: 'transaction-service',
      timestamp: new Date().toISOString(),
    };
  }

  async detailedCheck() {
    const checks = {
      service: 'transaction-service',
      timestamp: new Date().toISOString(),
      status: 'ok',
      checks: {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        uptime: this.checkUptime(),
      },
    };

    // Determine overall status
    const hasErrors = Object.values(checks.checks).some(
      (check: any) => check.status === 'error',
    );
    checks.status = hasErrors ? 'degraded' : 'ok';

    return checks;
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        message: 'Database connection healthy',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }

  private checkMemory() {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'ok',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    };
  }

  private checkUptime() {
    const uptime = process.uptime();
    return {
      status: 'ok',
      uptime: `${Math.floor(uptime / 60)} minutes`,
      uptimeSeconds: Math.floor(uptime),
    };
  }
}
