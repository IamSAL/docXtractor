import type { Page } from '@playwright/test';
import { EXTRACTOR_ID, RUN_ID, AUTORUN_ID, DEMO_RUN_ID } from './seed.js';

export async function mockLLMProviders(page: Page) {
  await page.route('https://api.openai.com/**', (route) =>
    route.abort('blockedbyclient'),
  );
  await page.route('https://api.anthropic.com/**', (route) =>
    route.abort('blockedbyclient'),
  );
  await page.route('https://generativelanguage.googleapis.com/**', (route) =>
    route.abort('blockedbyclient'),
  );
}

export async function mockSeedRoutes(page: Page) {
  await page.route(`**/api/extractors/${EXTRACTOR_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: EXTRACTOR_ID,
          name: 'Test Extractor',
          description: 'Test description',
          schema: { fields: ['invoiceNumber', 'totalAmount'] },
          parserEngine: 'docling',
          extractionProvider: 'openai',
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-06-01T00:00:00Z',
        },
      }),
    }),
  );

  await page.route(`**/api/runs/${RUN_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: RUN_ID,
          extractorId: EXTRACTOR_ID,
          status: 'done',
          results: { invoiceNumber: 'INV-001', totalAmount: '1500.00' },
          createdAt: '2026-06-01T00:00:00Z',
        },
      }),
    }),
  );

  await page.route(`**/api/autoruns/${AUTORUN_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: AUTORUN_ID,
          name: 'Test AutoRun',
          status: 'active',
          definition: { nodes: [], edges: [] },
          createdAt: '2026-06-01T00:00:00Z',
        },
      }),
    }),
  );

  await page.route(`**/api/demo/${DEMO_RUN_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: DEMO_RUN_ID,
          status: 'done',
          results: { text: 'Extracted content' },
          createdAt: '2026-06-01T00:00:00Z',
        },
      }),
    }),
  );

  await page.route(`**/api/demo/result/${DEMO_RUN_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: DEMO_RUN_ID,
          status: 'done',
          results: { text: 'Extracted content' },
        },
      }),
    }),
  );
}
