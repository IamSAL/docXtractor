import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';
import {
  CreateSchemaVariantDto,
  UpdateSchemaVariantDto,
} from './dto/schema-variant.dto';
import { Extractor, SchemaVariant } from './entities/extractor.entity';
import { LlmService } from '../shared/llm/llm.service';
import { QueueService } from '../shared/queue/queue.service';
import { QueueName } from '../shared/queue/queue-names';
import * as fs from 'fs';
import * as path from 'path';

// User-mountable seed path (e.g. via docker volume) takes priority over built-in
const CUSTOM_SEED_PATH = '/app/seed/extractors.json';

@Injectable()
export class ExtractorsService implements OnModuleInit {
  private readonly logger = new Logger(ExtractorsService.name);

  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepository: Repository<Extractor>,
    private readonly llmService: LlmService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    const count = await this.extractorRepository.count();
    if (count === 0) {
      const seedData = this.loadSeedData();
      if (seedData.length > 0) {
        this.logger.log('No extractors found — seeding defaults...');
        const extractors = this.extractorRepository.create(seedData);
        await this.extractorRepository.save(extractors);
        this.logger.log(`Seeded ${extractors.length} default extractors`);
      }
    }
  }

  private loadSeedData(): any[] {
    // 1. Check for user-provided seed file (docker volume mount)
    if (fs.existsSync(CUSTOM_SEED_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(CUSTOM_SEED_PATH, 'utf-8'));
        this.logger.log(`Loading seed extractors from ${CUSTOM_SEED_PATH}`);
        return Array.isArray(data) ? data : [];
      } catch (e) {
        this.logger.error(`Failed to parse ${CUSTOM_SEED_PATH}: ${e.message}`);
      }
    }

    // 2. Fall back to built-in seed data
    const builtinPath = path.join(__dirname, 'seed-extractors.json');
    if (fs.existsSync(builtinPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(builtinPath, 'utf-8'));
        return Array.isArray(data) ? data : [];
      } catch (e) {
        this.logger.error(`Failed to parse built-in seed: ${e.message}`);
      }
    }

    return [];
  }

  private async dispatchExampleSourceParseJobs(
    extractorId: string,
    fewShotExamples: FewShotExample[],
    parserEngine: string,
  ): Promise<void> {
    const jobs: Array<{ name: string; data: any }> = [];

    for (const example of fewShotExamples ?? []) {
      for (const source of example.sources ?? []) {
        if (source.type === 'text' || source.parsedContent) continue;

        const jobData: Record<string, any> = {
          extractor_id: extractorId,
          example_id: example.id,
          source_id: source.id,
          type: source.type,
          parser_engine: parserEngine,
          bucket: process.env.MINIO_BUCKET || 'docxtractor',
        };

        if (source.type === 'url') {
          jobData.url = source.content;
        } else if (source.type === 'file') {
          jobData.storage_key = source.storageKey;
        }

        jobs.push({ name: 'parse-example-source', data: jobData });
      }
    }

    if (jobs.length === 0) return;

    this.logger.log(
      `Dispatching ${jobs.length} example source parse job(s) for extractor ${extractorId}`,
    );
    await this.queueService.addBulk(
      QueueName.EXAMPLE_SOURCE_PARSE_REQUESTS,
      jobs,
    );
  }

  async create(createExtractorDto: CreateExtractorDto): Promise<Extractor> {
    const extractor = this.extractorRepository.create(createExtractorDto);
    const saved = await this.extractorRepository.save(extractor);
    await this.dispatchExampleSourceParseJobs(
      saved.id,
      saved.fewShotExamples,
      saved.parserEngine,
    );
    return saved;
  }

  async findAll(): Promise<Extractor[]> {
    return await this.extractorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Extractor> {
    const extractor = await this.extractorRepository.findOne({ where: { id } });
    if (!extractor) {
      throw new NotFoundException(`Extractor with ID ${id} not found`);
    }
    return extractor;
  }

  async update(
    id: string,
    updateExtractorDto: UpdateExtractorDto,
  ): Promise<Extractor> {
    const extractor = await this.findOne(id);
    this.extractorRepository.merge(extractor, updateExtractorDto);
    const saved = await this.extractorRepository.save(extractor);
    await this.dispatchExampleSourceParseJobs(
      saved.id,
      saved.fewShotExamples,
      saved.parserEngine,
    );
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.extractorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Extractor with ID ${id} not found`);
    }
  }

  // --- Schema Variant CRUD ---

  async addVariant(
    extractorId: string,
    dto: CreateSchemaVariantDto,
  ): Promise<Extractor> {
    const extractor = await this.findOne(extractorId);

    if (extractor.variants.some((v) => v.name === dto.name)) {
      throw new BadRequestException('Variant name already exists');
    }

    const isFirstOrDefault = dto.isDefault || extractor.variants.length === 0;

    if (isFirstOrDefault) {
      extractor.variants.forEach((v) => (v.isDefault = false));
    }

    const variant: SchemaVariant = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      schema: dto.schema,
      isDefault: isFirstOrDefault,
      createdAt: new Date().toISOString(),
    };

    extractor.variants.push(variant);
    return this.extractorRepository.save(extractor);
  }

  async updateVariant(
    extractorId: string,
    variantId: string,
    dto: UpdateSchemaVariantDto,
  ): Promise<Extractor> {
    const extractor = await this.findOne(extractorId);
    const variant = extractor.variants.find((v) => v.id === variantId);

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (dto.isDefault) {
      extractor.variants.forEach((v) => (v.isDefault = false));
    }

    Object.assign(variant, dto);
    return this.extractorRepository.save(extractor);
  }

  async deleteVariant(
    extractorId: string,
    variantId: string,
  ): Promise<Extractor> {
    const extractor = await this.findOne(extractorId);
    const index = extractor.variants.findIndex((v) => v.id === variantId);

    if (index === -1) {
      throw new NotFoundException('Variant not found');
    }

    const wasDefault = extractor.variants[index].isDefault;
    extractor.variants.splice(index, 1);

    if (wasDefault && extractor.variants.length > 0) {
      extractor.variants[0].isDefault = true;
    }

    return this.extractorRepository.save(extractor);
  }

  async generateSchema(
    description: string,
  ): Promise<{ schema: Record<string, any> }> {
    const prompt = `You are a JSON Schema expert. Generate a JSON Schema (draft 2020-12) for a document data extraction use case.

The user wants to extract: ${description}

Requirements:
- The root must be type "object" with "properties" and "required" arrays
- Each property should have "type" and "description" fields
- Use appropriate types: "string", "number", "integer", "boolean", "array", "object"
- For dates use type "string" with format "date" or "date-time"
- For emails use type "string" with format "email"
- For arrays of objects, define the "items" schema with its own properties
- Add "description" to every property explaining what it captures
- Mark essential fields as required
- Use snake_case for property names

Return ONLY a JSON object with this exact structure:
{
  "schema": { <the JSON Schema object> }
}`;

    this.logger.log(`Generating schema for: ${description}`);
    const result = await this.llmService.generate(prompt);

    // Extract schema from response - handle both wrapped and unwrapped
    const schema = (result.schema as Record<string, any>) || result;

    // Ensure it has basic structure
    if (!schema.type) {
      schema.type = 'object';
    }
    if (!schema.properties) {
      schema.properties = {};
    }

    return { schema };
  }

  async generateExtractor(description: string): Promise<{
    name: string;
    description: string;
    schema: Record<string, any>;
    systemPrompt: string;
  }> {
    const prompt = `You are an expert at building document data extraction pipelines. Generate a complete extractor configuration for the following use case:

${description}

Return a JSON object with this exact structure:
{
  "name": "<short descriptive name for the extractor, e.g. 'Invoice Parser'>",
  "description": "<1-2 sentence description of what this extractor does>",
  "systemPrompt": "<detailed system prompt for an LLM that will extract data from documents. Include instructions about accuracy, handling missing fields, output format expectations, and domain-specific guidance>",
  "schema": {
    "type": "object",
    "properties": {
      "<field_name>": {
        "type": "<string|number|integer|boolean|array|object>",
        "description": "<what this field captures>"
      }
    },
    "required": ["<essential_field_names>"]
  }
}

Requirements for the schema:
- Use snake_case for property names
- For dates use type "string" with format "date"
- For arrays of objects define "items" with nested properties
- Add "description" to every property
- Mark essential fields as required

Requirements for systemPrompt:
- Be specific about the document type being processed
- Include instructions for handling ambiguous or missing data
- Mention expected output format (JSON)
- Include domain-specific extraction guidance`;

    this.logger.log(`Generating extractor for: ${description}`);
    const result = await this.llmService.generate(prompt);

    const name = (result.name as string) || 'Generated Extractor';
    const extractorDescription = (result.description as string) || description;
    const systemPrompt =
      (result.systemPrompt as string) ||
      `Extract the relevant data fields from the provided document accurately. Return results as JSON.`;
    const schema = (result.schema as Record<string, any>) || {
      type: 'object',
      properties: {},
    };

    if (!schema.type) {
      schema.type = 'object';
    }
    if (!schema.properties) {
      schema.properties = {};
    }

    return { name, description: extractorDescription, schema, systemPrompt };
  }
}
