import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['technical-catalog-pilot.e2e.spec.ts'],
  timeout: 45_000,
  retries: 1,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report-pilot', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
