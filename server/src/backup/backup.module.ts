import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupScheduler } from './backup.scheduler';
import { Extractor } from '../extractors/entities/extractor.entity';
import { Run } from '../runs/entities/run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extractor, Run])],
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
})
export class BackupModule {}
