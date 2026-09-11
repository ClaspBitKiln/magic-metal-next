import type { ProcurementAdapter } from './engine'
import type { NormalizedRFQItem, Offer } from './types'

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/search'
const SOURCE_ID = 'metalinfo-price-list'

function escapeQuery(value: string | number | undefined): string {
  return String(value ?? '').replace(/["\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildQuery(item: NormalizedRFQItem): string {
  const parts = [
    item.product.value,
    item.subtype.value,
    item.diameter.value ? `${item.diameter.value}` : undefined,
    item.wall.value ? `${item.wall.value}` : undefined,
    item.thickness.value ? `${item.thickness.value}` : undefined,
    item.grade.value,
    item.standard.value,
  ].filter(Boolean).map(escapeQuery)

  return parts.length ? parts.join(' ') : item.originalText
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

function hasNumber(text: string, value?: number): boolean {
  if (value === undefined) return true
  const n = String(value).replace('.', '[,.]')
  return new RegExp(`(?:^|[^0-9])${n}(?:$|[^0-9])`).test(text)
}

function hasToken(text: string, value?: string): boolean {
  if (!value) return true
  return normalizeText(text).includes(normalizeText(value))
}

function parsePrice(text: string): number | undefined {
  const normalized = text.replace(/\u00a0/g, ' ')
  const kg = normalized.match(/(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*кг|р\.?\s*\/\s*кг)/i)
  if (kg) {
    const value = Number(kg[1].replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(value) ? Math.round(value * 1000) : undefined
  }

  const ton = normalized.match(/(\d[\d\s.,]*)\s*(?:руб\.?\s*\/\s*т|р\.?\s*\/\s*т|₽\s*\/\s*т)/i)
  if (ton) {
    const value = Number(ton[1].replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(value) ? value : undefined
  }

  const thousand = normalized.match(/(\d[\d\s.,]*)\s*(?:тыс\.?\s*руб|тыс\.?\s*р)/i)
  if (thousand) {
    const value = Number(thousand[1].replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(value) ? Math.round(value * 1000) : undefined
  }

  return undefined
}

function parseQuantity(text: string): number | undefined {
  const match = text.match(/(?:наличи[ея]|склад[еа]|остаток|кол-?во|количество)[^\d]{0,20}(\d[\d\s.,]*)\s*(?:т|тонн|тонны)/i)
  if (!match) return undefined
  const value = Number(match[1].replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(value) ? value : undefined
}

function parseCity(text: string): string | undefined {
  const cities = ['Москва', 'Челябинск', 'Екатеринбург', 'Санкт-Петербург', 'Нижний Новгород', 'Казань', 'Пермь', 'Тула', 'Самара', 'Ростов-на-Дону', 'Воронеж']
  return cities.find((city) => normalizeText(text).includes(normalizeText(city)))
}

function parseSupplier(title: string, text: string): string | undefined {
  const patterns = [
    /(?:ООО|АО|ПАО|ЗАО|ИП)\s+[«"']?([^»"'\n]{2,100})/i,
    /(?:поставщик|компания|продавец)\s*[:\-]\s*([^\n]{2,100})/i,
  ]
  for (const pattern of patterns) {
    const match = `${title}\n${text}`.match(pattern)
    if (match?.[1]) return match[0].replace(/\s+/g, ' ').trim()
  }
  return undefined
}

function parseObservedAt(markdown: string): string | undefined {
  const match = markdown.match(/(\d{1,2}[./]\d{1,2}[./]\d{4}|\d{1,2}\s+[а-яё]+\s+\d{4})/i)
  return match?.[1]
}

function buildOffer(item: NormalizedRFQItem, result: { title?: string; url?: string; markdown?: string; description?: string }, index: number): Offer | undefined {
  const text = `${result.title ?? ''}\n${result.description ?? ''}\n${result.markdown ?? ''}`
  const normalized = normalizeText(text)

  if (!hasNumber(normalized, item.diameter.value) || !hasNumber(normalized, item.wall.value || item.thickness.value)) return undefined
  if (!hasToken(normalized, item.grade.value)) return undefined

  const price = parsePrice(text)
  if (!price) return undefined

  const supplier = parseSupplier(result.title ?? '', text)
  if (!supplier) return undefined

  const observedAt = parseObservedAt(text) || new Date().toISOString()
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
    observedAt,
    match: 'exact',
    confidence: supplier && price ? 0.82 : 0.6,
    evidenceUrl: result.url,
    evidenceNote: `Metalinfo search result: ${result.title ?? result.url ?? 'unknown'}`,
  }
}

export const metalinfoAdapter: ProcurementAdapter = {
  id: SOURCE_ID,
  async search(item) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY is required for live Metalinfo search')

    const response = await fetch(FIRECRAWL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:metalinfo.ru ${buildQuery(item)}`,
        limit: 10,
        sources: ['web'],
        includeDomains: ['metalinfo.ru', 'ww1.metalinfo.ru'],
        country: 'RU',
        scrapeOptions: { formats: [{ type: 'markdown' }] },
      }),
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`Metalinfo search failed: ${response.status}`)
    const payload = await response.json() as { success?: boolean; data?: { web?: Array<{ title?: string; url?: string; markdown?: string; description?: string }> } }
    if (!payload.success) throw new Error('Metalinfo search returned an unsuccessful response')

    return (payload.data?.web ?? [])
      .map((result, index) => buildOffer(item, result, index))
      .filter((offer): offer is Offer => Boolean(offer))
  },
}
