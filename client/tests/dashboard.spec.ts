import { test, expect } from './fixtures/auth.js';
import { mockLLMProviders } from './fixtures/mocks.js';

test.describe('/dashboard', () => {
  test('renders dashboard (authenticated)', async ({ page, authenticatedPage: _ }) => {
    await mockLLMProviders(page);
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1, h2, [role="heading"]').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('auth guard — unauthenticated redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
