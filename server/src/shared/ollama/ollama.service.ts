import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';

export interface OllamaExtractionResult {
  data: Record<string, unknown>;
  usage: {
    totalTokens: number;
  };
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly client: Ollama;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>(
      'OLLAMA_HOST',
      'http://localhost:11434',
    );
    this.defaultModel = this.configService.get<string>(
      'OLLAMA_DEFAULT_MODEL',
      'nuextract',
    );
    this.client = new Ollama({ host });
    this.logger.log(`Ollama client initialized: host=${host}, model=${this.defaultModel}`);
  }

  async extract(
    content: string,
    schema: Record<string, any>,
    systemPrompt: string,
    model?: string,
  ): Promise<OllamaExtractionResult> {
    const modelId = model || this.defaultModel;

    // Build field descriptions from schema
    const fieldsDesc = this.buildFieldsDescription(schema);

    // Build the prompt
    const instruction = systemPrompt
      ? `${systemPrompt}\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`
      : `Extract the following fields from the document text.\nReference the exact text where possible.\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`;

    const fullPrompt = `${instruction}\n\nDocument Content:\n${content}`;

    this.logger.log(
      `Running Ollama extraction: model=${modelId}, content_length=${content.length}`,
    );

    const response = await this.client.chat({
      model: modelId,
      messages: [{ role: 'user', content: fullPrompt }],
      format: 'json',
    });

    const resultData = JSON.parse(response.message.content);

    const totalTokens =
      (response.prompt_eval_count || 0) + (response.eval_count || 0);

    this.logger.log(
      `Ollama extraction complete: tokens=${totalTokens}`,
    );

    return {
      data: resultData,
      usage: { totalTokens },
    };
  }

  /**
   * Build a human-readable field description from the schema.
   * Handles both JSON Schema format ({type: 'object', properties: {...}})
   * and the legacy fields format ({fields: [{name, type, description}]}).
   */
  private buildFieldsDescription(schema: Record<string, any>): string {
    // Legacy format: { fields: [{ name, type, description }] }
    if (schema.fields && Array.isArray(schema.fields)) {
      return schema.fields
        .map(
          (f: any) =>
            `- ${f.name} (${f.type}): ${f.description || ''}`,
        )
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

    // Fallback: stringify the schema
    return JSON.stringify(schema, null, 2);
  }
}
