import type { Offer, ProcurementDecision } from './types'
import { rankOffers, type RankingContext, type RankingWeights } from './ranking'

export type EnhancedRankingContext = RankingContext

/**
 * Backward-compatible entry point. Reliability/freshness now live in the
 * canonical rankOffers implementation so scoring is applied exactly once.
 */
export function rankOffersEnhanced(offers: Offer[], weights: Partial<RankingWeights> = {}, context: EnhancedRankingContext = {}): ProcurementDecision[] {
  return rankOffers(offers, weights, context)
}
