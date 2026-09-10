import type { Offer } from './types'
import { assessOfferRisk, type RiskPolicy } from './risk'

export type QAStatus = 'ok' | 'check' | 'blocked'

export type QAResult = {
  status: QAStatus
  canProceed: boolean
  reasons: string[]
}

/** Minimal final gate before a client offer: availability + price-list date. */
export function assessQA(
  offer: Offer,
  now = new Date(),
  policy?: RiskPolicy,
): QAResult {
  const risk = assessOfferRisk(offer, now, policy)
  return {
    status: risk.status,
    canProceed: risk.status === 'ok',
    reasons: risk.message ? [risk.message] : [],
  }
}
