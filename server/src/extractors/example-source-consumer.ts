import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueName } from '../shared/queue/queue-names';
import { Extractor } from './entities/extractor.entity';

@Processor(QueueName.EXAMPLE_SOURCE_PARSE_COMPLETED)
export class ExampleSourceParsedConsumer extends WorkerHost {
  private readonly logger = new Logger(ExampleSourceParsedConsumer.name);

  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepository: Repository<Extractor>,
  ) {
    super();
  }

  // fallow-ignore-next-line unused-class-members
  async process(job: Job<any>): Promise<any> {
    const {
      extractor_id,
      example_id,
      source_id,
      status,
      parsed_content,
      error,
    } = job.data;

    if (status !== 'success') {
      this.logger.warn(
        `Example source parse failed for extractor=${extractor_id} source=${source_id}: ${error}`,
      );
      return;
    }

    const extractor = await this.extractorRepository.findOne({
      where: { id: extractor_id },
    });

    if (!extractor) {
      this.logger.warn(`Extractor ${extractor_id} not found — skipping update`);
      return;
    }

    let updated = false;
    for (const example of extractor.fewShotExamples ?? []) {
      if (example.id !== example_id) continue;
      for (const source of example.sources ?? []) {
        if (source.id !== source_id) continue;
        source.parsedContent = parsed_content;
        updated = true;
        break;
      }
      if (updated) break;
    }

    if (!updated) {
      this.logger.warn(
        `Source ${source_id} not found in extractor ${extractor_id} — may have been deleted`,
      );
      return;
    }

    // TypeORM won't detect nested JSONB mutation — use queryBuilder to force write
    await this.extractorRepository
      .createQueryBuilder()
      .update(Extractor)
      .set({ fewShotExamples: extractor.fewShotExamples })
      .where('id = :id', { id: extractor_id })
      .execute();

    this.logger.log(
      `✅ parsedContent updated for source ${source_id} in extractor ${extractor_id}`,
    );
  }
}
