import { describe, expect, it } from 'vitest'
import { formatDimensionValue, formatDimensionSummary, formatDimensionDesignation } from '@/lib/dimensionDisplay'
import { productSizeSeries } from '@/data/productSizeSeries'

describe('dimension display', () => {
  it.each([
    ['1.5', '1,5'], ['3,0', '3'], ['4.00', '4'], ['0,0', '0'], ['1,5', '1,5'],
    ['0,005', '0,005'], ['32,0 × 36,0', '32 × 36'],
    ['1,0; 1,5; 2,0', '1; 1,5; 2'], ['(4,0)', '(4)'],
    ['2,5–40,0', '2,5–40'], ['от 3,0 до 4,0 мм', 'от 3 до 4 мм'],
    ['ГОСТ 3.0-2020', 'ГОСТ 3.0-2020'], ['12Х18Н10Т', '12Х18Н10Т'],
    ['ГОСТ 3063-80 полимерн. покр 2/3 уценка', 'ГОСТ 3063-80 полимерн. покр 2/3 уценка'],
  ])('%s → %s', (source, expected) => expect(formatDimensionValue(source)).toBe(expected))

  it('formats stock mesh dimensions while preserving the coating and steel grades', () => {
    expect(formatDimensionDesignation('10.00x1.00 оцинк')).toBe('10x1 оцинк')
    expect(formatDimensionDesignation('12Х18Н10Т')).toBe('12Х18Н10Т')
  })

  it('formats a dimension summary without changing the standard identifier', () => {
    expect(formatDimensionSummary('Лист по ГОСТ 19903-2015: толщина 0,40–160,0 мм; форматы отдельно по толщине'))
      .toBe('Лист по ГОСТ 19903-2015: толщина 0,40–160 мм; форматы отдельно по толщине')
  })

  it('removes integer zero fractions throughout all 93 normative tables without mutating them', () => {
    expect(productSizeSeries).toHaveLength(93)
    let changed = 0
    for (const table of productSizeSeries) for (const row of table.rows) for (const cell of row) {
      const display = formatDimensionValue(cell)
      if (display !== cell) changed++
      expect(display).not.toMatch(/\d[,.]0+(?!\d)/)
    }
    expect(changed).toBeGreaterThan(1000)
  })
})
