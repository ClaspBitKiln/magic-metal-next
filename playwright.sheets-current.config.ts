import { defineConfig } from '@playwright/test'
import base from './playwright.documentation.config'
export default defineConfig({
  ...base,
  testMatch: ['sheet-selection.e2e.spec.ts', 'specification-context.e2e.spec.ts', 'nonferrous-kind-navigation.e2e.spec.ts'],
})
