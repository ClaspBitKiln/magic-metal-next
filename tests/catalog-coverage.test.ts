import { describe, expect, it } from 'vitest'

import { homeCatalogGroups } from '@/data/homeCatalog'
import { productDetailCatalog } from '@/data/productDetailCatalog'
import { supplierCapabilityMap } from '@/data/supplierCapabilityMap'

const intentionallyCanonicalDetailSlugs = new Set(['krug-i-kvadrat', 'balka-shveller-ugolok'])

describe('unified sales catalog coverage', () => {
  it('keeps all sales groups populated and supplier-blind', () => {
    expect(homeCatalogGroups.length).toBeGreaterThanOrEqual(8)
    expect(homeCatalogGroups.every((group) => group.items.length > 0)).toBe(true)

    const hrefs = homeCatalogGroups.flatMap((group) => group.items.map((item) => item.href))
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('covers every product detail item except documented canonical aggregates', () => {
    const publicHrefs = new Set(homeCatalogGroups.flatMap((group) => group.items.map((item) => item.href)))

    for (const item of productDetailCatalog) {
      if (intentionallyCanonicalDetailSlugs.has(item.slug)) continue

      const href = `/produkciya/${item.categorySlug}/${item.slug}`
      expect(publicHrefs.has(href), `${item.shortTitle} missing from unified sales catalog`).toBe(true)
    }
  })

  it('keeps verified supplier capability records separated from offers', () => {
    expect(supplierCapabilityMap.length).toBeGreaterThan(0)
    expect(supplierCapabilityMap.every((item) => item.sourceUrl && item.checkedAt && item.evidence)).toBe(true)
    expect(supplierCapabilityMap.every((item) => item.capabilityStatus === 'verified' || item.capabilityStatus === 'discovery')).toBe(true)
  })
})
