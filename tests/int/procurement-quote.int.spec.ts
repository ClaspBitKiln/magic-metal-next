import { describe, expect, it } from 'vitest'
import { buildClientQuote } from '@/lib/procurement/quote'
import type { ProcurementDecision } from '@/lib/procurement/types'

const decision: ProcurementDecision = {
  offerId: 'internal-1', score: 0.9,
  landedCost: { purchase: 100000, supplierCharges: 0, pickup: 2000, freight: 8000, handling: 0, customs: 0, destination: 0, riskAllowance: 0, total: 110000, currency: 'RUB' },
  reasons: ['Точное соответствие'], risks: [], recommended: true,
}
const row = { line: 1, product: 'Труба', size: '219x8', quantity: 20, unit: 'т', decision }

function expectNoInternalCosts(quote: ReturnType<typeof buildClientQuote>) {
  const serialized = JSON.stringify(quote)
  for (const key of ['supplierId', 'sourceId', 'offerId', 'landedCost', 'purchase', 'margin']) {
    expect(serialized).not.toContain(key)
  }
  expect(serialized).not.toContain('internal-1')
  expect(serialized).not.toContain('110000')
}

describe('client-safe quote', () => {
  it('uses an explicitly supplied selling price without exposing internal costs', () => {
    const quote = buildClientQuote([{ ...row, sellingPrice: 140000 }])
    expect(quote.lines[0]).toMatchObject({ price: 140000, status: 'готово к предложению' })
    expectNoInternalCosts(quote)
  })

  it('does not substitute purchase cost when a selling price is missing', () => {
    const quote = buildClientQuote([row])
    expect(quote.lines[0]).toMatchObject({ price: 0, status: 'требует уточнения' })
    expect(quote.notes).toHaveLength(1)
    expectNoInternalCosts(quote)
  })

  it('keeps risky offers subject to internal confirmation without leaking risk details', () => {
    const quote = buildClientQuote([{ ...row, sellingPrice: 140000, decision: { ...decision, risks: ['supplier-secret-risk'] } }])
    expect(quote.lines[0]).toMatchObject({ price: 140000, status: 'требует уточнения' })
    expect(JSON.stringify(quote)).not.toContain('supplier-secret-risk')
    expectNoInternalCosts(quote)
  })
})
