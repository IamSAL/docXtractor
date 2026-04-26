import {
  IsEmail,
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DemoRunSourceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class DemoRunDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  extractorId: string;

  @ApiProperty({ type: [DemoRunSourceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DemoRunSourceDto)
  sources: DemoRunSourceDto[];
}

export class DemoCaptureEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class DemoClassifyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;
}
