import type { LogisticsRoute, Offer, ProcurementPlan, SplitAllocation } from './types'

type SplitInput = { itemLine: number; quantity: number; unit: string; offers: Offer[] }
type Candidate = { offer: Offer; quantity: number; itemLine: number; unit: string }
type SplitOptions = {
  allowObservedRoutes?: boolean
  maxOffersPerLine?: number
  maxPlans?: number
  beamWidth?: number
}

type TransportResult = {
  total: number
  runs: number
  unverifiedRuns: number
  groupCosts: Map<string, number>
}

const eligible = (offers: Offer[]) => offers.filter((offer) =>
  (offer.match === 'exact' || offer.match === 'approved-alternative') &&
  Number.isFinite(offer.price) && (offer.price ?? -1) >= 0 &&
  Number.isFinite(offer.quantity) && (offer.quantity ?? 0) > 0
)

const normalizedUnit = (unit: string) => unit.trim().toLowerCase()

const quantityInTons = (quantity: number, unit: string) => {
  const value = normalizedUnit(unit)
  if (value === 'т' || value === 'тонна' || value === 'тонны' || value === 'тонн' || value === 't') return quantity
  if (value === 'кг' || value === 'kg') return quantity / 1000
  return undefined
}

const routeFor = (offer: Offer, routes: LogisticsRoute[], destination: string, allowObservedRoutes: boolean) => routes.find((route) => {
  const allowed = route.status === 'verified' || (allowObservedRoutes && route.status === 'observed')
  return allowed && route.origin === offer.city && route.destination === destination
})

const variableRouteCost = (route: LogisticsRoute, candidates: Candidate[]) => {
  const tons = candidates.reduce((sum, candidate) => sum + (quantityInTons(candidate.quantity, candidate.unit) ?? 0), 0)
  const kg = tons * 1000
  const variable = route.variableCostPerTon !== undefined
    ? route.variableCostPerTon * tons
    : (route.variableCostPerKg ?? 0) * kg
  return { tons, cost: Math.max(route.minimumCharge ?? 0, (route.fixedCost ?? 0) + variable) }
}

// A transport run is consolidated by physical origin. Multiple suppliers in one city
// may be collected in the same carrier run; supplier count remains a separate metric.
const groupKey = (candidate: Candidate) => candidate.offer.city
  ? `origin:${candidate.offer.city}`
  : `offer:${candidate.offer.id}`

function transportCost(candidates: Candidate[], routes: LogisticsRoute[], destination: string, allowObservedRoutes: boolean): TransportResult {
  const groups = new Map<string, Candidate[]>()
  for (const candidate of candidates) {
    const key = groupKey(candidate)
    groups.set(key, [...(groups.get(key) ?? []), candidate])
  }

  let total = 0
  let unverifiedRuns = 0
  const groupCosts = new Map<string, number>()

  for (const [key, group] of groups) {
    const route = routeFor(group[0].offer, routes, destination, allowObservedRoutes)
    if (!route) {
      unverifiedRuns += 1
      const fallback = group.reduce((sum, candidate) => sum + (candidate.offer.pickupCost ?? 0) + (candidate.offer.freightCost ?? 0), 0)
      groupCosts.set(key, fallback)
      total += fallback
      continue
    }

    const routeData = variableRouteCost(route, group)
    if (route.capacityTons !== undefined && routeData.tons > route.capacityTons) {
      return { total: Number.POSITIVE_INFINITY, runs: groups.size, unverifiedRuns, groupCosts }
    }

    groupCosts.set(key, routeData.cost)
    total += routeData.cost
    if (route.status === 'observed') unverifiedRuns += 1
  }

  return { total, runs: groups.size, unverifiedRuns, groupCosts }
}

const directVariableCost = (offer: Offer) => {
  const quantity = Math.max(offer.quantity ?? 1, 1)
  const fixed = (offer.handlingCost ?? 0) + (offer.destinationCost ?? 0) + (offer.customsCost ?? 0)
  return (offer.price ?? 0) + fixed / quantity + (offer.pickupCost ?? 0) / quantity + (offer.freightCost ?? 0) / quantity
}

const allocationQuantity = (offer: Offer, remaining: number) => {
  const stock = offer.quantity ?? 0
  const supplierMax = offer.maxOrderQuantity ?? Number.POSITIVE_INFINITY
  let quantity = Math.min(remaining, stock, supplierMax)
  const step = offer.orderStep
  if (step !== undefined && step > 0) quantity = Math.floor(quantity / step) * step
  const min = offer.minOrderQuantity ?? 0
  if (quantity > 0 && quantity < min) return 0
  return quantity
}

function quantityPatterns(input: SplitInput, maxOffers: number): Candidate[][] {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return []
  const offers = eligible(input.offers).slice(0, maxOffers)
  if (!offers.length) return []

  const patterns: Candidate[][] = []
  const subsetCount = 1 << offers.length
  for (let mask = 1; mask < subsetCount; mask += 1) {
    const selected = offers.filter((_, index) => (mask & (1 << index)) !== 0)
      .sort((a, b) => directVariableCost(a) - directVariableCost(b))
    let remaining = input.quantity
    const allocation: Candidate[] = []
    for (const offer of selected) {
      if (remaining <= 1e-9) break
      const available = allocationQuantity(offer, remaining)
      if (available <= 0) continue
      allocation.push({ offer, quantity: available, itemLine: input.itemLine, unit: input.unit })
      remaining -= available
    }
    if (remaining <= 1e-9) patterns.push(allocation)
  }

  const seen = new Set<string>()
  return patterns.filter((pattern) => {
    const signature = pattern.map((item) => `${item.offer.id}:${item.quantity}`).sort().join('|')
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

function approximatePatternCost(pattern: Candidate[]) {
  return pattern.reduce((sum, candidate) => sum + (candidate.offer.price ?? 0) * candidate.quantity + (candidate.offer.handlingCost ?? 0) + (candidate.offer.destinationCost ?? 0) + (candidate.offer.customsCost ?? 0), 0)
}

const inputsAllocationCount = (candidates: Candidate[]) => new Set(candidates.map((candidate) => candidate.itemLine)).size

function buildPlan(candidates: Candidate[], routes: LogisticsRoute[], destination: string, allowObservedRoutes: boolean): ProcurementPlan | null {
  if (!candidates.length) return null
  const currencies = new Set(candidates.map((candidate) => candidate.offer.currency))
  if (currencies.size !== 1) return null

  const logistics = transportCost(candidates, routes, destination, allowObservedRoutes)
  if (!Number.isFinite(logistics.total)) return null

  const allocationsBase = candidates.map((candidate) => ({
    candidate,
    purchaseCost: (candidate.offer.price ?? 0) * candidate.quantity,
    extraCost: (candidate.offer.handlingCost ?? 0) + (candidate.offer.destinationCost ?? 0) + (candidate.offer.customsCost ?? 0),
  }))

  const groups = new Map<string, typeof allocationsBase>()
  for (const item of allocationsBase) {
    const key = groupKey(item.candidate)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  const allocations: SplitAllocation[] = []
  for (const [key, group] of groups) {
    const groupPurchase = group.reduce((sum, item) => sum + item.purchaseCost, 0)
    const groupQuantity = group.reduce((sum, item) => sum + item.candidate.quantity, 0)
    const groupLogistics = logistics.groupCosts.get(key) ?? 0
    for (const item of group) {
      const basis = groupPurchase > 0 ? item.purchaseCost / groupPurchase : item.candidate.quantity / Math.max(groupQuantity, 1)
      const logisticsShare = groupLogistics * basis
      allocations.push({
        itemLine: item.candidate.itemLine,
        offerId: item.candidate.offer.id,
        quantity: item.candidate.quantity,
        unit: item.candidate.unit,
        purchaseCost: item.purchaseCost,
        logisticsCost: logisticsShare,
        landedCost: item.purchaseCost + item.extraCost + logisticsShare,
      })
    }
  }

  const purchase = allocations.reduce((sum, allocation) => sum + allocation.purchaseCost, 0)
  const extras = allocationsBase.reduce((sum, item) => sum + item.extraCost, 0)
  const total = purchase + extras + logistics.total
  const supplierCount = new Set(candidates.map((candidate) => candidate.offer.supplierId)).size
  const isSplit = supplierCount > 1 || allocations.length > inputsAllocationCount(candidates)
  const reason = isSplit
    ? 'Quantity-level Split Procurement: объём распределён между доступными предложениями с учётом ограничений количества и общей логистики.'
    : 'Single-source Procurement: весь объём закрыт одним предложением без необходимости дробления.'
  const risks = logistics.unverifiedRuns
    ? [`${logistics.unverifiedRuns} транспортный маршрут использует наблюдаемую/неподтверждённую ставку; перед финальной закупкой требуется подтверждение перевозчика.`]
    : []

  return {
    allocations,
    landedCost: total,
    currency: candidates[0].offer.currency,
    supplierCount,
    transportRunCount: logistics.runs,
    leadTimeDays: Math.max(...candidates.map((candidate) => candidate.offer.leadTimeDays ?? 0)) || undefined,
    reasons: [reason, `Общая логистика рассчитана по ${logistics.runs} транспортному направлению(ям) для ${destination}.`],
    risks,
    recommended: false,
  }
}

export function optimizeSplitProcurement(inputs: SplitInput[], routes: LogisticsRoute[] = [], destination = 'Ташкент', options: SplitOptions = {}): ProcurementPlan[] {
  if (!inputs.length) return []
  const maxOffers = Math.max(1, Math.min(options.maxOffersPerLine ?? 8, 12))
  const maxPlans = Math.max(1, options.maxPlans ?? 20)
  const beamWidth = Math.max(maxPlans, options.beamWidth ?? 100)
  const patternsByLine = inputs.map((input) => quantityPatterns(input, maxOffers))
  if (patternsByLine.some((patterns) => patterns.length === 0)) return []

  let partials: Candidate[][] = [[]]
  for (const patterns of patternsByLine) {
    const next: Candidate[][] = []
    for (const partial of partials) for (const pattern of patterns) next.push([...partial, ...pattern])
    partials = next
      .sort((a, b) => approximatePatternCost(a) - approximatePatternCost(b))
      .slice(0, beamWidth)
  }

  const plans = partials
    .map((candidates) => buildPlan(candidates, routes, destination, options.allowObservedRoutes === true))
    .filter((plan): plan is ProcurementPlan => plan !== null)
    .sort((a, b) => a.landedCost - b.landedCost)

  const unique = new Set<string>()
  return plans.filter((plan) => {
    const signature = plan.allocations.map((allocation) => `${allocation.itemLine}:${allocation.offerId}:${allocation.quantity}`).sort().join('|')
    if (unique.has(signature)) return false
    unique.add(signature)
    return true
  }).slice(0, maxPlans).map((plan, index) => ({
    ...plan,
    recommended: index === 0 && plan.risks.length === 0,
  }))
}
