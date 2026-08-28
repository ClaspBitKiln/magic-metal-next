import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Finding } from './types'

export const ensureDir = (directory: string) => mkdir(directory, { recursive: true })
export const absoluteUrl = (baseUrl: string, pathname: string) => new URL(pathname, baseUrl).toString()
export const finding = (agent: string, severity: Finding['severity'], page: string, title: string, evidence: string, recommendation: string): Finding => ({ agent, severity, page, title, evidence, recommendation })

export async function writeReport(outputDir: string, findings: Finding[]) {
  await ensureDir(outputDir)
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  findings.sort((a, b) => order[a.severity] - order[b.severity])
  await writeFile(path.join(outputDir, 'report.json'), JSON.stringify(findings, null, 2))
  const counts = ['critical', 'high', 'medium', 'low'].map((severity) => `${severity}: ${findings.filter((item) => item.severity === severity).length}`).join(' · ')
  const rows = findings.length
    ? findings.map((item) => `| ${item.severity} | ${item.agent} | ${item.page} | ${item.title} | ${item.evidence.replaceAll('|', '\\|')} |`).join('\n')
    : '| — | — | — | Нарушений не найдено | — |'
  await writeFile(path.join(outputDir, 'report.md'), `# Magic Metal QA\n\n${counts}\n\n| Приоритет | Агент | Страница | Проблема | Доказательство |\n|---|---|---|---|---|\n${rows}\n`)
}
