import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public } from 'src/auth/decorators/public.decorators';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JWTPayload } from 'src/shared/types/jwt-payload.types';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('Invites')
@Controller('invites')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateInviteDto,
    @GetUser() user: JWTPayload,
  ) {
    return this.inviteService.create(dto, user.sub);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inviteService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Public()
  @Get(':token/validate')
  async validate(@Param('token') token: string) {
    return this.inviteService.validate(token);
  }

  @Public()
  @Post(':token/accept')
  @HttpCode(HttpStatus.CREATED)
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ) {
    const user = await this.inviteService.accept(token, dto);
    // Auto-login after accepting invite
    return this.authService.login(user);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  async revoke(@Param('id') id: string) {
    return this.inviteService.revoke(id);
  }
}
