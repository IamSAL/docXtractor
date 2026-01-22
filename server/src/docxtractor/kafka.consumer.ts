/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { KafkaProducerService } from './kafka.producer';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private configService: ConfigService,
    private kafkaProducer: KafkaProducerService,
  ) {
    this.kafka = new Kafka({
      clientId: 'docxtractor-server-consumer',
      brokers: (
        this.configService.get<string>('KAFKA_BROKERS') || 'kafka:9092'
      ).split(','),
    });
    this.consumer = this.kafka.consumer({ groupId: 'server-orchestrator' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();

      // Subscribe to topics
      await this.consumer.subscribe({
        topic: 'docxtractor.documents.parsed',
        fromBeginning: false,
      });
      await this.consumer.subscribe({
        topic: 'docxtractor.extraction.completed',
        fromBeginning: false,
      });

      this.logger.log('Kafka Concumer connected and subscribed');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value?.toString();
          if (!value) return;

          try {
            const data = JSON.parse(value);
            await this.handleMessage(topic, data);
          } catch (error) {
            this.logger.error(`Error processing message from ${topic}`, error);
          }
        },
      });
    } catch (error) {
      this.logger.error('Failed to connect consumer', error);
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleMessage(topic: string, data: any) {
    if (topic === 'docxtractor.documents.parsed') {
      await this.handleParsedDocument(data);
    } else if (topic === 'docxtractor.extraction.completed') {
      await this.handleExtractionCompleted(data);
    }
  }

  private async handleParsedDocument(data: any) {
    this.logger.log(
      `Received Parsed Document: Job ${data.job_id}, Status: ${data.status}`,
    );

    this.logger.log(`Parsed Document: ${JSON.stringify(data, null, 2)}`);

    if (data.status === 'success' && data.markdown_content) {
      this.logger.log(`Triggering extraction for Job ${data.job_id}`);

      const extractionRequest = {
        job_id: data.job_id,
        content: {
          combined_markdown: data.markdown_content,
        },
        schema: {}, // Empty schema for now as per plan
      };

      await this.kafkaProducer.sendMessage(
        'docxtractor.extraction.requests',
        extractionRequest,
      );
    } else {
      this.logger.warn(`Parse failed or empty content for Job ${data.job_id}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleExtractionCompleted(data: any) {
    this.logger.log(
      `Extraction Completed for Job ${data.job_id}, Status: ${data.status}`,
    );
    if (data.status === 'success') {
      this.logger.log(`Extraction Data: ${JSON.stringify(data.data, null, 2)}`);
    } else {
      this.logger.error(`Extraction failed for Job ${data.job_id}`);
    }
  }
}
