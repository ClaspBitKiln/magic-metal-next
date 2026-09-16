import { describe, expect, it } from 'vitest'
import { amount, compareOptions, evaluateOption, tons } from '../../src/lib/procurement/workbench'
import { calculateLandedCost } from '../../src/lib/procurement/landedCost'
import type { NormalizedRFQItem, Offer } from '../../src/lib/procurement/types'

const item = {
  quantity: { value: 20 }, unit: { value: 'т' }, grade: { value: '09Г2С' },
  standard: { value: 'ГОСТ 8732-78' }, destination: { value: 'Челябинск' },
} as NormalizedRFQItem
const offer = { id: 'a', match: 'exact', unit: 't' } as Offer
const decision = { offerId: 'a', score: 0.9, landedCost: calculateLandedCost({ purchase: 100000 }), reasons: [], risks: [], recommended: true }
const review = { price: '100000', stock: '20', expenses: '100000', verificationNote: 'Счёт поставщика №1 от 15.09.2026', confirmed: true }

describe('Procurement workbench decisions', () => {
  it('adds trip expenses once to the full requested tonnage', () => {
    expect(evaluateOption(item, offer, review, decision)).toMatchObject({ ready: true, total: 2100000, unitCost: 105000 })
  })
  it('converts a kilogram RFQ without multiplying the quote a thousandfold', () => {
    expect(evaluateOption({ ...item, quantity: { value: 20000, confidence: 'high' }, unit: { value: 'кг', confidence: 'high' } }, offer, review, decision).total).toBe(2100000)
    expect(tons(20, 'шт')).toBeUndefined()
  })
  it.each(['', '-1', 'NaN', 'Infinity', '1e9'])('rejects missing or invalid expenses: %s', expenses => {
    expect(evaluateOption(item, offer, { ...review, expenses }).ready).toBe(false)
  })
  it('distinguishes explicitly free delivery from unknown delivery', () => {
    expect(evaluateOption(item, offer, { ...review, expenses: '0' }, decision).total).toBe(2000000)
    expect(evaluateOption(item, offer, { ...review, expenses: '' }).total).toBeUndefined()
    expect(amount('1 250,50')).toBe(1250.5)
  })
  it('blocks unknown or insufficient stock and unverified terms', () => {
    for (const stock of ['', '0', '18']) expect(evaluateOption(item, offer, { ...review, stock }).ready).toBe(false)
    expect(evaluateOption(item, offer, { ...review, confirmed: false }).ready).toBe(false)
    expect(evaluateOption(item, offer).ready).toBe(false)
  })
  it('respects supplier lot constraints and exact identity', () => {
    for (const patch of [{ minOrderQuantity: 25 }, { maxOrderQuantity: 10 }, { orderStep: 3 }, { match: 'clarification-required' as const }]) {
      expect(evaluateOption(item, { ...offer, ...patch }, review, decision).ready).toBe(false)
    }
  })
  it('ranks delivered cost over sticker price and excludes an unchecked cheap option', () => {
    const options = compareOptions(item, [offer, { ...offer, id: 'b' }, { ...offer, id: 'c' }], {
      a: { ...review, price: '90000', expenses: '500000' },
      b: review,
      c: { ...review, price: '1000', confirmed: false },
    }, [decision, { ...decision, offerId: 'b' }, { ...decision, offerId: 'c' }])
    expect(options.map(option => option.offer.id)).toEqual(['b', 'a', 'c'])
  })
  it('uses the server score to choose the first candidate when no option is confirmed', () => {
    const options = compareOptions(item, [offer, { ...offer, id: 'b' }], {}, [
      { ...decision, offerId: 'a', score: 0.4 },
      { ...decision, offerId: 'b', score: 0.9 },
    ])
    expect(options.map(option => option.offer.id)).toEqual(['b', 'a'])
    expect(options.every(option => option.ready === false)).toBe(true)
  })
})
