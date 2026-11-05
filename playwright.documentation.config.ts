import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['product-documentation.e2e.spec.ts', 'technical-catalog-pilot.e2e.spec.ts', 'nonferrous-shape-reset.e2e.spec.ts', 'specification-context.e2e.spec.ts', 'sheet-selection.e2e.spec.ts'],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 3,
  reporter: [['line']],
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:3017', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : undefined } }],
})
