import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { productDetailCatalog } from '@/data/productDetailCatalog'

const home = readFileSync(resolve(process.cwd(), 'public/home-static.html'), 'utf8')
const rows = [...home.matchAll(/<details class="catalog-item"><summary class="catalog-row">([\s\S]*?)<\/summary>/g)].map((m) => m[1])

function rowByTitle(title: string) {
  return rows.find((row) => row.includes('>' + title + '</strong>'))
}

describe('public catalog source consistency', () => {
  it('keeps all 56 public catalog rows with nonempty size, standard and grades/finish columns', () => {
    expect(rows).toHaveLength(56)
    for (const row of rows) {
      const cols = [...row.matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1].trim())
      expect(cols.length).toBeGreaterThanOrEqual(3)
      expect(cols.slice(0, 3).every(Boolean)).toBe(true)
    }
  })

  it('never reintroduces placeholders for the approved nonferrous grades', () => {
    const slugs = ['med', 'latun', 'bronza', 'alyuminij', 'titan', 'olovo', 'svinec', 'cink']
    for (const slug of slugs) {
      const detail = productDetailCatalog.find((x) => x.categorySlug === 'cvetnye-metally' && x.slug === slug)
      expect(detail).toBeDefined()
      expect(detail!.grades.length).toBeGreaterThan(0)
      for (const grade of detail!.grades) expect(home).toContain(grade)
    }
    expect(home).not.toMatch(/марка (?:меди|латуни|бронзы|титана|олова|свинца|цинка)[^<]*после подтверждения заявки/i)
  })

  it('identifies standards for the formerly incomplete section rows', () => {
    const required = {
      'Лист рифлёный': '8568-77',
      'Лист ПВЛ': '36.26.11-5-89',
      'Профнастил': '24045-2016',
      'Арматура': '34028-2016',
      'Катанка': '30136-95',
      'Шестигранник': '2879-2006',
      'Швеллер гнутый': '8278-83',
      'Сетки': '23279-2012',
      'Лента упаковочная': '3560-73',
      'Канаты': '2688-80',
    } as const
    for (const [title, standard] of Object.entries(required)) {
      const row = rowByTitle(title)
      expect(row, title + ' row missing').toBeDefined()
      expect(row).toContain(standard)
    }
  })
})
