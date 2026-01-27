import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';
import { Extractor } from './entities/extractor.entity';

@Injectable()
export class ExtractorsService {
  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepository: Repository<Extractor>,
  ) {}

  async create(createExtractorDto: CreateExtractorDto): Promise<Extractor> {
    const extractor = this.extractorRepository.create(createExtractorDto);
    return await this.extractorRepository.save(extractor);
  }

  async findAll(): Promise<Extractor[]> {
    return await this.extractorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Extractor> {
    const extractor = await this.extractorRepository.findOne({ where: { id } });
    if (!extractor) {
      throw new NotFoundException(`Extractor with ID ${id} not found`);
    }
    return extractor;
  }

  async update(
    id: string,
    updateExtractorDto: UpdateExtractorDto,
  ): Promise<Extractor> {
    const extractor = await this.findOne(id);
    this.extractorRepository.merge(extractor, updateExtractorDto);
    return await this.extractorRepository.save(extractor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.extractorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Extractor with ID ${id} not found`);
    }
  }
}
