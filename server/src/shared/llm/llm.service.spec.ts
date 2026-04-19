jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

import OpenAI from 'openai';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';

function getMockCreate(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('openai').__mockCreate as jest.Mock;
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

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await buildService();
    mockCreate = getMockCreate();
  });

  describe('generate()', () => {
    it('returns parsed JSON from chat response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"name":"test"}' } }],
        usage: { total_tokens: 42 },
      });

      const result = await service.generate('describe something');

      expect(result).toEqual({ name: 'test' });
      expect(mockCreate).toHaveBeenCalledWith(
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
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('throws after all retries exhausted', async () => {
      mockCreate.mockRejectedValue(new Error('persistent error'));

      await expect(service.generate('test')).rejects.toThrow(
        'persistent error',
      );
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.generate('test', 'groq/llama-3.3-70b-versatile');

      expect(mockCreate).toHaveBeenCalledWith(
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

    it('returns extracted data with token count', async () => {
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
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ response_format: { type: 'json_object' } }),
      );
    });

    it('includes systemPrompt in the request message', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, 'Be precise and accurate');

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain('Be precise and accurate');
    });

    it('uses model override when provided', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
        usage: { total_tokens: 5 },
      });

      await service.extract('content', schema, '', 'gemini/gemini-2.5-flash');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini/gemini-2.5-flash' }),
      );
    });

    it('handles legacy fields schema format', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"total":"100"}' } }],
        usage: { total_tokens: 20 },
      });

      const legacySchema = {
        fields: [{ name: 'total', type: 'string', description: 'Total value' }],
      };

      const result = await service.extract('text', legacySchema, '');

      expect(result.data).toEqual({ total: '100' });
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.messages[0].content).toContain(
        '- total (string): Total value',
      );
    });
  });
});
