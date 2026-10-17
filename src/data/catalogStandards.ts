// Server components use this registry; clients receive only rendered links.

import { standards, standardGroups, type Standard } from './standards'
import { productSizeSeries } from './productSizeSeries'
import type { SizeSeries } from './sizeSeriesTypes'

/** Preserve the edition; table and appendix references do not form part of a code. */
export function getStandardReferences(reference: string): string[] {
  return [...new Set(reference.split(';').map(part => part
    .replace(/,\s*(?:таблиц[аы]?|приложени[ея]|пункт|п\.)\b.*$/iu, '')
    .replace(/,\s*(?:таблиц|приложени|пункт).*/iu, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()).filter(Boolean))]
}

const codeKey = (code: string) => code.toUpperCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
const seriesByCode = new Map<string, SizeSeries[]>()
for (const table of productSizeSeries) {
  for (const code of getStandardReferences(table.standard)) {
    const key = codeKey(code)
    const entries = seriesByCode.get(key) || []
    entries.push(table)
    seriesByCode.set(key, entries)
  }
}

const groupFor = (category: string): Standard['group'] => {
  if (category === 'cvetnye-metally') return 'non-ferrous'
  if (category === 'nerzhaveyushchaya-stal') return 'stainless'
  if (category === 'sdt') return 'fittings'
  if (category.startsWith('truby')) return 'pipes'
  return 'steel'
}

const slugFor = (code: string) => code.toLowerCase()
  .replace(/^гост\s*р\s*/u, 'gost-r-')
  .replace(/^гост\s*/u, 'gost-')
  .replace(/^ту\s*/u, 'tu-')
  .replace(/р/gu, 'r')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

// Original records retain their metadata, links, and declared status unchanged.
export const catalogStandards: Standard[] = [...standards]
const knownCodes = new Set(standards.map(item => codeKey(item.code)))
const occupiedSlugs = new Set(standards.map(item => item.slug))
for (const [key, tables] of seriesByCode) {
  if (knownCodes.has(key)) continue
  const first = tables[0]
  const code = getStandardReferences(first.standard).find(item => codeKey(item) === key)!
  const group = groupFor(first.categorySlug)
  const scope = [...new Set(tables.map(table => table.scope))]
  const baseSlug = slugFor(code)
  let slug = baseSlug
  let suffix = 2
  while (occupiedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`
  occupiedSlugs.add(slug)
  const products = [...new Map(tables.map(table => {
    const slug = `${table.categorySlug}/${table.productSlug}#sizes`
    return [slug, { label: table.title, slug }] as const
  })).values()]
  catalogStandards.push({
    slug, code, title: first.title, group,
    groupLabel: standardGroups.find(([id]) => id === group)![1],
    status: 'Размерные данные в каталоге',
    summary: first.scope,
    scope,
    checkBeforeOrder: ['точное обозначение стандарта и исполнение', 'размеры и количество', 'марка материала и состояние поставки', 'требования к контролю и документам качества'],
    materialSlugs: [],
    products,
    // This is the existing table provenance, not an invented official registry record.
    officialUrl: '',
  })
  knownCodes.add(key)
}

const catalogByCode = new Map(catalogStandards.map(item => [codeKey(item.code), item]))
const catalogBySlug = new Map(catalogStandards.map(item => [item.slug, item]))

export const getCatalogStandard = (slug: string) => catalogBySlug.get(slug)

export function getCatalogStandardLinks(reference: string): { code: string; href: string }[] {
  return getStandardReferences(reference).flatMap(code => {
    const item = catalogByCode.get(codeKey(code))
    return item ? [{ code: item.code, href: `/spravochnik-gost/${item.slug}` }] : []
  })
}

export const getSeriesForStandard = (code: string): SizeSeries[] => seriesByCode.get(codeKey(code)) || []

/** Match a complete code, including its edition, in a qualified product reference. */
export function findCatalogStandard(reference: string): Standard | undefined {
  const codes = reference.toUpperCase().replace(/[–—]/g, '-').match(/(?:ГОСТ(?:\s+Р)?|ТУ)\s+\d+(?:\.\d+)*-\d{2,4}(?!\d)/gu) || []
  if (codes.length !== 1) return undefined
  return catalogByCode.get(codeKey(codes[0]))
}
