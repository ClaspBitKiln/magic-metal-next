import { describe, expect, it } from 'vitest'
import { assessQA } from '../../src/lib/procurement/qa'
import type { Offer } from '../../src/lib/procurement/types'

const offer = (overrides: Partial<Offer> = {}): Offer => ({
  id: 'qa-1',
  product: 'Труба',
  grade: '20',
  standard: 'ГОСТ',
  availability: 'confirmed',
  currency: 'RUB',
  observedAt: new Date('2026-09-10T00:00:00Z').toISOString(),
  ...overrides,
})

describe('QA Gate', () => {
  it('allows confirmed availability and fresh price', () => {
    const result = assessQA(offer(), new Date('2026-09-10T12:00:00Z'))
    expect(result).toEqual({ status: 'ok', canProceed: true, reasons: [] })
  })

  it('checks stale price date', () => {
    const result = assessQA(offer({ observedAt: '2026-08-20T00:00:00Z' }), new Date('2026-09-10T00:00:00Z'))
    expect(result.status).toBe('check')
    expect(result.canProceed).toBe(false)
  })

  it('blocks when availability is not confirmed', () => {
    const result = assessQA(offer({ availability: 'unknown' }), new Date('2026-09-10T00:00:00Z'))
    expect(result.status).toBe('blocked')
    expect(result.canProceed).toBe(false)
  })
})
