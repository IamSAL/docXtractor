import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { Run } from './entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';
import { FilesModule } from '../files/files.module';
import { QueueModule } from '../shared/queue/queue.module';
import {
  ParsedDocumentsConsumer,
  ExtractionCompletedConsumer,
} from '../shared/queue/queue-consumers';
import { RunsGateway } from './runs.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Run, Extractor]),
    FilesModule,
    QueueModule,
  ],
  controllers: [RunsController],
  providers: [
    RunsService,
    ParsedDocumentsConsumer,
    ExtractionCompletedConsumer,
    RunsGateway,
  ],
  exports: [RunsService, RunsGateway],
})
export class RunsModule {}
