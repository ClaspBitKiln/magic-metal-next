import { materials } from './materials'
import { seoCatalog } from './seoCatalog'
import { standards } from './standards'
import { sdtCatalog } from './sdtCatalog'
import { pipeCatalog } from './pipeCatalog'
import { productDetailCatalog } from './productDetailCatalog'

export type SearchItem = {
  type: 'product' | 'material' | 'standard'
  typeLabel: string
  title: string
  subtitle: string
  description: string
  href: string
  searchText: string
}

export const searchIndex: SearchItem[] = [
  ...seoCatalog.map((item) => ({
    type: 'product' as const, typeLabel: 'Продукция', title: item.title,
    subtitle: item.standards.slice(0, 3).join(' · '), description: item.description,
    href: `/produkciya/${item.slug}`, searchText: [item.title, item.description, ...item.standards, ...item.products, ...item.grades].join(' '),
  })),
  ...sdtCatalog.map((item) => ({
    type: 'product' as const, typeLabel: 'СДТ', title: item.title,
    subtitle: item.standards.slice(0, 3).join(' · '), description: item.description,
    href: `/produkciya/sdt/${item.slug}`, searchText: [item.title, item.description, item.intro, ...item.execution, ...item.range, ...item.standards, ...item.materials].join(' '),
  })),
  ...pipeCatalog.map((item) => ({
    type: 'product' as const, typeLabel: 'Трубы', title: item.title,
    subtitle: item.standards.slice(0, 3).join(' · '), description: item.description,
    href: `/produkciya/${item.categorySlug}/${item.slug}`,
    searchText: [item.title, item.description, item.intro, ...item.standards, ...item.grades, ...item.applications, ...item.range.flatMap((row) => [row.label, row.value])].join(' '),
  })),
  ...productDetailCatalog.map((item) => ({
    type: 'product' as const, typeLabel: 'Продукция', title: item.title,
    subtitle: item.standards.slice(0, 3).join(' · '), description: item.description,
    href: `/produkciya/${item.categorySlug}/${item.slug}`,
    searchText: [item.title, item.description, item.intro, ...item.standards, ...item.grades, ...item.applications, ...item.range.flatMap((row) => [row.label, row.value])].join(' '),
  })),
  ...materials.map((item) => ({
    type: 'material' as const, typeLabel: 'Материал', title: item.designation,
    subtitle: item.name, description: item.summary,
    href: `/spravochnik-materialov/${item.slug}`, searchText: [item.designation, item.name, item.groupLabel, item.summary, ...item.standards, ...item.forms, ...item.applications, ...item.analogs].join(' '),
  })),
  ...standards.map((item) => ({
    type: 'standard' as const, typeLabel: 'ГОСТ', title: item.code,
    subtitle: item.title, description: item.summary,
    href: `/spravochnik-gost/${item.slug}`, searchText: [item.code, item.title, item.groupLabel, item.summary, ...item.scope, ...item.checkBeforeOrder].join(' '),
  })),
]

export function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[×*]/g, 'x').replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, ' ').trim()
}
