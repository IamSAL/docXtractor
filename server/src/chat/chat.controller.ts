import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { RequestWithUser } from 'src/shared/types/request.types';
import { Public } from 'src/auth/decorators/public.decorators';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Send a message to the AI chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Streamed AI response' })
  @ApiBody({ type: CreateChatDto })
  async create(
    @Body() createChatDto: CreateChatDto,
    @Ip() userIp: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const ip = req.headers['x-forwarded-for']?.[0] || userIp || '127.0.0.1';
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    console.log(req.body);
    await this.chatService.handleRequest({
      ip,
      createChatDto,
      res,
      userId,
      userRole,
    });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Test the AI model connectivity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Model test successful' })
  async test() {
    await this.chatService.testModel();
  }
}
