export type CatalogSearchRow = {
  category: string
  product: string
  designation: string
  size: string
  standard: string
}

const queryKey = (value: string) => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ')

type StructuredRule = (row: CatalogSearchRow) => boolean
const productIs = (row: CatalogSearchRow, ...products: string[]) => products.includes(row.product.toLocaleUpperCase('ru'))
const productStarts = (row: CatalogSearchRow, prefix: string) => row.product.toLocaleUpperCase('ru').startsWith(prefix)
const inCategory = (row: CatalogSearchRow, category: string) => row.category === category

// Homepage links use customer-friendly names while official price exports use
// terse headings. These rules are deliberately exact to avoid false stock claims.
const structuredRules: Record<string, StructuredRule> = {
  'электросварные прямошовные и спиралешовные': (row) => inCategory(row, 'Трубы') && productIs(row, 'ТРУБЫ ЭЛЕКТРОСВАРНЫЕ'),
  'водогазопроводные': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ ВОДОГАЗОПРОВ.'),
  'трубы вгп': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ ВОДОГАЗОПРОВ.'),
  'профильные квадратные и прямоугольные': (row) => inCategory(row, 'Трубы') && productIs(row, 'ТРУБЫ ЭЛЕКТРОСВАРНЫЕ КВАДРАТ', 'ТРУБЫ ЭЛЕКТРОСВАРНЫЕ ПРЯМОУГ'),
  'профильные трубы': (row) => inCategory(row, 'Трубы') && productIs(row, 'ТРУБЫ ЭЛЕКТРОСВАРНЫЕ КВАДРАТ', 'ТРУБЫ ЭЛЕКТРОСВАРНЫЕ ПРЯМОУГ'),
  'бесшовные горячедеформированные': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ Г/Д'),
  'горячедеформированные': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ Г/Д'),
  'бесшовные холоднодеформированные': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ Х/Д'),
  'холоднодеформированные': (row) => inCategory(row, 'Трубы') && productStarts(row, 'ТРУБЫ Х/Д'),
  'нержавеющие и коррозионностойкие': (row) => inCategory(row, 'Нержавейка') && productStarts(row, 'ТРУБЫ НЕРЖАВ.'),
  'нержавеющие трубы': (row) => inCategory(row, 'Нержавейка') && productStarts(row, 'ТРУБЫ НЕРЖАВ.'),
  'отводы бесшовные': (row) => productIs(row, 'ОТВОДЫ СТАЛЬНЫЕ', 'ДЕТАЛИ ТРУБОПРОВОДОВ - ОТВОД'),
  'тройники бесшовные': (row) => productIs(row, 'ТРОЙНИКИ СТАЛЬНЫЕ'),
  'переходы бесшовные': (row) => productIs(row, 'ПЕРЕХОДЫ СТАЛЬНЫЕ'),
  'фланцы': (row) => productIs(row, 'ФЛАНЦЫ СТАЛЬНЫЕ'),
  'заглушки и днища': (row) => productIs(row, 'ЗАГЛУШКИ СТАЛЬНЫЕ'),
  'лист и рулон горячекатаный': (row) => inCategory(row, 'Листовой прокат') && /ЛИСТ(?:ОВАЯ)? Г\/К/.test(row.product),
  'лист и рулон холоднокатаный': (row) => inCategory(row, 'Листовой прокат') && productIs(row, 'СТАЛЬ ЛИСТОВАЯ Х/К'),
  'оцинкованный прокат': (row) => inCategory(row, 'Листовой прокат') && productIs(row, 'СТАЛЬ ЛИСТОВАЯ ОЦИНКОВАННАЯ Х/К'),
  'круг горячекатаный': (row) => inCategory(row, 'Сортовой прокат (цена от 5 т.)') && productIs(row, 'КРУГ Г/К'),
  'квадрат': (row) => inCategory(row, 'Сортовой прокат (цена от 5 т.)') && productIs(row, 'КВАДРАТ Г/К', 'СТАЛЬ ФАСОН ПРОФИЛИ КВАДРАТ'),
  'уголок': (row) => inCategory(row, 'Сортовой прокат (цена от 5 т.)') && productStarts(row, 'УГОЛОК'),
  'балка двутавровая': (row) => productIs(row, 'БАЛКИ ДВУТАВРОВЫЕ'),
  'швеллер': (row) => inCategory(row, 'Сортовой прокат (цена от 5 т.)') && productStarts(row, 'ШВЕЛЛЕР'),
  'промышленный крепеж': (row) => inCategory(row, 'Крепеж'),
  'крепеж': (row) => inCategory(row, 'Крепеж'),
  'медь': (row) => inCategory(row, 'Цветной прокат') && productStarts(row, 'МЕДН'),
  'латунь': (row) => inCategory(row, 'Цветной прокат') && productStarts(row, 'ЛАТУН'),
  'бронза': (row) => inCategory(row, 'Цветной прокат') && productStarts(row, 'БРОНЗ'),
  'алюминий': (row) => inCategory(row, 'Цветной прокат') && productStarts(row, 'АЛЮМИНИ'),
  'нихром': (row) => inCategory(row, 'Цветной прокат') && row.product.includes('НИХРОМ'),
  // Exact material queries must not be satisfied by coating descriptions.
  'цинк': () => false,
  'баббит': () => false,
  'титан': () => false,
  'олово': () => false,
  'свинец': () => false,
  'нержавеющий лист': (row) => inCategory(row, 'Нержавейка') && productStarts(row, 'СТАЛЬ ЛИСТОВАЯ НЕРЖАВ'),
  'нержавеющий круг и профиль': (row) => inCategory(row, 'Нержавейка') && productStarts(row, 'СТАЛЬ СОРТ НЕРЖ'),
}

const replacements: Array<[RegExp, string]> = [
  [/водогазопров(?:одные|одная|одный|\.)?/g, 'водогазопровод'],
  [/\bвгп\b/g, 'водогазопровод'],
  [/\bг\s*\/\s*д\b/g, 'горячедеформ'],
  [/горячедеформированн\w*/g, 'горячедеформ'],
  [/\bх\s*\/\s*д\b/g, 'холоднодеформ'],
  [/холоднодеформированн\w*/g, 'холоднодеформ'],
  [/электросварн\w*/g, 'электросвар'],
  [/бесшовн\w*/g, 'бесшов'],
  [/профильн\w*/g, 'профил'],
  [/прямоуг(?:ольн\w*)?/g, 'прямоугол'],
  [/квадратн\w*/g, 'квадрат'],
  [/нержавеющ\w*|нержавейк\w*/g, 'нержав'],
  [/коррозионностойк\w*/g, 'нержав'],
  [/горячекатан\w*/g, 'горячекатан'],
  [/холоднокатан\w*/g, 'холоднокатан'],
  [/оцинкованн\w*/g, 'оцинк'],
  [/листов\w*/g, 'лист'],
  [/двутавров\w*/g, 'двутавр'],
  [/крепеж\w*/g, 'крепеж'],
]

const stopWords = new Set(['и', 'или', 'в', 'для', 'по', 'на', 'из', 'с'])

export const formatProductTitle = (value: string) => {
  const lower = value.toLocaleLowerCase('ru')
  let title = `${lower.charAt(0).toLocaleUpperCase('ru')}${lower.slice(1)}`
    .replace(/гост/giu, 'ГОСТ')
    .replace(/ГОСТ(?=\d)/g, 'ГОСТ ')
    .replace(/(^|[^а-яё])ту(?=[^а-яё]|$)/giu, '$1ТУ')
    .replace(/вгп/giu, 'ВГП')
  if (title.includes('Трубы г/д (катаные, нефтепров)')) title = title.replace('Трубы г/д (катаные, нефтепров)', 'Трубы бесшовные горячедеформированные ·')
  if (title.includes('Трубы х/д (тянутые,бесшовные)')) title = title.replace('Трубы х/д (тянутые,бесшовные)', 'Трубы бесшовные холоднодеформированные ·')
  if (title.startsWith('Трубы водогазопров.')) title = title.replace('Трубы водогазопров.', 'Трубы водогазопроводные (ВГП)')
  if (title === 'Трубы электросварные квадрат') title = 'Трубы профильные квадратные'
  if (title === 'Трубы электросварные прямоуг') title = 'Трубы профильные прямоугольные'
  return title
}

export const normalizeCatalogText = (value: string) => {
  let normalized = value.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[×хx]/g, 'x')
  replacements.forEach(([pattern, replacement]) => { normalized = normalized.replace(pattern, replacement) })
  return normalized.replace(/[^0-9a-zа-я./-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export const matchesCatalogQuery = (row: CatalogSearchRow, query: string) => {
  if (!query.trim()) return true
  const structuredRule = structuredRules[queryKey(query)]
  if (structuredRule) return structuredRule(row)
  const haystack = normalizeCatalogText(`${row.category} ${row.product} ${formatProductTitle(row.product)} ${row.designation} ${row.size} ${row.standard}`)
  const tokens = normalizeCatalogText(query).split(' ').filter((token) => token && !stopWords.has(token))
  const haystackTokens = haystack.split(' ')
  return tokens.every((token) => haystackTokens.some((candidate) => candidate === token || candidate.startsWith(token)))
}
