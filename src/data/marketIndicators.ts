export type MarketIndicatorScope = 'benchmark' | 'supplier-discovery' | 'price-list-discovery' | 'market-signal'

export type MarketIndicatorSource = {
  code: string
  name: string
  scopes: MarketIndicatorScope[]
  url: string
  observationRegion?: string
  observationFrequency?: string
  fields: string[]
  notes: string
}

/** Internal-only market intelligence sources. Never rendered as supplier choices in the public catalog. */
export const marketIndicatorSources: MarketIndicatorSource[] = [
  {
    code: 'METALINFO_PRICE_LISTS',
    name: 'Металлоснабжение и сбыт — прайс-листы',
    scopes: ['price-list-discovery', 'supplier-discovery'],
    url: 'https://rss.metalinfo.ru/ru/metalmarket/price/',
    fields: ['company', 'material', 'productType', 'productDesignation', 'location', 'price', 'unit', 'sourceDate'],
    notes: 'Большой агрегированный слой опубликованных прайс-листов. Использовать для discovery и cross-check; не считать цену автоматически подтверждённой закупочной ценой Magic Metal.'
  },
  {
    code: 'METALINFO_DIRECTORY',
    name: 'Металлургия. Металлопоставки. Россия и страны СНГ',
    scopes: ['supplier-discovery'],
    url: 'https://www.metalinfo.ru/ru/directory/',
    fields: ['company', 'role', 'region', 'productAssortment', 'contacts', 'companyPage', 'priceListLink'],
    notes: 'Ежедневно обновляемый справочник предприятий и поставщиков; использовать для расширения карты источников по сортаменту и регионам.'
  },
  {
    code: 'METALINFO_PRICE_MONITOR_CENTRAL',
    name: 'Металлоснабжение и сбыт — мониторинг цен, Центральный регион',
    scopes: ['benchmark', 'market-signal'],
    url: 'https://www.metalinfo.ru/ru/metalmarket/analytics/',
    observationRegion: 'Центральный регион, Москва',
    observationFrequency: 'еженедельные/периодические мониторинги',
    fields: ['observationDate', 'productDesignation', 'averagePrice', 'indexPercent', 'region'],
    notes: 'Использовать как независимый рыночный benchmark по типам продукции. Индекс показывает изменение котировки относительно предыдущего наблюдения, поэтому сохраняем и цену, и индекс, и дату.'
  },
]
