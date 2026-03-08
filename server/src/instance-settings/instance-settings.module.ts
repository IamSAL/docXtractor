import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstanceSettings } from './entities/instance-settings.entity';
import { InstanceSettingsService } from './instance-settings.service';
import { InstanceSettingsController } from './instance-settings.controller';
import { User } from 'src/user/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([InstanceSettings, User])],
  providers: [InstanceSettingsService],
  controllers: [InstanceSettingsController],
  exports: [InstanceSettingsService],
})
export class InstanceSettingsModule {}
