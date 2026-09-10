import type { LogisticsRoute } from './types'

export type SupplierRegistryEntry = {
  id: string
  entityName: string
  layer: string
  verificationStatus: 'confirmed' | 'verify' | 'reference' | 'historical' | 'disabled'
  integrationStatus: 'active' | 'planned' | 'verify' | 'manual'
  procurementRoute: string
  productScopes: string[]
}

export type ProcurementRouteRegistry = {
  suppliers: SupplierRegistryEntry[]
  logistics: LogisticsRoute[]
}

export function isProcurementEligibleSupplier(entry: SupplierRegistryEntry): boolean {
  return entry.verificationStatus === 'confirmed' && entry.integrationStatus !== 'disabled'
}

export function filterEligibleSuppliers(entries: SupplierRegistryEntry[], productScope?: string): SupplierRegistryEntry[] {
  return entries.filter((entry) => isProcurementEligibleSupplier(entry) && (!productScope || entry.productScopes.includes(productScope) || entry.productScopes.includes('metal-products') || entry.productScopes.includes('common-marketable-metal')))
}
