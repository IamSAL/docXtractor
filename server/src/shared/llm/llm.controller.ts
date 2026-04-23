import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { LlmService } from './llm.service';

export class LlmModelDto {
  @ApiProperty({ example: 'free-smart' })
  id: string;

  @ApiProperty({ example: 'groq' })
  owned_by: string;
}

@ApiTags('llm')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('models')
  @ApiOkResponse({ type: [LlmModelDto] })
  async listModels(): Promise<LlmModelDto[]> {
    return this.llmService.listModels();
  }
}
