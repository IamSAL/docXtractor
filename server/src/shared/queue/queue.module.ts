import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from './queue-names';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6381),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QueueName.UPLOADED_DOCUMENTS },
      { name: QueueName.PARSED_DOCUMENTS },
      { name: QueueName.EXTRACTION_REQUESTS },
      { name: QueueName.EXTRACTION_COMPLETED },
      { name: QueueName.WORKFLOW_EXECUTIONS },
    ),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
