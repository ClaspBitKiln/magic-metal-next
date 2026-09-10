import type { Payload } from 'payload'
import type { LogisticsRoute } from './types'

export async function loadLogisticsRoutes(
  payload: Payload,
  destination: string,
  options: { allowObserved?: boolean; tonnage?: number } = {},
): Promise<LogisticsRoute[]> {
  const result = await payload.find({
    collection: 'logistics-benchmarks',
    where: {
      and: [
        { destination: { equals: destination } },
        ...(options.tonnage ? [{ tonnage: { equals: options.tonnage } }] : []),
      ],
    },
    limit: 1000,
    sort: '-dateFrom',
    depth: 0,
  })

  const latest = new Map<string, (typeof result.docs)[number]>()
  for (const doc of result.docs) {
    const current = latest.get(String(doc.routeId))
    if (!current || new Date(String(doc.dateFrom)).getTime() > new Date(String(current.dateFrom)).getTime()) latest.set(String(doc.routeId), doc)
  }

  return [...latest.values()]
    .filter((doc) => doc.evidenceLevel === 'verified' || options.allowObserved === true)
    .map((doc) => ({
      id: String(doc.routeId),
      origin: String(doc.origin),
      destination: String(doc.destination),
      mode: 'road',
      fixedCost: Number(doc.averagePriceRub),
      currency: 'RUB',
      observedAt: new Date(String(doc.observedAt)).toISOString(),
      confidence: doc.evidenceLevel === 'verified' ? 0.95 : 0.6,
      status: doc.evidenceLevel === 'verified' ? 'verified' : 'observed',
      evidenceUrl: 'https://ati.su/developers/paid-api/average_prices/',
      evidenceNote: `ATI.SU average rate benchmark for ${doc.tonnage} t, ${doc.carType}. This is a market benchmark, not a Magic Metal carrier contract tariff.`,
    }))
}
