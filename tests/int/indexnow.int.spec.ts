// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { config, prepareSubmission, submitIndexNow } from '../../scripts/growth/indexnow.mjs'

const urls = ['https://magicmet.ru/postavki/kazakhstan', 'https://magicmet.ru/postavki/uzbekistan']
const temporary: string[] = []
async function receipt() {
  const dir = await mkdtemp(join(tmpdir(), 'magicmet-indexnow-'))
  temporary.push(dir)
  return join(dir, 'receipt.json')
}
function network(status = 200, retryAfter?: string) {
  return vi.fn(async (input: string, options?: RequestInit) => {
    expect(options?.redirect).toBe('error')
    if (input === config.keyLocation) return new Response(config.key + '\n', { status: 200 })
    if (input === config.endpoint) return new Response(null, { status, headers: retryAfter ? { 'retry-after': retryAfter } : {} })
    return new Response('<html>Public page</html>', { status: 200 })
  })
}
afterEach(async () => { await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true }))) })

describe('bounded owner-authorized IndexNow indexing', () => {
  it('defaults to dry-run without network and deduplicates canonical URLs', async () => {
    const fetch = network()
    const result = await submitIndexNow(prepareSubmission([urls[1], urls[0], urls[0]], 'release1'), { fetchImpl: fetch })
    expect(result).toEqual({ status: 'dry_run', urlCount: 2, urls, revision: 'release1' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    'http://magicmet.ru/', 'https://www.magicmet.ru/', 'https://foreign.invalid/postavki/kazakhstan',
    'https://user:password@magicmet.ru/', 'https://magicmet.ru/?email=private',
    'https://magicmet.ru/#request', 'https://magicmet.ru/api/request',
    'https://magicmet.ru/admin/', 'https://magicmet.ru/produkciya/%2fapi',
  ])('rejects private, foreign or noncanonical input without exposing it: %s', value => {
    expect(() => prepareSubmission([value])).toThrow('Only canonical public')
  })

  it('bounds batches and revision identifiers', () => {
    expect(() => prepareSubmission([])).toThrow('1–100')
    expect(() => prepareSubmission(Array(101).fill(urls[0]))).toThrow('1–100')
    expect(() => prepareSubmission(urls, 'new\nline')).toThrow('Revision')
  })

  it('does not POST when the published key proof is absent or wrong', async () => {
    for (const response of [new Response('wrong key'), new Response('', { status: 404 })]) {
      const fetch = vi.fn(async () => response)
      await expect(submitIndexNow(prepareSubmission(urls), { submit: true, fetchImpl: fetch, receiptPath: await receipt() })).rejects.toThrow('No URLs submitted')
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(config.keyLocation, expect.not.objectContaining({ method: 'POST' }))
    }
  })

  it('does not POST when any target URL is unavailable', async () => {
    const fetch = vi.fn(async (input: string) => input === config.keyLocation ? new Response(config.key) : new Response('', { status: 404 }))
    await expect(submitIndexNow(prepareSubmission(urls), { submit: true, fetchImpl: fetch, receiptPath: await receipt() })).rejects.toThrow('No URLs submitted')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it.each([[200, 'accepted'], [202, 'verification_pending']])('stores HTTP %i as %s, never as confirmed indexing', async (status, expected) => {
    const path = await receipt()
    const fetch = network(Number(status))
    const plan = prepareSubmission(urls, 'release1')
    const result = await submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })
    expect(result.status).toBe(expected)
    expect(result.indexingConfirmed).toBe(false)
    const post = fetch.mock.calls.find(([, options]) => options?.method === 'POST')!
    expect(post[0]).toBe('https://api.indexnow.org/indexnow')
    expect(JSON.parse(post[1]!.body as string)).toEqual(plan.payload)
    const saved = JSON.parse(await readFile(path, 'utf8'))
    expect(saved.fingerprint).toBe(plan.fingerprint)
    expect((await stat(path)).mode & 0o777).toBe(0o600)
    fetch.mockClear()
    expect((await submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })).status).toBe('already_submitted')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('records a rate limit and Retry-After without retries', async () => {
    const fetch = network(429, '120')
    const path = await receipt()
    const plan = prepareSubmission(urls)
    const result = await submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })
    expect(result).toMatchObject({ status: 'rate_limited', httpStatus: 429, retryAfter: '120', indexingConfirmed: false })
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1)
    fetch.mockClear()
    expect((await submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })).status).toBe('retry_later')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves an ambiguous POST outcome and prevents a blind duplicate', async () => {
    const path = await receipt()
    const plan = prepareSubmission(urls)
    const fetch = network()
    fetch.mockImplementation(async input => {
      if (input === config.endpoint) throw new Error('private network diagnostic')
      return new Response(input === config.keyLocation ? config.key : '<html>ok</html>')
    })
    await expect(submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })).rejects.toThrow('Unknown IndexNow submission outcome')
    expect(JSON.parse(await readFile(path, 'utf8')).status).toBe('outcome_unknown')
    fetch.mockClear()
    expect((await submitIndexNow(plan, { submit: true, fetchImpl: fetch, receiptPath: path })).status).toBe('outcome_unknown')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps receipts out of public Git before starting any network call', async () => {
    const fetch = network()
    await expect(submitIndexNow(prepareSubmission(urls), { submit: true, fetchImpl: fetch, receiptPath: resolve('indexnow-private-receipt.json') })).rejects.toThrow('outside the repository')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('matches the committed public proof file with the configured key', async () => {
    expect((await readFile(resolve('public', config.key + '.txt'), 'utf8')).trim()).toBe(config.key)
  })
})
