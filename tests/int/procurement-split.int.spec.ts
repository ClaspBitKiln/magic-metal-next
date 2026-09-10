import { describe, expect, it } from 'vitest'
import { optimizeSplitProcurement } from '../../src/lib/procurement/split'
import type { Offer } from '../../src/lib/procurement/types'

const offer = (id: string, supplierId: string, city: string, price: number): Offer => ({
  id, sourceId: 'test-source', supplierId, product: 'Труба', diameter: 100, wall: 5, grade: '20', standard: 'ГОСТ 8732',
  quantity: 10, unit: 'т', price, currency: 'RUB', availability: 'in-stock', city,
  observedAt: new Date().toISOString(), match: 'exact', confidence: 1,
})

describe('split procurement', () => {
  it('chooses the cheaper landed plan, not simply the cheapest line price', () => {
    const plans = optimizeSplitProcurement([
      { itemLine: 1, quantity: 10, unit: 'т', offers: [offer('a1', 'A', 'Москва', 100000), offer('b1', 'B', 'Челябинск', 98000)] },
      { itemLine: 2, quantity: 10, unit: 'т', offers: [offer('a2', 'A', 'Москва', 100000), offer('b2', 'B', 'Челябинск', 98000)] },
    ], [
      { id: 'moscow-tashkent', origin: 'Москва', destination: 'Ташкент', mode: 'road', fixedCost: 50000, variableCostPerTon: 1000, currency: 'RUB', observedAt: new Date().toISOString(), confidence: 1, status: 'verified' },
      { id: 'chel-tashkent', origin: 'Челябинск', destination: 'Ташкент', mode: 'road', fixedCost: 100000, variableCostPerTon: 1000, currency: 'RUB', observedAt: new Date().toISOString(), confidence: 1, status: 'verified' },
    ])

    expect(plans[0].recommended).toBe(true)
    expect(plans[0].supplierCount).toBe(1)
    expect(plans[0].transportRunCount).toBe(1)
  })

  it('does not recommend a plan whose route tariff is unverified', () => {
    const plans = optimizeSplitProcurement([
      { itemLine: 1, quantity: 10, unit: 'т', offers: [offer('a1', 'A', 'Москва', 100000)] },
    ], [
      { id: 'moscow-tashkent', origin: 'Москва', destination: 'Ташкент', mode: 'road', fixedCost: 50000, variableCostPerTon: 1000, currency: 'RUB', observedAt: new Date().toISOString(), confidence: 1, status: 'needs-verification' },
    ])

    expect(plans[0].recommended).toBe(false)
    expect(plans[0].risks.length).toBeGreaterThan(0)
  })
})
