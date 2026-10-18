import { describe, expect, it } from 'vitest'
import { calculateMetalMass, type MetalCalculationInput } from '@/lib/metalCalculation'
import { searchDimensionTables } from '@/lib/dimensionSearch'
import { hasValidRequestContact } from '@/lib/requestValidation'
import { Requests } from '@/collections/Requests'
import { RequestFiles } from '@/collections/RequestFiles'
import sitemap from '@/app/(frontend)/sitemap'

const pipe: MetalCalculationInput = { shape: 'pipe', density: 7850, diameter: '20', wall: '2', thickness: '10', width: '1500', pieceLength: '6000', side: '100', length: '12', quantity: '1' }

describe('mass calculation does not silently change the specification', () => {
  it('calculates a hollow tube and scales by material, length and quantity', () => {
    const result = calculateMetalMass(pipe)
    expect(result).not.toHaveProperty('error')
    if ('total' in result) expect(result.total).toBeCloseTo(Math.PI * (20 ** 2 - 16 ** 2) / 4 * 7850e-6 * 12, 8)
    const aluminum = calculateMetalMass({ ...pipe, density: 2700, quantity: '2' })
    expect(aluminum).not.toHaveProperty('error')
    if (typeof aluminum.total === 'number' && typeof result.total === 'number') expect(aluminum.total / result.total).toBeCloseTo(2700 / 7850 * 2, 8)
  })
  it.each(['10', '11', '20'])('rejects impossible wall %s for diameter 20', wall => {
    expect(calculateMetalMass({ ...pipe, wall })).toHaveProperty('error')
  })
  it.each(['abc', '0', '-1', '0.5', 'Infinity', '1e999'])('rejects invalid piece count %s', quantity => {
    expect(calculateMetalMass({ ...pipe, quantity })).toHaveProperty('error')
  })
  it('accepts decimal commas and a valid wall below the half-diameter boundary', () => {
    expect(calculateMetalMass({ ...pipe, wall: '9,99' })).not.toHaveProperty('error')
  })
  it('uses sheet millimetres instead of linear-product metres', () => {
    const result = calculateMetalMass({ ...pipe, shape: 'sheet', quantity: '2' })
    expect(result).toMatchObject({ unit: 706.5, total: 1413, unitLabel: 'кг/лист' })
  })
})

describe('normative dimension search', () => {
  it.each(['57x3', '57×3', 'труба 57х3', '57 х 3 мм'])('finds exact table pairs: %s', query => {
    const result = searchDimensionTables(query)
    expect(result.length).toBeGreaterThan(0)
    for (const item of result) {
      const href = new URL(item.href, 'https://magicmet.ru')
      expect([...href.searchParams.entries()].some(([key, value]) => key.startsWith('size_') && Number(value.replace(',', '.')) === 57)).toBe(true)
      expect([...href.searchParams.entries()].some(([key, value]) => key.startsWith('wall_') && value === '3')).toBe(true)
    }
  })
  it('does not substitute a nearby wall or silently interpret a third dimension as length', () => {
    expect(searchDimensionTables('57x3.14159')).toHaveLength(0)
    expect(searchDimensionTables('57x3x6000')).toHaveLength(0)
  })
  it('finds a sheet thickness without returning material names containing 10', () => {
    const result = searchDimensionTables('лист 10')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(item => item.type === 'product' && /лист/iu.test(item.title))).toBe(true)
  })
  it('keeps flange pressure separate from nominal bore', () => {
    expect(searchDimensionTables('фланец Ду 50 Ру 16')).toHaveLength(2)
    expect(searchDimensionTables('фланец Ду 50 Ру 999')).toHaveLength(0)
  })
})

describe('request entry points and contact checks', () => {
  it.each([['+7 (922) 711-73-63', ''], ['+998 90 123 45 67', ''], ['', 'buyer@example.invalid']])('accepts international contact %s %s', (phone, email) => {
    expect(hasValidRequestContact(phone, email)).toBe(true)
  })
  it.each([['не телефон', ''], ['123', ''], ['', 'invalid'], ['', ''], ['+79990000000', 'broken@']])('rejects unusable contact %s %s', (phone, email) => {
    expect(hasValidRequestContact(phone, email)).toBe(false)
  })
  it('does not expose an anonymous create route around the request handler', async () => {
    for (const collection of [Requests, RequestFiles]) {
      const access = collection.access?.create
      expect(typeof access).toBe('function')
      if (typeof access === 'function') expect(await access({ req: { user: null } } as never)).toBe(false)
    }
  })
  it('lists new GOST pages and removes the stale availability entry', () => {
    const paths = sitemap().map(item => new URL(item.url).pathname)
    expect(paths).toContain('/spravochnik-gost/gost-19903-2015')
    expect(paths).not.toContain('/spravochnik-nalichiya')
  })
})
