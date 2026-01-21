import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaProducerService } from './kafka.producer';
import { StorageService } from './storage.service';
import { DocxtractorController } from './docxtractor.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DocxtractorController],
  providers: [KafkaProducerService, StorageService],
  exports: [KafkaProducerService, StorageService],
})
export class DocxtractorModule {}
