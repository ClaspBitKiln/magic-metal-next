import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAtiAverageRates } from '../../src/lib/logistics/atiAverageRates'

afterEach(() => vi.restoreAllMocks())

describe('ATI logistics benchmark provider', () => {
  it('resolves configured city directions and normalizes average route cost', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ AllDirections: [
        { FromCityId: 3611, FromCity: 'Москва', ToCityId: 206, ToCity: 'Ташкент' },
      ] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ Data: [{ DateFrom: '2026-09-09', Prices: { AveragePrice: 120 }, PricesInRub: { AveragePrice: 480000, BottomPrice: 430000, UpperPrice: 520000 }, LoadsCount: 31 }], Distance: 4000, WithNDS: false }), { status: 200 })))

    const result = await fetchAtiAverageRates('test-token', [{ id: 'moscow-tashkent-road', origin: 'Москва', destination: 'Ташкент', mode: 'road', tonnage: 20 }], '2026-09-09')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ routeId: 'moscow-tashkent-road', averagePriceRub: 480000, averagePricePerKm: 120, distanceKm: 4000, evidenceLevel: 'observed' })
  })

  it('does not invent a rate when ATI has no direction data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ AllDirections: [] }), { status: 200 })))
    const result = await fetchAtiAverageRates('test-token', [{ id: 'china-tashkent-multimodal', origin: 'Китай', destination: 'Ташкент', mode: 'multimodal', tonnage: 20 }], '2026-09-09')
    expect(result).toEqual([])
  })
})
