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
  CreateSchemaVariantDto,
  UpdateSchemaVariantDto,
} from './dto/schema-variant.dto';
import {
  GenerateSchemaDto,
  GenerateExtractorDto,
} from './dto/generate-extractor.dto';
import { Extractor } from './entities/extractor.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JWTPayload } from '../shared/types/jwt-payload.types';

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
  create(@Body() createExtractorDto: CreateExtractorDto, @GetUser() user: JWTPayload) {
    return this.extractorsService.create(createExtractorDto, user.sub);
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
  findAll(@GetUser() user: JWTPayload) {
    return this.extractorsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an extractor by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the extractor.',
    type: Extractor,
  })
  findOne(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.extractorsService.findOne(id, user.sub);
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
    @GetUser() user: JWTPayload,
  ) {
    return this.extractorsService.update(id, updateExtractorDto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an extractor by id' })
  @ApiResponse({
    status: 200,
    description: 'The extractor has been successfully deleted.',
  })
  remove(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.extractorsService.remove(id, user.sub);
  }

  // --- Schema Variant Endpoints ---

  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a schema variant to an extractor' })
  @ApiResponse({
    status: 201,
    description: 'Variant added successfully.',
    type: Extractor,
  })
  addVariant(@Param('id') id: string, @Body() dto: CreateSchemaVariantDto, @GetUser() user: JWTPayload) {
    return this.extractorsService.addVariant(id, dto, user.sub);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update a schema variant' })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully.',
    type: Extractor,
  })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateSchemaVariantDto,
    @GetUser() user: JWTPayload,
  ) {
    return this.extractorsService.updateVariant(id, variantId, dto, user.sub);
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Delete a schema variant' })
  @ApiResponse({
    status: 200,
    description: 'Variant deleted successfully.',
    type: Extractor,
  })
  deleteVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @GetUser() user: JWTPayload,
  ) {
    return this.extractorsService.deleteVariant(id, variantId, user.sub);
  }
}
