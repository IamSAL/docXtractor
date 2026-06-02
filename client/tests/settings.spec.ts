import { test, expect } from './fixtures/auth.js';
import { mockLLMProviders } from './fixtures/mocks.js';

const SETTINGS_PAGES = [
  '/settings/profile',
  '/settings/notifications',
  '/settings/extraction',
  '/settings/instance',
  '/settings/backups',
  '/settings/appearance',
  '/settings/api-keys',
];

test.describe('Settings routes', () => {
  test.beforeEach(async ({ page }) => {
    await mockLLMProviders(page);
  });

  for (const route of SETTINGS_PAGES) {
    test(`renders ${route} (authenticated)`, async ({ page, authenticatedPage: _ }) => {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, h3, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    });

    test(`auth guard — ${route} unauthenticated redirects`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  }

  test('/settings redirects to /settings/extraction (authenticated)', async ({ page, authenticatedPage: _ }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings\/extraction/, { timeout: 10_000 });
  });
});
