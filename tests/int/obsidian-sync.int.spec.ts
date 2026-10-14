// @vitest-environment node
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { encodeVaultPath, syncObsidianFile } from '../../scripts/sync_obsidian.mjs'

describe('Obsidian REST note sync', () => {
  let server: Server
  let directory: string
  let baseUrl: string
  let sourcePath: string
  let stored: string | undefined
  let writes: number
  let readStatus: number
  let corruptReadback: boolean
  const apiKey = 'local-test-key'
  const targetPath = '02 Projects/Magic Metal/Каталог — проверка.md'
  const content = '# Каталог\n\nРазмеры и ГОСТы.\n'

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'obsidian-sync-test-'))
    sourcePath = path.join(directory, 'note.md')
    await writeFile(sourcePath, content)
    stored = undefined
    writes = 0
    readStatus = 0
    corruptReadback = false
    server = createServer(async (req, res) => {
      if (req.headers.authorization !== `Bearer ${apiKey}`) {
        res.writeHead(401).end()
        return
      }
      if (req.url === '/gateway/') {
        res.writeHead(200).end('{}')
        return
      }
      if (decodeURIComponent(req.url ?? '') !== `/gateway/vault/${targetPath}`) {
        res.writeHead(400).end()
        return
      }
      if (req.method === 'PUT') {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        stored = Buffer.concat(chunks).toString('utf8')
        writes += 1
        res.writeHead(204).end()
        return
      }
      if (readStatus) {
        res.writeHead(readStatus).end()
        return
      }
      res.writeHead(stored === undefined ? 404 : 200, { 'Content-Type': 'text/markdown' })
        .end(stored === undefined ? '' : corruptReadback ? 'wrong content' : stored)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Test server unavailable')
    baseUrl = `http://127.0.0.1:${address.port}/gateway`
  })

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await rm(directory, { recursive: true, force: true })
  })

  const sync = (overrides = {}) => syncObsidianFile({ baseUrl, apiKey, sourcePath, targetPath, ...overrides })

  it('writes a Unicode note through a gateway prefix, verifies it and avoids duplicate writes', async () => {
    expect(await sync()).toMatchObject({ changed: true, targetPath })
    expect(stored).toBe(content)
    expect(await sync()).toMatchObject({ changed: false })
    expect(writes).toBe(1)
  })

  it('preserves an existing note with different content', async () => {
    stored = '# User edits'
    await expect(sync()).rejects.toThrow('different content')
    expect(stored).toBe('# User edits')
    expect(writes).toBe(0)
  })

  it('does not write after authorization failure', async () => {
    await expect(sync({ apiKey: 'wrong-key' })).rejects.toThrow('health check failed (401)')
    expect(writes).toBe(0)
  })

  it('does not treat a failed read as a missing note', async () => {
    readStatus = 503
    await expect(sync()).rejects.toThrow('read failed (503)')
    expect(writes).toBe(0)
  })

  it('rejects an incorrect readback after a write', async () => {
    corruptReadback = true
    await expect(sync()).rejects.toThrow('verification failed')
    expect(writes).toBe(1)
  })

  it('requires credentials and encrypted remote connections before making requests', async () => {
    await expect(sync({ apiKey: '' })).rejects.toThrow('OBSIDIAN_API_KEY is required')
    await expect(sync({ baseUrl: 'http://example.com' })).rejects.toThrow('requires HTTPS')
    expect(writes).toBe(0)
  })

  it('rejects traversal, absolute paths and non-note targets', () => {
    for (const value of ['../note.md', '/note.md', 'folder/../note.md', 'C:/note.md', 'folder\\note.md', 'folder//note.md', '.obsidian/config.json']) {
      expect(() => encodeVaultPath(value)).toThrow()
    }
    expect(encodeVaultPath(targetPath)).toContain('%D0')
  })
})
