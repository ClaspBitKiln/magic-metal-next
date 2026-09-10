import { describe, expect, it } from 'vitest'
import { assessPlanRisk, assessRisk } from '@/lib/procurement/risk'
import type { ProcurementPlan } from '@/lib/procurement/types'

const plan = (overrides: Partial<ProcurementPlan> = {}): ProcurementPlan => ({
  allocations: [],
  landedCost: 1_000_000,
  currency: 'RUB',
  supplierCount: 1,
  transportRunCount: 1,
  reasons: [],
  risks: [],
  recommended: false,
  ...overrides,
})

describe('procurement risk engine', () => {
  it('blocks an unverified route before QA', () => {
    const result = assessRisk({
      routeVerified: false,
      supplierReliability: 0.9,
      priceFreshness: 1,
      availabilityFreshness: 1,
      logisticsFreshness: 1,
      dataQuality: 1,
    })
    expect(result.blocking).toBe(true)
    expect(result.canProceed).toBe(false)
    expect(result.items.some((item) => item.code === 'route-unverified')).toBe(true)
  })

  it('detects stale price, availability and logistics data', () => {
    const result = assessRisk({ priceFreshness: 0.2, availabilityFreshness: 0.2, logisticsFreshness: 0.2, routeVerified: true, supplierReliability: 0.9, dataQuality: 0.9 })
    expect(result.items.map((item) => item.code)).toEqual(expect.arrayContaining(['price-stale', 'availability-stale', 'logistics-stale', 'route-stale']))
    expect(result.level).toBe('high')
  })

  it('flags weak supplier reliability and missing execution history', () => {
    const weak = assessRisk({ supplierReliability: 0.3, routeVerified: true, priceFreshness: 1, availabilityFreshness: 1, logisticsFreshness: 1, dataQuality: 1 })
    expect(weak.items.some((item) => item.code === 'supplier-unreliable')).toBe(true)
    const missing = assessRisk({ routeVerified: true, priceFreshness: 1, availabilityFreshness: 1, logisticsFreshness: 1, dataQuality: 1 })
    expect(missing.items.some((item) => item.code === 'supplier-history-missing')).toBe(true)
  })

  it('flags split procurement and long or unknown lead time', () => {
    const result = assessPlanRisk(plan({ supplierCount: 3, transportRunCount: 2 }), undefined, { routeVerified: true, supplierReliability: 0.9, priceFreshness: 1, availabilityFreshness: 1, logisticsFreshness: 1, dataQuality: 1, leadTimeDays: 30 })
    expect(result.items.some((item) => item.code === 'split-procurement')).toBe(true)
    expect(result.items.some((item) => item.code === 'lead-time-risk')).toBe(true)
  })

  it('blocks a plan whose margin is below minimum', () => {
    const result = assessPlanRisk(plan(), {
      landedCost: 1_000_000,
      sellingPrice: 1_050_000,
      grossProfit: 50_000,
      marginPercent: 4.7619,
      markupPercent: 5,
      minimumSellingPrice: 1_111_111,
      targetSellingPrice: 1_176_470,
      maximumDiscountAmount: 0,
      riskReserve: 0,
      contributionAfterRiskReserve: 50_000,
      currency: 'RUB',
      meetsMinimum: false,
      meetsTarget: false,
      risks: ['Маржа ниже минимальной'],
    })
    expect(result.blocking).toBe(true)
    expect(result.items.some((item) => item.code === 'margin-below-minimum')).toBe(true)
  })
})
