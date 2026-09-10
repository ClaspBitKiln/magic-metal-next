import { describe, expect, it } from 'vitest'
import { isClientSafeResult } from '../../src/lib/agents/contracts'
import { assessQA } from '../../src/lib/procurement/qa'

describe('Phase 14 security and production gates', () => {
  it('rejects internal procurement data at the client boundary', () => {
    const result = {
      output: { product: '12Х1МФ', supplier: 'internal-supplier' },
      warnings: [],
    } as never
    expect(isClientSafeResult(result)).toBe(false)
  })

  it('allows a client-safe result', () => {
    const result = {
      output: { product: '12Х1МФ', price: 100, currency: 'RUB' },
      warnings: [],
    } as never
    expect(isClientSafeResult(result)).toBe(true)
  })

  it('blocks unknown availability and checks stale price dates', () => {
    const unknown = assessQA({ availability: 'unknown', observedAt: new Date().toISOString() } as never)
    expect(unknown.status).toBe('blocked')
    expect(unknown.canProceed).toBe(false)

    const stale = assessQA({ availability: 'in-stock', observedAt: '2020-01-01T00:00:00.000Z' } as never, new Date('2026-09-10T00:00:00.000Z'))
    expect(stale.status).toBe('check')
    expect(stale.canProceed).toBe(false)
  })
})
