import { IsPhoneNumber } from 'class-validator';
import { CreateNotificationDto } from './cerate-notification.dto';
import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'The phone number to send the WhatsApp notification to',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  declare userPhone: string;
}
