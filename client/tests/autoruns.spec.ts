import { test, expect } from './fixtures/auth.js';
import { mockLLMProviders, mockSeedRoutes } from './fixtures/mocks.js';
import { AUTORUN_ID } from './fixtures/seed.js';

test.describe('AutoRuns routes', () => {
  test.beforeEach(async ({ page }) => {
    await mockLLMProviders(page);
    await mockSeedRoutes(page);
  });

  test.describe('/autoruns', () => {
    test('renders autoruns list (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/autoruns');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/autoruns');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/autoruns/new', () => {
    test('renders new autorun page (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/autoruns/new');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('form, h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/autoruns/new');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/autoruns/:id', () => {
    test('renders autorun detail (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/autoruns/${AUTORUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/autoruns/${AUTORUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/autoruns/edit/:id', () => {
    test('renders autorun edit form (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/autoruns/edit/${AUTORUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('form, h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/autoruns/edit/${AUTORUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/autoruns/builder/:id', () => {
    test('renders autorun builder (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/autoruns/builder/${AUTORUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, canvas, [role="application"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/autoruns/builder/${AUTORUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/autoruns/runs/:id', () => {
    test('renders autorun runs history (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/autoruns/runs/${AUTORUN_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/autoruns/runs/${AUTORUN_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });
});
