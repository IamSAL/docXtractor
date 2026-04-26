import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @ApiPropertyOptional({ description: 'URL if type is url' })
  url?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'File ID if type is file' })
  fileId?: string;
}

export class CreateRunDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the extractor to use for this run',
  })
  @IsString()
  @IsNotEmpty()
  extractorId: string;

  @ApiProperty({
    type: [RunSourceDto],
    description: 'List of documents to process',
    example: [
      { type: 'url', name: 'Invoice', url: 'https://example.com/invoice.pdf' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RunSourceDto)
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

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'ID of schema variant to use for extraction',
  })
  variantId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Field names to exclude from extraction',
    example: ['optional_notes', 'internal_reference'],
  })
  skippedFields?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'LLM model to use for extraction (overrides extractor default)',
    example: 'free-smart',
  })
  model?: string;
}
