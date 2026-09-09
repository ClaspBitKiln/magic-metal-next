export type MarketBenchmarkObservation = {
  observationDate: string
  region: string
  productDesignation: string
  averagePriceRubT: number
  indexPercent: number
  sourceCode: 'METALINFO'
  sourceUrl: string
}

/**
 * Curated public benchmark snapshot from Metalinfo's market monitor.
 * This is a market reference layer, not a Magic Metal purchase/sale price.
 */
export const metalinfoBenchmarkSnapshot: MarketBenchmarkObservation[] = [
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Арм. А500С ф10', averagePriceRubT: 73400, indexPercent: -10.7, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Арм.А500С ф12', averagePriceRubT: 71800, indexPercent: -4.5, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Арм. В500С ф8', averagePriceRubT: 85500, indexPercent: 4.1, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Проволока ВР ф4-5', averagePriceRubT: 83666.7, indexPercent: 3.2, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Проволока ок ф1,2', averagePriceRubT: 99000, indexPercent: 3.0, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Катанка ф6,5', averagePriceRubT: 70500, indexPercent: -10.6, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Лист г/к 4', averagePriceRubT: 65500, indexPercent: 2.1, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Лист х/к 0,8-1', averagePriceRubT: 70500, indexPercent: 0.9, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Лист оц. 0,55', averagePriceRubT: 98500, indexPercent: 6.1, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Труба ВГП 20х2,8', averagePriceRubT: 61250, indexPercent: -4.7, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Труба ВГП 32х3,2', averagePriceRubT: 60200, indexPercent: -5.1, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Труба э/с 89х3,5', averagePriceRubT: 59725, indexPercent: -4.6, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Труба э/с 102х3,5', averagePriceRubT: 60100, indexPercent: -4.7, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Уголок р/п 63х5-6', averagePriceRubT: 84100, indexPercent: 5.5, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Швеллер 10', averagePriceRubT: 98000, indexPercent: 11.4, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Швеллер 12', averagePriceRubT: 105000, indexPercent: 12.3, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
  { observationDate: '2026-09-08', region: 'Центральный регион', productDesignation: 'Балка 30Б1', averagePriceRubT: 88600, indexPercent: 0.0, sourceCode: 'METALINFO', sourceUrl: 'https://www.metalinfo.ru/ru/metalmarket/analytics' },
]
