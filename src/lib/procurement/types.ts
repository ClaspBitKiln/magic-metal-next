export type SourceRole = 'manufacturer' | 'supplier' | 'aggregator' | 'reference' | 'benchmark'

export type Availability = 'in-stock' | 'limited' | 'on-request' | 'production' | 'unknown'

export type MatchKind = 'exact' | 'approved-alternative' | 'clarification-required' | 'non-qualifying'

export type RFQFieldConfidence = 'high' | 'medium' | 'low' | 'missing'

export type NormalizedField<T> = {
  value?: T
  raw?: string
  confidence: RFQFieldConfidence
}

export type NormalizedRFQItem = {
  line: number
  originalText: string
  product: NormalizedField<string>
  subtype: NormalizedField<string>
  diameter: NormalizedField<number>
  wall: NormalizedField<number>
  thickness: NormalizedField<number>
  length: NormalizedField<number>
  grade: NormalizedField<string>
  standard: NormalizedField<string>
  quantity: NormalizedField<number>
  unit: NormalizedField<string>
  destination: NormalizedField<string>
  deadline: NormalizedField<string>
  certification: NormalizedField<string>
  substitutionAllowed: NormalizedField<boolean>
}

export type NormalizedRFQ = {
  id: string
  originalText: string
  items: NormalizedRFQItem[]
  parsedAt: string
}

export type Offer = {
  id: string
  sourceId: string
  supplierId: string
  manufacturerId?: string
  product: string
  subtype?: string
  diameter?: number
  wall?: number
  thickness?: number
  length?: number
  grade?: string
  standard?: string
  quantity?: number
  unit?: string
  price?: number
  currency: string
  availability: Availability
  warehouse?: string
  city?: string
  leadTimeDays?: number
  pickupCost?: number
  freightCost?: number
  handlingCost?: number
  destinationCost?: number
  customsCost?: number
  benchmarkValue?: number
  benchmarkCurrency?: string
  observedAt: string
  match: MatchKind
  confidence: number
}

export type LandedCost = {
  purchase: number
  supplierCharges: number
  pickup: number
  freight: number
  handling: number
  customs: number
  destination: number
  riskAllowance: number
  total: number
  currency: string
}

export type ProcurementDecision = {
  offerId: string
  score: number
  landedCost: LandedCost
  reasons: string[]
  risks: string[]
  recommended: boolean
}

export type LogisticsRoute = {
  id: string
  origin: string
  destination: string
  mode: 'road' | 'rail' | 'sea' | 'multimodal'
  fixedCost?: number
  variableCostPerTon?: number
  variableCostPerKg?: number
  minimumCharge?: number
  leadTimeDays?: number
  capacityTons?: number
  currency: string
  observedAt: string
  confidence: number
  status: 'verified' | 'observed' | 'needs-verification' | 'disabled'
  evidenceUrl?: string
  evidenceNote?: string
}

export type SplitAllocation = {
  itemLine: number
  offerId: string
  quantity: number
  unit: string
  purchaseCost: number
  logisticsCost: number
  landedCost: number
}

export type ProcurementPlan = {
  allocations: SplitAllocation[]
  landedCost: number
  currency: string
  supplierCount: number
  transportRunCount: number
  leadTimeDays?: number
  reasons: string[]
  risks: string[]
  recommended: boolean
}
