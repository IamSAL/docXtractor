import { test, expect } from './fixtures/auth.js';
import { mockLLMProviders, mockSeedRoutes } from './fixtures/mocks.js';
import { RUN_ID } from './fixtures/seed.js';

test.describe('Runs routes', () => {
  test.beforeEach(async ({ page }) => {
    await mockLLMProviders(page);
    await mockSeedRoutes(page);
  });

  test.describe('/runs', () => {
    test('renders runs list (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/runs');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/runs');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/runs/new', () => {
    test('renders new run form (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/runs/new');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('form, h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/runs/new');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/runs/:id', () => {
    test('renders run detail (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/runs/${RUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/runs/${RUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/runs/review/:id', () => {
    test('renders run review (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/runs/review/${RUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/runs/review/${RUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });
});
