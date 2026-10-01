export type TubeQuery = {
  tubeType?: string
  diameterMm?: number
  wallMm?: number
  grade?: string
  standard?: string
}

export type TubeFactoryCapability = {
  factoryId: string
  factoryName: string
  region: string
  tubeType: string
  diameterMinMm?: number
  diameterMaxMm?: number
  wallMinMm?: number
  wallMaxMm?: number
  specificSizes?: Array<{ diameterMm: number; wallMm: number }>
  grades?: string[]
  standards?: string[]
  sourceUrl: string
  evidenceLevel: 'official-table' | 'official-catalog' | 'secondary-confirmation'
  checkedAt: string
}

export type TubeOffer = {
  sourceCode: string
  externalKey: string
  tubeType: string
  diameterMm?: number
  wallMm?: number
  grade?: string
  standard?: string
  quantity?: number
  unit?: string
  price?: number
  currency?: string
  location?: string
  availability: 'verified-stock' | 'market-listed' | 'on-request' | 'inactive'
  observedAt: string
  sourceUrl?: string
}

export type TubeMatch = {
  capability: TubeFactoryCapability
  reason: 'range-match' | 'specific-size-match'
}

const normalize = (value?: string) => value?.trim().toLowerCase()

export function matchesCapability(query: TubeQuery, capability: TubeFactoryCapability): boolean {
  if (query.tubeType && normalize(query.tubeType) !== normalize(capability.tubeType)) return false

  if (query.diameterMm != null) {
    const specific = capability.specificSizes?.some(
      (item) => item.diameterMm === query.diameterMm && (query.wallMm == null || item.wallMm === query.wallMm),
    )
    if (specific) return true

    const diameterInRange =
      capability.diameterMinMm == null || query.diameterMm >= capability.diameterMinMm
        ? capability.diameterMaxMm == null || query.diameterMm <= capability.diameterMaxMm
        : false
    if (!diameterInRange) return false
  }

  if (query.wallMm != null) {
    if (capability.wallMinMm != null && query.wallMm < capability.wallMinMm) return false
    if (capability.wallMaxMm != null && query.wallMm > capability.wallMaxMm) return false

    if (capability.specificSizes?.length) {
      const exactSize = capability.specificSizes.some(
        (item) => item.diameterMm === query.diameterMm && item.wallMm === query.wallMm,
      )
      if (!exactSize && query.diameterMm != null) return false
    }
  }

  if (query.grade && capability.grades?.length) {
    const wanted = normalize(query.grade)
    if (!capability.grades.some((grade) => normalize(grade) === wanted)) return false
  }

  if (query.standard && capability.standards?.length) {
    const wanted = normalize(query.standard)
    if (!capability.standards.some((standard) => normalize(standard) === wanted)) return false
  }

  return true
}

export function findFactoryCapabilities(
  query: TubeQuery,
  capabilities: TubeFactoryCapability[],
): TubeMatch[] {
  return capabilities
    .filter((capability) => matchesCapability(query, capability))
    .map((capability) => {
      const specific = capability.specificSizes?.some(
        (item) => item.diameterMm === query.diameterMm && (query.wallMm == null || item.wallMm === query.wallMm),
      )
      return {
        capability,
        reason: specific ? 'specific-size-match' : 'range-match',
      }
    })
}

export function matchesOffer(query: TubeQuery, offer: TubeOffer): boolean {
  if (query.tubeType && normalize(query.tubeType) !== normalize(offer.tubeType)) return false
  if (query.diameterMm != null && offer.diameterMm !== query.diameterMm) return false
  if (query.wallMm != null && offer.wallMm !== query.wallMm) return false
  if (query.grade && normalize(query.grade) !== normalize(offer.grade)) return false
  if (query.standard && normalize(query.standard) !== normalize(offer.standard)) return false
  return offer.availability !== 'inactive'
}

export function rankOffers(query: TubeQuery, offers: TubeOffer[]): TubeOffer[] {
  return offers
    .filter((offer) => matchesOffer(query, offer))
    .slice()
    .sort((a, b) => {
      const availabilityRank = (value: TubeOffer['availability']) =>
        value === 'verified-stock' ? 0 : value === 'market-listed' ? 1 : 2
      const aRank = availabilityRank(a.availability)
      const bRank = availabilityRank(b.availability)
      if (aRank !== bRank) return aRank - bRank
      if (a.price != null && b.price != null) return a.price - b.price
      return Date.parse(b.observedAt) - Date.parse(a.observedAt)
    })
}
