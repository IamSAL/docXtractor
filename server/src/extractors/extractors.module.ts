import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from '../shared/queue/queue.module';
import { ExtractorsService } from './extractors.service';
import { ExtractorsController } from './extractors.controller';
import { Extractor } from './entities/extractor.entity';
import { ExampleSourceParsedConsumer } from './example-source-consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Extractor]), QueueModule],
  controllers: [ExtractorsController],
  providers: [ExtractorsService, ExampleSourceParsedConsumer],
})
export class ExtractorsModule {}
