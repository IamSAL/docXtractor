import { test, expect } from '@playwright/test';
import { INVITE_TOKEN } from './fixtures/seed.js';

test.describe('Auth routes', () => {
  test.describe('/login', () => {
    test('renders login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test('shows error on invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.locator('input[type="email"]').first().fill('bad@test.com');
      await page.locator('input[type="password"]').first().fill('wrongpass');
      await page.locator('button[type="submit"]').first().click();
      await expect(
        page.locator('text=/error|invalid|incorrect/i').first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('/signup', () => {
    test('renders signup form', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    });
  });

  test.describe('/setup', () => {
    test('renders setup page', async ({ page }) => {
      await page.goto('/setup');
      const heading = page.locator('h1, h2, [role="heading"]').first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('/invite/:token', () => {
    test('renders invite page', async ({ page }) => {
      await page.goto(`/invite/${INVITE_TOKEN}`);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('/auth/verify', () => {
    test('renders verify page', async ({ page }) => {
      await page.goto('/auth/verify');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('/auth/callback', () => {
    test('renders callback page', async ({ page }) => {
      await page.goto('/auth/callback');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
