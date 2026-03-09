import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsJsonSchema } from '../../shared/decorators/is-json-schema.decorator';

export class CreateSchemaVariantDto {
  @ApiProperty({ example: 'Quick Invoice' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Fast extraction with only essential fields',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: { type: 'object', properties: {} } })
  @IsObject()
  @IsJsonSchema()
  @IsNotEmpty()
  schema: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateSchemaVariantDto extends PartialType(
  CreateSchemaVariantDto,
) {}
