import { PartialType } from '@nestjs/swagger';
import { CreateRunDto } from './create-run.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SortConfig } from '../entities/run.entity';

class SortConfigDto implements SortConfig {
  @IsArray()
  @IsString({ each: true })
  referenceValues: string[];

  @IsString()
  matchColumn: string;

  @IsString()
  fileName: string;

  @IsString()
  referenceColumn: string;
}

export class UpdateRunDto extends PartialType(CreateRunDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => SortConfigDto)
  @ApiPropertyOptional({ description: 'Reference sort configuration' })
  sortConfig?: SortConfig | null;
}
