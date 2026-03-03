import { Controller, Get, Head } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Public()
  @Head()
  @ApiOperation({ summary: 'Health check (HEAD)' })
  handleHeadRequest(): { success: boolean } {
    return { success: true };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (GET)' })
  handleGetRequest(): { success: boolean } {
    return { success: true };
  }
}
