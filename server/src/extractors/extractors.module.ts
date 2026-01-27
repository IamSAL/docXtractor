import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtractorsService } from './extractors.service';
import { ExtractorsController } from './extractors.controller';
import { Extractor } from './entities/extractor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extractor])],
  controllers: [ExtractorsController],
  providers: [ExtractorsService],
})
export class ExtractorsModule {}
