#!/usr/bin/env node
// Local diagnosis only: no vault writes, installations, account login or tunnel setup.
import { readFile, stat, realpath, mkdir, writeFile } from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const DEFAULT_ENDPOINT = 'https://127.0.0.1:27124/'
const KNOWN_VAULT = 'C:/Users/asus/Documents/inn-bot'

export function safeLocalPath(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u001f]/u.test(value)
    || /^(?:\\\\|\/\/|[a-z]+:\/\/)/iu.test(value)
    || value.split(/[\\/]/u).some(segment => segment === '..')
    || (!path.isAbsolute(value) && !/^[a-z]:[\\/]/iu.test(value))) {
    throw new Error('unsafe-local-path')
  }
  if (value.replace(/^[a-z]:/iu, '').includes(':')) throw new Error('unsafe-local-path')
  return value
}

export function localEndpoint(value = DEFAULT_ENDPOINT) {
  // Check the raw input as well: URL normalization must not hide traversal.
  if (typeof value !== 'string' || !/^https:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d{1,5}\/?$/iu.test(value)) {
    throw new Error('unsafe-local-endpoint')
  }
  const url = new URL(value)
  if (Number(url.port || 443) < 1 || Number(url.port || 443) > 65535) throw new Error('unsafe-local-endpoint')
  return url
}

export function registryPaths(registry) {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)
    || !registry.vaults || typeof registry.vaults !== 'object' || Array.isArray(registry.vaults)) return []
  return [...new Set(Object.values(registry.vaults).flatMap(item => {
    try { return [safeLocalPath(item?.path)] } catch { return [] }
  }))]
}

export function selectVault(vaults, knownVault = KNOWN_VAULT) {
  const configured = vaults.filter(vault => vault.pluginConfigPresent)
  const canonical = value => value.replace(/\\/gu, '/').replace(/\/$/u, '').toLowerCase()
  const known = configured.filter(vault => canonical(vault.path) === canonical(knownVault))
  if (known.length === 1) return known[0]
  return configured.length === 1 ? configured[0] : null
}

async function readSmallJson(filename) {
  const size = (await stat(filename)).size
  if (size > 1024 * 1024) throw new Error('oversized-registry')
  return JSON.parse(await readFile(filename, 'utf8'))
}

export async function discoverVaults({ appData, vaultPath, knownVault = KNOWN_VAULT } = {}) {
  const candidates = []
  let registryStatus = 'unavailable'
  if (appData) {
    try {
      const filename = path.join(safeLocalPath(appData), 'obsidian', 'obsidian.json')
      const discovered = registryPaths(await readSmallJson(filename))
      if (!vaultPath) candidates.push(...discovered)
      registryStatus = 'read'
    } catch { registryStatus = 'unavailable' }
  }
  if (vaultPath) candidates.push(safeLocalPath(vaultPath))
  if (knownVault && !vaultPath) candidates.push(safeLocalPath(knownVault))
  const vaults = []
  for (const candidate of [...new Set(candidates)]) {
    try {
      if (!(await stat(candidate)).isDirectory()) continue
      const resolved = await realpath(candidate)
      const config = await realpath(path.join(resolved, '.obsidian'))
      const relative = path.relative(resolved, config)
      if (!relative || path.isAbsolute(relative) || relative.split(path.sep).includes('..') || !(await stat(config)).isDirectory()) continue
      let pluginConfigPresent = false
      try { pluginConfigPresent = (await stat(path.join(config, 'plugins', 'obsidian-local-rest-api', 'data.json'))).isFile() } catch { /* not installed/configured */ }
      vaults.push({ path: resolved, pluginConfigPresent })
    } catch { /* Missing paths are normal when moving between machines. */ }
  }
  return { registryStatus, vaults: vaults.filter((v, i) => vaults.findIndex(x => x.path === v.path) === i) }
}

// Authoritative schema: https://github.com/coddingtonbear/obsidian-local-rest-api/blob/master/src/types.ts
// Only apiKey, secure port/enabled, authorizationHeaderName and public CA/cert are used.
// Private keys and full plugin settings are never returned, logged or written.
export async function localSettings(vault, { apiKey: envKey, ca: explicitCA } = {}) {
  const root = await realpath(safeLocalPath(vault.path))
  const filename = await realpath(path.join(root, '.obsidian', 'plugins', 'obsidian-local-rest-api', 'data.json'))
  const relative = path.relative(root, filename)
  if (path.isAbsolute(relative) || relative.split(path.sep).includes('..')) throw new Error('unsafe-plugin-config')
  const config = await readSmallJson(filename)
  if (config.enableSecureServer === false) throw new Error('secure-local-api-disabled')
  const port = config.port ?? 27124
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid-local-port')
  const header = config.authorizationHeaderName || 'Authorization'
  if (typeof header !== 'string' || !/^[a-z0-9!#$%&'*+.^_`|~-]+$/iu.test(header)
    || /^(?:host|connection|content-length|transfer-encoding)$/iu.test(header)) throw new Error('invalid-auth-header')
  return {
    endpoint: `https://127.0.0.1:${port}/`,
    apiKey: envKey || (typeof config.apiKey === 'string' ? config.apiKey : undefined),
    ca: explicitCA || config.crypto?.caCert || config.crypto?.cert,
    authorizationHeaderName: header,
    credentialSource: envKey ? 'process-environment' : config.apiKey ? 'local-plugin-config' : 'not-provided',
  }
}

export function probeLocalHealth({ endpoint = DEFAULT_ENDPOINT, apiKey, ca, authorizationHeaderName = 'Authorization', timeoutMs = 5000, tlsDisabled = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' } = {}, requestImpl = https.request) {
  const url = localEndpoint(endpoint)
  url.pathname = '/vault/'
  if (tlsDisabled) throw new Error('tls-verification-required')
  if (typeof apiKey !== 'string' || !apiKey || /[\r\n]/u.test(apiKey)) {
    return Promise.resolve({ status: 'local-key-missing', healthVerified: false })
  }
  return new Promise(resolve => {
    let completed = false
    let timer
    const finish = result => {
      if (completed) return
      completed = true
      clearTimeout(timer)
      resolve(result)
    }
    try {
      const request = requestImpl(url, {
        method: 'GET', rejectUnauthorized: true, ...(ca ? { ca } : {}),
        headers: { [authorizationHeaderName]: `Bearer ${apiKey}`, Accept: 'application/json' },
        // Do not resolve localhost through external DNS or an altered hosts entry.
        ...(url.hostname === 'localhost' ? { lookup: (_host, _opts, callback) => callback(null, '127.0.0.1', 4) } : {}),
      }, response => {
        const code = response.statusCode ?? 0
        // Never follow redirects or retain headers, response text or vault filenames.
        if (code >= 300 && code < 400) { response.resume(); return finish({ status: 'redirect-refused', healthVerified: false }) }
        if (code === 401 || code === 403) { response.resume(); return finish({ status: 'local-auth-rejected', healthVerified: false }) }
        if (code !== 200) { response.resume(); return finish({ status: 'local-api-not-ready', healthVerified: false, httpStatus: code }) }
        const chunks = []
        let size = 0
        response.on('error', () => finish({ status: 'local-api-response-failed', healthVerified: false }))
        response.on('data', chunk => {
          size += chunk.length
          if (size > 1024 * 1024) { response.destroy(); finish({ status: 'local-api-response-too-large', healthVerified: false }); return }
          chunks.push(chunk)
        })
        response.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (!Array.isArray(body.files) || !body.files.every(file => typeof file === 'string')) throw new Error('invalid-response')
            finish({ status: 'local-vault-read-ready', healthVerified: true, authenticatedVaultReadVerified: true, topLevelEntries: body.files.length })
          } catch { finish({ status: 'local-api-response-unrecognized', healthVerified: false }) }
        })
      })
      request.on('error', error => {
        const certificate = /CERT|TLS|SSL|SELF_SIGNED/iu.test(error.code ?? '')
        finish({ status: certificate ? 'local-certificate-untrusted' : 'local-api-unreachable', healthVerified: false })
      })
      if (!completed) timer = setTimeout(() => {
        finish({ status: 'local-api-timeout', healthVerified: false })
        request.destroy()
      }, timeoutMs)
      request.end()
    } catch {
      finish({ status: 'local-api-unreachable', healthVerified: false })
    }
  })
}

export function redactReport(report, secrets = []) {
  const sensitive = /api.?key|authorization|token|password|secret|cookie|private.?key/iu
  return JSON.stringify(report, (key, value) => {
    if (sensitive.test(key)) return '[REDACTED]'
    if (typeof value !== 'string') return value
    return secrets.filter(x => typeof x === 'string' && x).reduce((s, secret) => s.split(secret).join('[REDACTED]'), value)
  }, 2) + '\n'
}

export async function main(args = process.argv.slice(2), env = process.env) {
  if (args.includes('--help')) {
    console.log('Usage: node obsidian-recovery.mjs [--vault ABSOLUTE_LOCAL_PATH] [--ca-file LOCAL_PEM]\nUses the existing local REST plugin credential; OBSIDIAN_API_KEY can override it in this process. HTTPS loopback only.\nWrites a redacted local diagnosis, never vault notes or settings. Does not connect ChatGPT.')
    return 0
  }
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!['--vault', '--ca-file'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw new Error('invalid-arguments')
    options[args[i]] = safeLocalPath(args[i + 1])
  }
  if (!env.LOCALAPPDATA) throw new Error('local-app-data-missing')
  const directory = path.join(safeLocalPath(env.LOCALAPPDATA), 'MagicMetalObsidianSync')
  const discovery = await discoverVaults({ appData: env.APPDATA, vaultPath: options['--vault'] })
  let health = { status: 'vault-not-found', healthVerified: false, authenticatedVaultReadVerified: false }
  let settings = { credentialSource: 'not-provided' }
  const configured = discovery.vaults.filter(v => v.pluginConfigPresent)
  const selected = selectVault(discovery.vaults)
  if (configured.length > 1 && !selected) health.status = 'multiple-configured-vaults'
  else if (discovery.vaults.length && !configured.length) health.status = 'local-rest-plugin-not-configured'
  else if (selected) {
    try {
      const ca = options['--ca-file'] ? await readFile(options['--ca-file']) : undefined
      settings = await localSettings(selected, { apiKey: env.OBSIDIAN_API_KEY, ca })
      health = await probeLocalHealth({ ...settings, tlsDisabled: env.NODE_TLS_REJECT_UNAUTHORIZED === '0' })
    } catch { health.status = 'local-plugin-settings-unusable' }
  }
  const report = {
    checkedAt: new Date().toISOString(), mode: 'local-diagnosis-only', authenticatedVaultReadVerified: false, ...discovery, ...health,
    credentialSource: settings.credentialSource,
    chatgptConnectionVerified: false, notesWritten: false,
    nextStep: health.healthVerified ? 'Connect the authenticated vault gateway/MCP separately; local health does not establish ChatGPT access.' : 'Check the running Windows Obsidian app, Local REST API plugin, local credential and trusted certificate.',
  }
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'recovery-report.json'), redactReport(report, [env.OBSIDIAN_API_KEY, settings.apiKey]), { mode: 0o600 })
  console.log(JSON.stringify({ status: report.status, vaultsFound: discovery.vaults.length, reportFile: 'LOCALAPPDATA/MagicMetalObsidianSync/recovery-report.json', chatgptConnectionVerified: false }))
  return health.healthVerified ? 0 : 2
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => { process.exitCode = code }).catch(() => { console.error('Recovery diagnosis stopped safely; no credentials or remote responses were logged.'); process.exitCode = 1 })
}
