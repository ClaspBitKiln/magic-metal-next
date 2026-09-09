export type SupplierRelationshipSource = 'user-confirmed' | 'documented-contract'

export type SupplierRelationship = {
  supplierCode: string
  relationship: 'working-channel' | 'discovery'
  source: SupplierRelationshipSource
  confirmedAt: string
  notes?: string
}

/** Internal-only relationship hints. Contract status is operational context, not a commercial ranking factor. */
export const supplierRelationships: SupplierRelationship[] = [
  { supplierCode: 'OMK_VYZKSA', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
  { supplierCode: 'TD_MMK', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
  { supplierCode: 'A_GROUP', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
  { supplierCode: 'URAL_METAL_BASE_PMSMK', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
  { supplierCode: 'URAL_MPC', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
  { supplierCode: 'EVRAZ_METALSERVICE', relationship: 'working-channel', source: 'user-confirmed', confirmedAt: '2026-09-09' },
]
