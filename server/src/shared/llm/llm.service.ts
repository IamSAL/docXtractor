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

export class TruncatedResponseError extends Error {
  constructor() {
    super('LLM response was truncated (json-possibly-truncated)');
    this.name = 'TruncatedResponseError';
  }
}

interface FewShotSource {
  type?: string;
  parsedContent?: string;
  content?: string;
}
interface FewShotExample {
  sources: FewShotSource[];
  output: string;
}

function buildFewShotBlock(examples?: FewShotExample[]): string {
  if (!examples?.length) return '';

  const blocks = examples
    .map((ex) => {
      const sourceTexts = ex.sources
        .map((s) => {
          if (s.type === 'text') return (s.content || '').trim();
          return (s.parsedContent || '').trim();
        })
        .filter((t) => t.length > 0);

      const combinedInput = sourceTexts.join('\n\n---\n\n') || '(no input)';
      const output = (ex.output || '').trim();
      if (!sourceTexts.length && !output) return null;

      return `<example>\n<input>\n${combinedInput}\n</input>\n<expected_output>\n${output}\n</expected_output>\n</example>`;
    })
    .filter((b): b is string => b !== null);

  if (!blocks.length) return '';

  return `\n<examples>\n${blocks.join('\n')}\n</examples>`;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly defaultExtractionModel: string;
  private readonly maxRetries: number;
  private readonly ollamaBaseUrl: string;
  private readonly pulledModels = new Set<string>();

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
    this.ollamaBaseUrl = configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://ollama-lb:11434',
    );

    this.logger.log(
      `LlmService initialized: baseURL=${configService.get('FREELLM_BASE_URL', 'http://freellm:3000/v1')}, defaultModel=${this.defaultModel}`,
    );
  }

  private isOllamaModel(model: string): boolean {
    return model.includes(':');
  }

  private isModelNotFoundError(error: any): boolean {
    const msg: string = (error?.message ?? error?.error ?? '').toLowerCase();
    return (
      (error?.status === 404 || msg.includes('not found')) &&
      msg.includes('model')
    );
  }

  private async ensureOllamaModelPulled(model: string): Promise<void> {
    if (this.pulledModels.has(model)) return;

    this.logger.log(`Pulling Ollama model: ${model}`);
    const res = await fetch(`${this.ollamaBaseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama pull failed for model '${model}': ${body}`);
    }

    this.pulledModels.add(model);
    this.logger.log(`Ollama model pulled successfully: ${model}`);
  }

  async extract(
    content: string,
    schema: Record<string, any>,
    systemPrompt: string,
    model?: string,
    fewShotExamples?: FewShotExample[],
  ): Promise<LlmExtractionResult> {
    const modelId = model || this.defaultExtractionModel;

    // Build response format: json_schema for structured schemas, fallback to json_object for legacy
    const responseFormat: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming['response_format'] =
      schema.properties
        ? {
            type: 'json_schema',
            json_schema: { name: 'extraction_result', schema },
          }
        : { type: 'json_object' };

    // Build system content with XML-delimited sections
    const fieldsDesc = this.buildFieldsDescription(schema);
    const baseInstruction = systemPrompt
      ? systemPrompt
      : 'Extract the following fields from the document text. Reference the exact text where possible.';

    const fewShotBlock = buildFewShotBlock(fewShotExamples);

    const systemContent = [
      `<instructions>\n${baseInstruction}\nReturn a valid JSON object matching the output schema exactly.\n</instructions>`,
      `<output_schema>\nFields to extract:\n${fieldsDesc}\n\nJSON Schema:\n${JSON.stringify(schema.properties ?? schema, null, 2)}\n</output_schema>`,
      fewShotBlock,
    ]
      .filter((s) => s.length > 0)
      .join('\n\n');

    // User message: document only
    const userContent = `<document>\n${content}\n</document>`;

    this.logger.log(
      `Running LLM extraction, model: ${modelId}, format: ${responseFormat.type}`,
    );
    this.logger.log('::::SYSTEM::::');
    this.logger.log(systemContent);
    this.logger.log('::::USER::::');
    this.logger.log(userContent);

    const validationRetries = 3;
    let lastValidationErrors = '';
    const maxRateLimitRetries = 5;
    let rateLimitRetries = 0;
    let autopullAttempted = false;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callWithTruncationCheck({
          model: modelId,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
          ],
          response_format: responseFormat,
        });

        const raw = response.choices[0].message.content ?? '{}';
        this.logger.log('::::OUTPUT::::');
        this.logger.debug(raw);

        const REFUSAL_PATTERNS = [
          /sorry,?\s+i\s+(can'?t|cannot)/i,
          /i\s+(can'?t|cannot)\s+(help|assist)/i,
          /as an (ai|language model)/i,
          /i('?m| am) not able to/i,
        ];
        if (REFUSAL_PATTERNS.some((p) => p.test(raw))) {
          throw new Error(`LLM refused to extract: ${raw.slice(0, 120)}`);
        }

        const resultData = JSON.parse(jsonrepair(raw)) as Record<
          string,
          unknown
        >;
        const totalTokens = response.usage?.total_tokens ?? 0;

        // Validate result against schema
        for (let vAttempt = 1; vAttempt <= validationRetries; vAttempt++) {
          const { valid, errors } = this.validateAgainstSchema(
            resultData,
            schema,
          );
          if (valid) {
            this.logger.log(`LLM extraction complete:`, response);
            return { data: resultData, usage: { totalTokens } };
          }

          lastValidationErrors = errors;
          this.logger.warn(
            `Schema validation failed (attempt ${vAttempt}/${validationRetries}): ${errors}`,
          );

          if (vAttempt === validationRetries) break;

          // Multi-turn correction retry: model sees its own bad output in context
          try {
            const correctionResponse = await this.callWithTruncationCheck({
              model: modelId,
              messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: userContent },
                { role: 'assistant', content: raw },
                {
                  role: 'user',
                  content: `Your previous response failed validation: ${errors}. Fix the JSON to match the schema exactly.`,
                },
              ],
              response_format: responseFormat,
            });
            const correctedRaw =
              correctionResponse.choices[0].message.content ?? '{}';
            Object.assign(
              resultData,
              JSON.parse(jsonrepair(correctedRaw)) as Record<string, unknown>,
            );
          } catch (correctionError: any) {
            if (correctionError instanceof TruncatedResponseError) {
              this.logger.warn(
                `Truncation during correction attempt ${vAttempt} — continuing inner loop`,
              );
              // Continue to next vAttempt, resultData unchanged
            } else {
              throw correctionError;
            }
          }
        }

        throw new Error(
          `LLM response failed schema validation after ${validationRetries} attempts: ${lastValidationErrors}`,
        );
      } catch (error: any) {
        if (error instanceof TruncatedResponseError) {
          this.logger.warn(
            `Truncation on attempt ${attempt}/${this.maxRetries} — counting as normal retry`,
          );
          if (attempt === this.maxRetries) throw error;
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }

        this.logger.error(
          `LLM extraction failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (
          !autopullAttempted &&
          this.isOllamaModel(modelId) &&
          this.isModelNotFoundError(error)
        ) {
          autopullAttempted = true;
          this.logger.warn(
            `Ollama model '${modelId}' not found — pulling and retrying`,
          );
          await this.ensureOllamaModelPulled(modelId);
          attempt--; // Don't consume a retry slot for the pull
          continue;
        }

        if (error?.status === 429) {
          rateLimitRetries++;
          if (rateLimitRetries > maxRateLimitRetries) {
            this.logger.error(
              `Rate limit retries exhausted (${maxRateLimitRetries}), giving up.`,
            );
            throw error;
          }
          const backoff =
            Math.min(3000 * Math.pow(2, rateLimitRetries - 1), 60_000) +
            Math.random() * 2000;
          this.logger.warn(
            `Rate limit hit (429), retry ${rateLimitRetries}/${maxRateLimitRetries} after ${Math.round(backoff)}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          attempt--; // Don't consume a normal retry slot for 429s
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

    const maxRateLimitRetries = 5;
    let rateLimitRetries = 0;
    let autopullAttempted = false;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callWithTruncationCheck({
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
        if (error instanceof TruncatedResponseError) {
          this.logger.warn(
            `Truncation on generation attempt ${attempt}/${this.maxRetries} — counting as normal retry`,
          );
          if (attempt === this.maxRetries) throw error;
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }

        this.logger.error(
          `LLM generation failed (attempt ${attempt}/${this.maxRetries}): ${error}`,
        );

        if (
          !autopullAttempted &&
          this.isOllamaModel(modelId) &&
          this.isModelNotFoundError(error)
        ) {
          autopullAttempted = true;
          this.logger.warn(
            `Ollama model '${modelId}' not found — pulling and retrying`,
          );
          await this.ensureOllamaModelPulled(modelId);
          attempt--;
          continue;
        }

        if (error?.status === 429) {
          rateLimitRetries++;
          if (rateLimitRetries > maxRateLimitRetries) {
            this.logger.error(
              `Rate limit retries exhausted (${maxRateLimitRetries}), giving up.`,
            );
            throw error;
          }
          const backoff =
            Math.min(3000 * Math.pow(2, rateLimitRetries - 1), 60_000) +
            Math.random() * 2000;
          this.logger.warn(
            `Rate limit hit (429), retry ${rateLimitRetries}/${maxRateLimitRetries} after ${Math.round(backoff)}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          attempt--; // Don't consume a normal retry slot for 429s
          continue;
        }

        if (attempt === this.maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('LLM generation failed after retries');
  }

  private validateAgainstSchema(
    data: Record<string, unknown>,
    schema: Record<string, any>,
  ): { valid: boolean; errors: string } {
    const expectedKeys: string[] = schema.properties
      ? Object.keys(schema.properties)
      : (schema.fields?.map((f: any) => f.name) ?? []);

    if (!expectedKeys.length) return { valid: true, errors: '' };

    const missingKeys = expectedKeys.filter((k) => !(k in data));
    if (!missingKeys.length) return { valid: true, errors: '' };

    return {
      valid: false,
      errors: `Missing keys: ${missingKeys.join(', ')}`,
    };
  }

  async listModels(): Promise<{ id: string; owned_by: string }[]> {
    const list = await this.client.models.list();
    const models: { id: string; owned_by: string }[] = [];
    for await (const model of list) {
      models.push({ id: model.id, owned_by: model.owned_by });
    }
    return models;
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

  private async callWithTruncationCheck(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const { data, response } = await this.client.chat.completions
      .create(params)
      .withResponse();

    const warning = response.headers.get('x-freellm-warning') ?? '';
    if (warning.includes('json-possibly-truncated')) {
      this.logger.warn(`FreeLLM truncation warning: ${warning}`);
      throw new TruncatedResponseError();
    }

    return data;
  }
}
