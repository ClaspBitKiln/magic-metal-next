import test from 'node:test'
import assert from 'node:assert/strict'
import { periods, safePath, sanitizeRows } from './metrika-report.mjs'

test('default periods contain equal completed relative days', () => {
  assert.deepEqual(periods(), { current: { date1: '28daysAgo', date2: 'yesterday' }, previous: { date1: '56daysAgo', date2: '29daysAgo' }, days: 28 })
})
test('explicit ranges compare equal inclusive periods across leap day', () => {
  assert.deepEqual(periods({ date1: '2024-03-01', date2: '2024-03-02' }), { current: { date1: '2024-03-01', date2: '2024-03-02' }, previous: { date1: '2024-02-28', date2: '2024-02-29' }, days: 2 })
  for (const args of [{ days: 0 }, { days: 1.5 }, { date1: '2026-02-30', date2: '2026-03-01' }, { date1: '2026-03-01' }, { date1: '2026-03-02', date2: '2026-03-01' }]) assert.throws(() => periods(args))
})
test('landing pages omit query, fragment, authority and credentials', () => {
  assert.equal(safePath('https://user:secret@example.org/a?email=private#token'), '/a')
  assert.equal(safePath('/a?token=secret#private'), '/a')
  assert.deepEqual(sanitizeRows([{ dimensions: [{ name: '/a?secret=1' }], metrics: [2] }], true), [{ dimensions: ['/a'], metrics: [2] }])
})

test('API reports use fixed HTTPS GET, keep token out of output, and preserve sampling', async () => {
  const { main } = await import('./metrika-report.mjs')
  const originalFetch = globalThis.fetch, originalLog = console.log
  const previousToken = process.env.YANDEX_METRIKA_TOKEN
  const output = [], calls = []
  process.env.YANDEX_METRIKA_TOKEN = 'offline-test-secret'
  console.log = (value) => output.push(value)
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    assert.equal(new URL(url).origin, 'https://api-metrika.yandex.net')
    assert.equal(init.headers.Authorization, 'OAuth offline-test-secret')
    assert.equal(init.method, undefined) // Fetch default is GET.
    let body
    if (new URL(url).pathname.endsWith('/goals')) body = { goals: [{ id: 10, name: 'request_sent', type: 'action', conditions: [{ url: 'request_sent' }] }] }
    else if (new URL(url).pathname.startsWith('/management/')) body = { counter: { name: 'test', time_zone_name: 'Europe/Moscow' } }
    else body = { query: { date1: '2026-09-19', date2: '2026-10-16' }, totals: [10, 12, 20, 25, 1.6, 40], sampled: true, sample_share: 0.8, data: [] }
    return { ok: true, json: async () => body }
  }
  try {
    await main(['--counter', '123'])
    assert.equal(calls.length, 12)
    const summary = JSON.parse(output.join(''))
    assert.equal(summary.currentQuality.sampled, true)
    assert.equal(summary.requestSentGoalPresent, true)
    assert.equal(output.join('').includes('offline-test-secret'), false)
    assert.equal(calls.some(({ url }) => url.includes('offline-test-secret')), false)
  } finally {
    globalThis.fetch = originalFetch
    console.log = originalLog
    if (previousToken === undefined) delete process.env.YANDEX_METRIKA_TOKEN
    else process.env.YANDEX_METRIKA_TOKEN = previousToken
  }
})
