import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { jsonrepair } from 'jsonrepair';

export interface OllamaExtractionResult {
  data: Record<string, unknown>;
  usage: {
    totalTokens: number;
  };
}

interface OllamaNode {
  client: Ollama;
  host: string;
  healthy: boolean;
}

class Semaphore {
  private tasks: (() => void)[] = [];
  private activeCount: number = 0;

  constructor(private concurrency: number) {}

  async acquire(): Promise<void> {
    if (this.activeCount < this.concurrency) {
      this.activeCount++;
      return;
    }
    return new Promise((resolve) => {
      this.tasks.push(resolve);
    });
  }

  release(): void {
    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      if (next) next();
    } else {
      this.activeCount--;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

@Injectable()
export class OllamaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OllamaService.name);
  private readonly pool: OllamaNode[];
  private readonly defaultModel: string;
  private readonly generationModel: string;
  private readonly semaphore: Semaphore;
  private nextIndex = 0;
  private healthCheckInterval: ReturnType<typeof setInterval>;

  constructor(private configService: ConfigService) {
    // Parse hosts: OLLAMA_HOSTS (comma-separated) takes priority over OLLAMA_HOST
    const hostsStr = this.configService.get<string>('OLLAMA_HOSTS', '');
    const singleHost = this.configService.get<string>(
      'OLLAMA_HOST',
      'http://ollama:11434',
    );
    const hosts = hostsStr
      ? hostsStr
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)
      : [singleHost];

    // Parse API keys: OLLAMA_API_KEYS (comma-separated, one per host) or OLLAMA_API_KEY (shared)
    const apiKeysStr = this.configService.get<string>('OLLAMA_API_KEYS', '');
    const sharedApiKey = this.configService.get<string>('OLLAMA_API_KEY', '');
    const apiKeys = apiKeysStr
      ? apiKeysStr.split(',').map((k) => k.trim())
      : [];

    this.pool = hosts.map((host, i) => {
      const apiKey = apiKeys[i] || sharedApiKey;
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      return {
        client: new Ollama({ host, headers }),
        host,
        healthy: true,
      };
    });

    this.defaultModel = this.configService.get<string>(
      'OLLAMA_DEFAULT_MODEL',
      'gpt-oss:120b-cloud',
    );
    this.generationModel = this.configService.get<string>(
      'OLLAMA_GENERATION_MODEL',
      'gpt-oss:120b-cloud',
    );
    const maxConcurrency = this.configService.get<number>(
      'OLLAMA_MAX_CONCURRENCY',
      2,
    );
    this.semaphore = new Semaphore(maxConcurrency);

    this.logger.log(
      `Ollama pool initialized: ${this.pool.length} instance(s) [${hosts.join(', ')}], concurrency=${maxConcurrency}`,
    );

    // Health check: every 30s, probe unhealthy nodes
    this.healthCheckInterval = setInterval(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      () => this.runHealthChecks(),
      30_000,
    );
  }

  async onModuleInit() {
    const modelsToEnsure = new Set([this.defaultModel, this.generationModel]);
    this.logger.log(
      `Ensuring models are available: ${[...modelsToEnsure].join(', ')}`,
    );

    for (const node of this.pool) {
      for (const model of modelsToEnsure) {
        try {
          // Check if model already exists on this node
          const { models } = await node.client.list();
          const exists = models.some(
            (m) => m.name === model || m.name === `${model}:latest`,
          );
          if (exists) {
            this.logger.log(
              `Model '${model}' already available on ${node.host}`,
            );
            continue;
          }

          this.logger.log(`Pulling model '${model}' on ${node.host}...`);
          await node.client.pull({ model });
          this.logger.log(
            `Model '${model}' pulled successfully on ${node.host}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to pull model '${model}' on ${node.host}: ${error}. It may need to be pulled manually.`,
          );
        }
      }
    }
  }

  onModuleDestroy() {
    clearInterval(this.healthCheckInterval);
  }

  private getNextNode(): OllamaNode {
    const poolSize = this.pool.length;
    for (let i = 0; i < poolSize; i++) {
      const idx = this.nextIndex % poolSize;
      this.nextIndex = (this.nextIndex + 1) % poolSize;
      if (this.pool[idx].healthy) {
        return this.pool[idx];
      }
    }
    // All unhealthy — try the next one anyway (it may have recovered)
    const fallback = this.pool[this.nextIndex % poolSize];
    this.nextIndex = (this.nextIndex + 1) % poolSize;
    this.logger.warn(`All Ollama nodes unhealthy, attempting ${fallback.host}`);
    return fallback;
  }

  private markUnhealthy(node: OllamaNode) {
    if (node.healthy) {
      node.healthy = false;
      this.logger.warn(`Ollama node marked unhealthy: ${node.host}`);
    }
  }

  private isConnectionError(error: any): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      msg.includes('ECONNREFUSED') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('fetch failed') ||
      msg.includes('socket hang up')
    );
  }

  private async runHealthChecks() {
    for (const node of this.pool) {
      if (node.healthy) continue;
      try {
        await node.client.list();
        node.healthy = true;
        this.logger.log(`Ollama node recovered: ${node.host}`);
      } catch {
        // Still unhealthy
      }
    }
  }

  async extract(
    content: string,
    schema: Record<string, any>,
    systemPrompt: string,
    _model?: string,
  ): Promise<OllamaExtractionResult> {
    return this.semaphore.run(async () => {
      const modelId = _model || this.defaultModel;

      // Build field descriptions from schema
      const fieldsDesc = this.buildFieldsDescription(schema);

      // Build the prompt
      const instruction = systemPrompt
        ? `${systemPrompt}\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`
        : `Extract the following fields from the document text.\nReference the exact text where possible.\n\nFields to extract:\n${fieldsDesc}\n\nReturn a valid JSON object matching this structure.`;

      const fullPrompt = `${instruction}\n\nDocument Content:\n${content}`;

      this.logger.log(`Running Ollama extraction, mode: ${modelId}`);

      const maxRetries = this.configService.get<number>(
        'OLLAMA_EXTRACTION_MAX_RETRIES',
        3,
      );
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const node = this.getNextNode();
        try {
          const response = await node.client.chat({
            model: modelId,
            messages: [{ role: 'user', content: fullPrompt }],
            format: schema,
          });
          this.logger.debug(`Ollama response: ${response.message.content}`);
          const resultData = JSON.parse(
            jsonrepair(response.message.content),
          ) as Record<string, unknown>;

          const totalTokens =
            (response.prompt_eval_count || 0) + (response.eval_count || 0);

          this.logger.log(
            `Ollama extraction complete: tokens=${totalTokens}, node=${node.host}`,
          );

          return {
            data: resultData,
            usage: { totalTokens },
          };
        } catch (error: any) {
          this.logger.error(
            `Ollama extraction failed (attempt ${attempt}/${maxRetries}, node=${node.host}): ${error}`,
          );

          if (this.isConnectionError(error)) {
            this.markUnhealthy(node);
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const isRateLimit =
            errorMessage
              .toLowerCase()
              .includes('too many concurrent requests') ||
            errorMessage.toLowerCase().includes('429');

          if (isRateLimit) {
            this.logger.warn(
              `Rate limit or concurrency error hit, backing off and retrying...`,
            );
            attempt--;
            await new Promise((resolve) =>
              setTimeout(resolve, 3000 + Math.random() * 5000),
            );
            continue;
          }

          if (attempt === maxRetries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
      throw new Error('Ollama extraction failed after retries');
    });
  }

  /**
   * General-purpose JSON generation using Ollama.
   * Uses the generation model (configurable via OLLAMA_GENERATION_MODEL).
   */
  async generate(
    prompt: string,
    model?: string,
  ): Promise<Record<string, unknown>> {
    return this.semaphore.run(async () => {
      const modelId = model || this.generationModel;

      this.logger.log(
        `Running Ollama generation: model=${modelId}, prompt_length=${prompt.length}`,
      );

      const maxRetries = this.configService.get<number>(
        'OLLAMA_EXTRACTION_MAX_RETRIES',
        3,
      );
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const node = this.getNextNode();
        try {
          const response = await node.client.chat({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            format: 'json',
          });

          this.logger.debug(
            `Ollama generation response: ${response.message.content}`,
          );

          const result = JSON.parse(
            jsonrepair(response.message.content),
          ) as Record<string, unknown>;

          const totalTokens =
            (response.prompt_eval_count || 0) + (response.eval_count || 0);

          this.logger.log(
            `Ollama generation complete: tokens=${totalTokens}, node=${node.host}`,
          );

          return result;
        } catch (error: any) {
          this.logger.error(
            `Ollama generation failed (attempt ${attempt}/${maxRetries}, node=${node.host}): ${error}`,
          );

          if (this.isConnectionError(error)) {
            this.markUnhealthy(node);
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const isRateLimit =
            errorMessage
              .toLowerCase()
              .includes('too many concurrent requests') ||
            errorMessage.toLowerCase().includes('429');

          if (isRateLimit) {
            this.logger.warn(
              `Rate limit or concurrency error hit in generation, backing off and retrying...`,
            );
            attempt--;
            await new Promise((resolve) =>
              setTimeout(resolve, 3000 + Math.random() * 5000),
            );
            continue;
          }

          if (attempt === maxRetries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
      throw new Error('Ollama generation failed after retries');
    });
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
        .map((f: any) => `- ${f.name} (${f.type}): ${f.description || ''}`)
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
