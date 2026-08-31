import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { matchesCatalogQuery, type CatalogSearchRow } from '@/lib/catalogSearch'

const snapshot = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mc-price-snapshot.json'), 'utf8')) as { rows: CatalogSearchRow[] }
const count = (query: string) => snapshot.rows.filter((row) => matchesCatalogQuery(row, query)).length

describe('catalog search links', () => {
  it.each([
    ['Водогазопроводные', 50],
    ['Бесшовные холоднодеформированные', 200],
    ['Бесшовные горячедеформированные', 300],
    ['Профильные квадратные и прямоугольные', 300],
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
})
