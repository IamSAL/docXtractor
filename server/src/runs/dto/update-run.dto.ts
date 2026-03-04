import { PartialType } from '@nestjs/swagger';
import { CreateRunDto } from './create-run.dto';

export class UpdateRunDto extends PartialType(CreateRunDto) {}
