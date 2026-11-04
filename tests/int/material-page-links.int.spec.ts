import { describe, expect, it } from 'vitest'
import { materials } from '@/data/materials'
import { getMaterialPageSlug, materialPageSlugs } from '@/data/materialPageLinks'

describe('material-page links only point to actual glossary pages', () => {
  const actual = new Map(materials.map(material => [material.designation, material.slug]))
  it('keeps the browser link index in sync with the published glossary', () => {
    expect(Object.entries(materialPageSlugs).length).toBe(materials.length)
    for (const [designation, slug] of Object.entries(materialPageSlugs)) {
      expect(actual.get(designation)).toBe(slug)
      expect(getMaterialPageSlug(designation)).toBe(slug)
    }
  })
  it('supports common steel prefixes without inventing missing material pages', () => {
    expect(getMaterialPageSlug('сталь 20')).toBe('stal-20')
    expect(getMaterialPageSlug('20')).toBe('stal-20')
    expect(getMaterialPageSlug(' БрАЖ9-4 ')).toBe('bronza-brazh9-4')
    expect(getMaterialPageSlug('БрОФ6,5-0,15')).toBeUndefined()
    expect(getMaterialPageSlug('М0')).toBeUndefined()
  })
})
