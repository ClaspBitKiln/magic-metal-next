import { describe, expect, it } from 'vitest'
import { findFactoryCapabilities, rankOffers, type TubeFactoryCapability, type TubeOffer } from '../src/lib/tubeMaster'

const factories: TubeFactoryCapability[] = [
  {
    factoryId: 'uraltrubprom',
    factoryName: 'Уралтрубпром',
    region: 'Урал',
    tubeType: 'electrowelded-round',
    diameterMinMm: 114,
    diameterMaxMm: 630,
    wallMinMm: 3,
    wallMaxMm: 22,
    standards: ['ГОСТ 10704-91', 'ГОСТ 10705-80'],
    sourceUrl: 'https://trubprom.com/products/catalog/gosts/10704-91',
    evidenceLevel: 'official-table',
    checkedAt: '2026-09-09',
  },
  {
    factoryId: 'ntpz',
    factoryName: 'НТПЗ',
    region: 'Ногинск',
    tubeType: 'electrowelded-round',
    specificSizes: [
      { diameterMm: 219, wallMm: 6 },
      { diameterMm: 219, wallMm: 8 },
    ],
    standards: ['ГОСТ 10704-91', 'ГОСТ 10705-80'],
    sourceUrl: 'https://ntpz.ru/o-zavode/',
    evidenceLevel: 'official-table',
    checkedAt: '2026-09-09',
  },
]

const offers: TubeOffer[] = [
  {
    sourceCode: 'e-metall',
    externalKey: 'e1',
    tubeType: 'electrowelded-round',
    diameterMm: 426,
    wallMm: 6,
    grade: 'ст20',
    standard: 'ГОСТ 10704',
    quantity: 100,
    unit: 'т',
    price: 75000,
    location: 'Тамбов',
    availability: 'verified-stock',
    observedAt: '2026-09-07',
  },
  {
    sourceCode: '23met',
    externalKey: 'm1',
    tubeType: 'electrowelded-round',
    diameterMm: 426,
    wallMm: 6,
    grade: 'ст20',
    standard: 'ГОСТ 10704',
    price: 70000,
    availability: 'market-listed',
    observedAt: '2026-09-05',
  },
]

describe('Tube Master', () => {
  it('finds factories by exact published size or supported range', () => {
    const exact = findFactoryCapabilities(
      { tubeType: 'electrowelded-round', diameterMm: 219, wallMm: 8, standard: 'ГОСТ 10704-91' },
      factories,
    )
    expect(exact.map((item) => item.capability.factoryId)).toEqual(['uraltrubprom', 'ntpz'])
  })

  it('does not treat an out-of-range wall as a capability match', () => {
    const matches = findFactoryCapabilities(
      { tubeType: 'electrowelded-round', diameterMm: 219, wallMm: 25 },
      factories,
    )
    expect(matches).toHaveLength(0)
  })

  it('prioritizes verified stock before lower-priced market signals', () => {
    const ranked = rankOffers(
      { tubeType: 'electrowelded-round', diameterMm: 426, wallMm: 6, grade: 'ст20' },
      offers,
    )
    expect(ranked.map((offer) => offer.externalKey)).toEqual(['e1', 'm1'])
  })
})
