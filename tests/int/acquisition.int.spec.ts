import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, stat, writeFile, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  stateDirectory, initialize, loadPlatforms, plan, draft, record,
  addLead, moveLead, statistics, trackingUrl, validateProfile,
} from '../../scripts/growth/acquisition.mjs'

let temp: string
let state: string
beforeEach(async () => {
  temp = await mkdtemp(join(tmpdir(), 'magicmet-acquisition-'))
  state = await stateDirectory(join(temp, 'private'))
})
afterEach(async () => { await rm(temp, { recursive: true, force: true }) })

describe('local acquisition workbench', () => {
  it('preserves an existing company profile and private task state on repeated initialization', async () => {
    expect(await initialize(state, { name: 'Approved company' })).toEqual({ initialized: true })
    const before = await readFile(join(state, 'state.json'), 'utf8')
    expect(await initialize(state, { name: 'A different company' })).toEqual({ initialized: false })
    expect(await readFile(join(state, 'state.json'), 'utf8')).toBe(before)
    const profile = JSON.parse(before).profile
    expect(profile.name).toBe('Approved company')
    expect(profile).not.toHaveProperty('address')
    expect(profile).not.toHaveProperty('taxId')
    if (process.platform !== 'win32') {
      expect((await stat(join(state, 'state.json'))).mode & 0o777).toBe(0o600)
      expect((await stat(state)).mode & 0o777).toBe(0o700)
    }
  })

  it('rejects state inside the public worktree, including dot-dot-like directory names and symlinks', async () => {
    const publicPath = resolve(`..acquisition-private-${Date.now()}`)
    await mkdir(publicPath)
    try {
      await expect(stateDirectory(publicPath)).rejects.toThrow('outside the public repository')
      const link = join(temp, 'linked-worktree')
      await symlink(publicPath, link, 'dir')
      await expect(stateDirectory(link)).rejects.toThrow('outside the public repository')
    } finally { await rm(publicPath, { recursive: true, force: true }) }
  })

  it('does not accept credential-like profile fields or non-HTTPS/userinfo URLs', () => {
    expect(() => validateProfile({ apiToken: 'PRIVATE-TOKEN' })).toThrow('unsupported fields')
    expect(() => validateProfile({ website: 'https://name:password@magicmet.ru' })).toThrow()
    expect(() => trackingUrl('javascript:alert(1)', 'RF', 'site')).toThrow()
    expect(() => trackingUrl('https://magicmet.ru', 'UNKNOWN', 'site')).toThrow()
    expect(() => trackingUrl('https://magicmet.ru', 'UZ', '../private')).toThrow()
  })

  it('builds market-specific campaign links while discarding private query content', () => {
    const url = new URL(trackingUrl('https://magicmet.ru/?email=PRIVATE&product=PRIVATE', 'KZ', 'flagma-kz'))
    expect(url.pathname).toBe('/postavki/kazakhstan')
    expect([...url.searchParams.entries()]).toEqual([
      ['utm_source', 'flagma-kz'], ['utm_medium', 'directory'], ['utm_campaign', 'rf_cis_kz'],
    ])
    expect(url.href).not.toContain('PRIVATE')
    expect(new URL(trackingUrl('https://magicmet.ru', 'UZ', 'prom-uz')).pathname).toBe('/postavki/uzbekistan')
  })

  it('prepares a draft once, preserves manual edits and never reports a registration as completed', async () => {
    await initialize(state)
    const platforms = await loadPlatforms()
    const first = await draft(state, platforms, 'prom-uz', 'UZ')
    expect(first.prepared).toBe(true)
    expect((await draft(state, platforms, 'prom-uz', 'UZ')).prepared).toBe(false)
    expect((await plan(state, platforms, 'UZ')).find(p => p.platform === 'prom-uz')?.state).toBe('planned')
    const content = await readFile(first.file, 'utf8')
    expect(content).toContain('НЕ опубликовано')
    expect(content).toContain('utm_source=prom-uz')
    await writeFile(first.file, 'Manual company edits', { mode: 0o600 })
    await expect(draft(state, platforms, 'prom-uz', 'UZ')).rejects.toThrow('preserve')
    expect(await readFile(first.file, 'utf8')).toBe('Manual company edits')
    expect((await statistics(state)).verifiedRegistrations).toBe(0)
  })

  it('requires explicit evidence for publication and rejects cross-platform links, query secrets and ineligible free listings', async () => {
    await initialize(state)
    const platforms = await loadPlatforms()
    await expect(record(state, platforms, 'prom-uz', 'UZ', 'published_verified', 'https://www.prom.uz/company/example', false)).rejects.toThrow('confirmation')
    await expect(record(state, platforms, 'prom-uz', 'UZ', 'published_verified', 'https://attacker.invalid/company/example', true)).rejects.toThrow('platform domain')
    await expect(record(state, platforms, 'prom-uz', 'UZ', 'submitted', 'https://www.prom.uz/company/example?token=PRIVATE', true)).rejects.toThrow('platform domain')
    await expect(record(state, platforms, 'goldenpages-uz', 'UZ', 'submitted', 'https://www.goldenpages.uz/company/example', true)).rejects.toThrow('excluded')
    await record(state, platforms, 'prom-uz', 'UZ', 'published_verified', 'https://www.prom.uz/company/example', true)
    await record(state, platforms, 'prom-uz', 'UZ', 'published_verified', 'https://www.prom.uz/company/example', true)
    expect((await statistics(state)).verifiedRegistrations).toBe(1)
    expect(JSON.parse(await readFile(join(state, 'state.json'), 'utf8')).tasks['prom-uz:UZ'].evidenceType).toBe('owner_confirmed')
  })

  it('counts a shared international account once while keeping its regional placement tasks separate', async () => {
    await initialize(state)
    const platforms = await loadPlatforms()
    const evidence = 'https://kz.all.biz/company/example'
    await record(state, platforms, 'allbiz', 'RF', 'published_verified', evidence, true)
    await record(state, platforms, 'allbiz', 'KZ', 'published_verified', evidence, true)
    const stats = await statistics(state)
    expect(stats.tasks.published_verified).toBe(2)
    expect(stats.verifiedPlacements).toBe(2)
    expect(stats.verifiedRegistrations).toBe(1)
    expect(stats.limitation).toContain('not independently verified accounts')
  })

  it('deduplicates private leads and enforces the qualification/proposal/deal sequence', async () => {
    await initialize(state)
    const input = { reference: 'RFQ-TEST-1', company: 'PRIVATE COMPANY', contact: 'private@example.invalid', request: 'PRIVATE SPECIFICATION', market: 'KZ' }
    const first = await addLead(state, input)
    expect(first.added).toBe(true)
    expect((await addLead(state, { ...input, request: 'A changed description' })).added).toBe(false)
    await expect(moveLead(state, first.id, 'won')).rejects.toThrow('transition')
    await moveLead(state, first.id, 'qualified')
    await moveLead(state, first.id, 'proposal_sent')
    await moveLead(state, first.id, 'won')
    const stats = await statistics(state)
    expect(stats.leads.won).toBe(1)
    expect(stats.leads.new).toBe(0)
    expect(JSON.stringify(stats)).not.toContain('PRIVATE')
    expect(JSON.stringify(stats)).not.toContain('private@example.invalid')
  })

  it('does not leak private input or credential-like data through CLI success/error output', async () => {
    await initialize(state)
    const file = join(temp, 'lead.json')
    await writeFile(file, JSON.stringify({ contact: 'PRIVATE-EMAIL@example.invalid', request: 'PRIVATE-SPEC', market: 'RF' }))
    const script = resolve('scripts/growth/acquisition.mjs')
    const stdout = execFileSync(process.execPath, [script, 'lead-add', '--state-dir', state, '--file', file], { encoding: 'utf8' })
    expect(stdout).not.toContain('PRIVATE')
    expect(JSON.parse(stdout).added).toBe(true)
    await writeFile(file, JSON.stringify({ password: 'PRIVATE-SECRET' }))
    try {
      execFileSync(process.execPath, [script, 'lead-add', '--state-dir', state, '--file', file], { encoding: 'utf8', stdio: 'pipe' })
      throw new Error('Invalid input should not be accepted')
    } catch (error) {
      const failure = error as { stderr?: string; stdout?: string; status?: number }
      expect(failure.status).toBe(1)
      expect(`${failure.stdout}${failure.stderr}`).not.toContain('PRIVATE')
      expect(failure.stderr).toContain('sensitive details withheld')
    }
  })
})
