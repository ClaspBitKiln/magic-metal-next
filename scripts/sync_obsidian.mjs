import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const noteName = 'OBSIDIAN_PENDING_RF_CATALOG_AND_CONNECTIONS_2026-10-14.md'

export function encodeVaultPath(vaultPath) {
  if (typeof vaultPath !== 'string' || !vaultPath || /[\\\u0000-\u001f]/u.test(vaultPath)
    || path.posix.isAbsolute(vaultPath) || /^[A-Za-z]:/u.test(vaultPath)
    || vaultPath.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Target must be a safe vault-relative note path')
  }
  if (!vaultPath.endsWith('.md')) throw new Error('Target must be a Markdown note')
  return vaultPath.split('/').map(encodeURIComponent).join('/')
}

function digest(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function apiBase(baseUrl) {
  const url = new URL(baseUrl)
  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) {
    throw new Error('Remote Obsidian API requires HTTPS')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('API URL must not contain credentials, a query or a fragment')
  }
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('TLS verification must remain enabled')
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}

function request({ baseUrl, apiKey, method, pathname, body, timeoutMs }) {
  const url = new URL(pathname, baseUrl)
  const transport = url.protocol === 'https:' ? https : http
  const headers = { Accept: 'text/markdown, application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  if (body !== undefined) {
    headers['Content-Type'] = 'text/markdown; charset=utf-8'
    headers['Content-Length'] = Buffer.byteLength(body)
  }

  return new Promise((resolve, reject) => {
    const req = transport.request(url, { method, headers, rejectUnauthorized: true }, (res) => {
      const chunks = []
      res.on('error', reject)
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode ?? 0,
        body: Buffer.concat(chunks).toString('utf8'),
      }))
    })
    const deadline = setTimeout(() => req.destroy(new Error('Obsidian API request timed out')), timeoutMs)
    req.on('close', () => clearTimeout(deadline))
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

export async function syncObsidianFile({ baseUrl, apiKey, sourcePath, targetPath, timeoutMs = 15000 }) {
  if (!apiKey) throw new Error('OBSIDIAN_API_KEY is required')
  const vaultPath = `vault/${encodeVaultPath(targetPath)}`
  const base = apiBase(baseUrl)
  const content = await readFile(sourcePath, 'utf8')
  const call = (method, pathname, body) => request({ baseUrl: base, apiKey, method, pathname, body, timeoutMs })

  const health = await call('GET', '')
  if (health.status < 200 || health.status >= 300) {
    throw new Error(`Obsidian API health check failed (${health.status})`)
  }
  const existing = await call('GET', vaultPath)
  if (existing.status === 200) {
    if (digest(existing.body) === digest(content)) {
      return { changed: false, targetPath, sha256: digest(content) }
    }
    throw new Error('Target note already contains different content; choose a new target path')
  }
  if (existing.status !== 404) throw new Error(`Obsidian API read failed (${existing.status})`)

  const write = await call('PUT', vaultPath, content)
  if (write.status < 200 || write.status >= 300) {
    throw new Error(`Obsidian API write failed (${write.status})`)
  }
  const verified = await call('GET', vaultPath)
  if (verified.status !== 200 || digest(verified.body) !== digest(content)) {
    throw new Error('Obsidian API verification failed')
  }
  return { changed: true, targetPath, sha256: digest(content) }
}

async function main() {
  dotenv.config({ path: path.join(projectRoot, '.env.local') })
  const result = await syncObsidianFile({
    baseUrl: process.env.OBSIDIAN_API_URL ?? 'https://127.0.0.1:27124',
    apiKey: process.env.OBSIDIAN_API_KEY,
    sourcePath: path.resolve(projectRoot, process.env.OBSIDIAN_SYNC_SOURCE ?? `docs/ai/${noteName}`),
    targetPath: process.env.OBSIDIAN_SYNC_TARGET ?? `02 Projects/Magic Metal/${noteName}`,
  })
  console.log(`Obsidian sync ${result.changed ? 'created' : 'already current'}: ${result.targetPath} (${result.sha256.slice(0, 12)})`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Obsidian sync failed')
    process.exitCode = 1
  })
}
