import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PreviewExtractionDto {
  @ApiProperty({ description: 'JSON schema to extract against' })
  @IsObject()
  @IsNotEmpty()
  schema: Record<string, any>;

  @ApiProperty({ description: 'System prompt for the LLM' })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiPropertyOptional({
    description: 'Sample document text (max 2000 chars)',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  sampleText?: string;
}
