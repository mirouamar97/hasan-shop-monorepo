import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ...(isCI ? ([['github']] as const) : []),
  ],
  outputDir: 'test-results',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_URL ?? 'http://localhost:3001',
      },
      testMatch: /admin.*\.spec\.ts|shipping-fulfillment\.spec\.ts/,
    },
    {
      name: 'storefront',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STOREFRONT_URL ?? 'http://localhost:3000',
      },
      testMatch: /storefront.*\.spec\.ts/,
    },
  ],
  webServer: isCI
    ? undefined
    : [
        {
          command: 'pnpm --filter @hasan-shop/api dev',
          url: 'http://localhost:4000/api/v1/health',
          reuseExistingServer: true,
          timeout: 180_000,
        },
        {
          command: 'pnpm --filter @hasan-shop/admin dev',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
          timeout: 180_000,
        },
        {
          command: 'pnpm --filter @hasan-shop/storefront dev',
          url: 'http://localhost:3000/ar',
          reuseExistingServer: true,
          timeout: 180_000,
        },
      ],
});
