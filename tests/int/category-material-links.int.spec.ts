import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProductPage from '@/app/(frontend)/(catalog)/produkciya/[slug]/page'
import SectionCatalog from '@/components/SectionCatalog'
import { seoCatalog } from '@/data/seoCatalog'
import { materials } from '@/data/materials'
import { getMaterialPageSlug } from '@/data/materialPageLinks'

const actualSlugs = new Set(materials.map(material => material.slug))

describe('category grade surfaces use real material detail pages', () => {
  it.each(seoCatalog.map(category => [category.slug, category] as const))('%s preserves its grade labels and links only known pages', async (slug, category) => {
    const output = await ProductPage({ params: Promise.resolve({ slug }) })
    const document = new DOMParser().parseFromString(renderToStaticMarkup(output), 'text/html')
    const surface = document.querySelector('.sc-grades') || document.querySelectorAll('.product-facts dd')[2]
    expect(surface).toBeDefined()
    const rows = Array.from(surface!.children)
    expect(rows).toHaveLength(category.grades.length)
    category.grades.forEach((grade, index) => {
      const row = rows[index]
      expect(row.textContent).toBe(grade)
      const link = row.querySelector('a')
      const destination = getMaterialPageSlug(grade)
      if (destination) {
        expect(actualSlugs.has(destination)).toBe(true)
        expect(link?.getAttribute('href')).toBe(`/spravochnik-materialov/${destination}`)
      } else expect(link).toBeNull()
    })
  })

  it('keeps unsupported copper and bronze grades as text alongside actual steel links', () => {
    const category = { ...seoCatalog.find(item => item.slug === 'sortovoy-i-fasonny-prokat')!, grades: ['20', '09Г2С', 'М0', 'БрОФ6,5-0,15'] }
    const document = new DOMParser().parseFromString(renderToStaticMarkup(createElement(SectionCatalog, { category, relatedMaterials: [] })), 'text/html')
    const surface = document.querySelector('.sc-grades')!
    expect(Array.from(surface.querySelectorAll('a'), link => link.getAttribute('href'))).toEqual(['/spravochnik-materialov/stal-20', '/spravochnik-materialov/09g2s'])
    expect(Array.from(surface.children, child => child.textContent)).toEqual(category.grades)
    expect(surface.querySelectorAll('span:not(.has-material-link) a')).toHaveLength(0)
  })
})
