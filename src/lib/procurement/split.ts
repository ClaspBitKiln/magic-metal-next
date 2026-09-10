import type { LogisticsRoute, Offer, ProcurementPlan, SplitAllocation } from './types'

type SplitInput = { itemLine: number; quantity: number; unit: string; offers: Offer[] }
type Candidate = { offer: Offer; quantity: number; itemLine: number; unit: string }
type SplitOptions = { allowObservedRoutes?: boolean }

const eligible = (offers: Offer[]) => offers.filter((offer) => (offer.match === 'exact' || offer.match === 'approved-alternative') && Number.isFinite(offer.price) && (offer.price ?? -1) >= 0)

const routeFor = (offer: Offer, routes: LogisticsRoute[], destination: string, allowObservedRoutes: boolean) => routes.find((route) => {
  const allowed = route.status === 'verified' || (allowObservedRoutes && route.status === 'observed')
  return allowed && route.origin === offer.city && route.destination === destination
})

function transportCost(candidates: Candidate[], routes: LogisticsRoute[], destination: string, allowObservedRoutes: boolean) {
  const groups = new Map<string, Candidate[]>()
  for (const candidate of candidates) {
    const key = candidate.offer.city ? `${candidate.offer.city}|${candidate.offer.supplierId}` : `offer:${candidate.offer.id}`
    groups.set(key, [...(groups.get(key) ?? []), candidate])
  }
  let total = 0
  let unverifiedRuns = 0
  for (const [, group] of groups) {
    const route = routeFor(group[0].offer, routes, destination, allowObservedRoutes)
    const tons = group.reduce((sum, candidate) => sum + (candidate.unit === 'т' ? candidate.quantity : 0), 0)
    const kg = group.reduce((sum, candidate) => sum + (candidate.unit === 'кг' ? candidate.quantity : 0), 0)
    if (!route) {
      unverifiedRuns += 1
      total += group.reduce((sum, candidate) => sum + (candidate.offer.pickupCost ?? 0) + (candidate.offer.freightCost ?? 0), 0)
      continue
    }
    if (route.capacityTons !== undefined && tons > route.capacityTons) return { total: Number.POSITIVE_INFINITY, runs: groups.size, unverifiedRuns }
    const variable = route.variableCostPerTon !== undefined ? route.variableCostPerTon * tons : (route.variableCostPerKg ?? 0) * kg
    total += Math.max(route.minimumCharge ?? 0, (route.fixedCost ?? 0) + variable)
    if (route.status === 'observed') unverifiedRuns += 1
  }
  return { total, runs: groups.size, unverifiedRuns }
}

function buildPlan(candidates: Candidate[], routes: LogisticsRoute[], reason: string, destination: string, allowObservedRoutes: boolean): ProcurementPlan {
  const allocations: SplitAllocation[] = candidates.map((candidate) => ({ itemLine: candidate.itemLine, offerId: candidate.offer.id, quantity: candidate.quantity, unit: candidate.unit, purchaseCost: (candidate.offer.price ?? 0) * candidate.quantity, logisticsCost: 0, landedCost: (candidate.offer.price ?? 0) * candidate.quantity }))
  const logistics = transportCost(candidates, routes, destination, allowObservedRoutes)
  const purchase = allocations.reduce((sum, allocation) => sum + allocation.purchaseCost, 0)
  const extra = candidates.reduce((sum, candidate) => sum + (candidate.offer.handlingCost ?? 0) + (candidate.offer.destinationCost ?? 0) + (candidate.offer.customsCost ?? 0), 0)
  const total = purchase + logistics.total + extra
  const perAllocationLogistics = logistics.runs ? logistics.total / logistics.runs : 0
  const risks = logistics.unverifiedRuns ? [`${logistics.unverifiedRuns} транспортный маршрут использует наблюдаемую/неподтверждённую ставку; нужен запрос перевозчику перед финальной закупкой.`] : []
  return {
    allocations: allocations.map((allocation) => ({ ...allocation, logisticsCost: perAllocationLogistics, landedCost: allocation.purchaseCost + perAllocationLogistics })),
    landedCost: total,
    currency: candidates[0]?.offer.currency ?? 'RUB',
    supplierCount: new Set(candidates.map((candidate) => candidate.offer.supplierId)).size,
    transportRunCount: logistics.runs,
    leadTimeDays: Math.max(...candidates.map((candidate) => candidate.offer.leadTimeDays ?? 0)) || undefined,
    reasons: [reason, `Логистика консолидирована по ${logistics.runs} транспортному направлению(ям) для ${destination}.`],
    risks,
    recommended: false,
  }
}

export function optimizeSplitProcurement(inputs: SplitInput[], routes: LogisticsRoute[] = [], destination = 'Ташкент', options: SplitOptions = {}): ProcurementPlan[] {
  if (!inputs.length) return []
  const candidatesByLine = inputs.map((input) => eligible(input.offers).map((offer) => ({ offer, quantity: input.quantity, itemLine: input.itemLine, unit: input.unit })))
  if (candidatesByLine.some((items) => !items.length)) return []
  const combinations: Candidate[][] = []
  const visit = (index: number, current: Candidate[]) => {
    if (index === candidatesByLine.length) return combinations.push(current)
    for (const candidate of candidatesByLine[index]) visit(index + 1, [...current, candidate])
  }
  visit(0, [])

  return combinations.map((combination) => buildPlan(combination, routes, new Set(combination.map((candidate) => candidate.offer.supplierId)).size > 1 ? 'Split Procurement: позиции распределены между несколькими поставщиками с учётом общей логистики.' : 'Single-source Procurement: позиции сведены к одному поставщику, когда это выгоднее по полной стоимости.', destination, options.allowObservedRoutes === true))
    .filter((plan) => Number.isFinite(plan.landedCost))
    .sort((a, b) => a.landedCost - b.landedCost)
    .map((plan, index) => ({ ...plan, recommended: index === 0 && plan.risks.length === 0 }))
}
