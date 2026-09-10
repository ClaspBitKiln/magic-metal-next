import type { LandedCost, LogisticsRoute, Offer, ProcurementPlan, SplitAllocation } from './types'
import { calculateLandedCost } from './landedCost'

type SplitInput = {
  itemLine: number
  quantity: number
  unit: string
  offers: Offer[]
  routes?: LogisticsRoute[]
}

const eligible = (offers: Offer[]) => offers.filter((offer) =>
  offer.match === 'exact' || offer.match === 'approved-alternative'
).filter((offer) => Number.isFinite(offer.price) && (offer.price ?? -1) >= 0)

const routeCost = (offer: Offer, quantity: number, routes: LogisticsRoute[]) => {
  const route = routes.find((candidate) => candidate.origin === offer.city)
  if (!route) return undefined
  const fixed = route.fixedCost ?? 0
  const variable = route.variableCostPerTon !== undefined ? route.variableCostPerTon * quantity : (route.variableCostPerKg ?? 0) * quantity * 1000
  return Math.max(route.minimumCharge ?? 0, fixed + variable)
}

export function optimizeSplitProcurement(inputs: SplitInput[], routes: LogisticsRoute[] = []): ProcurementPlan[] {
  if (!inputs.length) return []

  const plans: ProcurementPlan[] = []
  const singleAllocations: SplitAllocation[] = []

  for (const input of inputs) {
    const best = eligible(input.offers).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0]
    if (!best) continue
    const logistics = routeCost(best, input.quantity, routes) ?? best.pickupCost ?? 0
    const purchaseCost = (best.price ?? 0) * input.quantity
    const landedCost = calculateLandedCost({
      purchase: purchaseCost,
      pickup: logistics,
      freight: best.freightCost,
      handling: best.handlingCost,
      destination: best.destinationCost,
      customs: best.customsCost,
    }).total
    singleAllocations.push({ itemLine: input.itemLine, offerId: best.id, quantity: input.quantity, unit: input.unit, purchaseCost, logisticsCost: logistics, landedCost })
  }

  if (singleAllocations.length === inputs.length) {
    plans.push({
      allocations: singleAllocations,
      landedCost: singleAllocations.reduce((sum, allocation) => sum + allocation.landedCost, 0),
      currency: 'RUB',
      supplierCount: new Set(singleAllocations.map((allocation) => allocation.offerId)).size,
      transportRunCount: new Set(singleAllocations.map((allocation) => inputs.find((input) => input.itemLine === allocation.itemLine)?.offers.find((offer) => offer.id === allocation.offerId)?.city)).size,
      reasons: ['Базовый план: лучшие доступные предложения по строкам заявки.'],
      risks: [],
      recommended: false,
    })
  }

  // Generate a split candidate only when an alternative supplier is materially cheaper
  // for an individual line. This keeps the MVP deterministic and avoids combinatorial explosion.
  for (const input of inputs) {
    const offers = eligible(input.offers).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    if (offers.length < 2) continue
    const cheapest = offers[0]
    const second = offers[1]
    if (!cheapest.price || !second.price || second.price <= cheapest.price) continue

    const allocations = singleAllocations.map((allocation) => {
      if (allocation.itemLine !== input.itemLine) return allocation
      const logistics = routeCost(second, input.quantity, routes) ?? second.pickupCost ?? 0
      const purchaseCost = second.price! * input.quantity
      const landedCost = calculateLandedCost({ purchase: purchaseCost, pickup: logistics, freight: second.freightCost, handling: second.handlingCost, destination: second.destinationCost, customs: second.customsCost }).total
      return { ...allocation, offerId: second.id, purchaseCost, logisticsCost: logistics, landedCost }
    })
    const plan: ProcurementPlan = {
      allocations,
      landedCost: allocations.reduce((sum, allocation) => sum + allocation.landedCost, 0),
      currency: 'RUB',
      supplierCount: new Set(allocations.map((allocation) => allocation.offerId)).size,
      transportRunCount: new Set(allocations.map((allocation) => inputs.find((candidate) => candidate.itemLine === allocation.itemLine)?.offers.find((offer) => offer.id === allocation.offerId)?.city)).size,
      reasons: ['Сценарий разделённой закупки рассчитан для сравнения полной стоимости.'],
      risks: ['Требуется проверить, что дополнительный маршрут не создаёт несогласованные сроки или транспортные затраты.'],
      recommended: false,
    }
    plans.push(plan)
  }

  return plans.sort((a, b) => a.landedCost - b.landedCost).map((plan, index) => ({ ...plan, recommended: index === 0 && plan.risks.length === 0 }))
}
