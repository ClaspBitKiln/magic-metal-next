import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { productDetailCatalog } from '@/data/productDetailCatalog'
import { GET as getHomepage } from '@/app/(frontend)/route'

const home = readFileSync(resolve(process.cwd(), 'public/home-static.html'), 'utf8')
const rows = [...home.matchAll(/<details class="catalog-item"><summary class="catalog-row">([\s\S]*?)<\/summary>/g)].map((m) => m[1])

function rowByTitle(title: string) {
  return rows.find((row) => row.includes('>' + title + '</strong>'))
}

describe('public catalog source consistency', () => {
  it('keeps all 59 public catalog rows with nonempty size, standard and grades/finish columns', () => {
    expect(rows).toHaveLength(59)
    for (const row of rows) {
      const cols = [...row.matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1].trim())
      expect(cols.length).toBeGreaterThanOrEqual(3)
      expect(cols.slice(0, 3).every(Boolean)).toBe(true)
    }
  })

  it('keeps each nonferrous source row and served row on its exact canonical grade list', async () => {
    const source = new DOMParser().parseFromString(home, 'text/html')
    const response = await getHomepage()
    expect(response.headers.get('content-type')).toContain('text/html')
    const served = new DOMParser().parseFromString(await response.text(), 'text/html')
    const nonferrous = productDetailCatalog.filter(item => item.categorySlug === 'cvetnye-metally')
    expect(nonferrous.length).toBeGreaterThanOrEqual(10)
    for (const detail of nonferrous) {
      expect(detail.grades.length, detail.slug).toBeGreaterThan(0)
      const href = `/produkciya/cvetnye-metally/${detail.slug}`
      for (const [label, document] of [['source', source], ['served', served]] as const) {
        const matching = Array.from(document.querySelectorAll('.catalog-item')).filter(row => row.querySelector('a')?.getAttribute('href')?.split('#')[0] === href)
        expect(matching, `${label}: ${detail.slug} must have exactly one row`).toHaveLength(1)
        const columns = matching[0].querySelectorAll('summary.catalog-row > span')
        expect(columns, `${label}: ${detail.slug} columns`).toHaveLength(3)
        // DOM textContent decodes entities and checks this row, so a grade in an
        // unrelated product or an extra stale grade cannot satisfy the assertion.
        expect(columns[2].textContent, `${label}: ${detail.slug} grades`).toBe(detail.grades.join(' · '))
      }
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
      'Канаты стальные': '2688-80',
    } as const
    for (const [title, standard] of Object.entries(required)) {
      const row = rowByTitle(title)
      expect(row, title + ' row missing').toBeDefined()
      expect(row).toContain(standard)
    }
  })
})
