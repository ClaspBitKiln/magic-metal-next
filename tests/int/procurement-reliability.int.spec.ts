import { describe, expect, it } from 'vitest'
import { assessOfferQuality, freshnessScore, reliabilityFromHistory } from '@/lib/procurement/reliability'
import { rankOffersEnhanced } from '@/lib/procurement/rankingEnhanced'
import type { Offer } from '@/lib/procurement/types'

const base = (id: string, price: number, observedAt: string): Offer => ({ id, sourceId: id, supplierId: id, product: 'pipe', price, currency: 'RUB', availability: 'in-stock', observedAt, match: 'exact', confidence: 0.95 })

describe('supplier reliability and data freshness', () => {
  it('decays freshness as data ages', () => {
    const now = new Date('2026-09-10T00:00:00Z')
    expect(freshnessScore('2026-09-10T00:00:00Z', 7, now)).toBe(1)
    expect(freshnessScore('2026-09-06T12:00:00Z', 7, now)).toBeGreaterThan(0.45)
    expect(freshnessScore('2026-09-01T00:00:00Z', 7, now)).toBe(0)
  })

  it('uses execution history when available', () => {
    expect(reliabilityFromHistory({ supplierId: 'a', reliabilityScore: 0.9 })).toBe(0.9)
    expect(reliabilityFromHistory({ supplierId: 'b', completedDeliveries: 10, confirmedDeliveries: 8, onTimeDeliveries: 7 })).toBeCloseTo(0.76)
    expect(reliabilityFromHistory()).toBe(0.5)
  })

  it('does not treat missing history as zero reliability', () => {
    const quality = assessOfferQuality(base('a', 100000, '2026-09-10T00:00:00Z'))
    expect(quality.supplierReliability).toBe(0.5)
    expect(quality.risks).toContain('Нет истории исполнения поставщика')
  })

  it('can prefer a slightly more expensive supplier with materially better reliability and freshness', () => {
    const now = new Date('2026-09-10T00:00:00Z')
    const offers = [base('cheap-old', 95000, '2026-08-20T00:00:00Z'), base('reliable-fresh', 100000, '2026-09-10T00:00:00Z')]
    const result = rankOffersEnhanced(offers, {}, { now, supplierHistory: { 'cheap-old': { supplierId: 'cheap-old', reliabilityScore: 0.55 }, 'reliable-fresh': { supplierId: 'reliable-fresh', reliabilityScore: 0.98 } } })
    expect(result[0].offerId).toBe('reliable-fresh')
  })
})
