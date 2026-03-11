import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export enum RetryMode {
  EXTRACTION = 'extraction',
  PARSE_AND_EXTRACTION = 'parse_and_extraction',
}

export class RetrySourcesDto {
  @ApiProperty({
    description: 'IDs of sources to retry',
    example: ['source-1', 'source-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  sourceIds: string[];

  @ApiProperty({
    enum: RetryMode,
    description: 'Whether to retry extraction only, or re-parse and extract',
    default: RetryMode.EXTRACTION,
  })
  @IsEnum(RetryMode)
  mode: RetryMode;

  @ApiPropertyOptional({
    description: 'Schema variant ID to use. Null = default schema.',
  })
  @IsOptional()
  @IsString()
  schemaVariantId?: string;

  @ApiPropertyOptional({
    description: 'Field names to include. Null = all fields.',
    example: ['name', 'amount', 'date'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFields?: string[];
}
