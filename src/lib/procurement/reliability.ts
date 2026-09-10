import type { Availability, Offer } from './types'

export type SupplierReliabilityRecord = {
  supplierId: string
  reliabilityScore: number
  completedDeliveries?: number
  failedDeliveries?: number
  confirmedDeliveries?: number
  onTimeDeliveries?: number
  lastObservedAt?: string
}

export type FreshnessPolicy = { priceDays: number; availabilityDays: number; logisticsDays: number }

export type OfferQuality = {
  supplierReliability: number
  priceFreshness: number
  availabilityFreshness: number
  logisticsFreshness: number
  evidenceScore: number
  overall: number
  risks: string[]
}

export const defaultFreshnessPolicy: FreshnessPolicy = { priceDays: 7, availabilityDays: 3, logisticsDays: 7 }
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function freshnessScore(observedAt: string | undefined, maxAgeDays: number, now = new Date()): number {
  if (!observedAt || maxAgeDays <= 0) return 0
  const ageDays = (now.getTime() - new Date(observedAt).getTime()) / 86_400_000
  return Number.isFinite(ageDays) ? clamp(1 - Math.max(0, ageDays) / maxAgeDays) : 0
}

export function reliabilityFromHistory(record?: SupplierReliabilityRecord): number {
  if (!record) return 0.5
  if (Number.isFinite(record.reliabilityScore)) return clamp(record.reliabilityScore)
  const completed = Math.max(0, record.completedDeliveries ?? 0)
  if (!completed) return 0.5
  const successful = Math.max(0, (record.confirmedDeliveries ?? 0) || completed - (record.failedDeliveries ?? 0))
  const onTime = record.onTimeDeliveries === undefined ? successful : Math.max(0, record.onTimeDeliveries)
  return clamp((successful / completed) * 0.6 + (onTime / completed) * 0.4)
}

export function evidenceScore(offer: Offer): number {
  if (offer.match === 'non-qualifying') return 0
  const availability: Record<Availability, number> = { 'in-stock': 1, limited: 0.8, 'on-request': 0.55, production: 0.35, unknown: 0.1 }
  return clamp(offer.confidence * 0.7 + availability[offer.availability] * 0.3)
}

export function assessOfferQuality(offer: Offer, history?: SupplierReliabilityRecord, policy: FreshnessPolicy = defaultFreshnessPolicy, now = new Date()): OfferQuality {
  const supplierReliability = reliabilityFromHistory(history)
  const priceFreshness = freshnessScore(offer.observedAt, policy.priceDays, now)
  const availabilityFreshness = freshnessScore(offer.observedAt, policy.availabilityDays, now)
  const logisticsFreshness = freshnessScore(offer.observedAt, policy.logisticsDays, now)
  const evidence = evidenceScore(offer)
  const risks: string[] = []
  if (priceFreshness < 0.5) risks.push('Цена устарела или близка к истечению срока актуальности')
  if (availabilityFreshness < 0.5) risks.push('Данные о наличии устарели')
  if (logisticsFreshness < 0.5) risks.push('Логистические данные требуют обновления')
  if (!history) risks.push('Нет истории исполнения поставщика')
  const overall = supplierReliability * 0.30 + priceFreshness * 0.20 + availabilityFreshness * 0.15 + logisticsFreshness * 0.10 + evidence * 0.25
  return { supplierReliability, priceFreshness, availabilityFreshness, logisticsFreshness, evidenceScore: evidence, overall, risks }
}
