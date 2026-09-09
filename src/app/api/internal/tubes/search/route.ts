import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { tubeFactoryCapabilities } from '@/data/tubeFactoryCapabilities'
import { findFactoryCapabilities, rankOffers, type TubeOffer, type TubeQuery } from '@/lib/tubeMaster'

type PayloadOffer = {
  id: number
  supplier?: { code?: string; name?: string } | number
  product?: string
  category?: string
  designation?: string
  size?: string
  diameter?: string
  wall?: string
  standard?: string
  price?: number
  currency?: string
  unit?: string
  availability?: 'price-confirmed' | 'market-listed' | 'on-request' | 'inactive'
  sourceUrl?: string
  observedAt: string
  active?: boolean
}

function normalizeNumber(value?: string | null) {
  if (!value) return undefined
  const parsed = Number(value.replace(',', '.').replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function inferTubeType(value: string) {
  const text = value.toLocaleLowerCase('ru')
  if (text.includes('х/д') || text.includes('холоднодеформ')) return 'seamless-cold-deformed'
  if (text.includes('г/д') || text.includes('горячедеформ')) return 'seamless-hot-deformed'
  if (text.includes('нержав')) return 'seamless-stainless'
  if (text.includes('бесшов')) return 'seamless'
  if (text.includes('профил')) return 'profile'
  if (text.includes('водогаз')) return 'water-gas'
  if (text.includes('электросвар') || text.includes('п/ш') || text.includes('прямошов')) return 'electrowelded-round'
  return undefined
}

function parseSize(value?: string) {
  if (!value) return {}
  const match = value.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*[×хx*]\s*(\d+(?:\.\d+)?)/iu)
  if (!match) return {}
  return { diameterMm: Number(match[1]), wallMm: Number(match[2]) }
}

function sourceCode(value: PayloadOffer['supplier']) {
  if (value && typeof value === 'object' && value.code) return value.code
  return 'unknown'
}

function toTubeOffer(item: PayloadOffer): TubeOffer | null {
  const inferred = inferTubeType(`${item.product ?? ''} ${item.category ?? ''} ${item.size ?? ''}`)
  const size = parseSize(item.size)
  const diameterMm = normalizeNumber(item.diameter) ?? size.diameterMm
  const wallMm = normalizeNumber(item.wall) ?? size.wallMm
  if (!diameterMm || !wallMm || !inferred) return null

  return {
    sourceCode: sourceCode(item.supplier),
    externalKey: String(item.id),
    tubeType: inferred,
    diameterMm,
    wallMm,
    grade: item.designation,
    standard: item.standard,
    price: item.price,
    currency: item.currency,
    unit: item.unit,
    availability:
      item.availability === 'price-confirmed' ? 'verified-stock' :
        item.availability === 'market-listed' ? 'market-listed' :
          item.availability === 'on-request' ? 'on-request' : 'inactive',
    observedAt: item.observedAt,
    sourceUrl: item.sourceUrl,
    location: undefined,
  }
}

function parseQuery(request: NextRequest): TubeQuery {
  const params = request.nextUrl.searchParams
  let diameterMm = normalizeNumber(params.get('diameter'))
  let wallMm = normalizeNumber(params.get('wall'))
  const size = params.get('size') ?? params.get('q')
  if (size) {
    const parsed = parseSize(size)
    diameterMm ??= parsed.diameterMm
    wallMm ??= parsed.wallMm
  }

  return {
    tubeType: params.get('type') || undefined,
    diameterMm,
    wallMm,
    grade: params.get('grade') || undefined,
    standard: params.get('standard') || undefined,
  }
}

function authorize(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.TUBE_SEARCH_API_TOKEN
  if (!expected) return false
  return request.headers.get('x-tube-search-token') === expected
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Manager endpoint is not configured for public access.' }, { status: 503 })
  }

  const query = parseQuery(request)
  if (!query.diameterMm && !query.wallMm && !query.grade && !query.standard && !query.tubeType) {
    return NextResponse.json({ error: 'Specify size, diameter, wall, grade, standard or type.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'supplier-offers',
      depth: 1,
      limit: 250,
      where: {
        and: [
          { active: { equals: true } },
          ...(query.diameterMm != null ? [{ diameter: { equals: String(query.diameterMm) } }] : []),
          ...(query.wallMm != null ? [{ wall: { equals: String(query.wallMm) } }] : []),
          ...(query.grade ? [{ designation: { contains: query.grade } }] : []),
          ...(query.standard ? [{ standard: { contains: query.standard } }] : []),
        ],
      },
    })

    const offers = result.docs.map((item) => toTubeOffer(item as unknown as PayloadOffer)).filter((item): item is TubeOffer => item !== null)
    const rankedOffers = rankOffers(query, offers).slice(0, 50)
    const capabilities = findFactoryCapabilities(query, tubeFactoryCapabilities)

    return NextResponse.json({
      query,
      capabilities: capabilities.map(({ capability, reason }) => ({
        factoryId: capability.factoryId,
        factoryName: capability.factoryName,
        region: capability.region,
        tubeType: capability.tubeType,
        reason,
        evidenceLevel: capability.evidenceLevel,
        checkedAt: capability.checkedAt,
        sourceUrl: capability.sourceUrl,
      })),
      offers: rankedOffers,
      meta: {
        offerCount: rankedOffers.length,
        capabilityCount: capabilities.length,
        generatedAt: new Date().toISOString(),
        stockRule: 'verified-stock requires a source state explicitly mapped as price-confirmed; market-listed remains a signal until commercially verified.',
      },
    })
  } catch (error) {
    console.error('tube-search failed', error)
    return NextResponse.json({ error: 'Tube search is temporarily unavailable.' }, { status: 500 })
  }
}
