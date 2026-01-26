import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'The new email address for the user',
    example: 'new_email@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}
