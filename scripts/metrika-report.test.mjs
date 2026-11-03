import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    assert.equal(calls.length, 20)
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


test('non-robot segment applies equally to visits, breakdowns and goals without management writes', async () => {
  const { main } = await import('./metrika-report.mjs')
  const originalFetch = globalThis.fetch, originalLog = console.log, token = process.env.YANDEX_METRIKA_TOKEN
  const calls = [], output = []
  process.env.YANDEX_METRIKA_TOKEN = 'offline-test-secret'
  console.log = value => output.push(value)
  globalThis.fetch = async (url, init) => {
    url = new URL(url); calls.push({ url, init })
    const body = url.pathname.endsWith('/goals') ? { goals: [{ id: 10, name: 'request_sent', type: 'action', conditions: [{ url: 'request_sent' }] }] }
      : url.pathname.startsWith('/management/') ? { counter: { name: 'test' } }
      : { totals: [2, 3, 4, 5, 6, 7], sampled: false, sample_share: 1, data: [] }
    return { ok: true, json: async () => body }
  }
  try {
    await main(['--counter', '123', '--days', '7', '--exclude-robots'])
    const stats = calls.filter(({ url }) => url.pathname.startsWith('/stat/'))
    assert.equal(stats.length, 18)
    for (const { url, init } of calls) {
      assert.equal(init.method, undefined)
      assert.equal(url.searchParams.get('filters'), url.pathname.startsWith('/stat/') ? "ym:s:isRobot=='no'" : null)
    }
    assert.equal(JSON.parse(output[0]).segment, 'metrika_non_robot')
    assert.equal(output.join('').includes('offline-test-secret'), false)
  } finally {
    globalThis.fetch = originalFetch; console.log = originalLog
    if (token === undefined) delete process.env.YANDEX_METRIKA_TOKEN; else process.env.YANDEX_METRIKA_TOKEN = token
  }
})

test('popular and exit pages compare complete URL paths with correct metrics, sort and optional robot segment', async () => {
  const { main } = await import('./metrika-report.mjs')
  const originalFetch = globalThis.fetch, originalLog = console.log, token = process.env.YANDEX_METRIKA_TOKEN
  const directory = await mkdtemp(join(tmpdir(), 'metrika-breakdowns-'))
  process.env.YANDEX_METRIKA_TOKEN = 'offline-test-secret'
  const output = []
  console.log = value => output.push(value)
  try {
    for (const excludeRobots of [false, true]) {
      const calls = []
      globalThis.fetch = async (input, init) => {
        const url = new URL(input)
        calls.push({ url, init })
        const dimension = url.searchParams.get('dimensions')
        let body
        if (url.pathname.endsWith('/goals')) body = { goals: [] }
        else if (url.pathname.startsWith('/management/')) body = { counter: { name: 'test' } }
        else {
          const pageviews = url.searchParams.get('metrics').startsWith('ym:pv:')
          const totals = pageviews ? [20, 10] : [10, 12, 20, 25, 1.6, 40]
          body = {
            query: { date1: url.searchParams.get('date1'), date2: url.searchParams.get('date2') },
            totals, sampled: false, sample_share: 1,
            data: dimension ? [{ dimensions: [{ name: dimension.includes('Path') ? 'https://user:secret@example.org/produkciya/sortovoy-i-fasonny-prokat/ugolok?email=private#token' : 'organic' }], metrics: pageviews ? [5, 4] : totals }] : [],
          }
        }
        return { ok: true, json: async () => body }
      }
      const target = join(directory, `report-${excludeRobots}.json`)
      await main(['--counter', '123', '--days', '7', '--out', target, ...(excludeRobots ? ['--exclude-robots'] : [])])
      const report = JSON.parse(await readFile(target, 'utf8'))
      const statCalls = calls.filter(({ url }) => url.pathname === '/stat/v1/data')
      const popular = statCalls.filter(({ url }) => url.searchParams.get('dimensions') === 'ym:pv:URLPath')
      const exits = statCalls.filter(({ url }) => url.searchParams.get('dimensions') === 'ym:s:endURLPath')
      assert.equal(popular.length, 2)
      assert.equal(exits.length, 2)
      for (const group of [popular, exits]) {
        assert.deepEqual(group.map(({ url }) => [url.searchParams.get('date1'), url.searchParams.get('date2')]), [['7daysAgo', 'yesterday'], ['14daysAgo', '8daysAgo']])
      }
      for (const { url } of popular) {
        assert.equal(url.searchParams.get('metrics'), 'ym:pv:pageviews,ym:pv:users')
        assert.equal(url.searchParams.get('sort'), '-ym:pv:pageviews')
      }
      for (const { url } of exits) {
        assert.equal(url.searchParams.get('metrics'), 'ym:s:users,ym:s:visits,ym:s:pageviews,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds')
        assert.equal(url.searchParams.get('sort'), '-ym:s:visits')
      }
      for (const { url, init } of statCalls) {
        assert.equal(url.searchParams.get('filters'), excludeRobots ? "ym:s:isRobot=='no'" : null)
        assert.equal(init.method, undefined)
      }
      assert.equal(report.segment, excludeRobots ? 'metrika_non_robot' : 'all_traffic')
      assert.deepEqual(report.breakdowns.popularPages.metricNames, ['pageviews', 'users'])
      assert.deepEqual(report.breakdowns.popularPages.current.pageviewCoverage, { listed: 5, total: 20, complete: false })
      assert.deepEqual(report.breakdowns.exitPages.metricNames, report.metricNames)
      assert.deepEqual(report.breakdowns.sources.metricNames, report.metricNames)
      assert.ok(statCalls.some(({ url }) => url.searchParams.get('dimensions') === 'ym:s:regionCountryName'))
      assert.ok(statCalls.some(({ url }) => url.searchParams.get('dimensions') === 'ym:s:regionAreaName'))
      for (const breakdown of [report.breakdowns.popularPages, report.breakdowns.exitPages]) {
        for (const range of ['current', 'previous']) {
          assert.deepEqual(breakdown[range].rows[0].dimensions, ['/produkciya/sortovoy-i-fasonny-prokat/ugolok'])
          assert.equal(breakdown[range].quality.sampled, false)
        }
      }
      assert.equal(JSON.stringify(report.breakdowns).includes('email=private'), false)
      assert.equal(JSON.stringify(report.breakdowns).includes('user:secret'), false)
    }
    assert.equal(output.join('').includes('offline-test-secret'), false)
  } finally {
    globalThis.fetch = originalFetch; console.log = originalLog
    if (token === undefined) delete process.env.YANDEX_METRIKA_TOKEN; else process.env.YANDEX_METRIKA_TOKEN = token
    await rm(directory, { recursive: true, force: true })
  }
})
