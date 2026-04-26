import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSchemaDto {
  @ApiProperty({
    example: 'Invoice with vendor name, date, total amount, and line items',
    description: 'A description of the data fields to extract',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class GenerateExtractorDto {
  @ApiProperty({
    example:
      'An extractor for medical prescriptions that captures patient info, medications, and dosages',
    description:
      'A description of the extractor to generate, including what documents it processes and what data to extract',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Sample document text to improve field inference (max 3000 chars)',
    maxLength: 3000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  sampleText?: string;
}
