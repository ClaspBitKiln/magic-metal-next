import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync(new URL('../public/home-static.html', import.meta.url), 'utf8')
const base = process.env.CATALOG_BASE_URL || 'https://magicmet.ru'
const rows = [...html.matchAll(/<details class="catalog-item">([\s\S]*?)<\/details>/g)].map((match, index) => {
  const row = match[1]
  const title = row.match(/<strong><span[^>]*><\/span>([^<]+)<\/strong>/)?.[1]
  const href = row.match(/<a href="([^"]+)"/)?.[1]
  if (!title || !href) throw new Error('Missing title/link in catalog row ' + (index + 1))
  return { index: index + 1, title, href }
})

if (rows.length < 56) throw new Error('Public catalog unexpectedly shrank: ' + rows.length + ' rows (minimum 56)')

const results = []
let cursor = 0
async function worker() {
  while (cursor < rows.length) {
    const row = rows[cursor++]
    const url = new URL(row.href.split('#')[0], base).href
    let status = 0
    let error = ''
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
      status = response.status
      if (response.ok) {
        const body = await response.text()
        if (body.includes('<title>Login - Vercel</title>')) error = 'unexpected deployment login'
      }
    } catch (cause) {
      error = String(cause instanceof Error ? cause.message : cause)
    }
    results.push({ ...row, url, status, error })
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()))
results.sort((a, b) => a.index - b.index)
const failed = results.filter((row) => row.status !== 200 || row.error)

const markdown = [
  '# MagicMetal — live catalog link audit',
  '',
  'Base: ' + base,
  'Checked: ' + new Date().toISOString(),
  'Result: ' + (rows.length - failed.length) + '/' + rows.length + ' HTTP 200.',
  '',
  '| # | Product | HTTP | URL | Issue |',
  '|---:|---|---:|---|---|',
  ...results.map((r) => '| ' + r.index + ' | ' + r.title.replaceAll('|', '/') + ' | ' + r.status + ' | ' + r.url + ' | ' + (r.error || '—') + ' |'),
].join('\n')
writeFileSync('catalog-live-audit.md', markdown + '\n')
console.log('Catalog live audit: ' + (rows.length - failed.length) + '/' + rows.length + ' OK')
for (const row of failed) console.error('FAIL', row.index, row.title, row.status, row.url, row.error)
if (failed.length) process.exitCode = 1
