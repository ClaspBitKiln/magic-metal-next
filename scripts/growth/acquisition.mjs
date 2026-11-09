#!/usr/bin/env node
/** Local acquisition workbench. No network, registration, messaging or paid APIs. */
import { readFile, writeFile, mkdir, chmod, rename, open, unlink, realpath } from 'node:fs/promises'
import { resolve, dirname, join, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash, randomUUID } from 'node:crypto'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repo = resolve(scriptDirectory, '../..')
export const defaultProfile = Object.freeze({ name: 'ООО «Мэджик Металл»', website: 'https://magicmet.ru', email: 'm1@magicmet.ru', phone: '+79227117363' })
const taskStates = new Set(['planned', 'needs_verification', 'submitted', 'published_verified'])
const leadTransitions = { new: ['qualified', 'lost'], qualified: ['proposal_sent', 'lost'], proposal_sent: ['won', 'lost'], won: [], lost: [] }
const slug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value)
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24)
const text = (value, max = 2000) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
function https(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.hash ? u : null } catch { return null }
}
export async function loadPlatforms() {
  return JSON.parse(await readFile(join(scriptDirectory, 'platforms.json'), 'utf8')).platforms
}
export function trackingUrl(website, market, platform) {
  const url = https(website)
  if (!url || !['RF', 'KZ', 'UZ'].includes(market) || !slug(platform)) throw new Error('Invalid tracking URL inputs')
  url.pathname = market === 'RF' ? '/' : `/postavki/${market === 'KZ' ? 'kazakhstan' : 'uzbekistan'}`
  url.search = ''
  url.searchParams.set('utm_source', platform)
  url.searchParams.set('utm_medium', 'directory')
  url.searchParams.set('utm_campaign', `rf_cis_${market.toLowerCase()}`)
  return url.href
}
export function validateProfile(input) {
  const allowed = new Set(['name', 'website', 'email', 'phone', 'description', 'legalName', 'taxId', 'address'])
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !allowed.has(k))) throw new Error('Profile contains unsupported fields')
  const result = { ...defaultProfile, ...input }
  if (!text(result.name, 180) || !https(result.website) || !text(result.email, 180) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) || !/^\+?[\d ()-]{7,30}$/.test(result.phone)) throw new Error('Invalid company profile')
  for (const [key, value] of Object.entries(result)) if (!text(value, key === 'description' ? 2000 : 250)) throw new Error('Invalid profile field')
  return result
}
export async function stateDirectory(value) {
  const dir = resolve(value || '/workspace/.cloud/magic-metal/growth/operations')
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const [actual, actualRepo] = await Promise.all([realpath(dir), realpath(repo)])
  const rel = relative(actualRepo, actual)
  if (rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))) throw new Error('State must be stored outside the public repository')
  await chmod(actual, 0o700)
  return actual
}
async function atomicJson(file, data) {
  const tmp = `${file}.tmp-${randomUUID()}`
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600, flag: 'wx' })
  try { await rename(tmp, file); await chmod(file, 0o600) } catch (error) { await unlink(tmp).catch(() => {}); throw error }
}
async function transaction(dir, change) {
  let lock
  try { lock = await open(join(dir, '.lock'), 'wx', 0o600) } catch { throw new Error('State is busy; verify another run before retrying') }
  try { return await change() } finally { await lock.close(); await unlink(join(dir, '.lock')) }
}
const readJson = async file => JSON.parse(await readFile(file, 'utf8'))
export async function initialize(dir, profile = {}) {
  return transaction(dir, async () => {
    const file = join(dir, 'state.json')
    try { const previous = await readJson(file); if (previous.schemaVersion !== 1) throw new Error('Unsupported state schema'); return { initialized: false } }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    await atomicJson(file, { schemaVersion: 1, profile: validateProfile(profile), tasks: {}, leads: {}, createdAt: new Date().toISOString() })
    return { initialized: true }
  })
}
async function mutate(dir, change) {
  return transaction(dir, async () => {
    const state = await readJson(join(dir, 'state.json'))
    if (state.schemaVersion !== 1) throw new Error('Unsupported state schema')
    const result = change(state)
    await atomicJson(join(dir, 'state.json'), state)
    return result
  })
}
function platformById(platforms, id) {
  const platform = platforms.find(p => p.id === id)
  if (!platform) throw new Error('Unknown platform')
  return platform
}
export function taskKey(id, market, platforms) {
  const platform = platformById(platforms, id)
  if (!platform.markets.includes(market)) throw new Error('Unsupported platform market')
  return `${id}:${market}`
}
export async function plan(dir, platforms, market) {
  if (market && !['RF', 'KZ', 'UZ'].includes(market)) throw new Error('Unsupported market')
  const state = await readJson(join(dir, 'state.json'))
  return platforms.flatMap(p => p.markets.filter(m => !market || m === market).map(m => ({ platform: p.id, name: p.name, market: m, rank: p.rank, state: state.tasks[`${p.id}:${m}`]?.status || 'planned', free: p.free, automationAllowed: p.automationAllowed, required: p.required, entryUrl: p.entryUrl, nextAction: p.free.startsWith('excluded') || p.free.startsWith('ineligible') ? 'Do not register without eligibility/cost review' : 'Check existing company and current terms; complete required owner verification' }))).sort((a, b) => a.rank - b.rank || a.platform.localeCompare(b.platform))
}
export async function draft(dir, platforms, id, market) {
  const key = taskKey(id, market, platforms), platform = platformById(platforms, id)
  const state = await readJson(join(dir, 'state.json')), profile = validateProfile(state.profile)
  const landing = trackingUrl(profile.website, market, id)
  const body = `# Черновик карточки: ${platform.name} / ${market}\n\nСтатус: подготовлено, НЕ опубликовано.\n\n${profile.name}\nСайт: ${landing}\nEmail: ${profile.email}\nТелефон: ${profile.phone}\n\n${profile.description || 'Комплектуем промышленные заявки на металлопрокат по спецификации. Укажите продукцию, размеры, марку материала, количество и город назначения. Наличие, стоимость, срок и условия поставки подтверждаются при подготовке предложения.'}\n\nЮридический/клиентский адрес и документы не выдумывать.\nТребуется проверить: ${platform.required.join(', ')}.\nАвтоматический доступ: ${String(platform.automationAllowed)}. Программа не регистрирует и не публикует карточки.\nОфициальный вход: ${platform.entryUrl}\nИсточники условий: ${platform.sources.join(' ; ')}\n`
  const folder = join(dir, 'drafts'); await mkdir(folder, { recursive: true, mode: 0o700 })
  const file = join(folder, `${id}-${market.toLowerCase()}.md`)
  try { const previous = await readFile(file, 'utf8'); if (previous !== body) throw new Error('Draft changed; preserve and review existing file'); return { prepared: false, file } }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await writeFile(file, body, { mode: 0o600, flag: 'wx' })
  await mutate(dir, data => { if (!data.tasks[key]) data.tasks[key] = { status: 'planned', updatedAt: new Date().toISOString() }; return null })
  return { prepared: true, file }
}
export async function record(dir, platforms, id, market, status, evidenceUrl, confirmed = false) {
  const key = taskKey(id, market, platforms), platform = platformById(platforms, id)
  if (!taskStates.has(status)) throw new Error('Unsupported task status')
  if (status === 'submitted' || status === 'published_verified') {
    const evidence = https(evidenceUrl), entry = new URL(platform.entryUrl)
    const hosts = platform.evidenceHosts || [entry.hostname.replace(/^(?:www|account|my|welcome)\./, '')]
    if (!evidence || evidence.search || !hosts.some(host => evidence.hostname === host || evidence.hostname.endsWith(`.${host}`))) throw new Error('A public evidence URL on the platform domain is required')
    if (!confirmed) throw new Error('Explicit owner confirmation is required; this tool did not submit or verify the page')
    if (platform.free.startsWith('excluded') || platform.free.startsWith('ineligible')) throw new Error('Platform is excluded from this free acquisition plan')
  }
  return mutate(dir, state => {
    state.tasks[key] = { status, ...(status === 'submitted' || status === 'published_verified' ? { evidenceUrl, evidenceType: 'owner_confirmed', confirmedAt: new Date().toISOString() } : {}), updatedAt: new Date().toISOString() }
    return { recorded: true, platform: id, market, status }
  })
}
export async function addLead(dir, input) {
  const keys = new Set(['reference', 'company', 'contact', 'request', 'platform', 'market'])
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !keys.has(k)) || !text(input.contact, 300) || !text(input.request, 4000) || !['RF', 'KZ', 'UZ'].includes(input.market)) throw new Error('Invalid private lead input')
  for (const v of Object.values(input)) if (!text(v, 4000)) throw new Error('Invalid private lead field')
  const id = hash(input.reference ? `ref:${input.reference.trim().toLowerCase()}` : `${input.contact.trim().toLowerCase()}\n${input.request.trim().toLowerCase()}`)
  return mutate(dir, state => {
    if (state.leads[id]) return { added: false, id }
    state.leads[id] = { ...input, stage: 'new', createdAt: new Date().toISOString() }
    return { added: true, id }
  })
}
export async function moveLead(dir, id, stage) {
  return mutate(dir, state => {
    const lead = state.leads[id]
    if (!lead || !Object.hasOwn(leadTransitions, lead.stage) || !leadTransitions[lead.stage].includes(stage)) throw new Error('Invalid lead stage transition')
    lead.stage = stage; lead.updatedAt = new Date().toISOString()
    return { moved: true, id, stage }
  })
}
export async function statistics(dir) {
  const state = await readJson(join(dir, 'state.json'))
  const tasks = Object.fromEntries([...taskStates].map(status => [status, Object.values(state.tasks).filter(t => t.status === status).length]))
  const leads = Object.fromEntries(Object.keys(leadTransitions).map(stage => [stage, Object.values(state.leads).filter(lead => lead.stage === stage).length]))
  const verifiedPlatforms = new Set(Object.entries(state.tasks).filter(([, task]) => task.status === 'published_verified').map(([key]) => key.split(':')[0])).size
  return { tasks, leads, verifiedRegistrations: verifiedPlatforms, verifiedPlacements: tasks.published_verified, limitation: 'verifiedRegistrations counts distinct owner-confirmed platforms, not independently verified accounts. Placements count platform/market tasks; no network verification or sales attribution.' }
}
export async function main(argv = process.argv.slice(2)) {
  const command = argv[0]
  const options = {}
  for (let i = 1; i < argv.length; i += 2) {
    const key = argv[i]
    if (!['--state-dir', '--profile', '--market', '--platform', '--status', '--evidence', '--confirmed', '--file', '--id', '--stage'].includes(key) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Invalid command arguments')
    options[key.slice(2)] = argv[i + 1]
  }
  if (!['init', 'platforms', 'plan', 'draft', 'record', 'lead-add', 'lead-move', 'stats'].includes(command)) throw new Error('Commands: init, platforms, plan, draft, record, lead-add, lead-move, stats')
  const platforms = await loadPlatforms()
  if (command === 'platforms') return platforms.map(({ id, name, markets, rank, free, automationAllowed }) => ({ id, name, markets, rank, free, automationAllowed }))
  const dir = await stateDirectory(options['state-dir'])
  if (command === 'init') return initialize(dir, options.profile ? await readJson(resolve(options.profile)) : {})
  if (command === 'plan') return plan(dir, platforms, options.market)
  if (command === 'draft') return draft(dir, platforms, options.platform, options.market)
  if (command === 'record') return record(dir, platforms, options.platform, options.market, options.status, options.evidence, options.confirmed === 'yes')
  if (command === 'lead-add') { if (!options.file) throw new Error('Private input file is required'); return addLead(dir, await readJson(resolve(options.file))) }
  if (command === 'lead-move') return moveLead(dir, options.id, options.stage)
  return statistics(dir)
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(() => { console.error('Acquisition command failed. Check arguments, private input, state permissions and platform evidence; sensitive details withheld.'); process.exitCode = 1 })
}
