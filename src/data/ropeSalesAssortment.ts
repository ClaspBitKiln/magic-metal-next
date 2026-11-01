import { formatDimensionValue } from '@/lib/dimensionDisplay'

// Assortment offered by the owner, supplied as the image
// «Перечень конструкций стальных канатов» on 2026-11-01.
// This is a sales range, not a stock balance or a verified declaration.
// Repeated constructions in the image are listed once. Source spelling IWR
// is retained: it must be confirmed against the manufacturer's documents.
export const ropeSalesConstructions = [
  '35×7', '35×K7', '35W×7', '35W×K7', '19×K7', '18×K7+IWS', '18×K7+IWRC',
  '19×7', '18×7', '18×7+FC',
  '18×19S+FC', '18×19S+IWS', '18×19S+IWRC',
  '18×19W+FC', '18×19W+IWS', '18×19W+IWRC',
  '18×19+FC', '18×19+IWS', '18×19+IWRC',
  '6×37+FC', '6×37+IWRC', '6×37S+FC', '6×37S+IWRC',
  '6×36WS+FC', '6×36WS+IWRC', '6×25Fi+FC', '6×25Fi+IWRC',
  '6×26WS+FC', '6×26WS+IWRC',
  '6×31WS+FC', '6×31WS+IWRC', '6×29Fi+FC', '6×29Fi+IWRC',
  '6×7+FC', '6×7+IWS', '6×9W+FC', '6×9W+IWRC',
  '6×12+7FC', '6×12+IWRC', '6×19+7FC', '6×19+FC', '6×19+IWRC',
  '6×19S+FC', '6×19S+IWS', '6×19S+IWRC', '6×19W+FC', '6×19W+IWS', '6×19W+IWRC',
  '6×19Fi+FC', '6×19Fi+IWRC', '6×19+IWS', '6×24+7FC', '6×24S+7FC',
  '6×26WS+SFC', '6×29WS+IWRC', '6×36WS+IWR',
  '8×19S+NFC', '8×19S+FC', '8×19S+IWRC', '8×19W+FC', '8×19W+IWRC',
  '8×19Fi+IWRC', '8×25Fi+FC', '8×25Fi+IWRC',
  '8×26WS+FC', '8×26WS+IWRC', '8×31WS+FC', '8×31WS+IWRC',
] as const

export type RopeSalesDiameterGroup = {
  constructions: readonly string[]
  diameters: readonly number[]
}

// Owner-provided diameter matrices, parts 1 and 2, based on the Shenwei
// catalogue. The original catalogue has not been independently checked.
// Only explicit construction/diameter pairs are listed, within 1–56 mm.
// Constructions absent here remain available for a specification request.
export const ropeSalesDiameterGroups: readonly RopeSalesDiameterGroup[] = [
  { constructions: ['6×7+FC'], diameters: [1.8, 2, 2.15, 2.5, 3, 3.05, 3.6, 4, 4.1, 4.5, 5, 5.4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
  { constructions: ['6×7+IWS'], diameters: [1.8, 2, 2.15, 2.5, 3, 3.05, 3.6, 4, 4.5, 5, 5.4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
  { constructions: ['6×9W+FC', '6×9W+IWRC'], diameters: [1.8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
  { constructions: ['6×12+7FC'], diameters: [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 32] },
  { constructions: ['6×19+FC'], diameters: [3, 3.3, 3.6, 4, 4.2, 4.8, 5, 5.1, 6, 6.2, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46] },
  { constructions: ['6×19+IWS'], diameters: [3, 3.2, 3.6, 4, 4.2, 5, 5.1, 6, 7, 7.5, 8, 8.25, 9, 9.75, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46] },
  { constructions: ['6×19+IWRC'], diameters: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46] },
  { constructions: ['6×19S+FC', '6×19S+IWS', '6×19S+IWRC'], diameters: [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40] },
  { constructions: ['6×19W+FC', '6×19W+IWS', '6×19W+IWRC'], diameters: [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40] },
  { constructions: ['6×24+7FC'], diameters: [8, 9, 10, 12, 14, 18, 20, 24, 28, 32, 36, 40] },
  { constructions: ['6×25Fi+FC', '6×25Fi+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×26WS+FC', '6×26WS+SFC', '6×26WS+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×29Fi+FC', '6×29Fi+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×31WS+FC', '6×31WS+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×36WS+FC', '6×36WS+IWR', '6×36WS+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×37+FC', '6×37+IWRC'], diameters: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['6×37S+FC', '6×37S+IWRC'], diameters: [8, 10, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56] },
  { constructions: ['8×19S+NFC', '8×19S+FC', '8×19S+IWRC'], diameters: [10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48] },
  { constructions: ['8×19W+FC', '8×19W+IWRC'], diameters: [10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48] },
  { constructions: ['8×25Fi+FC', '8×25Fi+IWRC'], diameters: [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42] },
  { constructions: ['8×26WS+FC', '8×26WS+IWRC'], diameters: [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42] },
  { constructions: ['8×31WS+FC', '8×31WS+IWRC'], diameters: [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42] },
  { constructions: ['18×7+FC'], diameters: [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44] },
  { constructions: ['18×19+FC', '18×19+IWS', '18×19+IWRC'], diameters: [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44] },
  { constructions: ['35W×7'], diameters: [16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50] },
]

export const getRopeSalesDiameters = (construction: string): readonly number[] =>
  ropeSalesDiameterGroups.find((group) => group.constructions.includes(construction))?.diameters ?? []

export const ropeSalesSizedRequestHref = (construction: string, diameter: number) => {
  if (!getRopeSalesDiameters(construction).includes(diameter)) {
    throw new Error('Сочетание конструкции и диаметра отсутствует в перечне канатов')
  }
  const product = [
    'Канаты стальные',
    `конструкция ${construction}`,
    `диаметр ${formatDimensionValue(String(diameter))} мм`,
    'маркировочная группа 1770 или 1960 Н/мм² — уточнить',
    'оцинковка, полимерное покрытие, длина и количество — уточнить',
  ].join('; ')
  return `/?product=${encodeURIComponent(product)}#request`
}

export const ropeSalesAssortment = {
  diameterRange: '1–56 мм',
  markingGroups: ['1770', '1960'],
  markingGroupUnit: 'Н/мм²',
  wireFinishes: ['оцинкованная проволока', 'неоцинкованная проволока'],
  surfaceFinishes: ['с полимерным покрытием', 'без полимерного покрытия'],
  standard: 'EN 12385-4:2015',
  selectionNote: 'Диаметр, конструкцию, сердечник и исполнение согласуем для выбранного каната. Диапазон 1–56 мм относится к ассортименту в целом.',
  documentNote: 'Требования EN 12385-4:2015 и документы соответствия уточняем для выбранного каната при заказе.',
} as const

export const ropeSalesRequestHref = (construction?: string) => {
  const product = [
    'Канаты стальные',
    construction ? `конструкция ${construction}` : 'подбор конструкции',
    'диаметр — указать в пределах ассортимента 1–56 мм',
    'маркировочная группа 1770 или 1960 Н/мм² — уточнить',
    'оцинковка, полимерное покрытие, длина и количество — уточнить',
  ].join('; ')
  return `/?product=${encodeURIComponent(product)}#request`
}
