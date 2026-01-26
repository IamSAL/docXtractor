import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExtractorsService } from './extractors.service';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';

@Controller('extractors')
export class ExtractorsController {
  constructor(private readonly extractorsService: ExtractorsService) {}

  @Post()
  create(@Body() createExtractorDto: CreateExtractorDto) {
    return this.extractorsService.create(createExtractorDto);
  }

  @Get()
  findAll() {
    return this.extractorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extractorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExtractorDto: UpdateExtractorDto) {
    return this.extractorsService.update(+id, updateExtractorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extractorsService.remove(+id);
  }
}
