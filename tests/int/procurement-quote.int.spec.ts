import { describe, expect, it } from 'vitest'
import { buildClientQuote } from '@/lib/procurement/quote'

describe('client-safe quote', () => {
  it('does not expose supplier or source fields', () => {
    const quote = buildClientQuote([{ line: 1, product: 'Труба', size: '219x8', quantity: 20, unit: 'т', decision: { offerId: 'internal-1', score: 0.9, landedCost: { purchase: 100000, supplierCharges: 0, pickup: 2000, freight: 8000, handling: 0, customs: 0, destination: 0, riskAllowance: 0, total: 110000, currency: 'RUB' }, reasons: ['Точное соответствие'], risks: [], recommended: true } }])
    expect(quote.lines[0].price).toBe(110000)
    expect(JSON.stringify(quote)).not.toContain('supplierId')
    expect(JSON.stringify(quote)).not.toContain('sourceId')
    expect(JSON.stringify(quote)).not.toContain('offerId')
  })
})
