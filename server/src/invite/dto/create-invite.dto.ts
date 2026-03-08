import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateInviteDto {
  @ApiPropertyOptional({
    description: 'Email to restrict the invite to (optional)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Role for the invited user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @ApiPropertyOptional({
    description: 'Invite expiry in hours (default: 48)',
    default: 48,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720) // 30 days max
  expiresInHours?: number;
}
