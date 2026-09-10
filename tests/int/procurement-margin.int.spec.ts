import { describe, expect, it } from 'vitest'
import { calculateMargin, calculateMinimumSellingPrice, calculatePlanMargin } from '@/lib/procurement/margin'
import type { ProcurementPlan } from '@/lib/procurement/types'

describe('procurement margin engine', () => {
  it('calculates gross profit, margin and markup from landed cost', () => {
    const result = calculateMargin({ landedCost: 800000, sellingPrice: 1000000 })
    expect(result.grossProfit).toBe(200000)
    expect(result.marginPercent).toBe(20)
    expect(result.markupPercent).toBe(25)
    expect(result.meetsMinimum).toBe(true)
  })

  it('calculates minimum selling price from target margin, not markup', () => {
    expect(calculateMinimumSellingPrice(800000, 20)).toBe(1000000)
  })

  it('rejects a selling price below the configured minimum margin', () => {
    const result = calculateMargin({ landedCost: 800000, sellingPrice: 850000, policy: { minimumMarginPercent: 10 } })
    expect(result.meetsMinimum).toBe(false)
    expect(result.risks[0]).toContain('Маржа ниже минимальной')
  })

  it('supports a target margin and risk reserve without changing landed cost', () => {
    const result = calculateMargin({
      landedCost: 1000000,
      sellingPrice: 1200000,
      policy: { minimumMarginPercent: 10, targetMarginPercent: 20, riskReservePercent: 3 },
    })
    expect(result.meetsMinimum).toBe(true)
    expect(result.meetsTarget).toBe(true)
    expect(result.riskReserve).toBe(30000)
    expect(result.contributionAfterRiskReserve).toBe(170000)
    expect(result.minimumSellingPrice).toBeCloseTo(1111111.1111)
    expect(result.targetSellingPrice).toBe(1250000)
  })

  it('uses the actual procurement plan landed cost as the margin base', () => {
    const plan: ProcurementPlan = {
      allocations: [],
      landedCost: 1250000,
      currency: 'RUB',
      supplierCount: 2,
      transportRunCount: 1,
      reasons: ['split'],
      risks: [],
      recommended: true,
    }
    const result = calculatePlanMargin(plan, 1500000, { minimumMarginPercent: 10 })
    expect(result.landedCost).toBe(1250000)
    expect(result.grossProfit).toBe(250000)
    expect(result.marginPercent).toBeCloseTo(16.6666667)
    expect(result.meetsMinimum).toBe(true)
  })
})
