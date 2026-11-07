import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import https from 'node:https'
import { safeLocalPath, localEndpoint, registryPaths, selectVault, discoverVaults, localSettings, probeLocalHealth, redactReport, main } from '../scripts/obsidian-recovery.mjs'

const KEY = 'offline-existing-local-key-123'
const PRIVATE = 'offline-private-key-must-not-escape'

function fakeRequest({ status = 200, body = { files: ['Rules/', 'private-note.md'] }, error, noResponse = false } = {}) {
  const calls = []
  const request = (url, options, callback) => {
    calls.push({ url: String(url), options })
    const req = new EventEmitter()
    req.destroy = () => {}
    req.end = () => queueMicrotask(() => {
      if (error) return req.emit('error', error)
      if (noResponse) return
      const response = Readable.from([Buffer.from(JSON.stringify(body))])
      response.statusCode = status
      callback(response)
    })
    return req
  }
  return { request, calls }
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'obsidian-recovery-'))
  const vault = path.join(root, 'vault')
  const appData = path.join(root, 'appdata')
  const localAppData = path.join(root, 'localdata')
  const plugin = path.join(vault, '.obsidian', 'plugins', 'obsidian-local-rest-api')
  await mkdir(plugin, { recursive: true })
  await mkdir(path.join(appData, 'obsidian'), { recursive: true })
  await writeFile(path.join(appData, 'obsidian', 'obsidian.json'), JSON.stringify({ vaults: { one: { path: vault } } }))
  const config = { apiKey: KEY, port: 27124, enableSecureServer: true, crypto: { caCert: 'offline-public-ca', privateKey: PRIVATE } }
  await writeFile(path.join(plugin, 'data.json'), JSON.stringify(config))
  return { root, vault, appData, localAppData, plugin, config, cleanup: () => rm(root, { recursive: true, force: true }) }
}

test('vault discovery reads registry and does not change existing plugin config', async () => {
  const f = await fixture()
  try {
    const before = await readFile(path.join(f.plugin, 'data.json'), 'utf8')
    const discovered = await discoverVaults({ appData: f.appData, knownVault: null })
    assert.equal(discovered.registryStatus, 'read')
    assert.deepEqual(discovered.vaults, [{ path: f.vault, pluginConfigPresent: true }])
    const settings = await localSettings(discovered.vaults[0])
    assert.equal(settings.apiKey, KEY)
    assert.equal(settings.ca, 'offline-public-ca')
    assert.equal(settings.credentialSource, 'local-plugin-config')
    assert.equal(Object.hasOwn(settings, 'privateKey'), false)
    assert.equal(await readFile(path.join(f.plugin, 'data.json'), 'utf8'), before)
  } finally { await f.cleanup() }
})

test('registry paths reject remote locations and traversal without exposing input', () => {
  assert.deepEqual(registryPaths({ vaults: { good: { path: 'C:/Users/asus/Documents/inn-bot' }, remote: { path: '\\\\other-pc\\share' }, traversal: { path: 'C:/vault/../secret' } } }), ['C:/Users/asus/Documents/inn-bot'])
  for (const value of ['../vault', 'C:/vault/../secret', '//server/share', 'https://server/vault', 'C:/vault:stream']) assert.throws(() => safeLocalPath(value))
})

test('authentication destination cannot be remote, plaintext or a normalized traversal', () => {
  for (const endpoint of ['https://example.com:27124/', 'http://127.0.0.1:27123/', 'https://127.0.0.1:27124/a/../', 'https://user:pass@localhost:27124/', 'https://localhost:27124/?x=1', 'https://localhost:27124/#token', 'https://127.0.0.1.evil:27124/']) assert.throws(() => localEndpoint(endpoint))
  assert.equal(localEndpoint('https://[::1]:27124/').hostname, '[::1]')
})

test('known project vault wins over other vaults; ambiguous unknown vaults never choose the first', () => {
  const other = { path: 'C:/Users/asus/Other', pluginConfigPresent: true }
  const known = { path: 'C:\\Users\\asus\\Documents\\inn-bot', pluginConfigPresent: true }
  assert.equal(selectVault([other, known]), known)
  assert.equal(selectVault([other, { path: 'C:/OtherVault', pluginConfigPresent: true }]), null)
})

test('authorized vault listing uses GET, validates TLS and returns only a count', async () => {
  const fake = fakeRequest()
  const result = await probeLocalHealth({ apiKey: KEY, ca: 'trusted-local-ca', tlsDisabled: false }, fake.request)
  assert.equal(result.authenticatedVaultReadVerified, true)
  assert.equal(result.topLevelEntries, 2)
  assert.equal(fake.calls[0].url, 'https://127.0.0.1:27124/vault/')
  assert.equal(fake.calls[0].options.method, 'GET')
  assert.equal(fake.calls[0].options.rejectUnauthorized, true)
  assert.equal(fake.calls[0].options.headers.Authorization, `Bearer ${KEY}`)
  assert.equal(fake.calls[0].options.ca, 'trusted-local-ca')
  assert.equal(JSON.stringify(result).includes('private-note.md'), false)
})

test('redirect never forwards credentials to a second destination', async () => {
  const fake = fakeRequest({ status: 302 })
  const result = await probeLocalHealth({ apiKey: KEY, tlsDisabled: false }, fake.request)
  assert.equal(result.status, 'redirect-refused')
  assert.equal(result.healthVerified, false)
  assert.equal(fake.calls.length, 1)
})

test('invalid key and untrusted certificate are reported without remote error text', async () => {
  for (const [fake, status] of [[fakeRequest({ status: 401 }), 'local-auth-rejected'], [fakeRequest({ error: Object.assign(new Error(KEY), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }) }), 'local-certificate-untrusted']]) {
    const result = await probeLocalHealth({ apiKey: KEY, tlsDisabled: false }, fake.request)
    assert.equal(result.status, status)
    assert.equal(result.healthVerified, false)
    assert.equal(JSON.stringify(result).includes(KEY), false)
  }
})

test('missing credential performs no request and global TLS bypass is refused', async () => {
  const fake = fakeRequest()
  assert.equal((await probeLocalHealth({ tlsDisabled: false }, fake.request)).status, 'local-key-missing')
  assert.equal(fake.calls.length, 0)
  assert.throws(() => probeLocalHealth({ apiKey: KEY, tlsDisabled: true }, fake.request))
})

test('a generic HTTP 200 does not prove authenticated vault access', async () => {
  const fake = fakeRequest({ body: { message: 'not an Obsidian vault listing' } })
  const result = await probeLocalHealth({ apiKey: KEY, tlsDisabled: false }, fake.request)
  assert.equal(result.healthVerified, false)
  assert.equal(result.status, 'local-api-response-unrecognized')
})

test('hung local API times out without revealing secrets', async () => {
  const fake = fakeRequest({ noResponse: true })
  const result = await probeLocalHealth({ apiKey: KEY, timeoutMs: 5, tlsDisabled: false }, fake.request)
  assert.equal(result.status, 'local-api-timeout')
  assert.equal(JSON.stringify(result).includes(KEY), false)
})

test('redaction removes credential properties and embedded known credential values', () => {
  const text = redactReport({ apiKey: KEY, Authorization: `Bearer ${KEY}`, crypto: { privateKey: PRIVATE }, error: `example ${KEY}` }, [KEY, PRIVATE])
  assert.equal(text.includes(KEY), false)
  assert.equal(text.includes(PRIVATE), false)
})

test('local report never asserts ChatGPT connection or writes vault notes', async () => {
  const f = await fixture()
  const originalRequest = https.request
  const fake = fakeRequest()
  const originalLog = console.log
  try {
    https.request = fake.request
    console.log = () => {}
    assert.equal(await main([], { APPDATA: f.appData, LOCALAPPDATA: f.localAppData }), 0)
    const text = await readFile(path.join(f.localAppData, 'MagicMetalObsidianSync', 'recovery-report.json'), 'utf8')
    const report = JSON.parse(text)
    assert.equal(report.authenticatedVaultReadVerified, true)
    assert.equal(report.chatgptConnectionVerified, false)
    assert.equal(report.notesWritten, false)
    assert.equal(report.credentialSource, 'local-plugin-config')
    for (const secret of [KEY, PRIVATE, 'private-note.md']) assert.equal(text.includes(secret), false)
    assert.equal(fake.calls.length, 1)
    assert.equal(fake.calls[0].options.method, 'GET')
  } finally { https.request = originalRequest; console.log = originalLog; await f.cleanup() }
})

test('unhealthy diagnosis returns nonzero and persists the failure instead of claiming recovery', async () => {
  const f = await fixture()
  const originalRequest = https.request
  const originalLog = console.log
  try {
    https.request = fakeRequest({ status: 401 }).request
    console.log = () => {}
    assert.equal(await main([], { APPDATA: f.appData, LOCALAPPDATA: f.localAppData }), 2)
    const report = JSON.parse(await readFile(path.join(f.localAppData, 'MagicMetalObsidianSync', 'recovery-report.json'), 'utf8'))
    assert.equal(report.healthVerified, false)
    assert.equal(report.chatgptConnectionVerified, false)
  } finally { https.request = originalRequest; console.log = originalLog; await f.cleanup() }
})
