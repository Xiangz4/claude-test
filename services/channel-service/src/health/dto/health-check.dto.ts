import { ApiProperty } from '@nestjs/swagger';

class CheckStatus {
  @ApiProperty({ example: 'up', description: 'Status of the check' })
  status: string;

  @ApiProperty({ example: 'Connected', required: false })
  message?: string;
}

class HealthChecks {
  @ApiProperty({ type: CheckStatus })
  database: CheckStatus;
}

export class HealthCheckDto {
  @ApiProperty({ example: 'ok', description: 'Overall health status' })
  status: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'channel-service' })
  service: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: 123.45, description: 'Uptime in seconds' })
  uptime: number;

  @ApiProperty({ example: 15, description: 'Response time in milliseconds' })
  responseTime: number;

  @ApiProperty({ type: HealthChecks })
  checks: HealthChecks;
}
