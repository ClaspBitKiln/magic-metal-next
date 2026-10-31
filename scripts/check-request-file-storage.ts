import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { default: S3rver } = await import(pathToFileURL(process.env.S3_TEST_EMULATOR_MODULE || '/tmp/magicmet-s3-emulator/node_modules/s3rver/lib/s3rver.js').href)
import { buildConfig, getPayload } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { REST_GET } from '@payloadcms/next/routes'
import { Users } from '../src/collections/Users'
import { RequestFiles } from '../src/collections/RequestFiles'
import { Requests } from '../src/collections/Requests'
import { requestFileStoragePlugins } from '../src/lib/requestFileStorage'

if (process.env.NODE_ENV === 'production') throw new Error('Run this disposable local verifier outside production mode')

const suffix = crypto.randomBytes(5).toString('hex')
const database = `magicmet_storage_${suffix}`
const directory = await fs.mkdtemp('/tmp/magicmet-s3-data-')
const server = new S3rver({ address: '127.0.0.1', port: 19000, directory, silent: true, allowMismatchedSignatures: false, configureBuckets: [{ name: 'private-requests', configs: [] }] })
const dockerArgs = ['--host=unix:///var/run/docker.sock', 'compose', 'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c']
function sql(statement: string) {
  const result = spawnSync('docker', [...dockerArgs, statement], { encoding: 'utf8' })
  if (result.status) throw new Error('Disposable database command failed')
}
let payload: Awaited<ReturnType<typeof getPayload>> | undefined
let databaseCreated = false
try {
  sql(`CREATE DATABASE ${database}`)
  databaseCreated = true
  await server.run()
  const env = {
    REQUEST_FILES_S3_BUCKET: 'private-requests', REQUEST_FILES_S3_REGION: 'us-east-1',
    REQUEST_FILES_S3_ACCESS_KEY_ID: 'S3RVER', REQUEST_FILES_S3_SECRET_ACCESS_KEY: 'S3RVER',
    REQUEST_FILES_S3_ENDPOINT: 'http://127.0.0.1:19000', REQUEST_FILES_S3_FORCE_PATH_STYLE: 'true',
  }
  const config = await buildConfig({
    secret: crypto.randomBytes(48).toString('hex'),
    admin: { disable: true },
    collections: [Users, RequestFiles, Requests],
    db: postgresAdapter({ pool: { connectionString: `postgres://postgres:postgres@127.0.0.1:5432/${database}` } }),
    plugins: requestFileStoragePlugins(env),
  })
  payload = await getPayload({ config })
  const db = payload.db as typeof payload.db & { pool?: { on: (event: string, handler: () => void) => unknown } }
  db.pool?.on('error', () => {})
  const password = crypto.randomBytes(24).toString('hex')
  const email = 'storage-check@example.invalid'
  await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>', '<< /Length 0 >>\nstream\n\nendstream']
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n` })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const bytes = Buffer.from(pdf)
  const file = await payload.create({ collection: 'request-files', data: { description: 'Isolated fixture; no mail' }, file: { name: `storage-${suffix}.pdf`, data: bytes, mimetype: 'application/pdf', size: bytes.length }, overrideAccess: true })
  assert(file.url?.includes('/api/request-files/file/'))
  assert(!file.url?.includes('19000'))
  const request = await payload.create({ collection: 'requests', data: { name: 'Storage fixture', phone: 'fixture', message: 'Storage fixture; no delivery', files: [file.id] }, overrideAccess: true })
  const stored = await payload.findByID({ collection: 'requests', id: request.id, depth: 1, overrideAccess: true })
  assert.equal((stored.files?.[0] as { id: number }).id, file.id)
  const get = REST_GET(config)
  const url = `http://localhost/api/request-files/file/${file.filename}`
  const args = { params: Promise.resolve({ slug: ['request-files', 'file', file.filename!] }) }
  const denied = await get(new Request(url), args)
  assert([401, 403].includes(denied.status), `Anonymous file status ${denied.status}`)
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const allowed = await get(new Request(url, { headers: { Authorization: `JWT ${login.token}` } }), args)
  assert.equal(allowed.status, 200)
  assert.deepEqual(Buffer.from(await allowed.arrayBuffer()), bytes)
  console.log(JSON.stringify({ fileCreated: true, requestLinked: true, payloadURL: true, anonymousStatus: denied.status, authorizedStatus: allowed.status, identicalBytes: true, storage: 'local filesystem S3 emulator; production bucket policy unverified', externalMail: false }))
} catch (error) {
  console.error(JSON.stringify({ integrationFailed: true, error: error instanceof Error ? error.message : 'Unknown integration error' }))
  process.exitCode = 1
} finally {
  await payload?.destroy()
  await server.close().catch(() => {})
  if (databaseCreated) sql(`DROP DATABASE ${database} WITH (FORCE)`)
  await fs.rm(directory, { recursive: true, force: true })
}
