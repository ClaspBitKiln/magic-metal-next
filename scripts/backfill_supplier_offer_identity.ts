import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildProductIdentityKey, normalizeProductIdentity } from '../src/lib/procurement/productIdentity'

const payload = await getPayload({ config })
let page = 1
let updated = 0

while (true) {
  const result = await payload.find({
    collection: 'supplier-offers',
    limit: 500,
    page,
    depth: 0,
    select: { product: true, designation: true, standard: true, diameter: true, wall: true },
  })

  for (const doc of result.docs) {
    const identity = normalizeProductIdentity(doc)
    await payload.update({
      collection: 'supplier-offers',
      id: doc.id,
      data: { ...identity, productIdentityKey: buildProductIdentityKey(doc) },
    })
    updated += 1
  }

  if (!result.hasNextPage) break
  page += 1
}

console.log(`Supplier offer identity backfill complete: ${updated} records updated`)
await payload.destroy()
