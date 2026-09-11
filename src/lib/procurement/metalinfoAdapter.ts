import type { ProcurementAdapter } from './engine'
import type { NormalizedRFQItem, Offer } from './types'

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/search'
const SOURCE_ID = 'metalinfo-price-list'
const DOMAINS = ['metalinfo.ru', 'ww1.metalinfo.ru']

type SearchResult = {
  title?: string
  url?: string
  description?: string
  markdown?: string
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/[×*]/g, 'х').replace(/\s+/g, ' ').trim()
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

  const size = diameter && wall ? `${diameter}х${wall}` : undefined
  const variants = size
    ? [`${diameter}х${wall}`, `${diameter}x${wall}`, `${diameter}*${wall}`, `${diameter}×${wall}`]
    : []

  return unique([
    ...variants.map((v) => `site:metalinfo.ru ${product} ${v} ${grade || ''} ${standard || ''}`),
    `site:metalinfo.ru ${product} ${grade || ''} ${standard || ''}`,
    `site:metalinfo.ru ${item.originalText}`,
  ].map((q) => q.replace(/\s+/g, ' ').trim()))
}

function containsNumber(text: string, value?: number): boolean {
  if (value === undefined) return true
  const n = String(value).replace('.', '[,.]')
  return new RegExp(`(?:^|[^0-9])${n}(?:$|[^0-9])`).test(normalizeText(text))
}

function containsToken(text: string, value?: string): boolean {
  if (!value) return true
  return normalizeText(text).includes(normalizeText(value))
}

function parsePrice(text: string): number | undefined {
  const normalized = text.replace(/\u00a0/g, ' ')
  const patterns = [
    /(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*кг|р\.?\s*\/\s*кг)/i,
    /(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*т|р\.?\s*\/\s*т|₽\s*\/\s*т)/i,
    /(\d[\d\s.,]*)\s*(?:тыс\.?\s*(?:руб|р))/i,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (!match) continue
    const value = Number(match[1].replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(value)) continue
    return pattern === patterns[0] ? Math.round(value * 1000) : Math.round(value * 1000)
  }

  return undefined
}

function parseQuantity(text: string): number | undefined {
  const match = text.match(/(?:наличи[ея]|склад[еа]|остаток|кол-?во|количество|вес)[^\d]{0,24}(\d[\d\s.,]*)\s*(?:т|тонн|тонны)/i)
  if (!match) return undefined
  const value = Number(match[1].replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(value) ? value : undefined
}

function parseCity(text: string): string | undefined {
  const cities = [
    'Москва', 'Челябинск', 'Екатеринбург', 'Санкт-Петербург', 'Нижний Новгород',
    'Казань', 'Пермь', 'Тула', 'Самара', 'Ростов-на-Дону', 'Воронеж', 'Уфа',
    'Новосибирск', 'Омск', 'Красноярск', 'Тюмень', 'Ижевск', 'Набережные Челны',
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

function buildOffer(
  item: NormalizedRFQItem,
  result: SearchResult,
  index: number,
): Offer | undefined {
  const text = `${result.title ?? ''}\n${result.description ?? ''}\n${result.markdown ?? ''}`

  if (!containsNumber(text, item.diameter.value)) return undefined
  if (!containsNumber(text, item.wall.value || item.thickness.value)) return undefined
  if (!containsToken(text, item.grade.value)) return undefined

  const price = parsePrice(text)
  const supplier = parseSupplier(text)
  if (price === undefined || !supplier || !result.url) return undefined

  const quantity = parseQuantity(text)
  const city = parseCity(text)

  return {
    id: `MI-${Date.now()}-${index}`,
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
    quantity,
    unit: 't',
    price,
    currency: 'RUB',
    availability: quantity && quantity > 0 ? 'in-stock' : 'on-request',
    warehouse: city,
    city,
    observedAt: new Date().toISOString(),
    match: 'exact',
    confidence: 0.82,
    evidenceUrl: result.url,
    evidenceNote: `Metalinfo Firecrawl search: ${result.title ?? result.url}`,
  }
}

async function searchFirecrawl(apiKey: string, query: string): Promise<SearchResult[]> {
  const response = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
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

  const payload = await response.json() as {
    success?: boolean
    data?: { web?: SearchResult[] }
  }

  if (!payload.success) throw new Error('Metalinfo Firecrawl search returned an unsuccessful response')
  return payload.data?.web ?? []
}

export const metalinfoAdapter: ProcurementAdapter = {
  id: SOURCE_ID,
  async search(item) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY is required for live Metalinfo search')

    const results = (await Promise.all(buildQueries(item).map((query) => searchFirecrawl(apiKey, query))))
      .flat()
      .filter((result) => result.url)

    const seen = new Set<string>()
    const uniqueResults = results.filter((result) => {
      if (!result.url || seen.has(result.url)) return false
      seen.add(result.url)
      return true
    })

    return uniqueResults
      .map((result, index) => buildOffer(item, result, index))
      .filter((offer): offer is Offer => Boolean(offer))
  },
}
