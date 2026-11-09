#!/usr/bin/env node
/** Manual, bounded IndexNow submission. No visitors, accounts, email or recurring jobs. */
import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile, chmod, open, unlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const moduleDirectory = import.meta.dirname || dirname(fileURLToPath(import.meta.url))
export const config = Object.freeze(JSON.parse(readFileSync(resolve(moduleDirectory, 'indexnow-config.json'), 'utf8')))
const repository = resolve(moduleDirectory, '../..')
const defaultState = process.env.MAGICMET_GROWTH_STATE_DIR || '/workspace/.cloud/magic-metal/growth'
const publicPath = /^\/(?:$|(?:produkciya|spravochnik-materialov|spravochnik-gost|postavki)(?:\/|$))/

export function prepareSubmission(urls, revision = '') {
  if (!Array.isArray(urls) || !urls.length || urls.length > 100) throw new Error('Provide 1–100 public canonical URLs.')
  if (typeof revision !== 'string' || !/^[a-zA-Z0-9_.-]{0,80}$/.test(revision)) throw new Error('Revision must be an optional short release identifier.')
  const canonical = urls.map(value => {
    let url
    try { url = new URL(value) } catch { throw new Error('Invalid URL; use a complete canonical HTTPS address.') }
    if (url.origin !== `https://${config.host}` || url.username || url.password || url.search || url.hash
      || !/^\/[a-zA-Z0-9/._-]*$/.test(url.pathname) || url.pathname.includes('//') || !publicPath.test(url.pathname)) {
      throw new Error('Only canonical public magicmet.ru pages without credentials, query or fragment are allowed.')
    }
    return url.href
  })
  const urlList = [...new Set(canonical)].sort()
  const payload = { host: config.host, key: config.key, keyLocation: config.keyLocation, urlList }
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...payload, revision })).digest('hex')
  return { payload, revision, fingerprint }
}

function privateReceipt(target, fingerprint) {
  const path = resolve(target || defaultState, target ? '' : `indexnow/${fingerprint}.json`)
  const rel = relative(repository, path)
  if (!rel || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error('Receipt must be outside the repository; do not publish operation history.')
  return path
}

async function fetchChecked(fetchImpl, url, options = {}) {
  try { return await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(20000), ...options }) }
  catch { throw new Error('HTTPS request failed; no submission was retried. Network details withheld.') }
}

export async function submitIndexNow(plan, { submit = false, fetchImpl = globalThis.fetch, receiptPath } = {}) {
  // Revalidate input rather than trusting an object loaded from another file.
  const verified = prepareSubmission(plan?.payload?.urlList, plan?.revision)
  if (!submit) return { status: 'dry_run', urlCount: verified.payload.urlList.length, urls: verified.payload.urlList, revision: verified.revision }
  const receipt = privateReceipt(receiptPath, verified.fingerprint)
  await mkdir(dirname(receipt), { recursive: true, mode: 0o700 })
  let previous
  try { previous = JSON.parse(await readFile(receipt, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw new Error('Existing receipt is unreadable; preserve it and choose a new receipt path.') }
  if (previous?.fingerprint === verified.fingerprint && ['accepted', 'verification_pending'].includes(previous.status)) {
    return { status: 'already_submitted', previousStatus: previous.status, urlCount: verified.payload.urlList.length, receipt }
  }
  if (previous?.fingerprint === verified.fingerprint && ['submitting', 'outcome_unknown'].includes(previous.status)) {
    return { status: 'outcome_unknown', urlCount: verified.payload.urlList.length, receipt }
  }
  if (previous?.fingerprint === verified.fingerprint && previous.status === 'rate_limited' && Date.parse(previous.retryAt) > Date.now()) {
    return { status: 'retry_later', retryAt: previous.retryAt, receipt }
  }
  let lock
  try { lock = await open(receipt + '.lock', 'wx', 0o600) }
  catch { throw new Error('Submission is already running or a previous lock remains; inspect it before retrying.') }
  try {
    const keyResponse = await fetchChecked(fetchImpl, config.keyLocation)
    if (keyResponse.status !== 200 || (await keyResponse.text()).trim() !== config.key) throw new Error('Published key proof is not available or does not match. No URLs submitted.')
    for (const url of verified.payload.urlList) {
      const response = await fetchChecked(fetchImpl, url)
      if (response.status !== 200) throw new Error('A target page is not HTTP 200. No URLs submitted.')
      await response.body?.cancel()
    }
    const baseRecord = { recordedAt: new Date().toISOString(), fingerprint: verified.fingerprint, revision: verified.revision, urlCount: verified.payload.urlList.length, urls: verified.payload.urlList, indexingConfirmed: false }
    // Persist intent first: a killed process or lost POST response must not cause an automatic duplicate.
    await writeFile(receipt, JSON.stringify({ ...baseRecord, status: 'submitting' }, null, 2) + '\n', { mode: 0o600 })
    await chmod(receipt, 0o600)
    let response
    try {
      response = await fetchChecked(fetchImpl, config.endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(verified.payload),
      })
    } catch {
      await writeFile(receipt, JSON.stringify({ ...baseRecord, status: 'outcome_unknown' }, null, 2) + '\n', { mode: 0o600 })
      throw new Error('Unknown IndexNow submission outcome; inspect the private receipt before any resubmission.')
    }
    const status = response.status === 200 ? 'accepted' : response.status === 202 ? 'verification_pending' : response.status === 429 ? 'rate_limited' : 'rejected'
    const retryAfter = response.headers.get('retry-after')?.slice(0, 100) || null
    const delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : retryAfter ? Date.parse(retryAfter) - Date.now() : 3600000
    const retryAt = status === 'rate_limited' ? new Date(Date.now() + Math.max(1000, Number.isFinite(delay) ? delay : 3600000)).toISOString() : null
    const record = { ...baseRecord, status, httpStatus: response.status, retryAfter, retryAt }
    await writeFile(receipt, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 })
    await chmod(receipt, 0o600)
    return { ...record, receipt }
  } finally { await lock.close(); await unlink(receipt + '.lock') }
}

export async function main(argv = process.argv.slice(2)) {
  let submit = false, revision = '', receiptPath
  const urls = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--submit') submit = true
    else if (['--revision', '--receipt'].includes(arg) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      if (arg === '--revision') revision = argv[++i]
      else receiptPath = argv[++i]
    } else if (arg.startsWith('--')) throw new Error('Usage: indexnow.mjs [--submit] [--revision RELEASE] [--receipt PRIVATE_FILE] <canonical URL> ...')
    else urls.push(arg)
  }
  const result = await submitIndexNow(prepareSubmission(urls, revision), { submit, receiptPath })
  console.log(JSON.stringify(result, null, 2))
  if (['rejected', 'rate_limited', 'retry_later', 'outcome_unknown'].includes(result.status)) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
