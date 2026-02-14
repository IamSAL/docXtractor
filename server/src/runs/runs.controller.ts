import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RunsService } from './runs.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JWTPayload } from '../shared/types/jwt-payload.types';

@Controller('runs')
@UseGuards(AccessTokenGuard)
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  create(@Body() createRunDto: CreateRunDto, @GetUser() user: JWTPayload) {
    return this.runsService.create(createRunDto, user.sub);
  }

  @Get()
  findAll(@GetUser() user: JWTPayload) {
    return this.runsService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRunDto: UpdateRunDto,
    @GetUser() user: JWTPayload,
  ) {
    return this.runsService.update(id, user.sub, updateRunDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.remove(id, user.sub);
  }
}
