import { describe, expect, it } from 'vitest'
import { parseRopeSearchQuery } from '@/lib/ropeSearchQuery'
import { searchDimensionTables } from '@/lib/dimensionSearch'

describe('rope sales construction and diameter search', () => {
  it.each(['6×7+FC 2,15 мм', 'канат стальной 6 х 7 + fc диаметр 2.15 mm.', 'Ø2,15 мм 6X7+FC'])(
    'finds the exact pair and preserves it in the native request URL: %s', query => {
      const results = searchDimensionTables(query)
      expect(results).toHaveLength(1)
      expect(results[0].typeLabel).toBe('Канат по ассортименту')
      expect(results[0].title).toBe('Канат 6×7+FC — Ø 2,15 мм')
      const href = new URL(results[0].href, 'https://magicmet.ru')
      expect(href.pathname).toBe('/')
      expect(href.hash).toBe('#request')
      expect(href.searchParams.get('product')).toContain('конструкция 6×7+FC; диаметр 2,15 мм')
      expect(results[0].description).not.toMatch(/нормативный|в наличии/iu)
    },
  )

  it('does not confuse a rope construction tuple with a pipe diameter and wall', () => {
    expect(parseRopeSearchQuery('35×7')?.construction).toBe('35×7')
    const results = searchDimensionTables('35×7')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Канат 35×7')
    expect(results[0].href).toBe('/produkciya/metizy-i-svarochnye-materialy/kanaty#rope-sales')
    expect(parseRopeSearchQuery('труба 57×3')).toBeNull()
    expect(parseRopeSearchQuery('труба 35×7')).toBeNull()
    expect(searchDimensionTables('труба 57×3').length).toBeGreaterThan(0)
  })

  it('keeps the core designation exact and fractional diameter unrounded', () => {
    const results = searchDimensionTables('6×19+IWS 8,25 мм')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Канат 6×19+IWS — Ø 8,25 мм')
    expect(searchDimensionTables('6×19+IWRC 8,25 мм')).toHaveLength(0)
    expect(searchDimensionTables('6×19+IWS 8,2 мм')).toHaveLength(0)
    expect(searchDimensionTables('6×19+IWS 9.75 мм')[0].title).toContain('9,75 мм')
  })

  it.each(['6×7+FC 56 мм', '6×7+FC 1 мм', '6×7+FC 0 мм', '6×7+FC -2 мм', '6×7+FC 2,15 мм 1770', '6×99+FC 2 мм', '6×7+FC 2,15,4 мм'])(
    'does not manufacture an unsupported pair or ignore other requirements: %s', query => {
      expect(searchDimensionTables(query)).toHaveLength(0)
    },
  )

  it('routes construction-only and unlisted diameter series to selection, without a size claim', () => {
    for (const query of ['6×7+FC', '35×7 12,5 мм']) {
      const [result] = searchDimensionTables(query)
      expect(result.typeLabel).toBe('Конструкция каната')
      expect(result.href).toBe('/produkciya/metizy-i-svarochnye-materialy/kanaty#rope-sales')
      expect(result.description).toContain('уточним по запросу')
    }
    expect(searchDimensionTables('35×7 57 мм')).toHaveLength(0)
  })
})
