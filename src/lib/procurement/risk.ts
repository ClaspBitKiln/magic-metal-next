import type { ProcurementPlan } from './types'
import type { MarginResult } from './margin'
import type { FreshnessPolicy } from './reliability'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type RiskCode =
  | 'route-unverified'
  | 'route-stale'
  | 'supplier-unreliable'
  | 'supplier-history-missing'
  | 'price-stale'
  | 'availability-stale'
  | 'logistics-stale'
  | 'split-procurement'
  | 'lead-time-unknown'
  | 'lead-time-risk'
  | 'data-quality'
  | 'margin-below-minimum'
  | 'plan-risk'

export type RiskItem = {
  code: RiskCode
  level: RiskLevel
  score: number
  message: string
  source?: string
}

export type RiskPolicy = {
  staleThreshold: number
  supplierReliabilityThreshold: number
  leadTimeRiskDays: number
  splitSupplierThreshold: number
  splitRunThreshold: number
  minimumOverallScore: number
  blockOnCritical: boolean
}

export type RiskContext = {
  supplierReliability?: number
  priceFreshness?: number
  availabilityFreshness?: number
  logisticsFreshness?: number
  routeVerified?: boolean
  leadTimeDays?: number
  dataQuality?: number
  policy?: Partial<RiskPolicy>
  freshnessPolicy?: FreshnessPolicy
}

export type RiskResult = {
  score: number
  level: RiskLevel
  items: RiskItem[]
  canProceed: boolean
  blocking: boolean
  reasons: string[]
}

export const defaultRiskPolicy: RiskPolicy = {
  staleThreshold: 0.5,
  supplierReliabilityThreshold: 0.6,
  leadTimeRiskDays: 21,
  splitSupplierThreshold: 2,
  splitRunThreshold: 2,
  minimumOverallScore: 0.6,
  blockOnCritical: true,
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const levelFor = (score: number): RiskLevel => score >= 0.85 ? 'low' : score >= 0.65 ? 'medium' : score >= 0.4 ? 'high' : 'critical'

export function assessRisk(context: RiskContext): RiskResult {
  const policy = { ...defaultRiskPolicy, ...context.policy }
  const items: RiskItem[] = []
  const add = (code: RiskCode, level: RiskLevel, score: number, message: string, source?: string) => items.push({ code, level, score: clamp(score), message, source })

  const freshness = [context.priceFreshness, context.availabilityFreshness, context.logisticsFreshness].filter((v): v is number => v !== undefined)
  for (const [name, value, code] of [
    ['цены', context.priceFreshness, 'price-stale'],
    ['наличия', context.availabilityFreshness, 'availability-stale'],
    ['логистики', context.logisticsFreshness, 'logistics-stale'],
  ] as const) {
    if (value !== undefined && value < policy.staleThreshold) add(code, value < 0.25 ? 'high' : 'medium', value, `Данные ${name} недостаточно свежие.`)
  }

  if (context.routeVerified === false) add('route-unverified', 'critical', 0, 'Маршрут не подтверждён перевозчиком и не может считаться финальным.')
  if (context.logisticsFreshness !== undefined && context.logisticsFreshness < policy.staleThreshold) add('route-stale', 'high', context.logisticsFreshness, 'Ставка/условия маршрута требуют обновления.')

  if (context.supplierReliability !== undefined && context.supplierReliability < policy.supplierReliabilityThreshold) {
    add('supplier-unreliable', context.supplierReliability < 0.4 ? 'high' : 'medium', context.supplierReliability, 'История исполнения поставщика ниже допустимого уровня.')
  } else if (context.supplierReliability === undefined) {
    add('supplier-history-missing', 'medium', 0.5, 'История исполнения поставщика отсутствует; оценка нейтральная.')
  }

  if (context.leadTimeDays === undefined) add('lead-time-unknown', 'medium', 0.5, 'Срок поставки не подтверждён.')
  else if (context.leadTimeDays > policy.leadTimeRiskDays) add('lead-time-risk', 'high', Math.max(0, 1 - context.leadTimeDays / 60), `Срок поставки ${context.leadTimeDays} дней создаёт повышенный риск.`)

  if (context.dataQuality !== undefined && context.dataQuality < policy.staleThreshold) add('data-quality', context.dataQuality < 0.25 ? 'high' : 'medium', context.dataQuality, 'Недостаточно качественных подтверждений по предложению.')

  const overallQuality = clamp((context.supplierReliability ?? 0.5) * 0.25 + (context.priceFreshness ?? 0.5) * 0.15 + (context.availabilityFreshness ?? 0.5) * 0.15 + (context.logisticsFreshness ?? 0.5) * 0.15 + (context.dataQuality ?? 0.5) * 0.30)
  const score = clamp(overallQuality - items.reduce((sum, item) => sum + (item.level === 'critical' ? 0.35 : item.level === 'high' ? 0.15 : item.level === 'medium' ? 0.05 : 0), 0))
  const blocking = policy.blockOnCritical && items.some((item) => item.level === 'critical')
  const level = items.length ? items.reduce<RiskLevel>((worst, item) => ['critical', 'high', 'medium', 'low'].indexOf(item.level) < ['critical', 'high', 'medium', 'low'].indexOf(worst) ? item.level : worst, 'low') : levelFor(score)
  return { score, level, items, canProceed: !blocking && score >= policy.minimumOverallScore, blocking, reasons: items.map((item) => item.message) }
}

export function assessPlanRisk(plan: ProcurementPlan, margin?: MarginResult, context: RiskContext = {}): RiskResult {
  const splitContext: RiskContext = {
    ...context,
    supplierReliability: context.supplierReliability,
  }
  const result = assessRisk(splitContext)
  if (plan.supplierCount >= defaultRiskPolicy.splitSupplierThreshold || plan.transportRunCount >= defaultRiskPolicy.splitRunThreshold) {
    result.items.push({ code: 'split-procurement', level: plan.supplierCount >= 3 || plan.transportRunCount >= 3 ? 'high' : 'medium', score: 0.5, message: `План использует ${plan.supplierCount} поставщика(ов) и ${plan.transportRunCount} транспортный(ых) запуск(ов); split увеличивает операционный риск.` })
  }
  if (plan.risks.length) result.items.push({ code: 'plan-risk', level: 'high', score: 0.25, message: `В плане уже зафиксировано рисков: ${plan.risks.length}.` })
  if (margin && !margin.meetsMinimum) result.items.push({ code: 'margin-below-minimum', level: 'critical', score: 0, message: 'Цена продажи ниже минимально допустимой маржи.' })
  const hasCritical = result.items.some((item) => item.level === 'critical')
  const penalty = result.items.slice(result.items.length - (plan.risks.length + 1)).reduce((sum, item) => sum + (item.level === 'critical' ? 0.35 : item.level === 'high' ? 0.15 : 0.05), 0)
  result.score = clamp(result.score - penalty)
  result.blocking = defaultRiskPolicy.blockOnCritical && hasCritical
  result.canProceed = !result.blocking && result.score >= defaultRiskPolicy.minimumOverallScore
  result.level = result.items.reduce<RiskLevel>((worst, item) => ['critical', 'high', 'medium', 'low'].indexOf(item.level) < ['critical', 'high', 'medium', 'low'].indexOf(worst) ? item.level : worst, levelFor(result.score))
  result.reasons = result.items.map((item) => item.message)
  return result
}
