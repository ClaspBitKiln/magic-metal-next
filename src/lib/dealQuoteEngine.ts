export type DealMode = 'rf' | 'export'
export type PricingMethod = 'markup' | 'fixed' | 'planned-profit' | 'vat-full' | 'vat-percent' | 'profit-fixed'
export type QuoteSource = 'METALLSERVICE' | 'MARKET' | 'MANUAL'

export type IncomingDealLine = {
  id: string | number
  name: string
  unit: 'т' | 'шт.' | 'м'
  quantity: number
  productKey?: string
}

export type ReferencePrice = {
  productKey: string
  price: number
  unit: 'т' | 'шт.' | 'м'
  source: QuoteSource
  observedAt: string
  location?: string
  supplierName?: string
  loadingPoint?: string
  leadDays?: number
}

export type MarketOffer = {
  source: string
  price: number
  location: string
  leadDays: number
  loadingPoint: string
  observedAt?: string
}

export type DealLineCalculation = IncomingDealLine & {
  referencePurchase: number | null
  selectedPurchase: number | null
  selectedSource: QuoteSource | null
  selectedSupplier: string | null
  selectedLocation?: string
  selectedLoadingPoint?: string
  selectedLeadDays?: number
  salePrice: number | null
  freightPerUnit: number
  allocatedFixedExpenses: number
  cheaperMarketPrice: number | null
  cheaperDelta: number
  lineCost: number
  lineSales: number
  lineProfit: number
  marketOffers: MarketOffer[]
}

export type DealInput = {
  mode: DealMode
  lines: IncomingDealLine[]
  referencePrices: ReferencePrice[]
  marketOffers?: Record<string, MarketOffer[]>
  freightPerUnit?: Record<string, number>
  pricing: { method: PricingMethod; value: number; vatRate?: number }
  fixedExpenses?: { delivery?: number; handling?: number; customs?: number; st1?: number; other?: number }
}

export type DealCalculation = {
  lines: DealLineCalculation[]
  purchaseTotal: number
  variableFreightTotal: number
  fixedExpensesTotal: number
  costTotal: number
  saleTotal: number
  plannedProfit: number
  plannedMargin: number
  inputVat: number
  vatEffectPlanned: number
  cheaperLineCount: number
  potentialSaving: number
  supplierCount: number
  loadingPointCount: number
  maxLeadDays: number
  missingReferenceCount: number
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export function calculateSaleTotal(
  _mode: DealMode,
  costTotal: number,
  purchaseTotal: number,
  pricing: DealInput['pricing'],
): number {
  const value = pricing.value || 0
  switch (pricing.method) {
    case 'markup':
      return costTotal * (1 + value / 100)
    case 'fixed':
      return value
    case 'planned-profit':
    case 'profit-fixed':
      return costTotal + value
    case 'vat-full':
      return costTotal + purchaseTotal * (pricing.vatRate ?? 0.22)
    case 'vat-percent':
      return costTotal + purchaseTotal * (pricing.vatRate ?? 0.22) * (value / 100)
    default:
      return costTotal
  }
}

export function calculateDeal(input: DealInput): DealCalculation {
  const priceByKey = new Map(input.referencePrices.map((item) => [item.productKey, item]))
  const fixedExpensesTotal = Object.values(input.fixedExpenses ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)

  const draftLines = input.lines.map((line) => {
    const key = line.productKey ?? line.name.trim().toLowerCase()
    const reference = priceByKey.get(key)
    const offers = input.marketOffers?.[String(line.id)] ?? []
    const cheaper = reference ? offers.filter((offer) => offer.price > 0 && offer.price < reference.price) : []
    const cheaperMarketPrice = cheaper.length ? Math.min(...cheaper.map((offer) => offer.price)) : null
    const freightPerUnit = input.freightPerUnit?.[String(line.id)] ?? 0
    const selectedPurchase = reference?.price ?? null
    const directCost = selectedPurchase === null ? 0 : (selectedPurchase + freightPerUnit) * line.quantity
    return {
      ...line,
      referencePurchase: reference?.price ?? null,
      selectedPurchase,
      selectedSource: reference?.source ?? null,
      selectedSupplier: reference?.supplierName ?? (reference ? 'Металлсервис' : null),
      selectedLocation: reference?.location,
      selectedLoadingPoint: reference?.loadingPoint,
      selectedLeadDays: reference?.leadDays,
      salePrice: null,
      freightPerUnit,
      allocatedFixedExpenses: 0,
      cheaperMarketPrice,
      cheaperDelta: cheaperMarketPrice === null || !reference ? 0 : round2(reference.price - cheaperMarketPrice),
      lineCost: directCost,
      lineSales: 0,
      lineProfit: 0,
      marketOffers: offers,
    } satisfies DealLineCalculation
  })

  const purchaseTotal = draftLines.reduce((sum, line) => sum + (line.selectedPurchase ?? 0) * line.quantity, 0)
  const variableFreightTotal = draftLines.reduce((sum, line) => sum + line.freightPerUnit * line.quantity, 0)
  const directCostTotal = purchaseTotal + variableFreightTotal
  const costTotal = directCostTotal + fixedExpensesTotal
  const missingReferenceCount = draftLines.filter((line) => line.selectedPurchase === null).length

  let saleTotal = calculateSaleTotal(input.mode, costTotal, purchaseTotal, input.pricing)
  if (missingReferenceCount > 0 && input.pricing.method !== 'fixed') saleTotal = 0

  const directCostByLine = draftLines.reduce((sum, line) => sum + line.lineCost, 0)
  const lineWithAllocation = draftLines.map((line) => ({
    line,
    allocatedFixedExpenses: directCostByLine > 0 ? fixedExpensesTotal * (line.lineCost / directCostByLine) : 0,
  }))

  const calculatedLines = lineWithAllocation.map(({ line, allocatedFixedExpenses }) => {
    const fullLineCost = line.lineCost + allocatedFixedExpenses
    return { line, allocatedFixedExpenses, fullLineCost }
  })

  const calculatedCostTotal = calculatedLines.reduce((sum, item) => sum + item.fullLineCost, 0)
  const profitableLines = calculatedLines.filter((item) => item.line.selectedPurchase !== null)
  const profitatableCost = profitableLines.reduce((sum, item) => sum + item.fullLineCost, 0)

  const saleLines = calculatedLines.map(({ line, allocatedFixedExpenses, fullLineCost }) => {
    let lineSales = 0
    if (line.selectedPurchase !== null) {
      if (input.pricing.method === 'markup') {
        lineSales = fullLineCost * (1 + (input.pricing.value || 0) / 100)
      } else if (input.pricing.method === 'fixed') {
        lineSales = profitatableCost > 0 ? saleTotal * (fullLineCost / profitatableCost) : 0
      } else {
        const incremental = saleTotal - calculatedCostTotal
        lineSales = profitatableCost > 0 ? fullLineCost + incremental * (fullLineCost / profitatableCost) : 0
      }
    }
    const salePerUnit = line.quantity > 0 && line.selectedPurchase !== null ? lineSales / line.quantity : null
    return {
      ...line,
      allocatedFixedExpenses,
      lineCost: fullLineCost,
      lineSales,
      lineProfit: lineSales - fullLineCost,
      salePrice: salePerUnit,
    }
  })

  const finalSaleTotal = saleLines.reduce((sum, line) => sum + line.lineSales, 0)
  const plannedProfit = finalSaleTotal - calculatedCostTotal
  const plannedMargin = finalSaleTotal > 0 ? (plannedProfit / finalSaleTotal) * 100 : 0
  const vatRate = input.pricing.vatRate ?? 0.22
  const inputVat = purchaseTotal * vatRate
  const vatEffectPlanned = input.mode === 'export'
    ? input.pricing.method === 'vat-full'
      ? inputVat
      : input.pricing.method === 'vat-percent'
        ? inputVat * (input.pricing.value / 100)
        : 0
    : 0

  const suppliers = new Set(finalSaleLines(finalSaleTotal, saleLines).map((line) => line.selectedSupplier).filter(Boolean))
  const points = new Set(saleLines.map((line) => line.selectedLoadingPoint).filter(Boolean))
  const potentialSaving = saleLines.reduce((sum, line) => sum + Math.max(0, line.cheaperDelta) * line.quantity, 0)
  const maxLeadDays = Math.max(0, ...saleLines.map((line) => line.selectedLeadDays ?? 0))

  return {
    lines: saleLines,
    purchaseTotal: round2(purchaseTotal),
    variableFreightTotal: round2(variableFreightTotal),
    fixedExpensesTotal: round2(fixedExpensesTotal),
    costTotal: round2(calculatedCostTotal),
    saleTotal: round2(finalSaleTotal),
    plannedProfit: round2(plannedProfit),
    plannedMargin: round2(plannedMargin),
    inputVat: round2(inputVat),
    vatEffectPlanned: round2(vatEffectPlanned),
    cheaperLineCount: saleLines.filter((line) => line.cheaperMarketPrice !== null).length,
    potentialSaving: round2(potentialSaving),
    supplierCount: suppliers.size,
    loadingPointCount: points.size,
    maxLeadDays,
    missingReferenceCount,
  }
}

function finalSaleLines(_saleTotal: number, lines: DealLineCalculation[]) {
  return lines
}
