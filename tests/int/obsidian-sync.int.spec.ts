import { createServer } from 'node:http'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'
import { encodeVaultPath, syncObsidianFile } from '../../scripts/sync_obsidian.mjs'

const servers: ReturnType<typeof createServer>[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
})

describe('Obsidian API sync', () => {
  it('writes through the API and verifies the exact content', async () => {
    const token = 'test-token'
    const target = '02 Projects/Magic Metal/Этап.md'
    let stored = ''
    let writes = 0
    const server = createServer((req, res) => {
      if (req.url === '/') return void res.end('ok')
      expect(req.headers.authorization).toBe(`Bearer ${token}`)
      expect(req.url).toBe(`/vault/${encodeVaultPath(target)}`)
      if (req.method === 'GET' && !stored) {
        res.statusCode = 404
        return void res.end()
      }
      if (req.method === 'GET') return void res.end(stored)
      const chunks: Buffer[] = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => {
        stored = Buffer.concat(chunks).toString('utf8')
        writes += 1
        res.statusCode = 204
        res.end()
      })
    })
    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Mock server did not start')

    const dir = await mkdtemp(path.join(tmpdir(), 'obsidian-sync-'))
    const sourcePath = path.join(dir, 'stage.md')
    await writeFile(sourcePath, '# Этап\n\nГотово.\n', 'utf8')
    const input = { baseUrl: `http://127.0.0.1:${address.port}`, apiKey: token, sourcePath, targetPath: target }

    expect(await syncObsidianFile(input)).toMatchObject({ changed: true, targetPath: target })
    expect(await syncObsidianFile(input)).toMatchObject({ changed: false, targetPath: target })
    expect(stored).toBe('# Этап\n\nГотово.\n')
    expect(writes).toBe(1)
  })
})
