import { Module } from '@nestjs/common';
import { ExtractorsService } from './extractors.service';
import { ExtractorsController } from './extractors.controller';

@Module({
  controllers: [ExtractorsController],
  providers: [ExtractorsService],
})
export class ExtractorsModule {}
