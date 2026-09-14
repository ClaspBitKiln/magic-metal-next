import { describe, expect, it } from 'vitest'
import { normalizeRFQ } from '@/lib/procurement/normalize'
import {
  buildMetalinfoOffer,
  classifyEvidenceFreshness,
  dedupeMetalinfoResults,
  type MetalinfoSearchResult,
} from '@/lib/procurement/metalinfoAdapter'

const request = 'Труба бесшовная 219×10 09Г2С ГОСТ 8732-78, 20 т, доставка: Ташкент'
const item = () => normalizeRFQ(request).items[0]

const liveResult = (overrides: Partial<MetalinfoSearchResult> = {}): MetalinfoSearchResult => ({
  title: 'Прайс-лист ООО «УралТруба»',
  url: 'https://metalinfo.ru/ru/price/pipe-1',
  markdown: [
    'ООО «УралТруба», склад Челябинск',
    'Труба бесшовная 219х8 сталь 09Г2С ГОСТ 8732-78 — 110 000 руб./т, остаток 30 т',
    'Труба бесшовная 219х10 сталь 09Г2С ГОСТ 8732-78 — 125 000 руб./т с НДС, остаток 18 т',
  ].join('\n'),
  metadata: { publishedTime: '2026-09-01T10:00:00Z' },
  ...overrides,
})

describe('Metalinfo evidence adapter', () => {
  it('normalizes a compact Russian pipe request without inventing fields', () => {
    const normalized = item()

    expect(normalized.diameter.value).toBe(219)
    expect(normalized.wall.value).toBe(10)
    expect(normalized.grade.value).toBe('09Г2С')
    expect(normalized.standard.value).toBe('ГОСТ 8732-78')
    expect(normalized.quantity.value).toBe(20)
    expect(normalized.unit.value).toBe('т')
    expect(normalized.destination.value).toBe('Ташкент')
  })

  it('binds price and stock to the exact neighboring catalogue line', () => {
    const offer = buildMetalinfoOffer(item(), liveResult(), new Date('2026-09-14T00:00:00Z'))

    expect(offer).toMatchObject({
      price: 125000,
      quantity: 18,
      vatIncluded: true,
      availability: 'in-stock',
      match: 'exact',
      freshness: 'fresh',
      evidenceStatus: 'needs-verification',
    })
  })

  it('rejects a result with a different standard', () => {
    const offer = buildMetalinfoOffer(
      item(),
      liveResult({
        markdown: [
          'ООО «УралТруба», склад Челябинск',
          'Труба бесшовная 219х10 сталь 09Г2С ГОСТ 8734-75 — 125 000 руб./т, остаток 18 т',
        ].join('\n'),
      }),
      new Date('2026-09-14T00:00:00Z'),
    )

    expect(offer).toBeUndefined()
  })

  it('does not claim an exact offer when a required RFQ field is missing', () => {
    const incomplete = normalizeRFQ('Труба бесшовная 219×10 09Г2С, 20 т').items[0]

    expect(buildMetalinfoOffer(incomplete, liveResult())).toBeUndefined()
  })

  it('marks evidence with no source date as unknown and unconfirmed', () => {
    const offer = buildMetalinfoOffer(
      item(),
      liveResult({ metadata: undefined, date: undefined, publishedDate: undefined }),
      new Date('2026-09-14T00:00:00Z'),
    )

    expect(offer?.freshness).toBe('unknown')
    expect(offer?.evidenceStatus).toBe('needs-verification')
  })

  it('marks old evidence as stale', () => {
    const offer = buildMetalinfoOffer(
      item(),
      liveResult({ metadata: { publishedTime: '2026-01-01T00:00:00Z' } }),
      new Date('2026-09-14T00:00:00Z'),
    )

    expect(offer?.freshness).toBe('stale')
    expect(offer?.evidenceStatus).toBe('stale')
  })

  it('classifies freshness at the documented boundaries', () => {
    const now = new Date('2026-09-14T00:00:00Z')

    expect(classifyEvidenceFreshness('2026-08-15T00:00:00Z', now)).toBe('fresh')
    expect(classifyEvidenceFreshness('2026-06-16T00:00:00Z', now)).toBe('aging')
    expect(classifyEvidenceFreshness('2026-06-15T00:00:00Z', now)).toBe('stale')
    expect(classifyEvidenceFreshness(undefined, now)).toBe('unknown')
  })

  it('deduplicates canonical evidence URLs', () => {
    const results = dedupeMetalinfoResults([
      { url: 'https://metalinfo.ru/ru/price/pipe-1/' },
      { url: 'https://metalinfo.ru/ru/price/pipe-1#offer' },
      { url: 'https://metalinfo.ru/ru/price/pipe-2' },
    ])

    expect(results.map((result) => result.url)).toEqual([
      'https://metalinfo.ru/ru/price/pipe-1/',
      'https://metalinfo.ru/ru/price/pipe-2',
    ])
  })

  it('keeps offer IDs stable across observation times', () => {
    const first = buildMetalinfoOffer(item(), liveResult(), new Date('2026-09-14T00:00:00Z'))
    const second = buildMetalinfoOffer(item(), liveResult(), new Date('2026-09-15T00:00:00Z'))

    expect(first?.id).toBe(second?.id)
  })
})
