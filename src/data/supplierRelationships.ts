export type SupplierRelationshipSource = 'user-confirmed' | 'documented-contract'

export type SupplierRelationship = {
  supplierCode: string
  relationship: 'contracted' | 'working-channel' | 'discovery'
  source: SupplierRelationshipSource
  confirmedAt: string
  notes?: string
}

/** Internal-only commercial relationship map. Never rendered in the public catalog. */
export const supplierRelationships: SupplierRelationship[] = [
  {
    supplierCode: 'OMK_VYZKSA',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Пользователь подтвердил наличие договора/рабочих отношений с ОМК, включая Выксунский металлургический завод (ВМЗ). Использовать как приоритетный канал при коммерческом поиске и обработке заявок; реквизиты договора и внутренние условия не публиковать.',
  },
]
