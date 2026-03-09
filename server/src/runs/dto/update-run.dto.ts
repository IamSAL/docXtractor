import { PartialType } from '@nestjs/swagger';
import { CreateRunDto } from './create-run.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SortConfig } from '../entities/run.entity';

class SortConfigDto implements SortConfig {
  referenceValues: string[];
  matchColumn: string;
  fileName: string;
  referenceColumn: string;
}

export class UpdateRunDto extends PartialType(CreateRunDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => SortConfigDto)
  @ApiPropertyOptional({ description: 'Reference sort configuration' })
  sortConfig?: SortConfig | null;
}
