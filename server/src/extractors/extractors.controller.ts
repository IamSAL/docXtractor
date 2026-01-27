import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExtractorsService } from './extractors.service';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';
import { Extractor } from './entities/extractor.entity';

@ApiTags('extractors')
@ApiBearerAuth()
@Controller('extractors')
export class ExtractorsController {
  constructor(private readonly extractorsService: ExtractorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new extractor' })
  @ApiResponse({
    status: 201,
    description: 'The extractor has been successfully created.',
    type: Extractor,
  })
  create(@Body() createExtractorDto: CreateExtractorDto) {
    return this.extractorsService.create(createExtractorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all extractors' })
  @ApiResponse({
    status: 200,
    description: 'Return all extractors.',
    type: [Extractor],
  })
  findAll() {
    return this.extractorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an extractor by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the extractor.',
    type: Extractor,
  })
  findOne(@Param('id') id: string) {
    return this.extractorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an extractor by id' })
  @ApiResponse({
    status: 200,
    description: 'The extractor has been successfully updated.',
    type: Extractor,
  })
  update(
    @Param('id') id: string,
    @Body() updateExtractorDto: UpdateExtractorDto,
  ) {
    return this.extractorsService.update(id, updateExtractorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an extractor by id' })
  @ApiResponse({
    status: 200,
    description: 'The extractor has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.extractorsService.remove(id);
  }
}
