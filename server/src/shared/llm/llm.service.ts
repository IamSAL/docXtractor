import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';

export interface LlmExtractionResult {
  data: Record<string, unknown>;
  usage: {
    totalTokens: number;
  };
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly defaultExtractionModel: string;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: configService.get<string>(
        'FREELLM_BASE_URL',
        'http://freellm:3000/v1',
      ),
      apiKey: configService.get<string>('FREELLM_API_KEY', 'freellm'),
    });
    this.defaultModel = configService.get<string>('LLM_DEFAULT_MODEL', 'free');
    this.defaultExtractionModel = configService.get<string>(
      'LLM_EXTRACTION_MODEL',
      'free-smart',
    );
    this.maxRetries = configService.get<number>('LLM_MAX_RETRIES', 3);

    this.logger.log(
      `LlmService initialized: baseURL=${configService.get('FREELLM_BASE_URL', 'http://freellm:3000/v1')}, defaultModel=${this.defaultModel}`,
    );
  }

  async extract(
    content: string,
    schema: Record<string, any>,
    systemPrompt: string,
    model?: string,
  ): Promise<LlmExtractionResult> {
    const modelId = model || this.defaultExtractionModel;
    const fieldsDesc = this.buildFieldsDescription(schema);

    const instruction = systemPrompt
      ? `${systemPrompt}\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`
      : `Extract the following fields from the document text.\nReference the exact text where possible.\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`;

    const fullPrompt = `${instruction}\n\nDocument Content:\n${content}`;

    this.logger.log(`Running LLM extraction, model: ${modelId}`);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: fullPrompt }],
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0].message.content ?? '{}';
        this.logger.debug(`LLM response: ${raw}`);
        const resultData = JSON.parse(jsonrepair(raw)) as Record<
          string,
          unknown
        >;
        const totalTokens = response.usage?.total_tokens ?? 0;

        this.logger.log(`LLM extraction complete: tokens=${totalTokens}`);
        return { data: resultData, usage: { totalTokens } };
      } catch (error: any) {
        this.logger.error(
          `LLM extraction failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (error?.status === 429) {
          this.logger.warn('Rate limit hit, backing off...');
          attempt--;
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 + Math.random() * 5000),
          );
          continue;
        }

        if (attempt === this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('LLM extraction failed after retries');
  }

  async generate(
    prompt: string,
    model?: string,
  ): Promise<Record<string, unknown>> {
    const modelId = model || this.defaultModel;
    this.logger.log(
      `Running LLM generation: model=${modelId}, prompt_length=${prompt.length}`,
    );

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0].message.content ?? '{}';
        this.logger.debug(`LLM generation response: ${raw}`);
        const result = JSON.parse(jsonrepair(raw)) as Record<string, unknown>;
        const totalTokens = response.usage?.total_tokens ?? 0;

        this.logger.log(`LLM generation complete: tokens=${totalTokens}`);
        return result;
      } catch (error: any) {
        this.logger.error(
          `LLM generation failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (error?.status === 429) {
          this.logger.warn('Rate limit hit, backing off...');
          attempt--;
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 + Math.random() * 5000),
          );
          continue;
        }

        if (attempt === this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('LLM generation failed after retries');
  }

  private buildFieldsDescription(schema: Record<string, any>): string {
    // Legacy format: { fields: [{ name, type, description }] }
    if (schema.fields && Array.isArray(schema.fields)) {
      return schema.fields
        .map((f) => `- ${f.name} (${f.type}): ${f.description || ''}`)
        .join('\n');
    }

    // JSON Schema format: { type: 'object', properties: { ... } }
    if (schema.properties && typeof schema.properties === 'object') {
      return Object.entries(schema.properties)
        .map(([name, prop]: [string, any]) => {
          const type = prop.type || 'string';
          const desc = prop.description || '';
          return `- ${name} (${type}): ${desc}`;
        })
        .join('\n');
    }

    return JSON.stringify(schema, null, 2);
  }
}
