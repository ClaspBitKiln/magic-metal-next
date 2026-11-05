import { defineConfig } from '@playwright/test'
import base from './playwright.documentation.config'
export default defineConfig({ ...base, testMatch: ['product-documentation.e2e.spec.ts', 'approved-product-card-a.e2e.spec.ts', 'nonferrous-unrestricted-request.e2e.spec.ts', 'sheet-selection.e2e.spec.ts'] })
