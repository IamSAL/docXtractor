import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RunStatus } from '../entities/run.entity';

export class FindRunsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(RunStatus)
  @ApiPropertyOptional({
    enum: RunStatus,
    description: 'Filter runs by their current status',
    example: RunStatus.DONE,
  })
  status?: RunStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter runs by the extractor ID used',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  extractorId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search term for run ID or name',
    example: 'invoice',
  })
  search?: string;
}
