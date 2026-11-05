import { readFileSync, writeFileSync } from 'node:fs'
const report = JSON.parse(readFileSync('.plan-b/temporary-current/preview-public.json', 'utf8'))
const base = new URL(report.url)
if (base.protocol !== 'https:' || !base.hostname.endsWith('.workers.dev') || base.username || base.password || base.search) throw new Error('Invalid preview origin')
const checks = []
for (const [route, expected] of [['/', 200], ['/produkciya/listovoy-prokat/holodnokatanyj', 200], ['/admin', 404], ['/api/request', 503]]) {
  let result
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(new URL(route, base), { ...(route === '/api/request' ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' } : {}), signal: AbortSignal.timeout(15000) })
      const html = await response.text()
      result = { route, expected, status: response.status, noindex: /noindex/.test(response.headers.get('x-robots-tag') || ''),
        containsDefaultCut: /1500/.test(html), cloudflareError: /error code: (\d{4})/i.exec(html)?.[1] || null }
      if (response.status === expected) break
    } catch { result = { route, expected, status: null, error: 'network-or-timeout' } }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000))
  }
  result.passed = result.status === expected && (expected !== 200 || result.noindex) && (route !== '/produkciya/listovoy-prokat/holodnokatanyj' || result.containsDefaultCut)
  checks.push(result)
}
report.checks = checks
report.verified = checks.every(check => check.passed)
report.checkedAt = new Date().toISOString()
writeFileSync('.plan-b/temporary-current/preview-public.json', JSON.stringify(report, null, 2) + '\n')
for (const check of checks) console.log(JSON.stringify(check))
const status = checks.map(c => `${c.status ?? 'network'}${c.expected === 200 ? '-noindex' + Number(c.noindex) : ''}${c.cloudflareError ? '-CF' + c.cloudflareError : ''}`).join(',')
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `status=${status}\n`, { flag: 'a' })
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `\nPublic smoke (home, sheet, admin, RFQ): ${status}\n`, { flag: 'a' })
if (!report.verified) process.exitCode = 1
