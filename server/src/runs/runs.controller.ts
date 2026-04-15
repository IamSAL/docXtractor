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
import { RetrySourcesDto } from './dto/retry-sources.dto';
import { PaginatedRunsDto } from './dto/paginated-runs.dto';
import { Run } from './entities/run.entity';
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
  @ApiResponse({ status: 201, description: 'Run created successfully', type: Run })
  create(@Body() createRunDto: CreateRunDto, @GetUser() user: JWTPayload) {
    return this.runsService.create(createRunDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all runs with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated runs', type: PaginatedRunsDto })
  findAll(@Query() query: FindRunsDto, @GetUser() user: JWTPayload) {
    return this.runsService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single run by ID' })
  @ApiResponse({ status: 200, description: 'Returns the run', type: Run })
  @ApiResponse({ status: 404, description: 'Run not found' })
  findOne(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.findOneForResponse(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a run' })
  @ApiResponse({ status: 200, description: 'Run updated successfully', type: Run })
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
  @ApiResponse({ status: 200, description: 'Run restarted successfully', type: Run })
  @ApiResponse({ status: 404, description: 'Run not found' })
  retry(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.runsService.retry(id, user.sub);
  }

  @Post(':id/sources/retry-batch')
  @ApiOperation({ summary: 'Batch retry specific sources with options' })
  @ApiResponse({ status: 200, description: 'Batch retry started', type: Run })
  retrySourcesBatch(
    @Param('id') id: string,
    @Body() dto: RetrySourcesDto,
    @GetUser() user: JWTPayload,
  ) {
    return this.runsService.retrySourcesBatch(id, user.sub, dto);
  }

  @Post(':id/sources/:sourceId/retry')
  @ApiOperation({ summary: 'Retry a single failed source within a run' })
  @ApiResponse({ status: 200, description: 'Source retry started', type: Run })
  @ApiResponse({ status: 400, description: 'Source is not in a failed state' })
  @ApiResponse({ status: 404, description: 'Run or source not found' })
  retrySource(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
    @GetUser() user: JWTPayload,
  ) {
    return this.runsService.retrySource(id, sourceId, user.sub);
  }
}
