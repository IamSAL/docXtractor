import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestNotificationDto {
  @ApiProperty({ description: 'Title of the test notification' })
  title: string;

  @ApiProperty({ description: 'Message of the test notification' })
  message: string;

  @ApiPropertyOptional({ description: 'URL to redirect to' })
  url?: string;
}
