import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { RequestFiles } from './collections/RequestFiles'
import { Requests } from './collections/Requests'
import { SupplierOffers } from './collections/SupplierOffers'
import { SupplierSources } from './collections/SupplierSources'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function requiredEnv(name: 'PAYLOAD_SECRET' | 'DATABASE_URL') {
  const value = process.env[name]
  if (!value) throw new Error(`Обязательная переменная окружения ${name} не задана`)
  return value
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Products, RequestFiles, Requests, SupplierSources, SupplierOffers],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: requiredEnv('PAYLOAD_SECRET'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requiredEnv('DATABASE_URL'),
    },
  }),
  sharp,
  plugins: [],
})
