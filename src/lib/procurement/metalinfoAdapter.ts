import crypto from 'node:crypto'
import type { ProcurementAdapter } from './engine'
import type { EvidenceFreshness, NormalizedRFQItem, Offer } from './types'

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/search'
const SOURCE_ID = 'metalinfo-price-list'
const DOMAINS = ['metalinfo.ru', 'ww1.metalinfo.ru']
const FRESH_DAYS = 30
const STALE_DAYS = 90

export type MetalinfoSearchResult = {
  title?: string
  url?: string
  description?: string
  markdown?: string
  date?: string
  publishedDate?: string
  metadata?: {
    publishedTime?: string
    modifiedTime?: string
  }
}

type ParsedLine = {
  text: string
  price?: number
  quantity?: number
  unit?: 't' | 'kg'
  vatIncluded?: boolean
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[×*]/g, 'х')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCode(value: string): string {
  return normalizeText(value).replace(/[^a-zа-я0-9]/g, '')
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function buildQueries(item: NormalizedRFQItem): string[] {
  const product = item.product.value || item.originalText
  const diameter = item.diameter.value
  const wall = item.wall.value || item.thickness.value
  const grade = item.grade.value
  const standard = item.standard.value
  const variants =
    diameter && wall
      ? [`${diameter}х${wall}`, `${diameter}x${wall}`, `${diameter}*${wall}`, `${diameter}×${wall}`]
      : []

  return unique(
    [
      ...variants.map((size) => `site:metalinfo.ru ${product} ${size} ${grade || ''} ${standard || ''}`),
      `site:metalinfo.ru ${product} ${grade || ''} ${standard || ''}`,
      `site:metalinfo.ru ${item.originalText}`,
    ].map((query) => query.replace(/\s+/g, ' ').trim()),
  )
}

function containsSize(text: string, diameter: number, wall: number): boolean {
  const d = String(diameter).replace('.', '[,.]')
  const w = String(wall).replace('.', '[,.]')
  return new RegExp(`(?:^|[^0-9])${d}\\s*[хx]\\s*${w}(?:$|[^0-9])`, 'i').test(normalizeText(text))
}

function containsGrade(text: string, grade: string): boolean {
  const normalized = normalizeText(text)
  const normalizedGrade = normalizeText(grade)

  if (/^\d+$/.test(normalizedGrade)) {
    return new RegExp(`(?:сталь|ст\\.?|марка)\\s*[:=-]?\\s*${normalizedGrade}(?!\\d)`, 'i').test(normalized)
  }

  return normalizeCode(normalized).includes(normalizeCode(normalizedGrade))
}

function containsStandard(text: string, standard: string): boolean {
  return normalizeCode(text).includes(normalizeCode(standard))
}

function parsePrice(text: string): Pick<ParsedLine, 'price' | 'unit'> {
  const normalized = text.replace(/\u00a0/g, ' ')
  const patterns: Array<{ re: RegExp; factor: number; unit: 't' | 'kg' }> = [
    { re: /(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*кг|р\.?\s*\/\s*кг)/i, factor: 1000, unit: 'kg' },
    { re: /(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*т|р\.?\s*\/\s*т|₽\s*\/\s*т)/i, factor: 1, unit: 't' },
    { re: /(\d[\d\s.,]*)\s*(?:тыс\.?\s*(?:руб|р))(?:\s*\/\s*т)?/i, factor: 1000, unit: 't' },
  ]

  for (const { re, factor, unit } of patterns) {
    const match = normalized.match(re)
    if (!match) continue
    const value = Number(match[1].replace(/\s/g, '').replace(',', '.'))
    if (Number.isFinite(value)) return { price: Math.round(value * factor), unit }
  }

  return {}
}

function parseQuantity(text: string): number | undefined {
  const match = text.match(
    /(?:наличи[ея]|склад[еа]|остаток|кол-?во|количество|вес)[^\d]{0,24}(\d[\d\s.,]*)\s*(?:т|тонн|тонны)/i,
  )
  if (!match) return undefined
  const value = Number(match[1].replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(value) ? value : undefined
}

function parseVatIncluded(text: string): boolean | undefined {
  if (/без\s+ндс/i.test(text)) return false
  if (/(?:с\s+ндс|ндс\s+включен|включая\s+ндс)/i.test(text)) return true
  return undefined
}

function parseCity(text: string): string | undefined {
  const cities = [
    'Москва',
    'Челябинск',
    'Екатеринбург',
    'Магнитогорск',
    'Первоуральск',
    'Нижний Тагил',
    'Санкт-Петербург',
    'Нижний Новгород',
    'Казань',
    'Пермь',
    'Тула',
    'Самара',
    'Ростов-на-Дону',
    'Воронеж',
    'Уфа',
    'Новосибирск',
    'Омск',
    'Красноярск',
    'Тюмень',
    'Ижевск',
    'Набережные Челны',
  ]
  const normalized = normalizeText(text)
  return cities.find((city) => normalized.includes(normalizeText(city)))
}

function parseSupplier(text: string): string | undefined {
  const patterns = [
    /(?:организация|поставщик|компания|продавец)\s*[:\-]\s*([^\n|]{2,120})/i,
    /((?:ООО|АО|ПАО|ЗАО|ИП)\s+[«"']?[^»"'\n|]{2,100})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim()
  }

  return undefined
}

function splitIntoCandidateLines(text: string): ParsedLine[] {
  const normalized = text.replace(/\r/g, '\n').replace(/•/g, '\n')
  const rawLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const lines: ParsedLine[] = []
  const sizePattern = /\b\d{2,4}\s*[хx]\s*\d{1,3}(?:[,.]\d+)?\b/gi

  for (const raw of rawLines) {
    const matches = [...raw.matchAll(sizePattern)]

    if (!matches.length) {
      const price = parsePrice(raw)
      lines.push({
        text: raw,
        ...price,
        quantity: parseQuantity(raw),
        vatIncluded: parseVatIncluded(raw),
      })
      continue
    }

    for (let index = 0; index < matches.length; index++) {
      const start = matches[index].index ?? 0
      const end = index + 1 < matches.length ? (matches[index + 1].index ?? raw.length) : raw.length
      const segment = raw.slice(Math.max(0, start - 80), end).trim()
      const price = parsePrice(segment)
      lines.push({
        text: segment,
        ...price,
        quantity: parseQuantity(segment),
        vatIncluded: parseVatIncluded(segment),
      })
    }
  }

  return lines
}

function findExactCandidate(item: NormalizedRFQItem, text: string): ParsedLine | undefined {
  const diameter = item.diameter.value
  const wall = item.wall.value || item.thickness.value
  const grade = item.grade.value
  const standard = item.standard.value

  if (diameter === undefined || wall === undefined || !grade || !standard) return undefined

  return splitIntoCandidateLines(text).find(
    (line) =>
      containsSize(line.text, diameter, wall) &&
      containsGrade(line.text, grade) &&
      containsStandard(line.text, standard) &&
      line.price !== undefined,
  )
}

function validDate(value?: string): string | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined
}

export function sourceDates(result: MetalinfoSearchResult): {
  sourcePublishedAt?: string
  sourceUpdatedAt?: string
} {
  return {
    sourcePublishedAt: validDate(result.metadata?.publishedTime || result.publishedDate || result.date),
    sourceUpdatedAt: validDate(result.metadata?.modifiedTime),
  }
}

export function classifyEvidenceFreshness(
  sourceDate: string | undefined,
  now = new Date(),
): EvidenceFreshness {
  if (!sourceDate) return 'unknown'
  const ageMs = now.getTime() - new Date(sourceDate).getTime()
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'unknown'
  const ageDays = ageMs / 86_400_000
  if (ageDays <= FRESH_DAYS) return 'fresh'
  if (ageDays <= STALE_DAYS) return 'aging'
  return 'stale'
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value)
    url.hash = ''
    url.searchParams.sort()
    return url.toString().replace(/\/$/, '')
  } catch {
    return value.trim().replace(/\/$/, '')
  }
}

export function dedupeMetalinfoResults(results: MetalinfoSearchResult[]): MetalinfoSearchResult[] {
  const seen = new Set<string>()
  return results.filter((result) => {
    if (!result.url) return false
    const key = canonicalUrl(result.url)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function buildMetalinfoOffer(
  item: NormalizedRFQItem,
  result: MetalinfoSearchResult,
  now = new Date(),
): Offer | undefined {
  const text = `${result.title ?? ''}\n${result.description ?? ''}\n${result.markdown ?? ''}`
  const candidate = findExactCandidate(item, text)
  if (!candidate || !result.url) return undefined

  const supplier = parseSupplier(text)
  if (!supplier) return undefined

  const dates = sourceDates(result)
  const sourceDate = dates.sourceUpdatedAt || dates.sourcePublishedAt
  const freshness = classifyEvidenceFreshness(sourceDate, now)
  const city = parseCity(candidate.text) || parseCity(text)
  const idSeed = `${canonicalUrl(result.url)}|${item.line}|${normalizeText(candidate.text)}`
  const id = `MI-${crypto.createHash('sha256').update(idSeed).digest('hex').slice(0, 16)}`

  return {
    id,
    sourceId: SOURCE_ID,
    supplierId: supplier,
    product: item.product.value || item.originalText,
    subtype: item.subtype.value,
    diameter: item.diameter.value,
    wall: item.wall.value,
    thickness: item.thickness.value,
    length: item.length.value,
    grade: item.grade.value,
    standard: item.standard.value,
    quantity: candidate.quantity,
    unit: 't',
    price: candidate.price,
    currency: 'RUB',
    availability: candidate.quantity && candidate.quantity > 0 ? 'in-stock' : 'unknown',
    warehouse: city,
    city,
    ...dates,
    observedAt: now.toISOString(),
    freshness,
    evidenceStatus: freshness === 'stale' ? 'stale' : 'needs-verification',
    vatIncluded: candidate.vatIncluded,
    match: 'exact',
    confidence: freshness === 'fresh' ? 0.9 : freshness === 'aging' ? 0.78 : 0.65,
    evidenceUrl: result.url,
    evidenceNote:
      `Metalinfo Firecrawl: ${result.title ?? result.url}; ` +
      'цена привязана к точной позиции; наличие и коммерческие условия требуют подтверждения',
  }
}

async function searchFirecrawl(apiKey: string, query: string): Promise<MetalinfoSearchResult[]> {
  const response = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: 20,
      sources: [{ type: 'web' }],
      includeDomains: DOMAINS,
      scrapeOptions: { formats: ['markdown'] },
    }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`Metalinfo Firecrawl search failed: ${response.status}`)

  const payload = (await response.json()) as {
    success?: boolean
    data?: { web?: MetalinfoSearchResult[] }
  }

  if (!payload.success) throw new Error('Metalinfo Firecrawl search returned an unsuccessful response')
  return payload.data?.web ?? []
}

export const metalinfoAdapter: ProcurementAdapter = {
  id: SOURCE_ID,
  async search(item) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY is required for live Metalinfo search')

    const results = (
      await Promise.all(buildQueries(item).map((query) => searchFirecrawl(apiKey, query)))
    ).flat()

    return dedupeMetalinfoResults(results)
      .map((result) => buildMetalinfoOffer(item, result))
      .filter((offer): offer is Offer => Boolean(offer))
  },
}
