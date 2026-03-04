import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExtractorDto } from './dto/create-extractor.dto';
import { UpdateExtractorDto } from './dto/update-extractor.dto';
import { Extractor } from './entities/extractor.entity';
import { OllamaService } from '../shared/ollama/ollama.service';

@Injectable()
export class ExtractorsService {
  private readonly logger = new Logger(ExtractorsService.name);

  constructor(
    @InjectRepository(Extractor)
    private readonly extractorRepository: Repository<Extractor>,
    private readonly ollamaService: OllamaService,
  ) {}

  async create(createExtractorDto: CreateExtractorDto): Promise<Extractor> {
    const extractor = this.extractorRepository.create(createExtractorDto);
    return await this.extractorRepository.save(extractor);
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
    return await this.extractorRepository.save(extractor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.extractorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Extractor with ID ${id} not found`);
    }
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
    const result = await this.ollamaService.generate(prompt);

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
    const result = await this.ollamaService.generate(prompt);

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
