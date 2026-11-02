import type { SearchItem } from '@/data/searchIndex'
import { getRopeSalesDiameters, ropeSalesConstructions, ropeSalesSizedRequestHref } from '@/data/ropeSalesAssortment'
import { formatDimensionValue } from './dimensionDisplay'
import { normalizeRopeConstruction, type RopeSearchQuery } from './ropeSearchQuery'

export function searchRopeAssortment(query: RopeSearchQuery): SearchItem[] {
  if (!query.valid) return []
  const construction = ropeSalesConstructions.find(value => normalizeRopeConstruction(value) === query.construction)
  if (!construction) return []
  const diameters = getRopeSalesDiameters(construction)
  if (query.diameter !== null && diameters.length && !diameters.includes(query.diameter)) return []
  const exact = query.diameter !== null && diameters.includes(query.diameter)
  const size = query.diameter === null ? '' : ` — Ø ${formatDimensionValue(String(query.diameter))} мм`
  return [{
    type: 'product',
    typeLabel: exact ? 'Канат по ассортименту' : 'Конструкция каната',
    title: `Канат ${construction}${size}`,
    subtitle: exact ? 'Конструкция и диаметр из перечня продаж' : 'Подбор диаметра и исполнения',
    description: exact
      ? 'Выбранные конструкция и диаметр перейдут в заявку. Исполнение, документы, количество и срок поставки подтвердим при расчёте.'
      : 'Откройте подбор каната: диаметр и исполнение уточним по запросу. Наличие и срок поставки подтвердим при расчёте.',
    href: exact ? ropeSalesSizedRequestHref(construction, query.diameter!) : '/produkciya/metizy-i-svarochnye-materialy/kanaty#rope-sales',
    searchText: '',
  }]
}
