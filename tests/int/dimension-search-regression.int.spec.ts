import { describe, expect, it } from 'vitest'
import { searchDimensionTables } from '@/lib/dimensionSearch'
import { parseSizeSearchQuery } from '@/lib/sizeSearchQuery'

// Regression cases use the published normative tables, without creating stock claims.
describe('dimension query boundaries', () => {
  it.each(['12Х18Н10Т', '12Х1МФ', '08Х18Н12Б', '57x3x6000x2', '57 x 3 x 6000 x 2', '-57x3', '57x-3', '0x3', 'лист 0', 'лист 12Х18Н10Т', 'фланец DN0 PN16'])(
    'does not turn a grade, invalid number or partial tuple into a size: %s', query => {
      expect(parseSizeSearchQuery(query)).toBeNull()
      expect(searchDimensionTables(query)).toHaveLength(0)
    },
  )

  it.each(['57х3', '57 х 3', '57×3мм', 'Ø57x3 mm.', '57X3,0'])(
    'preserves supported diameter/wall notation: %s', query => {
      expect(parseSizeSearchQuery(query)?.values).toEqual(['57', '3'])
      expect(searchDimensionTables(query).length).toBeGreaterThan(0)
    },
  )

  it('recognizes the dimensions after a steel grade, without consuming the grade', () => {
    const parsed = parseSizeSearchQuery('12Х18Н10Т труба 57x3')
    expect(parsed?.values).toEqual(['57', '3'])
    expect(parsed?.remainder).toBe('12Х18Н10Т')
    expect(searchDimensionTables('12Х18Н10Т труба 57x3')).toEqual(searchDimensionTables('труба 57x3 12Х18Н10Т'))
    expect(searchDimensionTables('12Х18Н10Т труба 57x3').length).toBeGreaterThan(0)
  })
})

describe('normative table identity and discrete dimensions', () => {
  it('filters the actual standard of each matched table, including an explicit edition', () => {
    const results = searchDimensionTables('57x4,5 ГОСТ 9940-81')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(item => item.subtitle.startsWith('ГОСТ 9940-81 ·'))).toBe(true)
    expect(searchDimensionTables('57x4,5 ГОСТ 9940-8')).toHaveLength(0)
    expect(searchDimensionTables('57x3 ГОСТ 873')).toHaveLength(0)
    expect(searchDimensionTables('57x3 ГОСТ 8734').length).toBeGreaterThan(0)
  })

  it('keeps explicit boiler grade groups separate instead of borrowing another table’s sizes', () => {
    const alloy = searchDimensionTables('108x6 12Х1МФ ТУ 14-3Р-55-2001')
    const stainless = searchDimensionTables('108x6 12Х18Н12Т ТУ 14-3Р-55-2001')
    expect(alloy).toHaveLength(1)
    expect(alloy[0].subtitle).toContain('таблица 2а')
    expect(stainless).toHaveLength(1)
    expect(stainless[0].subtitle).toContain('таблица 3а')
    expect(searchDimensionTables('108x6 12Х1М ТУ 14-3Р-55-2001')).toHaveLength(0)
    const plain = searchDimensionTables('57x3 сталь 20')
    expect(plain.length).toBeGreaterThan(0)
    expect(searchDimensionTables('57x3 Ст20')).toEqual(plain)
    expect(plain.some(item => item.href.includes('/holodnodeformirovannye?'))).toBe(true)
  })

  it('finds both existing stainless pipe cards and preserves their table selection URL', () => {
    const results = searchDimensionTables('57x4,5 ГОСТ 9940-81')
    expect(results.map(item => new URL(item.href, 'https://magicmet.ru').pathname)).toContain('/produkciya/nerzhaveyushchaya-stal/truby')
    for (const result of results) {
      const url = new URL(result.href, 'https://magicmet.ru')
      expect(url.searchParams.get('size_1')).toBe('57')
      expect(url.searchParams.get('wall_1')).toBe('4.5')
      expect(url.hash).toBe('#sizes-series-1')
      expect(result.description).toContain('наличие и срок поставки подтвердим')
    }
  })

  it('finds an exact profile triple and never substitutes another wall or extra length', () => {
    const results = searchDimensionTables('40x40x2 ГОСТ 30245-2003')
    expect(results).toHaveLength(1)
    const url = new URL(results[0].href, 'https://magicmet.ru')
    expect(url.searchParams.get('size_5')).toBe('40×40')
    expect(url.searchParams.get('wall_5')).toBe('2')
    expect(url.hash).toBe('#sizes-series-5')
    expect(searchDimensionTables('40x40x2.001 ГОСТ 30245-2003')).toHaveLength(0)
    expect(searchDimensionTables('40x40x6000 ГОСТ 30245-2003')).toHaveLength(0)
  })

  it('does not invent intermediate sheet thicknesses or wall values from ranges', () => {
    expect(searchDimensionTables('лист 10,123')).toHaveLength(0)
    expect(searchDimensionTables('57x3.14159')).toHaveLength(0)
  })
})
