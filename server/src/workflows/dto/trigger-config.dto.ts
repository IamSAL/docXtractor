import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum TriggerType {
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  SCHEDULE = 'schedule',
  GOOGLE_DRIVE = 'google_drive',
  S3 = 's3',
}

class ImapConfigDto {
  @ApiProperty()
  @IsString()
  host: string;

  @ApiProperty()
  @IsNumber()
  port: number;

  @ApiProperty()
  @IsString()
  user: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  folder: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filterSubject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filterFrom?: string;
}

export class TriggerConfigDto {
  @ApiProperty({ enum: TriggerType })
  @IsEnum(TriggerType)
  type: TriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookPath?: string;

  @ApiPropertyOptional({ type: ImapConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImapConfigDto)
  imapConfig?: ImapConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}
