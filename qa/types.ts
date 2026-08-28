import type { Page } from '@playwright/test'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Finding = { agent: string; severity: Severity; page: string; title: string; evidence: string; recommendation: string }
export type AuditContext = {
  baseUrl: string
  outputDir: string
  pages: string[]
  page: Page
  viewport: { name: string; width: number; height: number }
}
export type QaAgent = { name: string; run(context: AuditContext): Promise<Finding[]> }
