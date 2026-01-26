import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'The notification message' })
  message: string;

  @ApiProperty({
    description: 'The type of event',
    enum: ['appointment', 'reminder', 'system', 'prescription', 'order'],
  })
  eventType: 'appointment' | 'reminder' | 'system' | 'prescription' | 'order';

  @ApiPropertyOptional({ description: 'Related appointment ID' })
  appointmentId?: string;

  @ApiProperty({ description: 'Datetime of the event' })
  datetime: string;

  @ApiProperty({ description: 'Unique event ID' })
  eventId: string;

  @ApiPropertyOptional({ description: 'Title of the notification' })
  title?: string;

  @ApiPropertyOptional({ description: 'URL to redirect to when clicked' })
  url?: string;

  @ApiPropertyOptional({ description: 'Whether to send via WhatsApp' })
  sendWhatsApp?: boolean;

  @ApiPropertyOptional({ description: 'User phone number for WhatsApp' })
  userPhone?: string;
}

