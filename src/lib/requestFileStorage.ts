import { s3Storage, type S3StorageOptions } from '@payloadcms/storage-s3'
import { APIError, type Plugin } from 'payload'

type Environment = Record<string, string | undefined>
const required = ['REQUEST_FILES_S3_BUCKET', 'REQUEST_FILES_S3_REGION', 'REQUEST_FILES_S3_ACCESS_KEY_ID', 'REQUEST_FILES_S3_SECRET_ACCESS_KEY'] as const

export function getRequestFileStorageOptions(env: Environment = process.env): S3StorageOptions | undefined {
  const names = [...required, 'REQUEST_FILES_S3_ENDPOINT', 'REQUEST_FILES_S3_SESSION_TOKEN']
  if (!names.some(name => Boolean(env[name]?.trim()))) return undefined
  const missing = required.filter(name => !env[name]?.trim())
  if (missing.length) throw new Error(`Missing request file storage settings: ${missing.join(', ')}`)
  const endpoint = env.REQUEST_FILES_S3_ENDPOINT?.trim()
  if (endpoint) {
    let url: URL
    try { url = new URL(endpoint) } catch { throw new Error('Invalid REQUEST_FILES_S3_ENDPOINT') }
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && local && url.protocol === 'http:'))) {
      throw new Error('REQUEST_FILES_S3_ENDPOINT requires HTTPS without credentials or query parameters')
    }
  }
  const pathStyle = env.REQUEST_FILES_S3_FORCE_PATH_STYLE?.trim()
  if (pathStyle && !['true', 'false'].includes(pathStyle)) throw new Error('REQUEST_FILES_S3_FORCE_PATH_STYLE must be true or false')
  return {
    bucket: env.REQUEST_FILES_S3_BUCKET!.trim(),
    collections: { 'request-files': true },
    // Omit ACL/prefix/client uploads: private bucket policy and Payload access
    // checks protect downloads, and the existing database schema stays intact.
    signedDownloads: false,
    config: {
      region: env.REQUEST_FILES_S3_REGION!.trim(),
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: pathStyle === 'true',
      credentials: {
        accessKeyId: env.REQUEST_FILES_S3_ACCESS_KEY_ID!.trim(),
        secretAccessKey: env.REQUEST_FILES_S3_SECRET_ACCESS_KEY!,
        ...(env.REQUEST_FILES_S3_SESSION_TOKEN ? { sessionToken: env.REQUEST_FILES_S3_SESSION_TOKEN } : {}),
      },
    },
  }
}

export function requestFileStoragePlugins(env: Environment = process.env): Plugin[] {
  const options = getRequestFileStorageOptions(env)
  return options ? [s3Storage(options)] : []
}

export function assertRequestFileStorageReady(env: Environment = process.env) {
  if (env.NODE_ENV === 'production' && !getRequestFileStorageOptions(env)) {
    throw new APIError('Постоянное приватное хранилище файлов заявок не настроено', 503)
  }
}
