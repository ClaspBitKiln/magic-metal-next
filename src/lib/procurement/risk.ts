import type { Offer } from './types'

export type RiskStatus = 'ok' | 'check' | 'blocked'

export type RiskResult = {
  status: RiskStatus
  availabilityOk: boolean
  priceDateOk: boolean
  message?: string
}

export type RiskPolicy = {
  priceMaxAgeDays: number
}

export const defaultRiskPolicy: RiskPolicy = {
  priceMaxAgeDays: 7,
}

/**
 * Simple procurement risk gate: only availability and price-list date.
 * No supplier, logistics, margin or scoring logic belongs here.
 */
export function assessOfferRisk(
  offer: Offer,
  now = new Date(),
  policy: RiskPolicy = defaultRiskPolicy,
): RiskResult {
  const availabilityOk = offer.availability !== 'unknown'
  const observedAt = new Date(offer.observedAt)
  const ageDays = Number.isFinite(observedAt.getTime())
    ? (now.getTime() - observedAt.getTime()) / 86_400_000
    : Number.POSITIVE_INFINITY
  const priceDateOk = ageDays >= 0 && ageDays <= policy.priceMaxAgeDays

  if (!availabilityOk) {
    return { status: 'blocked', availabilityOk, priceDateOk, message: 'Наличие не подтверждено.' }
  }
  if (!priceDateOk) {
    return { status: 'check', availabilityOk, priceDateOk, message: 'Дата прайса требует проверки/обновления.' }
  }
  return { status: 'ok', availabilityOk, priceDateOk }
}
