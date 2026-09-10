import { describe, expect, it } from 'vitest'
import { filterEligibleSuppliers, isProcurementEligibleSupplier } from '../../src/lib/procurement/routeRegistry'

describe('procurement route registry', () => {
  it('allows confirmed active procurement sources', () => {
    expect(isProcurementEligibleSupplier({ id: 'chzsi', entityName: 'ЧЗСИ', layer: 'L7', verificationStatus: 'confirmed', integrationStatus: 'manual', procurementRoute: 'direct-rfq', productScopes: ['special-steels'] })).toBe(true)
  })

  it('does not turn reference or unverified sources into procurement routes', () => {
    expect(isProcurementEligibleSupplier({ id: 'ref', entityName: 'Reference', layer: 'L9', verificationStatus: 'reference', integrationStatus: 'manual', procurementRoute: 'reference-only', productScopes: ['special-steels'] })).toBe(false)
    expect(filterEligibleSuppliers([
      { id: 'kumz', entityName: 'КУМЗ', layer: 'L8', verificationStatus: 'confirmed', integrationStatus: 'manual', procurementRoute: 'direct-rfq', productScopes: ['aluminium'] },
      { id: 'ref', entityName: 'Reference', layer: 'L9', verificationStatus: 'verify', integrationStatus: 'verify', procurementRoute: 'reference-only', productScopes: ['aluminium'] },
    ], 'aluminium').map((entry) => entry.id)).toEqual(['kumz'])
  })
})
