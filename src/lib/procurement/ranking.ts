import type { Offer, ProcurementDecision } from './types'
import { calculateLandedCost } from './landedCost'

export type RankingWeights = {
  landedCost: number
  specification: number
  availability: number
  leadTime: number
  reliability: number
  logistics: number
  benchmark: number
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

const availabilityScore = (value: Offer['availability']) => ({ 'in-stock': 1, limited: 0.8, 'on-request': 0.55, production: 0.35, unknown: 0.1 }[value])

export function rankOffers(offers: Offer[], weights: Partial<RankingWeights> = {}): ProcurementDecision[] {
  const w = { ...defaults, ...weights }
  const priced = offers
    .map((offer) => offer.price)
    .filter((price): price is number => Number.isFinite(price) && price >= 0)
  const maxCost = priced.length
    ? Math.max(...offers.filter((offer) => Number.isFinite(offer.price) && (offer.price ?? -1) >= 0).map((offer) => calculateLandedCost({ purchase: offer.price!, pickup: offer.pickupCost, freight: offer.freightCost, handling: offer.handlingCost, destination: offer.destinationCost, customs: offer.customsCost }).total))
    : 0

  return offers.map((offer) => {
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
    const reliabilityScore = Math.max(0, Math.min(1, offer.confidence))
    const score = costScore * w.landedCost + specScore * w.specification + availabilityScore(offer.availability) * w.availability + leadScore * w.leadTime + reliabilityScore * w.reliability + logisticsScore * w.logistics + benchmarkScore * w.benchmark
    const risks: string[] = []
    if (!hasPrice) risks.push('Цена не подтверждена')
    if (offer.availability === 'unknown') risks.push('Наличие не подтверждено')
    if (offer.match !== 'exact') risks.push('Требуется проверка соответствия')
    if (offer.leadTimeDays === undefined) risks.push('Срок поставки неизвестен')
    return {
      offerId: offer.id,
      score,
      landedCost,
      reasons: [offer.match === 'exact' ? 'Точное соответствие' : 'Соответствие требует проверки', hasPrice ? `Итоговая стоимость учтена: ${landedCost.total}` : 'Цена отсутствует — предложение не готово к закупочному решению'],
      risks,
      recommended: false,
    }
  }).sort((a, b) => b.score - a.score).map((decision, index) => ({ ...decision, recommended: index === 0 && decision.risks.length < 3 }))
}
