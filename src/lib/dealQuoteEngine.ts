export type DealMode = 'rf' | 'export'
export type PricingMethod = 'markup' | 'fixed' | 'planned-profit' | 'vat-full' | 'vat-percent' | 'profit-fixed'
export type QuoteSource = 'METALLSERVICE' | 'MARKET' | 'MANUAL'
export type IncomingDealLine = { id: string | number; name: string; unit: 'т' | 'шт.' | 'м'; quantity: number; productKey?: string }
export type ReferencePrice = { productKey: string; price: number; unit: 'т' | 'шт.' | 'м'; source: QuoteSource; observedAt: string; location?: string }
export type MarketOffer = { source: string; price: number; location: string; leadDays: number; loadingPoint: string; observedAt?: string }
export type DealLineCalculation = IncomingDealLine & { referencePurchase: number | null; selectedPurchase: number | null; selectedSource: QuoteSource | null; salePrice: number | null; freightPerUnit: number; cheaperMarketPrice: number | null; cheaperDelta: number; lineCost: number; lineSales: number; lineProfit: number; marketOffers: MarketOffer[]; loadingPoint?: string; leadDays?: number }
export type DealInput = { mode: DealMode; lines: IncomingDealLine[]; referencePrices: ReferencePrice[]; marketOffers?: Record<string, MarketOffer[]>; freightPerUnit?: Record<string, number>; pricing: { method: PricingMethod; value: number; vatRate?: number }; fixedExpenses?: { delivery?: number; handling?: number; customs?: number; st1?: number; other?: number } }
export type DealCalculation = { lines: DealLineCalculation[]; purchaseTotal: number; variableFreightTotal: number; fixedExpensesTotal: number; costTotal: number; saleTotal: number; plannedProfit: number; plannedMargin: number; inputVat: number; vatEffectPlanned: number; cheaperLineCount: number; potentialSaving: number; supplierCount: number; loadingPointCount: number; maxLeadDays: number; missingReferenceCount: number }
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export function calculateSaleTotal(mode: DealMode, costTotal: number, purchaseTotal: number, pricing: DealInput['pricing']): number {
  const value = pricing.value || 0
  switch (pricing.method) {
    case 'markup': return costTotal * (1 + value / 100)
    case 'fixed': return value
    case 'planned-profit':
    case 'profit-fixed': return costTotal + value
    case 'vat-full': return costTotal + purchaseTotal * (pricing.vatRate ?? 0.22)
    case 'vat-percent': return costTotal + purchaseTotal * (pricing.vatRate ?? 0.22) * (value / 100)
    default: return mode === 'export' ? costTotal : costTotal
  }
}

export function calculateDeal(input: DealInput): DealCalculation {
  const priceByKey = new Map(input.referencePrices.map((item) => [item.productKey, item]))
  const fixedExpensesTotal = Object.values(input.fixedExpenses ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)
  const lines: DealLineCalculation[] = input.lines.map((line) => {
    const key = line.productKey ?? line.name.trim().toLowerCase()
    const reference = priceByKey.get(key)
    const offers = input.marketOffers?.[String(line.id)] ?? []
    const cheaper = reference ? offers.filter((offer) => offer.price > 0 && offer.price < reference.price) : []
    const cheaperMarketPrice = cheaper.length ? Math.min(...cheaper.map((offer) => offer.price)) : null
    const freightPerUnit = input.freightPerUnit?.[String(line.id)] ?? 0
    const selectedPurchase = reference?.price ?? null
    const lineCost = selectedPurchase === null ? 0 : (selectedPurchase + freightPerUnit) * line.quantity
    const marketBest = offers.filter((offer) => offer.price > 0).sort((a, b) => a.price - b.price)[0]
    return {
      ...line,
      referencePurchase: reference?.price ?? null,
      selectedPurchase,
      selectedSource: reference ? 'METALLSERVICE' : null,
      salePrice: null,
      freightPerUnit,
      cheaperMarketPrice,
      cheaperDelta: cheaperMarketPrice === null || !reference ? 0 : round2(reference.price - cheaperMarketPrice),
      lineCost,
      lineSales: 0,
      lineProfit: 0,
      marketOffers: offers,
      loadingPoint: marketBest?.loadingPoint,
      leadDays: marketBest?.leadDays,
    }
  })
  const purchaseTotal = lines.reduce((sum, line) => sum + (line.selectedPurchase ?? 0) * line.quantity, 0)
  const variableFreightTotal = lines.reduce((sum, line) => sum + line.freightPerUnit * line.quantity, 0)
  const costTotal = purchaseTotal + variableFreightTotal + fixedExpensesTotal
  const missingReferenceCount = lines.filter((line) => line.selectedPurchase === null).length
  let saleTotal = calculateSaleTotal(input.mode, costTotal, purchaseTotal, input.pricing)
  if (missingReferenceCount > 0 && input.pricing.method !== 'fixed') saleTotal = 0
  const pricedQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  const weightedRatio = pricedQuantity > 0 ? saleTotal / pricedQuantity : 0
  const pricedLines = lines.map((line) => {
    const lineSale = line.selectedPurchase === null ? 0 : weightedRatio * line.quantity
    return { ...line, salePrice: line.selectedPurchase === null ? null : weightedRatio, lineSales: lineSale, lineProfit: lineSale - line.lineCost }
  })
  const plannedProfit = saleTotal - costTotal
  const plannedMargin = saleTotal > 0 ? (plannedProfit / saleTotal) * 100 : 0
  const vatRate = input.pricing.vatRate ?? 0.22
  const inputVat = purchaseTotal * vatRate
  const vatEffectPlanned = input.mode === 'export' ? input.pricing.method === 'vat-full' ? inputVat : input.pricing.method === 'vat-percent' ? inputVat * (input.pricing.value / 100) : 0 : 0
  const suppliers = new Set(pricedLines.flatMap((line) => line.marketOffers.map((offer) => offer.source)).filter(Boolean))
  const points = new Set(pricedLines.map((line) => line.loadingPoint).filter(Boolean))
  const potentialSaving = pricedLines.reduce((sum, line) => sum + Math.max(0, line.cheaperDelta) * line.quantity, 0)
  const maxLeadDays = Math.max(0, ...pricedLines.map((line) => line.leadDays ?? 0))
  return { lines: pricedLines, purchaseTotal: round2(purchaseTotal), variableFreightTotal: round2(variableFreightTotal), fixedExpensesTotal: round2(fixedExpensesTotal), costTotal: round2(costTotal), saleTotal: round2(saleTotal), plannedProfit: round2(plannedProfit), plannedMargin: round2(plannedMargin), inputVat: round2(inputVat), vatEffectPlanned: round2(vatEffectPlanned), cheaperLineCount: pricedLines.filter((line) => line.cheaperMarketPrice !== null).length, potentialSaving: round2(potentialSaving), supplierCount: suppliers.size, loadingPointCount: points.size, maxLeadDays, missingReferenceCount }
}
