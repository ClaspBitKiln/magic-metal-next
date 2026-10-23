import { describe, expect, it } from 'vitest'
import { assessOfferRisk } from '@/lib/procurement/risk'
import type { Offer } from '@/lib/procurement/types'

const now = new Date('2026-09-10T12:00:00Z')
const offer = (overrides: Partial<Offer> = {}): Offer => ({
  id: 'risk-1',
  sourceId: 'test',
  supplierId: 'supplier',
  product: 'Труба',
  currency: 'RUB',
  availability: 'in-stock',
  observedAt: '2026-09-10T00:00:00Z',
  match: 'exact',
  confidence: 0.9,
  ...overrides,
})

describe('simple procurement risk gate', () => {
  it('allows current offers with stated availability', () => {
    expect(assessOfferRisk(offer(), now)).toEqual({
      status: 'ok',
      availabilityOk: true,
      priceDateOk: true,
    })
  })

  it('blocks offers with unknown availability', () => {
    expect(assessOfferRisk(offer({ availability: 'unknown' }), now)).toMatchObject({
      status: 'blocked',
      availabilityOk: false,
    })
  })

  it('requires review for stale, invalid or future observation dates', () => {
    for (const observedAt of ['2026-09-01T00:00:00Z', 'invalid', '2026-09-11T00:00:00Z']) {
      expect(assessOfferRisk(offer({ observedAt }), now).status).toBe('check')
    }
  })
})
