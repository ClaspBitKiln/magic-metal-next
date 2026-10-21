#!/usr/bin/env node
/** Minimal, idempotent Management API setup; no writes without --apply. */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
export const GOALS = Object.freeze(['phone_click', 'email_click', 'request_click', 'catalog_product_opened', 'standard_opened', 'size_filter_used', 'size_selected', 'request_started', 'specification_attached', 'request_sent', 'request_error'])

export function isTargetCounter(counter) {
  if (counter.status === 'Deleted') return false
  const value = counter.site2?.site || counter.site || ''
  try { return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, '') === 'magicmet.ru' } catch { return false }
}
export function matchingGoal(goal, name) {
  return goal.type === 'action' && goal.conditions?.length === 1 && goal.conditions[0].type === 'exact' && goal.conditions[0].url === name
}

export async function setup({ token, apply = false, counterId, fetchImpl = fetch } = {}) {
  if (!token?.trim()) throw new Error('Set YANDEX_METRIKA_SETUP_TOKEN with metrika:write access. No requests made.')
  if (counterId && !/^\d+$/.test(String(counterId))) throw new Error('counter must be a numeric ID.')
  const api = async (path, method = 'GET', body) => {
    if (method !== 'GET' && !apply) throw new Error('Write blocked without --apply.')
    const url = new URL(path, 'https://api-metrika.yandex.net')
    if (url.origin !== 'https://api-metrika.yandex.net') throw new Error('Invalid API origin.')
    let response
    try { response = await fetchImpl(url, { method, headers: { Authorization: `OAuth ${token.trim()}`, ...(body ? { 'content-type': 'application/json' } : {}) }, redirect: 'error', signal: AbortSignal.timeout(60000), ...(body ? { body: JSON.stringify(body) } : {}) }) }
    catch { throw new Error('Metrika API network request failed; secret values omitted. Rerun dry-run to inspect state before retrying writes.') }
    if (!response.ok) throw new Error(`Metrika API returned HTTP ${response.status}; no raw error body or token is printed.`)
    try { return await response.json() } catch { throw new Error('Invalid Metrika API JSON. Inspect state with dry-run before retrying writes.') }
  }
  let counter
  if (counterId) {
    counter = (await api(`/management/v1/counter/${counterId}`)).counter
    if (!counter || !isTargetCounter(counter)) throw new Error('Specified counter is not an active magicmet.ru counter; no writes made.')
  } else {
    const candidates = []
    let offset = 0
    while (true) {
      const result = await api(`/management/v1/counters?per_page=100&offset=${offset}`)
      const batch = result.counters || []
      candidates.push(...batch.filter(isTargetCounter))
      offset += batch.length
      if (!batch.length || batch.length < 100 || (typeof result.rows === 'number' && offset >= result.rows)) break
    }
    if (candidates.length > 1) throw new Error(`Multiple magicmet.ru counters found: ${candidates.map(({ id }) => id).join(', ')}. Repeat with --counter ID; no writes made.`)
    counter = candidates[0]
  }
  let counterStatus = counter ? 'reused' : 'would-create'
  if (!counter && apply) {
    const result = await api('/management/v1/counters', 'POST', { counter: { name: 'magicmet.ru', site2: { site: 'magicmet.ru' }, type: 'simple', time_zone_name: 'Asia/Yekaterinburg' } })
    counter = result.counter
    if (!counter?.id || !isTargetCounter(counter)) throw new Error('Counter creation response could not be verified. Inspect existing counters before retrying.')
    counterStatus = 'created'
  }
  if (!counter) return { counterId: null, counterStatus, goals: GOALS.map((name) => ({ name, status: 'would-create' })) }
  const goals = (await api(`/management/v1/counter/${counter.id}/goals`)).goals || []
  // Resolve all conflicts before creating any goals. Existing settings are never overwritten.
  const plan = GOALS.map((name) => {
    const matching = goals.filter((goal) => matchingGoal(goal, name))
    if (matching.length > 1) throw new Error(`Duplicate exact goals for ${name}; no goals changed.`)
    if (!matching.length && goals.some((goal) => goal.name === name)) throw new Error(`Goal name conflict for ${name}; no goals changed.`)
    return { name, status: matching.length ? 'exists' : 'would-create' }
  })
  if (apply) for (const item of plan) {
    if (item.status === 'exists') continue
    await api(`/management/v1/counter/${counter.id}/goals`, 'POST', { goal: { name: item.name, type: 'action', conditions: [{ type: 'exact', url: item.name }] } })
    item.status = 'created'
  }
  if (apply) {
    const verified = (await api(`/management/v1/counter/${counter.id}/goals`)).goals || []
    if (!GOALS.every((name) => verified.some((goal) => matchingGoal(goal, name)))) throw new Error('Goal verification incomplete; rerun dry-run to inspect before retrying.')
  }
  return { counterId: counter.id, counterStatus, goals: plan }
}

export async function main(argv = process.argv.slice(2)) {
  let apply = false, counterId
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') apply = true
    else if (argv[i] === '--counter' && /^\d+$/.test(argv[i + 1] || '')) counterId = argv[++i]
    else throw new Error('Usage: node scripts/metrika-setup.mjs [--counter ID] [--apply]')
  }
  console.log(JSON.stringify(await setup({ token: process.env.YANDEX_METRIKA_SETUP_TOKEN, apply, counterId }), null, 2))
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1 })
