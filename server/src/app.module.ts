import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';

// import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
// import { createKeyv, Keyv } from '@keyv/redis';
// import { CacheableMemory } from 'cacheable';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

import { ChatModule } from './chat/chat.module';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import { RolesGuard } from './auth/guards/roles.guard';

import { AppController } from './app.controller';

import { ExtractorsModule } from './extractors/extractors.module';
import { FilesModule } from './files/files.module';
import { RunsModule } from './runs/runs.module';
import { QueueModule } from './shared/queue/queue.module';

@Module({
  imports: [
    UserModule,

    DatabaseModule,
    AuthModule,
    ChatModule,
    QueueModule,

    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   isGlobal: true,
    //   useFactory: (configService: ConfigService) => {
    //     return {
    //       ttl: 60000,
    //       stores: [
    //         new Keyv({
    //           store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
    //         }),
    //         createKeyv(configService.getOrThrow<string>('REDIS_URL')),
    //       ],
    //     };
    //   },
    // }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLER_TTL') ?? 60000,
          limit: config.get('THROTTLER_LIMIT') ?? 100,
        },
      ],
    }),

    ExtractorsModule,

    FilesModule,

    RunsModule,
  ],
  controllers: [AppController],
  providers: [
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
