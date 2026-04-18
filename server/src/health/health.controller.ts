import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Service health check' })
  async check() {
    const db = await this.dataSource
      .query('SELECT 1')
      .then(() => 'connected')
      .catch(() => 'error');
    return { status: db === 'connected' ? 'ok' : 'degraded', db };
  }
}
