import { defineConfig } from '@playwright/test'
import base from './playwright.documentation.config'

export default defineConfig({
  ...base,
  testMatch: ['catalog-kind-navigation.e2e.spec.ts', 'mesh-kind-navigation.e2e.spec.ts'],
})
