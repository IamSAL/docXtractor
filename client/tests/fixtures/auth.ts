import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      const authState = {
        state: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MTc4NTYwMDAsImV4cCI6OTk5OTk5OTk5OX0.placeholder',
          refreshToken: 'refresh-token-placeholder',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        version: 0,
      };
      document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify(authState))}; path=/`;
    });
    await use();
  },
});

export { expect };
