import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExtractorDto {
  @ApiProperty({ example: 'Invoice Processor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Extracts data from invoices' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.png' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: { type: 'object', properties: {} } })
  @IsObject()
  @IsNotEmpty()
  schema: any;

  @ApiProperty({ example: 'Extract data accurately' })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: [{ id: '1', name: 'Ex', sources: [], output: '{}' }],
  })
  @IsObject({ each: true })
  @IsOptional()
  fewShotExamples: any[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  consensusEnabled?: boolean;

  @ApiPropertyOptional({ default: 85, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceThreshold?: number;

  @ApiPropertyOptional({
    enum: ['majority', 'highest_confidence', 'human_review', 'conservative'],
    default: 'majority',
  })
  @IsEnum(['majority', 'highest_confidence', 'human_review', 'conservative'])
  @IsOptional()
  conflictResolution?:
    | 'majority'
    | 'highest_confidence'
    | 'human_review'
    | 'conservative';

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  citationEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  citationIncludePdfPage?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  citationIncludeBbox?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  citationIncludeParagraphId?: boolean;

  @ApiPropertyOptional({ default: '128k' })
  @IsString()
  @IsOptional()
  contextWindow?: string;

  @ApiPropertyOptional({ default: 'gpt-4o' })
  @IsString()
  @IsOptional()
  defaultModel?: string;
}
