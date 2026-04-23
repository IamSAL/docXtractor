jest.mock('openai', () => {
  const mockCreate = jest.fn();

  // Mimics OpenAI SDK APIPromise: a Promise that also has .withResponse().
  // Wrapping mockCreate() inside .then() ensures rejections propagate cleanly
  // through both await and .withResponse() without premature unhandledRejection.
  const wrappedCreate = jest.fn((...args: any[]) => {
    const innerPromise: Promise<any> = Promise.resolve().then(() =>
      mockCreate(...args),
    );

    const apiPromise = innerPromise as any;
    apiPromise.withResponse = () =>
      innerPromise.then((data) => ({
        data,
        response: { headers: { get: () => '' } },
        request_id: null,
      }));
    return apiPromise;
  });
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: wrappedCreate } },
    })),
    __mockCreate: mockCreate,
    __wrappedCreate: wrappedCreate,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService, TruncatedResponseError } from './llm.service';

function getMockCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('openai') as any).__mockCreate as jest.Mock;
}

function getWrappedCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('openai') as any).__wrappedCreate as jest.Mock;
}

const mockConfigGet = jest.fn((key: string, def?: any) => {
  if (key === 'FREELLM_BASE_URL') return 'http://freellm:3000/v1';
  if (key === 'LLM_DEFAULT_MODEL') return 'free';
  if (key === 'LLM_MAX_RETRIES') return 3;
  return def;
});

async function buildService(): Promise<LlmService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      LlmService,
      { provide: ConfigService, useValue: { get: mockConfigGet } },
    ],
  }).compile();
  return module.get<LlmService>(LlmService);
}

describe('LlmService', () => {
  let service: LlmService;
  let mockCreate: jest.Mock;
  let wrappedCreate: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await buildService();
    mockCreate = getMockCreate();
    wrappedCreate = getWrappedCreate();
  });

  describe('generate()', () => {
    it('returns parsed JSON from chat response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"name":"test"}' } }],
        usage: { total_tokens: 42 },
      });

      const result = await service.generate('describe something');

      expect(result).toEqual({ name: 'test' });
      expect(wrappedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'free',
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: 'describe something' }],
        }),
      );
    });

    it('retries on transient failure then returns result', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('connection error'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"ok":true}' } }],
          usage: { total_tokens: 10 },
        });

      const result = await service.generate('test prompt');

      expect(result).toEqual({ ok: true });
      expect(wrappedCreate).toHaveBeenCalledTimes(2);
    });

    it('throws after all retries exhausted', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('persistent error'))
        .mockRejectedValueOnce(new Error('persistent error'))
        .mockRejectedValueOnce(new Error('persistent error'));

      await expect(service.generate('test')).rejects.toThrow(
        'persistent error',
      );
      expect(wrappedCreate).toHaveBeenCalledTimes(3);
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.generate('test', 'groq/llama-3.3-70b-versatile');

      expect(wrappedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'groq/llama-3.3-70b-versatile' }),
      );
    });
  });

  describe('extract()', () => {
    const schema = {
      type: 'object',
      properties: {
        invoice_number: { type: 'string', description: 'Invoice ID' },
        amount: { type: 'number', description: 'Total amount' },
      },
    };

    it('returns extracted data with token count using json_schema format', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          { message: { content: '{"invoice_number":"INV-001","amount":100}' } },
        ],
        usage: { total_tokens: 150 },
      });

      const result = await service.extract(
        'invoice text',
        schema,
        'extract invoice fields',
      );

      expect(result.data).toEqual({ invoice_number: 'INV-001', amount: 100 });
      expect(result.usage.totalTokens).toBe(150);

      const callArg = wrappedCreate.mock.calls[0][0];
      expect(callArg.response_format.type).toBe('json_schema');
      expect(callArg.response_format.json_schema.name).toBe('extraction_result');
    });

    it('uses system/user message split with document in user message', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          { message: { content: '{"invoice_number":"INV-001","amount":100}' } },
        ],
        usage: { total_tokens: 150 },
      });

      await service.extract('my document text', schema, 'Be precise');

      const callArg = wrappedCreate.mock.calls[0][0];
      expect(callArg.messages[0].role).toBe('system');
      expect(callArg.messages[1].role).toBe('user');
      expect(callArg.messages[1].content).toContain('<document>');
      expect(callArg.messages[1].content).toContain('my document text');
      expect(callArg.messages[1].content).toContain('</document>');
    });

    it('includes systemPrompt in the system message', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          { message: { content: '{"invoice_number":"INV-001","amount":100}' } },
        ],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, 'Be precise and accurate');

      const callArg = wrappedCreate.mock.calls[0][0];
      expect(callArg.messages[0].role).toBe('system');
      expect(callArg.messages[0].content).toContain('Be precise and accurate');
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"invoice_number":"X","amount":0}' } }],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, '', 'gemini/gemini-2.5-flash');

      expect(wrappedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini/gemini-2.5-flash' }),
      );
    });

    it('falls back to json_object for legacy fields schema format', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"total":"100"}' } }],
        usage: { total_tokens: 20 },
      });

      const legacySchema = {
        fields: [{ name: 'total', type: 'string', description: 'Total value' }],
      };

      const result = await service.extract('text', legacySchema, '');

      expect(result.data).toEqual({ total: '100' });
      const callArg = wrappedCreate.mock.calls[0][0];
      expect(callArg.response_format).toEqual({ type: 'json_object' });
      expect(callArg.messages[0].content).toContain('- total (string): Total value');
    });

    it('retries when FreeLLM returns truncation warning header', async () => {
      // First call: mockCreate returns valid data, but wrappedCreate simulates truncation header
      // We override wrappedCreate for this test to control .withResponse() directly
      wrappedCreate.mockImplementationOnce(() => {
        const promise = Promise.resolve({ choices: [], usage: null });
        (promise as any).withResponse = () =>
          Promise.resolve({
            data: {
              choices: [{ message: { content: '{"invoice_number":"T","amount":0}' } }],
              usage: { total_tokens: 10 },
            },
            response: { headers: { get: () => 'json-possibly-truncated' } },
            request_id: null,
          });
        return promise;
      });
      // Second call: clean response, no truncation header
      mockCreate.mockResolvedValueOnce({
        choices: [
          { message: { content: '{"invoice_number":"INV-002","amount":200}' } },
        ],
        usage: { total_tokens: 50 },
      });

      const result = await service.extract('invoice text', schema, '');

      expect(wrappedCreate).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ invoice_number: 'INV-002', amount: 200 });
    });
  });
});
