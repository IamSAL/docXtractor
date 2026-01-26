import { Injectable } from '@nestjs/common';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';

@Injectable()
export class ExtractorsService {
  create(createExtractorDto: CreateExtractorDto) {
    return 'This action adds a new extractor';
  }

  findAll() {
    return `This action returns all extractors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} extractor`;
  }

  update(id: number, updateExtractorDto: UpdateExtractorDto) {
    return `This action updates a #${id} extractor`;
  }

  remove(id: number) {
    return `This action removes a #${id} extractor`;
  }
}
