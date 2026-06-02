import { test, expect } from './fixtures/auth.js';
import { mockLLMProviders, mockSeedRoutes } from './fixtures/mocks.js';
import { EXTRACTOR_ID } from './fixtures/seed.js';

test.describe('Extractors routes', () => {
  test.beforeEach(async ({ page }) => {
    await mockLLMProviders(page);
    await mockSeedRoutes(page);
  });

  test.describe('/extractors', () => {
    test('renders extractor list (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/extractors');
      await expect(page.locator('body')).toBeVisible();
      const heading = page.locator('h1, h2, [role="heading"]').first();
      await expect(heading).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/extractors');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/extractors/new', () => {
    test('renders new extractor form (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/extractors/new');
      await expect(page.locator('body')).toBeVisible();
      const formOrHeading = page.locator('form, h1, h2').first();
      await expect(formOrHeading).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/extractors/new');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/extractors/:id', () => {
    test('renders extractor detail (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/extractors/${EXTRACTOR_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/extractors/${EXTRACTOR_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/extractors/edit/:id', () => {
    test('renders extractor edit form (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto(`/extractors/edit.${EXTRACTOR_ID}`);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('form, h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto(`/extractors/edit.${EXTRACTOR_ID}`);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test.describe('/extractors/templates', () => {
    test('renders templates page (authenticated)', async ({ page, authenticatedPage: _ }) => {
      await page.goto('/extractors/templates');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test('auth guard — unauthenticated redirects', async ({ page }) => {
      await page.goto('/extractors/templates');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });
});
