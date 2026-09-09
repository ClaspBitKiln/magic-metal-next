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
  {
    supplierCode: 'TD_MMK',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Договорной коммерческий канал Magic Metal. Использовать интернет-магазин/каталог и прайс как источники OFFER/AVAILABILITY после проверки свежести.',
  },
  {
    supplierCode: 'A_GROUP',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Договорной коммерческий канал Magic Metal. Ассортимент и конкретные условия брать из актуальных коммерческих источников после нормализации.',
  },
  {
    supplierCode: 'URAL_METAL_BASE_PMSMK',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Договорной складской канал. Учитывать как приоритетный источник бесшовных труб; публичную доступность цены/наличия подтверждать по актуальному источнику.',
  },
  {
    supplierCode: 'URAL_MPC',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Договорной специализированный канал. Использовать ассортимент и склад как внутренний источник; числовую цену подтверждать запросом, если публичной цены нет.',
  },
  {
    supplierCode: 'EVRAZ_METALSERVICE',
    relationship: 'contracted',
    source: 'user-confirmed',
    confirmedAt: '2026-09-09',
    notes: 'Договорной коммерческий канал. Использовать официальный каталог/магазин и прайс для OFFER/AVAILABILITY и проверки региональной цены.',
  },
]
