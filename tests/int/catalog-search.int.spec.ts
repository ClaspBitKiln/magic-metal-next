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
  it.each(['труба 57×3', 'трубы 57×3', 'ТРУБА 57 х 3', '57×3 мм', '57×3мм', '57×3 mm', '57×3 мм.'])(
    'accepts natural size requests without changing exact matches: %s', (query) => {
      const ids = (value: string) => snapshot.rows.filter((row) => matchesCatalogQuery(row, value))
      expect(ids(query)).toEqual(ids('57×3'))
      expect(ids(query)).toHaveLength(5)
    },
  )

  it('recognizes steel 20 without ignoring material requirements', () => {
    const found = snapshot.rows.filter((row) => matchesCatalogQuery(row, '57×3 сталь 20'))
    expect(found).toEqual(snapshot.rows.filter((row) => matchesCatalogQuery(row, '57×3 Ст20')))
    expect(found).toHaveLength(1)
    const row: CatalogSearchRow = { category: 'Трубы', product: 'Трубы бесшовные', designation: 'Ст20', size: '57×3', standard: 'ГОСТ 8734-75' }
    expect(matchesCatalogQuery(row, 'труба 57×3 мм сталь 20 ГОСТ 8734')).toBe(true)
    expect(matchesCatalogQuery({ ...row, designation: '09Г2С' }, '57×3 сталь 20')).toBe(false)
    expect(matchesCatalogQuery({ ...row, size: '57×3,5' }, 'труба 57×3 мм')).toBe(false)
    expect(matchesCatalogQuery(row, 'мм')).toBe(false)
  })

  it.each(['57х3', '57 х 3', '57×3', '57x3', '57 X 3', '57×3,0'])(
    'matches the exact diameter and wall for %s', (query) => {
      const found = snapshot.rows.filter((row) => matchesCatalogQuery(row, query))
      expect(found).toHaveLength(5)
      expect(found.every((row) => /^57(?:[.,]0+)?[х×x]3(?:[.,]0+)?$/iu.test(row.size.replace(/\s/g, '')))).toBe(true)
    },
  )

  it.each(['57х3,5', '57 х 3,5', '57×3.5', '57x3.50'])(
    'finds the same exact decimal dimensions for %s', (query) => {
      expect(snapshot.rows.filter((row) => matchesCatalogQuery(row, query))).toHaveLength(6)
    },
  )

  it('combines exact dimensions with material and standard requirements', () => {
    const row: CatalogSearchRow = { category: 'Трубы', product: 'Трубы бесшовные', designation: '09Г2С', size: '57×3,5', standard: 'ГОСТ 8734-75' }
    expect(matchesCatalogQuery(row, '57 x 3.5 09Г2С ГОСТ 8734')).toBe(true)
    expect(matchesCatalogQuery(row, '57 x 3.5 12Х18Н10Т')).toBe(false)
    expect(matchesCatalogQuery({ ...row, size: '57×3' }, '57×3,5')).toBe(false)
    expect(matchesCatalogQuery({ ...row, size: '157×3,5' }, '57×3,5')).toBe(false)
    expect(matchesCatalogQuery({ ...row, size: '57×3,5×6000' }, '57×3,5')).toBe(false)
  })

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
