import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DemoSession } from './entities/demo-session.entity';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { Extractor } from '../extractors/entities/extractor.entity';
import { User } from '../user/entities/user.entity';
import { Run } from '../runs/entities/run.entity';
import { File } from '../files/entities/file.entity';
import { UserModule } from '../user/user.module';
import { FilesModule } from '../files/files.module';
import { RunsModule } from '../runs/runs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DemoSession, Extractor, User, Run, File]),
    JwtModule.register({}),
    UserModule,
    FilesModule,
    RunsModule,
  ],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
