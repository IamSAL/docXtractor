import { ApiProperty } from '@nestjs/swagger';

class PushKeys {
  @ApiProperty({ description: 'P256dh key' })
  p256dh: string;

  @ApiProperty({ description: 'Auth key' })
  auth: string;
}

class PushSubscriptionContent {
  @ApiProperty({ description: 'Endpoint URL' })
  endpoint: string;

  @ApiProperty({ type: PushKeys })
  keys: PushKeys;
}

export class PushSubscriptionDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ type: PushSubscriptionContent })
  subscription: PushSubscriptionContent;
}

