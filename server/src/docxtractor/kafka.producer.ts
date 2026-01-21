import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'docxtractor-server',
      brokers: (this.configService.get<string>('KAFKA_BROKERS') || 'kafka:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka Producer connected');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendMessage(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Sent message to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${topic}`, error);
      throw error;
    }
  }
}
