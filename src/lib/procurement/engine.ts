import { normalizeRFQ } from './normalize'
import { rankOffers } from './ranking'
import type { NormalizedRFQ, Offer, ProcurementDecision } from './types'

export type ProcurementAdapter = {
  id: string
  search: (item: NormalizedRFQ['items'][number]) => Promise<Offer[]>
}

export type ProcurementResult = {
  rfq: NormalizedRFQ
  offers: Record<number, Offer[]>
  decisions: Record<number, ProcurementDecision[]>
  noRouteLines: number[]
  clarificationLines: number[]
}

export async function runProcurement(text: string, adapters: ProcurementAdapter[], parsedAt?: string): Promise<ProcurementResult> {
  const rfq = normalizeRFQ(text, parsedAt)
  const offers: Record<number, Offer[]> = {}
  const decisions: Record<number, ProcurementDecision[]> = {}
  const noRouteLines: number[] = []
  const clarificationLines: number[] = []

  for (const item of rfq.items) {
    const itemOffers = (await Promise.all(adapters.map((adapter) => adapter.search(item))))
      .flat()
      .filter((offer) => offer.match !== 'non-qualifying')
    if (!itemOffers.length) {
      noRouteLines.push(item.line)
      continue
    }
    offers[item.line] = itemOffers
    if (item.grade.confidence === 'missing' || item.standard.confidence === 'missing') clarificationLines.push(item.line)
    decisions[item.line] = rankOffers(itemOffers)
  }

  return { rfq, offers, decisions, noRouteLines, clarificationLines }
}
