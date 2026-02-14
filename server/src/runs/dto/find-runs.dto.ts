import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RunStatus } from '../entities/run.entity';

export class FindRunsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(RunStatus)
  @ApiPropertyOptional({
    enum: RunStatus,
    description: 'Filter by run status',
  })
  status?: RunStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Filter by extractor ID' })
  extractorId?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Search by run ID or name' })
  search?: string;
}
