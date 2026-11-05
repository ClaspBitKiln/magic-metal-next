import assert from 'node:assert/strict'
const base = new URL(process.env.PREVIEW_URL)
assert(base.protocol === 'https:' && base.hostname.endsWith('.workers.dev') && !base.username && !base.password && !base.search)
for (const route of ['/', '/produkciya/listovoy-prokat/holodnokatanyj']) {
  const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
  const html = await response.text()
  assert(html.includes('1500') || route === '/')
}
const admin = await fetch(new URL('/admin', base)); assert.equal(admin.status, 404)
// Empty JSON is intercepted by the preview wrapper; no email binding exists.
const rfq = await fetch(new URL('/api/request', base), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
assert.equal(rfq.status, 503)
console.log('Public pages, noindex, admin block and RFQ-disabled policy verified.')
