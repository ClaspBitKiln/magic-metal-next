import { chromium } from '@playwright/test'
import path from 'node:path'
import { accessibilityAgent } from './agents/accessibility-agent'
import { contentAgent } from './agents/content-agent'
import { e2eAgent } from './agents/e2e-agent'
import { performanceAgent } from './agents/performance-agent'
import { visualAgent } from './agents/visual-agent'
import { loadPages, priorityPages, viewports } from './config'
import type { Finding } from './types'
import { ensureDir, writeReport } from './utils'

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3000'
const outputDir = path.resolve(process.env.QA_OUTPUT_DIR || 'qa-results')
const pages = await loadPages(baseUrl)
const visualPages = priorityPages
const agents = [visualAgent, e2eAgent, accessibilityAgent, performanceAgent, contentAgent]
const browser = await chromium.launch({ headless: true })
const findings: Finding[] = []
await ensureDir(outputDir)

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    for (const agent of agents) {
      if (viewport.name !== 'desktop' && agent !== visualAgent) continue
      process.stdout.write(`[${viewport.name}] ${agent.name}... `)
      try {
        const found = await agent.run({ baseUrl, outputDir, pages, visualPages, page, viewport })
        findings.push(...found)
        console.log(`${found.length} замечаний`)
      } catch (error) {
        findings.push({ agent: agent.name, severity: 'critical', page: baseUrl, title: 'Агент не завершил проверку', evidence: error instanceof Error ? error.message : String(error), recommendation: 'Проверить сайт и окружение Playwright.' })
        console.log('ошибка')
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}

await writeReport(outputDir, findings)
const blocking = findings.filter((item) => item.severity === 'critical' || item.severity === 'high')
console.log(`\nОтчёт: ${path.join(outputDir, 'report.md')}`)
console.log(`Проверено маршрутов sitemap: ${pages.length}`)
console.log(`Всего замечаний: ${findings.length}; критичных/высоких: ${blocking.length}`)
process.exitCode = blocking.length ? 1 : 0
