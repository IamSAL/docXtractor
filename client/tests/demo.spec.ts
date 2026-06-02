import { test, expect } from '@playwright/test';
import { mockLLMProviders, mockSeedRoutes } from './fixtures/mocks.js';
import { DEMO_RUN_ID } from './fixtures/seed.js';

test.describe('Demo routes (public)', () => {
  test.beforeEach(async ({ page }) => {
    await mockLLMProviders(page);
    await mockSeedRoutes(page);
  });

  test.describe('/demo', () => {
    test('renders demo page without auth', async ({ page }) => {
      await page.goto('/demo');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('demo page accessible without login', async ({ page }) => {
      await page.goto('/demo');
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('/demo/result/:runId', () => {
    test('renders demo result page without auth', async ({ page }) => {
      await page.goto(`/demo/result/${DEMO_RUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('demo result accessible without login', async ({ page }) => {
      await page.goto(`/demo/result/${DEMO_RUN_ID}`);
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
