import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowDefinitionDto } from './workflow-definition.dto';
import { TriggerConfigDto } from './trigger-config.dto';

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: WorkflowDefinitionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition?: WorkflowDefinitionDto;

  @ApiPropertyOptional({ type: TriggerConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerConfigDto)
  triggerConfig?: TriggerConfigDto;
}
