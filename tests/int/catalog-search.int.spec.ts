import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { matchesCatalogQuery, type CatalogSearchRow } from '@/lib/catalogSearch'
import { decodeCatalogSnapshot } from '@/lib/catalogSnapshot'
import { catalogTreeDirectRequestQueries, catalogTreePipeQueries, requestOnlyDirectoryQueries } from '@/data/catalogAvailability'
import { productDetailCatalog } from '@/data/productDetailCatalog'

const snapshot = decodeCatalogSnapshot(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mc-price-snapshot.json'), 'utf8'))) as { rows: CatalogSearchRow[] }
const count = (query: string) => snapshot.rows.filter((row) => matchesCatalogQuery(row, query)).length

describe('catalog search links', () => {
  it.each([
    ['Водогазопроводные', 50],
    ['Бесшовные холоднодеформированные', 200],
    ['Бесшовные горячедеформированные', 300],
    ['Профильные квадратные и прямоугольные', 300],
    ['Лист г/к', 100],
    ['Лист х/к', 40],
    ['Лист и рулон горячекатаный', 100],
    ['Оцинкованный прокат', 50],
    ['Балка двутавровая', 50],
    ['Швеллер', 50],
    ['Медь', 50],
    ['Крепёж', 1000],
  ])('finds confirmed rows for %s', (query, minimum) => {
    expect(count(query)).toBeGreaterThan(minimum)
  })

  it.each(['Цинк', 'Баббит', 'Титан', 'Олово', 'Свинец', 'Котельные и крекинговые', 'Нефтяного сортамента'])(
    'does not fabricate stock for %s',
    (query) => expect(count(query)).toBe(0),
  )

  it('does not contain service placeholders', () => {
    expect(snapshot.rows.some((row) => /925-11-55|^0(?:[.,]0+)?$/.test(`${row.designation} ${row.size}`))).toBe(false)
  })

  it.each([['Лист г/к', 100], ['Лист х/к', 40]])('keeps %s inside the carbon sheet category', (query, minimum) => {
    const rows = snapshot.rows.filter((row) => matchesCatalogQuery(row, query))
    expect(rows.length).toBeGreaterThan(minimum)
    expect(new Set(rows.map((row) => row.category))).toEqual(new Set(['Листовой прокат']))
  })

  it('covers every public catalog leaf with stock rows or an explicit RFQ route', () => {
    const hiddenSlugs = new Set(['krug-i-kvadrat', 'balka-shveller-ugolok'])
    const detailQueries = productDetailCatalog.filter((item) => !hiddenSlugs.has(item.slug)).map((item) => item.shortTitle)
    const queries = [...catalogTreePipeQueries, ...detailQueries, ...catalogTreeDirectRequestQueries]

    expect(new Set(queries).size).toBe(queries.length)
    for (const query of queries) {
      const matches = count(query)
      if (requestOnlyDirectoryQueries.has(query)) expect(matches, query).toBe(0)
      else expect(matches, query).toBeGreaterThan(0)
    }
  })

  it('keeps all ten warehouse categories and every product group reachable', () => {
    expect(new Set(snapshot.rows.map((row) => row.category)).size).toBe(10)
    expect(new Set(snapshot.rows.map((row) => `${row.category}\u001f${row.product}`)).size).toBe(123)
  })
})
