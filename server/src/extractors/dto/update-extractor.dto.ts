import { PartialType } from '@nestjs/swagger';
import { CreateExtractorDto } from './create-extractor.dto';

export class UpdateExtractorDto extends PartialType(CreateExtractorDto) {}
