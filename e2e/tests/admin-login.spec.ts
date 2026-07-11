import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin', () => {
  test('login page renders', async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
    await expect(adminLoginPage.heading).toBeVisible();
    await expect(adminLoginPage.emailInput).toBeVisible();
    await expect(adminLoginPage.passwordInput).toBeVisible();
  });
});
