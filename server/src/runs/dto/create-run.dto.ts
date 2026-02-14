import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessingMode, ExtractionProvider } from '../entities/run.entity';

export class RunSourceDto {
  @IsString()
  @ApiProperty({ enum: ['file', 'url'] })
  type: 'file' | 'url';

  @IsString()
  @ApiProperty({ description: 'Display name for the source' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL if type is url' })
  url?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'File ID if type is file' })
  fileId?: string;
}

export class CreateRunDto {
  @IsUUID()
  @ApiProperty({ description: 'Extractor to use for this run' })
  extractorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunSourceDto)
  @ApiProperty({ type: [RunSourceDto], description: 'Documents to process' })
  sources: RunSourceDto[];

  @IsOptional()
  @IsEnum(ProcessingMode)
  @ApiPropertyOptional({
    enum: ProcessingMode,
    default: ProcessingMode.UNIFIED,
  })
  processingMode?: ProcessingMode;

  @IsOptional()
  @IsEnum(ExtractionProvider)
  @ApiPropertyOptional({
    enum: ExtractionProvider,
    default: ExtractionProvider.DOCLO,
  })
  extractionProvider?: ExtractionProvider;
}
