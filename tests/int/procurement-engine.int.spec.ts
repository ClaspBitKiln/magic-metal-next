import { describe, expect, it } from 'vitest'
import { normalizeRFQ } from '@/lib/procurement/normalize'
import { calculateLandedCost } from '@/lib/procurement/landedCost'
import { rankOffers } from '@/lib/procurement/ranking'
import type { Offer } from '@/lib/procurement/types'

describe('procurement engine core', () => {
  it('normalizes a pipe RFQ without inventing missing fields', () => {
    const rfq = normalizeRFQ('Труба бесшовная Ø219 стенка 8 сталь 20 ГОСТ 8732 количество 20 т')
    expect(rfq.items).toHaveLength(1)
    expect(rfq.items[0].diameter.value).toBe(219)
    expect(rfq.items[0].wall.value).toBe(8)
    expect(rfq.items[0].grade.value).toBe('20')
    expect(rfq.items[0].standard.value).toContain('ГОСТ 8732')
    expect(rfq.items[0].quantity.value).toBe(20)
  })

  it('calculates landed cost from pickup logistics', () => {
    expect(calculateLandedCost({ purchase: 100000, pickup: 5000, freight: 12000, handling: 3000 }).total).toBe(120000)
  })

  it('prefers the stronger exact/available offer using landed economics', () => {
    const offers: Offer[] = [
      { id: 'a', sourceId: 'factory-a', supplierId: 'a', product: 'pipe', price: 100000, currency: 'RUB', availability: 'in-stock', pickupCost: 2000, freightCost: 10000, observedAt: new Date().toISOString(), match: 'exact', confidence: 0.95 },
      { id: 'b', sourceId: 'factory-b', supplierId: 'b', product: 'pipe', price: 90000, currency: 'RUB', availability: 'on-request', pickupCost: 2000, freightCost: 30000, observedAt: new Date().toISOString(), match: 'exact', confidence: 0.95 },
    ]
    const result = rankOffers(offers)
    expect(result[0].offerId).toBe('a')
    expect(result[0].landedCost.total).toBe(112000)
  })
})
