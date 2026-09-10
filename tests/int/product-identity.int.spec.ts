import { describe, expect, it } from 'vitest'
import { buildProductIdentityKey, normalizeProductIdentity } from '../../src/lib/procurement/productIdentity'

describe('product identity', () => {
  it('normalizes Russian text, ГОСТ and dimensions deterministically', () => {
    const identity = normalizeProductIdentity({ product: 'Труба  ', designation: '20', standard: 'ГОСТ 8732', diameter: '100,0', wall: '5,0' })
    expect(identity.productKey).toBe('труба')
    expect(identity.standardKey).toBe('гост8732')
    expect(identity.diameterKey).toBe('1000')
    expect(identity.wallKey).toBe('50')
  })

  it('builds the same key for equivalent formatting', () => {
    expect(buildProductIdentityKey({ product: 'Труба', designation: '20', standard: 'ГОСТ 8732', diameter: '100', wall: '5' }))
      .toBe(buildProductIdentityKey({ product: ' труба ', designation: '20', standard: 'ГОСТ-8732', diameter: '100,0', wall: '5,0' }))
  })
})
