import { describe, expect, it } from 'vitest'
import { productDetailCatalog } from '@/data/productDetailCatalog'
import { homeCatalogGroups } from '@/data/homeCatalog'

const gradesBySlug: Record<string, string[]> = {
  med: ['М00', 'М0', 'М1', 'М2', 'М3', 'М1р', 'М2р', 'М3р'],
  latun: ['Л63', 'Л68', 'Л70', 'Л80', 'Л90', 'Л96', 'ЛС59-1'],
  bronza: ['БрОФ6,5-0,15', 'БрБ2', 'БрАМц9-2', 'БрАЖ9-4'],
  alyuminij: ['АД0', 'АД1', 'А5', 'А7', 'АМг2', 'АМг3', 'АМг6', 'Д16', 'В95'],
  titan: ['ВТ1-0', 'ВТ1-00', 'ВТ6', 'ВТ14', 'ОТ4', 'ПТ3В'],
  olovo: ['О1', 'О1пч', 'О2', 'О3', 'О4'],
  svinec: ['С0', 'С1', 'С2', 'С3'],
  cink: ['Ц0', 'Ц1', 'Ц2', 'Ц3'],
}

describe('approved grade lists on detail pages and homepage', () => {
  for (const [slug, required] of Object.entries(gradesBySlug)) {
    it('keeps the same approved grades for ' + slug, () => {
      const detail = productDetailCatalog.find((p) => p.categorySlug === 'cvetnye-metally' && p.slug === slug)
      expect(detail).toBeDefined()
      const home = homeCatalogGroups.flatMap((g) => g.items).find((p) => p.href.split('#')[0] === '/produkciya/cvetnye-metally/' + slug)
      expect(home).toBeDefined()
      expect(home!.grades).toBe(detail!.grades.join(' · '))
      for (const grade of required) expect(detail!.grades).toContain(grade)
      expect(home!.grades).not.toMatch(/после подтверждения заявки|марка .*по заявке/i)
    })
  }
})
