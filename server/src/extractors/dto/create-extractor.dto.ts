import { Type } from 'class-transformer';
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
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsJsonSchema } from '../../shared/decorators/is-json-schema.decorator';

export class FewShotExampleSourceDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['file', 'url', 'text'] })
  @IsEnum(['file', 'url', 'text'])
  type: 'file' | 'url' | 'text';

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content?: string;
}

export class FewShotExampleDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [FewShotExampleSourceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FewShotExampleSourceDto)
  sources: FewShotExampleSourceDto[];

  @ApiProperty()
  @IsString()
  output: string;
}

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
  @IsJsonSchema()
  @IsNotEmpty()
  schema: Record<string, any>;

  @ApiProperty({ example: 'Extract data accurately' })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiPropertyOptional({
    type: [FewShotExampleDto],
    example: [{ id: '1', name: 'Ex', sources: [], output: '{}' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FewShotExampleDto)
  @IsOptional()
  fewShotExamples: FewShotExampleDto[];

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
