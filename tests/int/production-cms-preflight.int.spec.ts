// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { checkProductionCms } from '../../scripts/check-production-cms'

const env = {
  DATABASE_URL: 'postgresql://test:private-password@localhost/test', PAYLOAD_SECRET: 'private-payload-value',
  REQUEST_FILES_S3_BUCKET: 'private-test', REQUEST_FILES_S3_REGION: 'test',
  REQUEST_FILES_S3_ACCESS_KEY_ID: 'test-key', REQUEST_FILES_S3_SECRET_ACCESS_KEY: 'private-storage-value',
}

describe('production CMS read-only preflight', () => {
  it('reports missing bindings and never uses the local dotenv database', async () => {
    const result = await checkProductionCms({})
    expect(result.status).toBe('blocked')
    expect(result.mutations).toBe(false)
    expect(result).toHaveProperty('missing', expect.arrayContaining(['DATABASE_URL', 'PAYLOAD_SECRET']))
  })

  it('does not mistake the development database for production or expose credentials', async () => {
    const result = await checkProductionCms(env)
    expect(result).toHaveProperty('configuration', 'loopback-database-is-not-a-production-check')
    const output = JSON.stringify(result)
    for (const value of [env.PAYLOAD_SECRET, 'private-password', env.REQUEST_FILES_S3_SECRET_ACCESS_KEY]) expect(output).not.toContain(value)
  })

  it('rejects an insecure remote endpoint before connecting to any service', async () => {
    const result = await checkProductionCms({ ...env, REQUEST_FILES_S3_ENDPOINT: 'http://storage.example.invalid' })
    expect(result).toHaveProperty('configuration', 'invalid-storage-settings')
    expect(result).not.toHaveProperty('database')
  })
})
