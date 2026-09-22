import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })

export function encodeVaultPath(vaultPath) {
  return vaultPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')
}

function digest(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function request({ baseUrl, apiKey, method, pathname, body }) {
  const url = new URL(pathname, baseUrl)
  const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  const transport = url.protocol === 'https:' ? https : http
  const headers = { Accept: 'text/markdown, application/json' }

  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  if (body !== undefined) {
    headers['Content-Type'] = 'text/markdown; charset=utf-8'
    headers['Content-Length'] = Buffer.byteLength(body)
  }

  return new Promise((resolve, reject) => {
    const req = transport.request(url, {
      method,
      headers,
      rejectUnauthorized: !isLoopback,
    }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode ?? 0,
        body: Buffer.concat(chunks).toString('utf8'),
      }))
    })
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

export async function syncObsidianFile({ baseUrl, apiKey, sourcePath, targetPath }) {
  if (!apiKey) throw new Error('OBSIDIAN_API_KEY is required')
  if (!targetPath || targetPath.includes('..') || path.isAbsolute(targetPath)) {
    throw new Error('OBSIDIAN_SYNC_TARGET must be a safe vault-relative path')
  }

  const content = await readFile(sourcePath, 'utf8')
  const vaultUrl = `/vault/${encodeVaultPath(targetPath)}`
  const health = await request({ baseUrl, method: 'GET', pathname: '/' })
  if (health.status < 200 || health.status >= 300) {
    throw new Error(`Obsidian API health check failed (${health.status})`)
  }

  const existing = await request({ baseUrl, apiKey, method: 'GET', pathname: vaultUrl })
  if (existing.status === 200 && digest(existing.body) === digest(content)) {
    return { changed: false, targetPath, sha256: digest(content) }
  }
  if (existing.status !== 200 && existing.status !== 404) {
    throw new Error(`Obsidian API read failed (${existing.status})`)
  }

  const write = await request({ baseUrl, apiKey, method: 'PUT', pathname: vaultUrl, body: content })
  if (write.status < 200 || write.status >= 300) {
    throw new Error(`Obsidian API write failed (${write.status})`)
  }

  const verified = await request({ baseUrl, apiKey, method: 'GET', pathname: vaultUrl })
  if (verified.status !== 200 || digest(verified.body) !== digest(content)) {
    throw new Error('Obsidian API verification failed')
  }

  return { changed: true, targetPath, sha256: digest(content) }
}

async function main() {
  const result = await syncObsidianFile({
    baseUrl: process.env.OBSIDIAN_API_URL ?? 'https://127.0.0.1:27124',
    apiKey: process.env.OBSIDIAN_API_KEY,
    sourcePath: path.resolve(projectRoot, process.env.OBSIDIAN_SYNC_SOURCE ?? 'docs/ai/OBSIDIAN_PENDING_2026-09-16.md'),
    targetPath: process.env.OBSIDIAN_SYNC_TARGET ?? '02 Projects/Magic Metal/OBSIDIAN_PENDING_2026-09-16.md',
  })
  const state = result.changed ? 'updated' : 'already current'
  console.log(`Obsidian sync ${state}: ${result.targetPath} (${result.sha256.slice(0, 12)})`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Obsidian sync failed')
    process.exitCode = 1
  })
}
