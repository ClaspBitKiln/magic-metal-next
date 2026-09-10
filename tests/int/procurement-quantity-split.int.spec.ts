import { describe, expect, it } from 'vitest'
import { optimizeSplitProcurement } from '@/lib/procurement/split'
import type { LogisticsRoute, Offer } from '@/lib/procurement/types'

const offer = (id: string, supplierId: string, city: string, price: number, quantity: number, overrides: Partial<Offer> = {}): Offer => ({
  id,
  sourceId: id,
  supplierId,
  product: 'pipe',
  price,
  quantity,
  currency: 'RUB',
  availability: 'in-stock',
  city,
  observedAt: '2026-09-10T10:00:00.000Z',
  match: 'exact',
  confidence: 0.95,
  ...overrides,
})

const route = (id: string, origin: string, fixedCost: number, variableCostPerTon: number, capacityTons?: number, status: LogisticsRoute['status'] = 'verified'): LogisticsRoute => ({
  id,
  origin,
  destination: 'Ташкент',
  mode: 'road',
  fixedCost,
  variableCostPerTon,
  capacityTons,
  currency: 'RUB',
  observedAt: '2026-09-10T10:00:00.000Z',
  confidence: 0.9,
  status,
})

describe('quantity-level split procurement', () => {
  it('allocates a 20t line exactly as 12t + 8t when supplier quantities are constrained', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 'A', 'Москва', 100000, 12), offer('b', 'B', 'Москва', 101000, 8)] },
    ], [route('moscow-tashkent', 'Москва', 50000, 5000, 25)])

    expect(result.length).toBeGreaterThan(0)
    const best = result[0]
    expect(best.allocations.map((item) => item.quantity)).toEqual(expect.arrayContaining([12, 8]))
    expect(best.allocations.reduce((sum, item) => sum + item.quantity, 0)).toBe(20)
    expect(best.supplierCount).toBe(2)
    expect(best.transportRunCount).toBe(1)
  })

  it('compares single source against partial split and keeps the cheaper landed-cost plan first', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [
        offer('a', 'A', 'Москва', 100000, 10),
        offer('b', 'B', 'Москва', 99000, 10),
        offer('c', 'C', 'Екатеринбург', 103000, 20),
      ] },
    ], [
      route('moscow-tashkent', 'Москва', 80000, 3000, 25),
      route('ekb-tashkent', 'Екатеринбург', 120000, 3000, 25),
    ])

    expect(result.length).toBeGreaterThan(1)
    expect(result[0].landedCost).toBeLessThanOrEqual(result[1].landedCost)
    expect(result[0].allocations.reduce((sum, item) => sum + item.quantity, 0)).toBe(20)
  })

  it('rejects a split when its extra transport run makes it more expensive', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [
        offer('a', 'A', 'Москва', 100000, 12),
        offer('b', 'B', 'Екатеринбург', 95000, 8),
        offer('c', 'C', 'Москва', 101000, 20),
      ] },
    ], [
      route('moscow-tashkent', 'Москва', 40000, 2000, 25),
      route('ekb-tashkent', 'Екатеринбург', 300000, 2000, 25),
    ])

    expect(result[0].allocations).toHaveLength(1)
    expect(result[0].allocations[0].offerId).toBe('c')
    expect(result[0].allocations[0].quantity).toBe(20)
  })

  it('rejects a plan that exceeds route capacity', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 'A', 'Москва', 100000, 20)] },
    ], [route('moscow-tashkent', 'Москва', 50000, 5000, 15)])

    expect(result).toEqual([])
  })

  it('does not invent stock when an offer has no confirmed quantity', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 'A', 'Москва', 100000, Number.NaN)] },
    ], [route('moscow-tashkent', 'Москва', 50000, 5000, 25)])

    expect(result).toEqual([])
  })

  it('marks observed logistics as a risk and does not recommend it by default', () => {
    const result = optimizeSplitProcurement([
      { itemLine: 1, quantity: 20, unit: 'т', offers: [offer('a', 'A', 'Москва', 100000, 20)] },
    ], [route('moscow-tashkent', 'Москва', 50000, 5000, 25, 'observed')], 'Ташкент', { allowObservedRoutes: true })

    expect(result[0].risks.length).toBeGreaterThan(0)
    expect(result[0].recommended).toBe(false)
  })
})
