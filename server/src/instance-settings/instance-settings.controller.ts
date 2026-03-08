import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InstanceSettingsService } from './instance-settings.service';
import {
  UpdateInstanceSettingsDto,
  TestSmtpDto,
} from './dto/update-instance-settings.dto';
import { Public } from 'src/auth/decorators/public.decorators';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Instance')
@Controller('instance')
export class InstanceSettingsController {
  constructor(
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  @Public()
  @Get('status')
  async getPublicStatus() {
    return this.instanceSettingsService.getPublicStatus();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('settings')
  async getSettings() {
    const settings = await this.instanceSettingsService.getSettings();
    return this.instanceSettingsService.sanitize(settings);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('settings')
  async updateSettings(@Body() dto: UpdateInstanceSettingsDto) {
    const settings = await this.instanceSettingsService.updateSettings(dto);
    return this.instanceSettingsService.sanitize(settings);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('settings/test-smtp')
  @HttpCode(HttpStatus.OK)
  async testSmtp(@Body() dto: TestSmtpDto) {
    return this.instanceSettingsService.testSmtp(dto.recipientEmail);
  }
}
