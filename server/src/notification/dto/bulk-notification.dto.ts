import { IsArray, IsString } from 'class-validator';
import { CreateNotificationDto } from './cerate-notification.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BulkNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'Array of user IDs to send notifications to',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
