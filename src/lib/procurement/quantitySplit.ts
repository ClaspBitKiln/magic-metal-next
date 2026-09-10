import type { Offer, SplitAllocation } from './types'
import { optimizeSplitProcurement } from './split'

type QuantitySplitInput = { itemLine: number; quantity: number; unit: string; offers: Offer[] }

/**
 * Backward-compatible single-line API. The canonical optimizer in split.ts
 * now owns quantity limits, supplier order constraints and landed-cost logic.
 */
export function optimizeQuantitySplit(input: QuantitySplitInput, maxOffers = 8): SplitAllocation[] {
  const plans = optimizeSplitProcurement([input], [], '', { maxOffersPerLine: maxOffers, maxPlans: 1 })
  return plans[0]?.allocations ?? []
}
