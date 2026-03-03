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
import {
  GenerateSchemaDto,
  GenerateExtractorDto,
} from './dto/generate-extractor.dto';
import { Extractor } from './entities/extractor.entity';

@ApiTags('Extractors')
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

  @Post('generate-schema')
  @ApiOperation({
    summary: 'Generate a JSON schema from a description using AI',
  })
  @ApiResponse({
    status: 201,
    description: 'The JSON schema has been generated.',
  })
  generateSchema(@Body() dto: GenerateSchemaDto) {
    return this.extractorsService.generateSchema(dto.description);
  }

  @Post('generate-extractor')
  @ApiOperation({
    summary:
      'Generate a full extractor configuration from a description using AI',
  })
  @ApiResponse({
    status: 201,
    description: 'The extractor configuration has been generated.',
  })
  generateExtractor(@Body() dto: GenerateExtractorDto) {
    return this.extractorsService.generateExtractor(dto.description);
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
