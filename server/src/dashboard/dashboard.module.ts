import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Run } from '../runs/entities/run.entity';
import { Extractor } from '../extractors/entities/extractor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Run, Extractor])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
