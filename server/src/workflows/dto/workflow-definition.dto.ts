import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowNodePositionDto {
  @ApiProperty()
  @IsObject()
  x: number;

  @ApiProperty()
  @IsObject()
  y: number;
}

export class WorkflowNodeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ type: WorkflowNodePositionDto })
  @ValidateNested()
  @Type(() => WorkflowNodePositionDto)
  position: WorkflowNodePositionDto;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  params: Record<string, any>;
}

export class WorkflowConnectionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsString()
  target: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceHandle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetHandle?: string;
}

export class WorkflowDefinitionDto {
  @ApiProperty({ type: [WorkflowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowConnectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowConnectionDto)
  connections: WorkflowConnectionDto[];
}
