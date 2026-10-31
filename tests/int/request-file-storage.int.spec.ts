// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildConfig } from 'payload'
import { RequestFiles } from '@/collections/RequestFiles'
import { assertRequestFileStorageReady, getRequestFileStorageOptions, requestFileStoragePlugins } from '@/lib/requestFileStorage'

const configured = {
  REQUEST_FILES_S3_BUCKET: 'private-request-test', REQUEST_FILES_S3_REGION: 'test-region',
  REQUEST_FILES_S3_ACCESS_KEY_ID: 'test-key', REQUEST_FILES_S3_SECRET_ACCESS_KEY: 'test-only-secret',
}
afterEach(() => vi.unstubAllEnvs())

describe('private request file storage', () => {
  it('keeps local development available and blocks unconfigured production uploads', () => {
    expect(requestFileStoragePlugins({})).toEqual([])
    expect(requestFileStoragePlugins({ REQUEST_FILES_S3_FORCE_PATH_STYLE: 'false' })).toEqual([])
    expect(() => assertRequestFileStorageReady({ NODE_ENV: 'development' })).not.toThrow()
    expect(() => assertRequestFileStorageReady({ NODE_ENV: 'production' })).toThrow('Постоянное приватное хранилище')
  })

  it('rejects incomplete settings without exposing supplied secrets', () => {
    const call = () => getRequestFileStorageOptions({ REQUEST_FILES_S3_SECRET_ACCESS_KEY: 'must-not-appear' })
    expect(call).toThrow('REQUEST_FILES_S3_BUCKET')
    try { call() } catch (e) { expect(String(e)).not.toContain('must-not-appear') }
  })

  it.each(['http://storage.example.invalid', 'https://user:password@storage.example.invalid', 'https://storage.example.invalid?secret=value'])('rejects unsafe production endpoint %s', endpoint => {
    expect(() => getRequestFileStorageOptions({ ...configured, NODE_ENV: 'production', REQUEST_FILES_S3_ENDPOINT: endpoint })).toThrow()
  })

  it('allows HTTP only for a local development endpoint', () => {
    expect(getRequestFileStorageOptions({ ...configured, REQUEST_FILES_S3_ENDPOINT: 'http://127.0.0.1:19000' })?.config.endpoint).toBe('http://127.0.0.1:19000')
    expect(() => getRequestFileStorageOptions({ ...configured, REQUEST_FILES_S3_ENDPOINT: 'http://storage.example.invalid' })).toThrow()
  })

  it('protects file reads and keeps the schema unchanged when the adapter is enabled', async () => {
    const base = () => ({ secret: 'offline-test-only', collections: [{ ...RequestFiles, fields: RequestFiles.fields.map(field => ({ ...field })) }], admin: { disable: true } })
    const local = await buildConfig(base())
    const stored = await buildConfig({ ...base(), plugins: requestFileStoragePlugins(configured) })
    const a = local.collections.find(x => x.slug === 'request-files')!
    const b = stored.collections.find(x => x.slug === 'request-files')!
    expect(b.fields.filter(x => 'name' in x).map(x => x.name)).toEqual(a.fields.filter(x => 'name' in x).map(x => x.name))
    expect(b.upload && typeof b.upload === 'object' && b.upload.disableLocalStorage).toBe(true)
    expect(await b.access.read!({ req: { user: null } } as never)).toBe(false)
    expect(await b.access.read!({ req: { user: { id: 1 } } } as never)).toBe(true)
    const options = getRequestFileStorageOptions(configured)!
    expect(options.collections).toEqual({ 'request-files': true })
    expect(options.signedDownloads).toBe(false)
    expect(options.acl).toBeUndefined()
  })

  it('rejects Local API file writes even when callers override access', () => {
    vi.stubEnv('NODE_ENV', 'production')
    for (const name of Object.keys(configured)) vi.stubEnv(name, '')
    const hook = RequestFiles.hooks!.beforeOperation![0]
    expect(() => hook({ operation: 'create', req: { file: { name: 'test.pdf' } }, args: { overrideAccess: true } } as never)).toThrow('Постоянное приватное хранилище')
    expect(() => hook({ operation: 'read', req: {}, args: {} } as never)).not.toThrow()
  })
})
