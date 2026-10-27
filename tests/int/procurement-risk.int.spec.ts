import { describe, expect, it } from 'vitest'
import { assessOfferRisk } from '@/lib/procurement/risk'
import type { Offer } from '@/lib/procurement/types'

const now = new Date('2026-10-27T12:00:00.000Z')
const offer = (overrides: Partial<Offer> = {}): Offer => ({
  id: 'offer', sourceId: 'source', supplierId: 'supplier', product: 'pipe',
  price: 100000, currency: 'RUB', availability: 'in-stock',
  observedAt: now.toISOString(), match: 'exact', confidence: 1,
  ...overrides,
})

describe('procurement offer risk gate', () => {
  it('accepts confirmed availability and a current price date', () => {
    expect(assessOfferRisk(offer(), now)).toEqual({ status: 'ok', availabilityOk: true, priceDateOk: true })
  })

  it('blocks unconfirmed availability even when the price is current', () => {
    expect(assessOfferRisk(offer({ availability: 'unknown' }), now)).toMatchObject({ status: 'blocked', availabilityOk: false, priceDateOk: true })
  })

  it('requires checking a stale price rather than treating it as current', () => {
    expect(assessOfferRisk(offer({ observedAt: '2026-10-19T12:00:00.000Z' }), now)).toMatchObject({ status: 'check', availabilityOk: true, priceDateOk: false })
  })

  it.each(['invalid-date', '2026-10-28T12:00:00.000Z'])('does not accept an invalid or future price date: %s', (observedAt) => {
    expect(assessOfferRisk(offer({ observedAt }), now)).toMatchObject({ status: 'check', priceDateOk: false })
  })

  it('accepts the inclusive seven-day freshness boundary', () => {
    expect(assessOfferRisk(offer({ observedAt: '2026-10-20T12:00:00.000Z' }), now).status).toBe('ok')
    expect(assessOfferRisk(offer({ observedAt: '2026-10-20T11:59:59.999Z' }), now).status).toBe('check')
  })

  it('respects a stricter configured freshness policy', () => {
    const recent = offer({ observedAt: '2026-10-25T12:00:00.000Z' })
    expect(assessOfferRisk(recent, now).status).toBe('ok')
    expect(assessOfferRisk(recent, now, { priceMaxAgeDays: 1 }).status).toBe('check')
  })
})
