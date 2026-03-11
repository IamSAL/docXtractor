import { ApiProperty } from '@nestjs/swagger';
import { Run } from '../entities/run.entity';

class StatusCountsDto {
  @ApiProperty()
  done: number;

  @ApiProperty()
  failed: number;
}

export class PaginatedRunsDto {
  @ApiProperty({ type: [Run] })
  data: Run[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: StatusCountsDto })
  statusCounts: StatusCountsDto;
}
