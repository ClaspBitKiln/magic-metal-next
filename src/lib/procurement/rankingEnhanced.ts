import type { Offer, ProcurementDecision } from './types'
import { calculateLandedCost } from './landedCost'
import { assessOfferQuality, type FreshnessPolicy, type SupplierReliabilityRecord } from './reliability'
import { rankOffers, type RankingWeights } from './ranking'

export type EnhancedRankingContext = {
  supplierHistory?: Record<string, SupplierReliabilityRecord>
  freshnessPolicy?: FreshnessPolicy
  now?: Date
}

export function rankOffersEnhanced(offers: Offer[], weights: Partial<RankingWeights> = {}, context: EnhancedRankingContext = {}): ProcurementDecision[] {
  const base = rankOffers(offers, weights)
  const costs = offers.map((offer) => calculateLandedCost({ purchase: offer.price ?? 0, pickup: offer.pickupCost, freight: offer.freightCost, handling: offer.handlingCost, destination: offer.destinationCost, customs: offer.customsCost }).total)
  const min = costs.length ? Math.min(...costs) : 0
  const max = costs.length ? Math.max(...costs) : 0
  return base.map((decision) => {
    const offer = offers.find((item) => item.id === decision.offerId)
    if (!offer) return decision
    const quality = assessOfferQuality(offer, context.supplierHistory?.[offer.supplierId], context.freshnessPolicy, context.now)
    const freshness = (quality.priceFreshness + quality.availabilityFreshness + quality.logisticsFreshness) / 3
    const cost = calculateLandedCost({ purchase: offer.price ?? 0, pickup: offer.pickupCost, freight: offer.freightCost, handling: offer.handlingCost, destination: offer.destinationCost, customs: offer.customsCost }).total
    const costNormalized = max > min ? 1 - (cost - min) / (max - min) : 1
    const score = decision.score * 0.70 + quality.supplierReliability * 0.10 + freshness * 0.10 + quality.evidenceScore * 0.05 + costNormalized * 0.05
    return { ...decision, score, reasons: [...decision.reasons, `Надёжность поставщика: ${(quality.supplierReliability * 100).toFixed(0)}%`, `Свежесть данных: ${(freshness * 100).toFixed(0)}%`, `Доказательность: ${(quality.evidenceScore * 100).toFixed(0)}%`], risks: [...new Set([...decision.risks, ...quality.risks])] }
  }).sort((a, b) => b.score - a.score).map((decision, index) => ({ ...decision, recommended: index === 0 && decision.risks.length < 3 }))
}
