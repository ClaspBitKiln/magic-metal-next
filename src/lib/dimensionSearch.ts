import { productSizeSeries } from '@/data/productSizeSeries'
import { searchIndex, normalizeSearch, type SearchItem } from '@/data/searchIndex'
import { numericSizeKey, parseSizeSearchQuery } from './sizeSearchQuery'

// Server-only caller: the normative tables never enter the search page's client bundle.
export function searchDimensionTables(query: string): SearchItem[] {
  const parsed = parseSizeSearchQuery(query)
  if (!parsed) return []
  const results: SearchItem[] = []
  for (const table of productSizeSeries) {
    if (table.kind === 'requirements') continue
    const path = `/produkciya/${table.categorySlug}/${table.productSlug}`
    const product = searchIndex.find(item => item.type === 'product' && item.href === path)
    const haystack = normalizeSearch(`${product?.title || ''} ${product?.searchText || ''} ${table.standard} ${table.title} ${table.scope}`)
    // The card can mention several standards. A result must belong to the
    // requested standard's own table, not another table on the same card.
    const standardPattern = /(?:ГОСТ(?:\s+Р)?|ТУ)\s*\d+(?:[.\-][\p{L}\d]+)*/giu
    const standardKey = (value: string) => normalizeSearch(value).replace(/\s/g, '')
    const requestedStandards = [...normalizeSearch(parsed.remainder).matchAll(standardPattern)].map(match => standardKey(match[0]))
    const tableStandards = [...normalizeSearch(table.standard).matchAll(standardPattern)].map(match => standardKey(match[0]))
    if (requestedStandards.some(requested => !tableStandards.some(standard => standard === requested || (!requested.includes('-') && standard.startsWith(`${requested}-`))))) continue
    const remainder = normalizeSearch(parsed.remainder).replace(standardPattern, '')
    const gradeKey = (value: string) => value.replace(/^ст(?=\d)/u, '')
    const tokens = remainder.split(' ').filter(token => token && !/^(?:сталь|стали|марка|марки)$/u.test(token)).map(gradeKey)
    const words = (haystack.match(/[\p{L}\d]+(?:[.,-][\p{L}\d]+)*/gu) || []).map(gradeKey)
    // Numeric/alphanumeric qualifiers must be whole tokens: 873 is not 8734,
    // and 12Х1МФ is not a different grade with the same prefix.
    if (tokens.some(token => /\d/u.test(token) ? !words.includes(token) : !haystack.includes(token))) continue
    const gradeScope = normalizeSearch(table.scope).match(/^марки стали:\s*([^.]*)/u)?.[1].split(',').map(value => gradeKey(value.trim()))
    if (gradeScope && tokens.some(token => /\d/u.test(token) && !gradeScope.includes(token))) continue
    const [first, second, third] = parsed.values
    let matches = false
    let selectedSize = ''
    let selectedWall = ''
    const cellHas = (value: string, expected: string) => value.split(';').some(part => /^\s*\(?\d+(?:[.,]\d+)?\)?\s*$/.test(part) && numericSizeKey(part) === expected)
    if (parsed.kind === 'pipe' && (table.categorySlug.startsWith('truby') || (table.categorySlug === 'nerzhaveyushchaya-stal' && table.productSlug === 'truby'))) {
      const walls = table.columns.map((name, index) => /стен/iu.test(name) ? index : -1).filter(index => index >= 0)
      const section = third ? `${first}x${second}` : first
      const wall = third || second
      const row = table.rows.find(row => numericSizeKey(row[0]) === section && walls.some(index => cellHas(row[index] || '', wall)))
      if (row) { matches = true; selectedSize = row[0]; selectedWall = wall }
    } else if (parsed.kind === 'sheet' && /лист/iu.test(`${table.title} ${product?.title || ''}`) && !/рулон/iu.test(table.title)) {
      // A nominal thickness is a discrete value, never a made-up point inside a range.
      if (parsed.values.length === 1) matches = table.rows.some(row => /^Толщина$/iu.test(row[0]) && cellHas(row[1] || '', first))
      if (!matches && parsed.values.length <= 2) {
        const thickness = table.columns.findIndex(name => /толщин/iu.test(name))
        const width = table.columns.findIndex(name => /ширин/iu.test(name))
        matches = thickness >= 0 && table.rows.some(row => cellHas(row[thickness] || '', first) && (!second || (width >= 0 && cellHas(row[width] || '', second))))
      }
    } else if (parsed.kind === 'flange' && table.productSlug === 'flantsy') {
      const dn = table.columns.findIndex(name => name === 'DN')
      const pressure = table.title.match(/PN\s*(\d+(?:[.,]\d+)?)/iu)?.[1]
      matches = dn >= 0 && (!second || (Boolean(pressure) && numericSizeKey(pressure!) === second)) && table.rows.some(row => cellHas(row[dn] || '', first))
    }
    if (!matches) continue
    const index = productSizeSeries.filter(item => item.categorySlug === table.categorySlug && item.productSlug === table.productSlug).indexOf(table) + 1
    const params = new URLSearchParams()
    if (selectedSize) params.set(`size_${index}`, selectedSize)
    if (selectedWall) params.set(`wall_${index}`, selectedWall)
    const label = parsed.kind === 'flange' ? `DN ${first}${second ? `, PN ${second}` : ''}` : `${parsed.values.join(' × ')} мм`
    results.push({ type: 'product', typeLabel: 'Размер в таблице', title: `${product?.title || table.title} — ${label}`, subtitle: `${table.standard} · ${table.title}`, description: 'Нормативный размер найден в таблице. Марку, условия применения, наличие и срок поставки подтвердим по заявке.', href: `${path}${params.size ? `?${params}` : ''}#sizes-series-${index}`, searchText: '' })
  }
  return results
}
