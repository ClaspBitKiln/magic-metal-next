import { describe, expect, it } from 'vitest'
import { calculateDeal, type DealInput } from '@/lib/dealQuoteEngine'

describe('automatic deal quote engine', () => {
  const base: DealInput = {
    mode: 'rf',
    lines: [
      { id: 1, name: 'Лист 5×1300×6000 MAGSTRONG S700MC', unit: 'т', quantity: 0.35, productKey: 's700mc-5-1300-6000' },
      { id: 2, name: 'Лист 14×1500×6000 09Г2С ГОСТ 19903-2015', unit: 'т', quantity: 2, productKey: '09г2с-14-1500-6000-gost19903-2015' },
    ],
    referencePrices: [
      { productKey: 's700mc-5-1300-6000', price: 310000, unit: 'т', source: 'METALLSERVICE', observedAt: '2026-09-09', location: 'Москва' },
      { productKey: '09г2с-14-1500-6000-gost19903-2015', price: 62000, unit: 'т', source: 'METALLSERVICE', observedAt: '2026-09-09', location: 'Москва' },
    ],
    freightPerUnit: { '1': 0, '2': 0 },
    fixedExpenses: { delivery: 30000 },
    pricing: { method: 'markup', value: 15, vatRate: 0.22 },
    marketOffers: {
      '1': [{ source: 'Другой рынок', price: 300000, location: 'Владимир', leadDays: 4, loadingPoint: 'Владимир', observedAt: '2026-09-09' }],
      '2': [{ source: 'Другой рынок', price: 65000, location: 'Тула', leadDays: 3, loadingPoint: 'Тула', observedAt: '2026-09-09' }],
    },
  }

  it('uses Metallservice reference prices as the automatic procurement base', () => {
    const result = calculateDeal(base)
    expect(result.purchaseTotal).toBe(232500)
    expect(result.fixedExpensesTotal).toBe(30000)
    expect(result.costTotal).toBe(262500)
    expect(result.saleTotal).toBe(301875)
    expect(result.plannedProfit).toBe(39375)
  })

  it('highlights only offers below the Metallservice base', () => {
    const result = calculateDeal(base)
    expect(result.cheaperLineCount).toBe(1)
    expect(result.potentialSaving).toBe(3500)
    expect(result.lines[0].cheaperMarketPrice).toBe(300000)
    expect(result.lines[1].cheaperMarketPrice).toBeNull()
  })

  it('blocks automatic sale calculation when a reference price is missing', () => {
    const result = calculateDeal({
      ...base,
      referencePrices: base.referencePrices.slice(0, 1),
    })
    expect(result.missingReferenceCount).toBe(1)
    expect(result.saleTotal).toBe(0)
  })

  it('supports export earnings as a percentage of input VAT', () => {
    const result = calculateDeal({
      ...base,
      mode: 'export',
      pricing: { method: 'vat-percent', value: 50, vatRate: 0.22 },
    })
    expect(result.inputVat).toBe(51150)
    expect(result.vatEffectPlanned).toBe(25575)
    expect(result.saleTotal).toBe(288075)
  })
})
