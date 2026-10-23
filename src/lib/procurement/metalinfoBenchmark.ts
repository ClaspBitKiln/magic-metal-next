export type MetalinfoBenchmark = {
  source: 'metalinfo.ru'
  publishedAt: string
  region: string
  product: string
  value: number
  currency: 'RUB'
  unit: 't'
}

/**
 * Snapshot from the public Metalinfo "Металлоснабжение и сбыт" market-price
 * monitoring. These are market benchmarks, not executable supplier offers.
 * Refresh from the source before using for a live quote.
 */
export const metalinfoBenchmarks: MetalinfoBenchmark[] = [
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Арматура А500С ф10', value: 73400, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Арматура А500С ф12', value: 71800, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Арматура В500С ф8', value: 85500, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Проволока ВР ф4-5', value: 83666.7, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Проволока оц ф1,2', value: 99000, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Катанка ф6,5', value: 70500, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Лист г/к 4', value: 65500, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Лист х/к 0,8-1', value: 70500, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Лист оц 0,55', value: 98500, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Труба ВГП 20х2,8', value: 61250, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Труба ВГП 32х3,2', value: 60200, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Труба э/с 89х3,5', value: 59725, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Труба э/с 102х3,5', value: 60100, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Уголок р/п 63х5-6', value: 84100, currency: 'RUB', unit: 't' },
  { source: 'metalinfo.ru', publishedAt: '2026-09-08', region: 'Москва / Центральный регион', product: 'Швеллер 10', value: 98000, currency: 'RUB', unit: 't' },
]

export function findMetalinfoBenchmark(product: string): MetalinfoBenchmark | undefined {
  const normalized = product.toLowerCase().replace(/\s+/g, ' ').trim()
  return metalinfoBenchmarks.find((item) => normalized.includes(item.product.toLowerCase()) || item.product.toLowerCase().includes(normalized))
}
