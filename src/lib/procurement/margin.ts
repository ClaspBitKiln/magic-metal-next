import type { ProcurementPlan, SplitAllocation } from './types'

export type MarginPolicy = {
  minimumMarginPercent: number
  targetMarginPercent?: number
  maximumDiscountPercent?: number
  riskReservePercent?: number
}

export type MarginInput = {
  landedCost: number
  sellingPrice: number
  currency?: string
  policy?: MarginPolicy
}

export type MarginResult = {
  landedCost: number
  sellingPrice: number
  grossProfit: number
  marginPercent: number
  markupPercent: number
  minimumSellingPrice: number
  targetSellingPrice?: number
  maximumDiscountAmount?: number
  riskReserve: number
  contributionAfterRiskReserve: number
  currency: string
  meetsMinimum: boolean
  meetsTarget: boolean
  risks: string[]
}

export type PlanMarginResult = MarginResult & {
  plan: ProcurementPlan
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value))
const finiteNonNegative = (value: number) => Number.isFinite(value) && value >= 0

export const defaultMarginPolicy: MarginPolicy = {
  minimumMarginPercent: 10,
  targetMarginPercent: 15,
  maximumDiscountPercent: 0,
  riskReservePercent: 0,
}

export function calculateMinimumSellingPrice(landedCost: number, marginPercent: number): number {
  if (!finiteNonNegative(landedCost) || !Number.isFinite(marginPercent) || marginPercent < 0 || marginPercent >= 100) return Number.POSITIVE_INFINITY
  return landedCost / (1 - marginPercent / 100)
}

export function calculateMargin(input: MarginInput): MarginResult {
  const policy = { ...defaultMarginPolicy, ...input.policy }
  const minimumMarginPercent = clampPercent(policy.minimumMarginPercent)
  const targetMarginPercent = policy.targetMarginPercent === undefined ? undefined : clampPercent(policy.targetMarginPercent)
  const landedCost = input.landedCost
  const sellingPrice = input.sellingPrice
  const grossProfit = sellingPrice - landedCost
  const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0
  const markupPercent = landedCost > 0 ? (grossProfit / landedCost) * 100 : 0
  const minimumSellingPrice = calculateMinimumSellingPrice(landedCost, minimumMarginPercent)
  const targetSellingPrice = targetMarginPercent === undefined ? undefined : calculateMinimumSellingPrice(landedCost, targetMarginPercent)
  const maximumDiscountAmount = policy.maximumDiscountPercent === undefined || !finiteNonNegative(sellingPrice)
    ? undefined
    : sellingPrice * clampPercent(policy.maximumDiscountPercent) / 100
  const riskReserve = finiteNonNegative(landedCost) ? landedCost * clampPercent(policy.riskReservePercent ?? 0) / 100 : 0
  const contributionAfterRiskReserve = grossProfit - riskReserve
  const risks: string[] = []

  if (!finiteNonNegative(landedCost)) risks.push('Landed cost не подтверждён')
  if (!finiteNonNegative(sellingPrice) || sellingPrice <= 0) risks.push('Цена продажи не задана')
  if (finiteNonNegative(landedCost) && sellingPrice > 0 && marginPercent < minimumMarginPercent) risks.push(`Маржа ниже минимальной: ${marginPercent.toFixed(2)}% < ${minimumMarginPercent.toFixed(2)}%`)
  if (riskReserve > 0 && contributionAfterRiskReserve < 0) risks.push('Прибыль после резерва риска отрицательная')

  return {
    landedCost,
    sellingPrice,
    grossProfit,
    marginPercent,
    markupPercent,
    minimumSellingPrice,
    targetSellingPrice,
    maximumDiscountAmount,
    riskReserve,
    contributionAfterRiskReserve,
    currency: input.currency ?? 'RUB',
    meetsMinimum: finiteNonNegative(sellingPrice) && sellingPrice > 0 && marginPercent >= minimumMarginPercent,
    meetsTarget: targetMarginPercent === undefined ? true : finiteNonNegative(sellingPrice) && sellingPrice > 0 && marginPercent >= targetMarginPercent,
    risks,
  }
}

export function calculatePlanMargin(plan: ProcurementPlan, sellingPrice: number, policy: MarginPolicy = defaultMarginPolicy): PlanMarginResult {
  return { plan, ...calculateMargin({ landedCost: plan.landedCost, sellingPrice, currency: plan.currency, policy }) }
}

export function allocationCostTotal(allocation: SplitAllocation): number {
  return allocation.landedCost
}
