import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstanceSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instanceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPublicSignup?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleOAuthClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleOAuthClientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleOAuthCallbackUrl?: string;
}

export class TestSmtpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientEmail?: string;
}
