import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { getRequestFileStorageOptions } from '../src/lib/requestFileStorage'

type Environment = Record<string, string | undefined>
const required = ['DATABASE_URL', 'PAYLOAD_SECRET', 'REQUEST_FILES_S3_BUCKET', 'REQUEST_FILES_S3_REGION', 'REQUEST_FILES_S3_ACCESS_KEY_ID', 'REQUEST_FILES_S3_SECRET_ACCESS_KEY']
const errorCode = (error: unknown) => {
  const value = error as { code?: unknown; name?: unknown }
  const code = typeof value?.code === 'string' ? value.code : typeof value?.name === 'string' ? value.name : 'UNKNOWN'
  return code.replace(/[^A-Za-z0-9_]/g, '').slice(0, 80)
}

export async function checkProductionCms(env: Environment = process.env) {
  const missing = required.filter(name => !env[name]?.trim())
  if (missing.length) return { status: 'blocked', missing, mutations: false }
  let options: ReturnType<typeof getRequestFileStorageOptions>
  try { options = getRequestFileStorageOptions({ ...env, NODE_ENV: 'production' }) } catch {
    return { status: 'blocked', configuration: 'invalid-storage-settings', mutations: false }
  }
  let databaseURL: URL
  try { databaseURL = new URL(env.DATABASE_URL!) } catch {
    return { status: 'blocked', configuration: 'invalid-database-url', mutations: false }
  }
  if (!['postgres:', 'postgresql:'].includes(databaseURL.protocol)) {
    return { status: 'blocked', configuration: 'invalid-database-protocol', mutations: false }
  }
  if (['localhost', '127.0.0.1', '[::1]'].includes(databaseURL.hostname)) {
    return { status: 'blocked', configuration: 'loopback-database-is-not-a-production-check', mutations: false }
  }
  // Resolve the documented dependencies of the installed adapters. No shell,
  // credential files, dotenv loading, Payload initialization or migrations.
  const require = createRequire(import.meta.url)
  const { Pool } = require(require.resolve('pg', { paths: [require.resolve('@payloadcms/db-postgres')] }))
  const { S3Client, HeadBucketCommand, GetPublicAccessBlockCommand } = require(require.resolve('@aws-sdk/client-s3', { paths: [require.resolve('@payloadcms/storage-s3')] }))
  const database: Record<string, unknown> = {}
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000,
    application_name: 'magicmet-readonly-preflight', options: '-c default_transaction_read_only=on -c statement_timeout=5000' })
  try {
    const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
    const tables = new Set(result.rows.map((row: { table_name: string }) => row.table_name))
    const missingTables = ['users', 'requests', 'request_files', 'payload_migrations'].filter(name => !tables.has(name))
    Object.assign(database, { connected: true, schema: tables.size === 0 ? 'empty-needs-reviewed-migration' : 'existing', missingTables })
    database.requiredTablesPresent = missingTables.length === 0
  } catch (error) { Object.assign(database, { connected: false, errorCode: errorCode(error) }) } finally { await pool.end() }
  const storage: Record<string, unknown> = {}
  const client = new S3Client({ ...options!.config, maxAttempts: 1 })
  try {
    await client.send(new HeadBucketCommand({ Bucket: options!.bucket }), { abortSignal: AbortSignal.timeout(10000) })
    storage.reachable = true
    const result = await client.send(new GetPublicAccessBlockCommand({ Bucket: options!.bucket }), { abortSignal: AbortSignal.timeout(10000) })
    const policy = result.PublicAccessBlockConfiguration
    storage.publicAccessBlocked = Boolean(policy?.BlockPublicAcls && policy?.IgnorePublicAcls && policy?.BlockPublicPolicy && policy?.RestrictPublicBuckets)
  } catch (error) {
    storage.errorCode = errorCode(error)
    storage.publicAccessBlocked = 'unverified-provider-policy-or-permissions'
  } finally { client.destroy() }
  const passed = database.requiredTablesPresent === true && storage.reachable === true && storage.publicAccessBlocked === true
  return { status: passed ? 'preflight-passed' : 'blocked', database, storage, mutations: false,
    remaining: 'Still requires reviewed migration history, real upload/download validation and provider permission review. A preflight is not proof of write permissions or full CMS readiness.' }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await checkProductionCms()
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.status === 'preflight-passed' ? 0 : 2
  } catch (error) {
    console.log(JSON.stringify({ status: 'blocked', errorCode: errorCode(error), mutations: false }))
    process.exitCode = 2
  }
}
