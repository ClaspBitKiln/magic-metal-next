import type { LandedCost } from './types'

export type LandedCostInput = {
  purchase: number
  supplierCharges?: number
  pickup?: number
  freight?: number
  handling?: number
  customs?: number
  destination?: number
  riskAllowance?: number
  currency?: string
}

export function calculateLandedCost(input: LandedCostInput): LandedCost {
  const result = {
    purchase: input.purchase,
    supplierCharges: input.supplierCharges ?? 0,
    pickup: input.pickup ?? 0,
    freight: input.freight ?? 0,
    handling: input.handling ?? 0,
    customs: input.customs ?? 0,
    destination: input.destination ?? 0,
    riskAllowance: input.riskAllowance ?? 0,
    currency: input.currency ?? 'RUB',
  }

  return { ...result, total: Object.entries(result).filter(([key]) => key !== 'currency').reduce((sum, [, value]) => sum + Number(value), 0) }
}
