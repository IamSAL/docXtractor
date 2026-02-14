import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RunsService } from './runs.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateRunDto } from './dto/update-run.dto';
import { FindRunsDto } from './dto/find-runs.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JWTPayload } from '../shared/types/jwt-payload.types';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('runs')
@Controller('runs')
@UseGuards(AccessTokenGuard)
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new extraction run' })
  @ApiResponse({ status: 201, description: 'Run created successfully' })
  create(@Body() createRunDto: CreateRunDto, @GetUser() user: JWTPayload) {
    return this.runsService.create(createRunDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all runs with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated runs' })
  findAll(@Query() query: FindRunsDto, @GetUser() user: JWTPayload) {
    return this.runsService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single run by ID' })
  @ApiResponse({ status: 200, description: 'Returns the run' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  findOne(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a run' })
  @ApiResponse({ status: 200, description: 'Run updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateRunDto: UpdateRunDto,
    @GetUser() user: JWTPayload,
  ) {
    return this.runsService.update(id, user.sub, updateRunDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a run' })
  @ApiResponse({ status: 200, description: 'Run deleted successfully' })
  remove(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.remove(id, user.sub);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed or cancelled run' })
  @ApiResponse({ status: 200, description: 'Run restarted successfully' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  retry(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.retry(id, user.sub);
  }
}
