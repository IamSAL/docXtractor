import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager';
import { Keyv, createKeyv } from '@keyv/redis';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        ttl: 86400 * 1000,
        isCacheable: () => true,
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
          }),
          createKeyv(configService.getOrThrow<string>('REDIS_URL')),
        ],
      }),
    }),
  ],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
