import type { Payload } from 'payload'
import type { NormalizedRFQItem, Offer } from './types'
import type { ProcurementAdapter } from './engine'

type SupplierOfferDoc = {
  id: string | number
  supplier: string | number | { id: string | number }
  product: string
  designation?: string
  size: string
  diameter?: string
  wall?: string
  standard?: string
  price?: number
  currency?: string
  unit?: string
  availability: 'price-confirmed' | 'market-listed' | 'on-request' | 'inactive'
  sourceUrl?: string
  observedAt: string
  active?: boolean
}

const sourceId = (supplier: SupplierOfferDoc['supplier']) => typeof supplier === 'object' ? supplier.id : supplier
const availability = (value: SupplierOfferDoc['availability']): Offer['availability'] => ({
  'price-confirmed': 'in-stock',
  'market-listed': 'limited',
  'on-request': 'on-request',
  inactive: 'unknown',
}[value])

const numberFrom = (value?: string) => {
  if (!value) return undefined
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

const normalized = (value?: string) => value?.toLowerCase().replace(/[\s°×xх-]+/g, '')
const equalNormalized = (a?: string, b?: string) => {
  if (!a || !b) return false
  return normalized(a) === normalized(b)
}

const productMatches = (doc: SupplierOfferDoc, item: NormalizedRFQItem) => {
  const requested = normalized(item.product.value)
  if (!requested) return false
  const product = normalized(doc.product)
  const designation = normalized(doc.designation)
  return Boolean(product && (product.includes(requested) || requested.includes(product) || designation?.includes(requested)))
}

export function createPayloadOfferAdapter(payload: Payload): ProcurementAdapter {
  return {
    id: 'payload-supplier-offers',
    async search(item) {
      const result = await payload.find({
        collection: 'supplier-offers',
        where: { active: { equals: true } },
        limit: 1000,
        depth: 0,
        sort: '-observedAt',
      })
      const candidates = result.docs as unknown as SupplierOfferDoc[]
      return candidates
        .map((doc): Offer | null => {
          if (!productMatches(doc, item)) return null

          const diameter = numberFrom(doc.diameter)
          const wall = numberFrom(doc.wall)
          const gradeMatch = !item.grade.value || equalNormalized(doc.designation, item.grade.value) || normalized(doc.designation)?.includes(normalized(item.grade.value) ?? '___')
          const standardMatch = !item.standard.value || equalNormalized(doc.standard, item.standard.value) || normalized(doc.standard)?.includes(normalized(item.standard.value) ?? '___')
          const diameterMatch = item.diameter.value === undefined || diameter === item.diameter.value
          const wallMatch = item.wall.value === undefined || wall === item.wall.value
          if (!gradeMatch || !standardMatch || !diameterMatch || !wallMatch) return null

          const exact = Boolean(gradeMatch && standardMatch && diameterMatch && wallMatch)
          return {
            id: String(doc.id),
            sourceId: String(sourceId(doc.supplier)),
            supplierId: String(sourceId(doc.supplier)),
            product: doc.product,
            subtype: doc.designation,
            diameter,
            wall,
            standard: doc.standard,
            grade: doc.designation,
            price: doc.price,
            currency: doc.currency ?? 'RUB',
            unit: doc.unit,
            availability: availability(doc.availability),
            observedAt: doc.observedAt,
            match: exact ? 'exact' : 'clarification-required',
            confidence: exact ? (doc.availability === 'price-confirmed' ? 0.98 : 0.9) : 0.6,
          }
        })
        .filter((offer): offer is Offer => Boolean(offer))
    },
  }
}
