import { describe, expect, it } from 'vitest'
import { optimizeQuantitySplit } from '@/lib/procurement/quantitySplit'
import type { Offer } from '@/lib/procurement/types'

const offer = (id: string, price: number, quantity?: number): Offer => ({ id, sourceId: id, supplierId: id, product: 'pipe', price, quantity, currency: 'RUB', availability: 'in-stock', observedAt: new Date().toISOString(), match: 'exact', confidence: 0.95 })

describe('quantity-level split procurement', () => {
  it('splits one RFQ line across real offer quantities', () => {
    const result = optimizeQuantitySplit({ itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 100000, 12), offer('b', 101000, 8)] })
    expect(result).toHaveLength(2)
    expect(result.reduce((sum, item) => sum + item.quantity, 0)).toBe(20)
    expect(result[0].quantity).toBe(12)
    expect(result[1].quantity).toBe(8)
  })

  it('returns no allocation when available quantities cannot cover the RFQ', () => {
    expect(optimizeQuantitySplit({ itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 100000, 12)] })).toEqual([])
  })
})
