import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorators';
import { PreviewExtractionDto } from './dto/preview-extraction.dto';
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
  create(
    @Body() createExtractorDto: CreateExtractorDto,
    @GetUser() user: JWTPayload,
  ) {
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
    return this.extractorsService.generateExtractor(dto.description, dto.sampleText);
  }

  @Post('parse-preview')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse a file to text for preview purposes' })
  @ApiResponse({ status: 200, description: 'Parsed text from file' })
  parsePreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.extractorsService.parsePreview(file.buffer, file.originalname);
  }

  @Post('preview-extraction')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Preview extraction result using sample text (direct LLM, no queue)',
  })
  @ApiResponse({ status: 200, description: 'Preview extraction result' })
  previewExtraction(@Body() dto: PreviewExtractionDto) {
    return this.extractorsService.previewExtraction(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all extractors' })
  @ApiResponse({
    status: 200,
    description: 'Return all extractors.',
    type: [Extractor],
  })
  findAll(@GetUser() user: JWTPayload, @Query('scope') scope?: string) {
    return this.extractorsService.findAll(user.sub, scope);
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

  @Post(':id/clone')
  @ApiOperation({
    summary: 'Clone a public extractor into current user workspace',
  })
  @ApiResponse({
    status: 201,
    description: 'Cloned extractor',
    type: Extractor,
  })
  cloneExtractor(@Param('id') id: string, @GetUser() user: JWTPayload) {
    return this.extractorsService.cloneExtractor(id, user.sub);
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
  addVariant(
    @Param('id') id: string,
    @Body() dto: CreateSchemaVariantDto,
    @GetUser() user: JWTPayload,
  ) {
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
