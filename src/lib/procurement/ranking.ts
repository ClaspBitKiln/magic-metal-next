import type { Offer, ProcurementDecision } from './types'
import { calculateLandedCost } from './landedCost'
import { assessOfferQuality, type FreshnessPolicy, type SupplierReliabilityRecord } from './reliability'

export type RankingWeights = {
  landedCost: number
  specification: number
  availability: number
  leadTime: number
  reliability: number
  logistics: number
  benchmark: number
}

export type RankingContext = {
  supplierHistory?: Record<string, SupplierReliabilityRecord>
  freshnessPolicy?: FreshnessPolicy
  logisticsObservedAtByOffer?: Record<string, string>
  now?: Date
}

const defaults: RankingWeights = {
  landedCost: 0.30,
  specification: 0.20,
  availability: 0.15,
  leadTime: 0.10,
  reliability: 0.10,
  logistics: 0.05,
  benchmark: 0.10,
}

const availabilityScore = (value: Offer['availability']) => ({
  'in-stock': 1,
  limited: 0.8,
  'on-request': 0.55,
  production: 0.35,
  unknown: 0.1,
}[value])

function readinessRisks(offer: Offer, quality: ReturnType<typeof assessOfferQuality>, hasPrice: boolean): string[] {
  const risks: string[] = []
  if (!hasPrice) risks.push('Цена не подтверждена')
  if (offer.availability === 'unknown') risks.push('Наличие не подтверждено')
  if (offer.match === 'clarification-required') risks.push('Требуется уточнение соответствия')
  if (offer.leadTimeDays === undefined) risks.push('Срок поставки неизвестен')
  risks.push(...quality.risks)
  return [...new Set(risks)]
}

function isPurchasable(offer: Offer, quality: ReturnType<typeof assessOfferQuality>, hasPrice: boolean): boolean {
  // A recommendation is a procurement action, not merely a market observation.
  // Missing price, unknown availability or unresolved specification must therefore
  // never become the automatic winner. Observed/on-request offers may remain
  // visible and rankable, but require manager verification.
  if (!hasPrice) return false
  if (offer.availability === 'unknown') return false
  if (offer.match === 'clarification-required') return false
  if (quality.priceFreshness < 0.5) return false
  if (quality.availabilityFreshness < 0.5) return false
  return true
}

export function rankOffers(offers: Offer[], weights: Partial<RankingWeights> = {}, context: RankingContext = {}): ProcurementDecision[] {
  const w = { ...defaults, ...weights }
  const pricedOffers = offers.filter((offer) => Number.isFinite(offer.price) && (offer.price ?? -1) >= 0)
  const landedCosts = pricedOffers.map((offer) => calculateLandedCost({
    purchase: offer.price!,
    pickup: offer.pickupCost,
    freight: offer.freightCost,
    handling: offer.handlingCost,
    destination: offer.destinationCost,
    customs: offer.customsCost,
  }))
  const maxCost = landedCosts.length ? Math.max(...landedCosts.map((cost) => cost.total)) : 0
  const minCost = landedCosts.length ? Math.min(...landedCosts.map((cost) => cost.total)) : 0
  const maxAllCost = landedCosts.length ? Math.max(...landedCosts.map((cost) => cost.total)) : 0

  const decisions = offers.map((offer) => {
    const hasPrice = Number.isFinite(offer.price) && (offer.price ?? -1) >= 0
    const landedCost = calculateLandedCost({
      purchase: hasPrice ? offer.price! : 0,
      pickup: offer.pickupCost,
      freight: offer.freightCost,
      handling: offer.handlingCost,
      destination: offer.destinationCost,
      customs: offer.customsCost,
    })
    const costScore = hasPrice && maxCost > 0 ? Math.max(0, 1 - landedCost.total / maxCost) : 0
    const specScore = offer.match === 'exact' ? 1 : offer.match === 'approved-alternative' ? 0.75 : offer.match === 'clarification-required' ? 0.35 : 0
    const leadScore = offer.leadTimeDays === undefined ? 0.25 : Math.max(0, 1 - offer.leadTimeDays / 30)
    const logisticsScore = offer.freightCost === undefined ? 0.35 : Math.max(0, 1 - offer.freightCost / Math.max(landedCost.total, 1))
    const benchmarkScore = offer.benchmarkValue && offer.price ? Math.max(0, Math.min(1, offer.benchmarkValue / offer.price)) : 0.5
    const baseReliabilityScore = Math.max(0, Math.min(1, offer.confidence))
    const baseScore = costScore * w.landedCost
      + specScore * w.specification
      + availabilityScore(offer.availability) * w.availability
      + leadScore * w.leadTime
      + baseReliabilityScore * w.reliability
      + logisticsScore * w.logistics
      + benchmarkScore * w.benchmark

    const quality = assessOfferQuality(
      offer,
      context.supplierHistory?.[offer.supplierId],
      context.freshnessPolicy,
      context.now,
      context.logisticsObservedAtByOffer?.[offer.id],
    )
    const freshness = (quality.priceFreshness + quality.availabilityFreshness + quality.logisticsFreshness) / 3
    const costNormalized = hasPrice && maxAllCost > minCost
      ? Math.max(0, Math.min(1, 1 - (landedCost.total - minCost) / (maxAllCost - minCost)))
      : hasPrice ? 1 : 0
    const score = baseScore * 0.70
      + quality.supplierReliability * 0.10
      + freshness * 0.10
      + quality.evidenceScore * 0.05
      + costNormalized * 0.05

    const risks = readinessRisks(offer, quality, hasPrice)
    const purchasable = isPurchasable(offer, quality, hasPrice)

    return {
      offerId: offer.id,
      score,
      landedCost,
      reasons: [
        offer.match === 'exact' ? 'Точное соответствие' : offer.match === 'approved-alternative' ? 'Одобренная альтернатива' : 'Соответствие требует проверки',
        hasPrice ? `Полная стоимость закупки учтена: ${landedCost.total}` : 'Цена отсутствует — вариант только для анализа рынка',
        `Надёжность поставщика: ${(quality.supplierReliability * 100).toFixed(0)}%`,
        `Свежесть данных: ${(freshness * 100).toFixed(0)}%`,
        `Доказательность: ${(quality.evidenceScore * 100).toFixed(0)}%`,
      ],
      risks,
      recommended: purchasable,
    }
  })

  const purchasable = decisions.filter((decision) => decision.recommended)
  const winnerId = purchasable.length
    ? [...purchasable].sort((a, b) => b.score - a.score)[0].offerId
    : undefined

  return decisions
    .map((decision) => ({ ...decision, recommended: decision.offerId === winnerId }))
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
      return b.score - a.score
    })
}
