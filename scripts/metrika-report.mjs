#!/usr/bin/env node
/** Read-only Yandex Metrika API client. Never logs credentials or raw API errors. */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const API = 'https://api-metrika.yandex.net'
const METRICS = 'ym:s:users,ym:s:visits,ym:s:pageviews,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds'
const METRIC_NAMES = ['users', 'visits', 'pageviews', 'bounceRatePercent', 'pageDepth', 'avgVisitDurationSeconds']

export function periods({ days = 28, date1, date2 } = {}) {
  if (date1 || date2) {
    const parse = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Both dates must use YYYY-MM-DD.')
      const parsed = new Date(`${value}T00:00:00Z`)
      if (!Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date.')
      return parsed
    }
    const start = parse(date1), end = parse(date2)
    if (start > end) throw new Error('date1 must not exceed date2.')
    const length = (+end - +start) / 86400000 + 1
    const day = (value) => new Date(value).toISOString().slice(0, 10)
    return { current: { date1, date2 }, previous: { date1: day(+start - length * 86400000), date2: day(+start - 86400000) }, days: length }
  }
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('days must be an integer from 1 to 366.')
  return { current: { date1: `${days}daysAgo`, date2: 'yesterday' }, previous: { date1: `${days * 2}daysAgo`, date2: `${days + 1}daysAgo` }, days }
}

export function safePath(value) {
  if (typeof value !== 'string') return value
  // Request paths only: exclude query strings, fragments, authority and credentials.
  try { return new URL(value, 'https://redacted.invalid').pathname } catch { return value.split(/[?#]/, 1)[0] }
}

export function sanitizeRows(data, redactPaths = false) {
  return (data || []).map((row) => ({
    dimensions: (row.dimensions || []).map((item) => redactPaths ? safePath(item.name) : item.name),
    metrics: row.metrics,
  }))
}

function quality(result) {
  return Object.fromEntries(['sampled', 'sample_share', 'sample_size', 'sample_space', 'data_lag', 'total_rows', 'total_rows_rounded'].filter((key) => key in result).map((key) => [key, result[key]]))
}

async function api(path, params, token) {
  const url = new URL(path, API)
  if (params) for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  let response
  try { response = await fetch(url, { headers: { Authorization: `OAuth ${token}` }, redirect: 'error', signal: AbortSignal.timeout(60000) }) }
  catch { throw new Error('Metrika API network request failed; credentials and response content omitted.') }
  if (!response.ok) throw new Error(`Metrika API returned HTTP ${response.status}; check access, counter ID and report availability.`)
  try { return await response.json() } catch { throw new Error('Metrika API returned invalid JSON.') }
}

export async function main(argv = process.argv.slice(2)) {
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (key === '--list-counters') options.list = true
    else if (['--counter', '--days', '--date1', '--date2', '--out'].includes(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) options[key.slice(2)] = argv[++i]
    else throw new Error('Usage: --list-counters OR --counter ID [--days 28 | --date1 YYYY-MM-DD --date2 YYYY-MM-DD] [--out PRIVATE_FILE]')
  }
  const token = process.env.YANDEX_METRIKA_TOKEN?.trim()
  if (!token) throw new Error('Set YANDEX_METRIKA_TOKEN with read-only Metrika access.')
  if (options.list) {
    const counters = []
    let offset = 0
    while (true) {
      const result = await api('/management/v1/counters', { per_page: 100, offset }, token)
      const batch = result.counters || []
      counters.push(...batch.map(({ id, name, site, time_zone_name, create_time }) => ({ id, name, siteHost: (() => { try { return new URL(site.includes('://') ? site : `https://${site}`).hostname } catch { return null } })(), time_zone_name, create_time })))
      offset += batch.length
      if (!batch.length || offset >= (result.rows ?? offset) || batch.length < 100) break
    }
    console.log(JSON.stringify({ counters }, null, 2))
    return
  }
  if (!/^\d+$/.test(options.counter || '')) throw new Error('A numeric --counter ID is required.')
  if (options.days && (options.date1 || options.date2)) throw new Error('Use either days or explicit dates.')
  const ranges = periods({ days: options.days ? Number(options.days) : 28, date1: options.date1, date2: options.date2 })
  const id = options.counter
  const { counter = {} } = await api(`/management/v1/counter/${id}`, null, token)
  const timeZone = counter.time_zone_name || null
  // Relative dates are evaluated by Metrika, avoiding the CLI machine's time zone.
  // Explicit dates must likewise describe completed days in the counter's zone.
  if (options.date2 && timeZone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]))
    const today = `${parts.year}-${parts.month}-${parts.day}`
    if (options.date2 >= today) throw new Error('date2 must be a completed day in the counter time zone.')
  }
  const report = async (range, dimensions, metrics = METRICS, paths = false) => {
    const result = await api('/stat/v1/data', { ids: id, ...range, metrics, ...(dimensions ? { dimensions } : {}), limit: 50, sort: '-ym:s:visits', accuracy: 'full', lang: 'ru' }, token)
    return { period: result.query ? { date1: result.query.date1, date2: result.query.date2 } : range, totals: result.totals, quality: quality(result), ...(dimensions ? { rows: sanitizeRows(result.data, paths) } : {}) }
  }
  const current = await report(ranges.current)
  const previous = await report(ranges.previous)
  const breakdowns = {}
  for (const [name, dimension, paths] of [['sources', 'ym:s:lastTrafficSource', false], ['devices', 'ym:s:deviceCategory', false], ['landingPages', 'ym:s:startURLPath', true]]) {
    try {
      breakdowns[name] = { current: await report(ranges.current, dimension, METRICS, paths), previous: await report(ranges.previous, dimension, METRICS, paths) }
    } catch (error) { breakdowns[name] = { unavailable: error.message } }
  }
  let goals
  try {
    const result = await api(`/management/v1/counter/${id}/goals`, null, token)
    goals = []
    for (const goal of result.goals || []) {
      const event = (goal.conditions || []).some((condition) => condition.url === 'request_sent') || goal.name === 'request_sent'
      const metrics = `ym:s:goal${goal.id}reaches,ym:s:goal${goal.id}users,ym:s:goal${goal.id}conversionRate`
      const goalReport = async (range) => {
        const result = await api('/stat/v1/data', { ids: id, ...range, metrics, accuracy: 'full' }, token)
        return { totals: result.totals, quality: quality(result) }
      }
      try { goals.push({ id: goal.id, name: goal.name, type: goal.type, requestSent: event, metricNames: ['reaches', 'users', 'conversionRatePercent'], current: await goalReport(ranges.current), previous: await goalReport(ranges.previous) }) }
      catch (error) { goals.push({ id: goal.id, name: goal.name, requestSent: event, unavailable: error.message }) }
    }
  } catch (error) { goals = { unavailable: error.message } }
  const comparison = Object.fromEntries(METRIC_NAMES.map((name, index) => {
    const now = current.totals?.[index] ?? null, before = previous.totals?.[index] ?? null
    return [name, { current: now, previous: before, absoluteChange: now === null || before === null ? null : now - before, percentChange: now === null || before === null || before === 0 ? null : (now - before) / before * 100 }]
  }))
  const result = { generatedAt: new Date().toISOString(), counter: { id, name: counter.name, timeZone, createdAt: counter.create_time }, ranges, metricNames: METRIC_NAMES, comparison, current, previous, breakdowns, goals, limitations: ['Counts are measured browsers/devices, not an exact count of people.', 'Historical traffic before counter installation cannot be reconstructed by this API.', 'Robot filtering settings were not changed. No separate robot metric was requested; do not call these verified human-only counts.', 'accuracy=full is requested; inspect quality.sampled and sample_share. Data lag is recorded only when returned by the API.', 'Breakdowns contain at most 50 rows per period; totals include the complete API report.', 'Landing-page paths exclude query strings and fragments. Goals do not prove lead quality or completed sales.', 'For explicit dates, use completed days in the counter time zone; if no time zone metadata is returned, completion cannot be verified.'] }
  if (options.out) {
    const target = resolve(options.out)
    await mkdir(dirname(target), { recursive: true, mode: 0o700 })
    await writeFile(target, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 })
  }
  console.log(JSON.stringify({ counter: id, timeZone, ranges, comparison, currentQuality: current.quality, previousQuality: previous.quality, requestSentGoalPresent: Array.isArray(goals) ? goals.some((goal) => goal.requestSent) : null, reportWritten: Boolean(options.out) }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
