import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { createGunzip } from 'node:zlib'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'
import type { SupplierOffer } from '../src/payload-types'

type SourceSeed = {
  code: string
  name: string
  website: string
  sourceType: 'price-file' | 'public-catalog' | 'marketplace' | 'api'
  enabled: boolean
  publicVisible: false
  lastImportStatus: 'pending' | 'success' | 'partial' | 'error'
  notes?: string
}

type OfferSeed = {
  sourceCode: string
  externalKey: string
  category?: string
  product: string
  designation?: string
  size: string
  diameter?: string
  wall?: string
  standard?: string
  price?: number
  currency?: 'RUB' | 'USD' | 'EUR' | 'UZS' | 'KZT' | 'CNY'
  unit?: string
  availability: 'price-confirmed' | 'market-listed' | 'on-request' | 'inactive'
  sourceUrl?: string
  observedAt: string
  raw?: SupplierOffer['raw']
}

const root = process.cwd()
const selectedSource = process.argv.find((value) => value.startsWith('--source='))?.split('=')[1] || 'all'
const limitValue = Number(process.argv.find((value) => value.startsWith('--limit='))?.split('=')[1] || 0)
const sources = JSON.parse(fs.readFileSync(path.join(root, 'private/data/supplier-sources.json'), 'utf8')) as SourceSeed[]
const sourceIds = new Map<string, number>()

const payload = await getPayload({ config })

async function upsertSource(seed: SourceSeed) {
  const existing = await payload.find({ collection: 'supplier-sources', where: { code: { equals: seed.code } }, limit: 1 })
  const data = { ...seed, lastCheckedAt: new Date().toISOString() }
  const document = existing.docs[0]
    ? await payload.update({ collection: 'supplier-sources', id: existing.docs[0].id, data })
    : await payload.create({ collection: 'supplier-sources', data })
  sourceIds.set(seed.code, document.id)
}

async function existingKeysForSource(sourceId: number) {
  const keys = new Set<string>()
  let page = 1
  while (true) {
    const result = await payload.find({
      collection: 'supplier-offers',
      where: { supplier: { equals: sourceId } },
      select: { externalKey: true },
      limit: 1000,
      page,
      depth: 0,
    })
    result.docs.forEach((document) => keys.add(document.externalKey))
    if (!result.hasNextPage) break
    page += 1
  }
  return keys
}

async function importOffers(sourceCode: string, seeds: AsyncIterable<OfferSeed>) {
  const sourceId = sourceIds.get(sourceCode)
  if (!sourceId) throw new Error(`Supplier source ${sourceCode} is not registered`)
  const existingKeys = await existingKeysForSource(sourceId)
  let seen = 0
  let created = 0
  const pending = new Set<Promise<void>>()

  const enqueue = async (seed: OfferSeed) => {
    if (existingKeys.has(seed.externalKey)) return
    const operation = payload.create({
      collection: 'supplier-offers',
      data: {
        supplier: sourceId,
        externalKey: seed.externalKey,
        category: seed.category,
        product: seed.product,
        designation: seed.designation,
        size: seed.size || 'По карточке поставщика',
        diameter: seed.diameter,
        wall: seed.wall,
        standard: seed.standard,
        price: seed.price,
        currency: seed.currency || 'RUB',
        unit: seed.unit,
        availability: seed.availability,
        sourceUrl: seed.sourceUrl,
        observedAt: new Date(seed.observedAt).toISOString(),
        raw: seed.raw,
        active: true,
      },
    }).then(() => { created += 1 }).then(() => undefined)
    pending.add(operation)
    operation.finally(() => pending.delete(operation))
    if (pending.size >= 16) await Promise.race(pending)
  }

  for await (const seed of seeds) {
    seen += 1
    await enqueue(seed)
    if (limitValue && seen >= limitValue) break
    if (seen % 10_000 === 0) console.log(`${sourceCode}: ${seen.toLocaleString('ru-RU')} прочитано · ${created.toLocaleString('ru-RU')} добавлено`)
  }
  await Promise.all(pending)
  console.log(`${sourceCode}: готово · ${seen.toLocaleString('ru-RU')} прочитано · ${created.toLocaleString('ru-RU')} добавлено`)
}

async function* metalserviceOffers(): AsyncGenerator<OfferSeed> {
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'public/data/mc-price-snapshot.json'), 'utf8')) as { snapshotDate: string; rows: Array<Record<string, string | undefined>> }
  for (const row of snapshot.rows) yield {
    sourceCode: 'metalservice',
    externalKey: `metalservice:${row.id}`,
    category: row.category,
    product: row.product || '',
    designation: row.designation,
    size: row.size || '',
    diameter: row.diameter,
    wall: row.wall,
    standard: row.standard,
    availability: 'price-confirmed',
    sourceUrl: 'https://mc.ru/products/msk',
    observedAt: snapshot.snapshotDate,
  }
}

async function* twentyThreeMetOffers(): AsyncGenerator<OfferSeed> {
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'private/data/23met-practical-snapshot.json'), 'utf8')) as { snapshotDate: string; groups: Array<{ id: string; title: string; sizes: string[]; sourcePages: string[] }> }
  for (const group of snapshot.groups) for (const size of group.sizes) yield {
    sourceCode: '23met',
    externalKey: `23met:${crypto.createHash('sha256').update(`${group.id}\u001f${size}`).digest('hex').slice(0, 24)}`,
    product: group.title,
    size,
    availability: 'market-listed',
    sourceUrl: group.sourcePages[0],
    observedAt: snapshot.snapshotDate,
  }
}

async function* eMetallOffers(): AsyncGenerator<OfferSeed> {
  const input = fs.createReadStream(path.join(root, 'private/data/e-metall-products.ndjson.gz')).pipe(createGunzip())
  const lines = readline.createInterface({ input, crlfDelay: Infinity })
  for await (const line of lines) if (line.trim()) yield JSON.parse(line) as OfferSeed
}

for (const source of sources) await upsertSource(source)

const imports: Record<string, [string, () => AsyncGenerator<OfferSeed>]> = {
  metalservice: ['metalservice', metalserviceOffers],
  '23met': ['23met', twentyThreeMetOffers],
  'e-metall': ['e-metall', eMetallOffers],
}

for (const [key, [sourceCode, generator]] of Object.entries(imports)) {
  if (selectedSource !== 'all' && selectedSource !== key) continue
  await importOffers(sourceCode, generator())
  const source = await payload.find({ collection: 'supplier-sources', where: { code: { equals: sourceCode } }, limit: 1 })
  if (source.docs[0]) await payload.update({ collection: 'supplier-sources', id: source.docs[0].id, data: { lastImportStatus: 'success', lastCheckedAt: new Date().toISOString() } })
}

await (payload as Payload).destroy()
