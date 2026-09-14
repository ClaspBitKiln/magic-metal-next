import crypto from 'node:crypto'
import type { NormalizedField, NormalizedRFQ, NormalizedRFQItem } from './types'

const numberFrom = (value?: string): number | undefined => {
  if (!value) return undefined
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

const field = <T>(value: T | undefined, raw?: string): NormalizedField<T> => ({
  value,
  raw,
  confidence: value === undefined ? 'missing' : 'high',
})

const normalizeStandard = (value?: string) => value?.replace(/\s+/g, ' ').trim()

const extractGrade = (line: string): string | undefined => {
  const labelled = line.match(
    /(?:марка\s*(?:стали)?|сталь)\s*[:=]?\s*(AISI\s*\d{3,4}|(?:12|10)Cr\d{2,3}|[0-9]{1,3}(?:[А-ЯЁA-Z][А-ЯЁA-Z0-9-]{0,8})?)/i,
  )
  if (labelled?.[1]) return labelled[1].replace(/\s+/g, '')

  const international = line.match(/\b(AISI\s*\d{3,4}|(?:12|10)Cr\d{2,3})\b/i)
  if (international?.[1]) return international[1].replace(/\s+/g, '')

  const russian = line.match(
    /(?:^|[^0-9A-ZА-ЯЁ])([0-9]{1,3}[А-ЯЁ][А-ЯЁ0-9-]{1,8})(?=$|[^0-9A-ZА-ЯЁ])/i,
  )
  return russian?.[1]
}

const normalizeUnit = (value?: string): string | undefined => {
  if (!value) return undefined
  if (/^(?:т|тонн)/i.test(value)) return 'т'
  if (/^кг/i.test(value)) return 'кг'
  if (/^шт/i.test(value)) return 'шт'
  if (/^м/i.test(value)) return 'м'
  return value
}

const removeMatch = (value: string, match?: RegExpMatchArray | null): string =>
  match?.[0] ? value.replace(match[0], ' ') : value

export function normalizeRFQ(text: string, parsedAt = new Date().toISOString()): NormalizedRFQ {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const items: NormalizedRFQItem[] = lines.map((line, index) => {
    const compactSize = line.match(
      /(?:^|[^0-9])(\d{2,4}(?:[.,]\d+)?)\s*[×хx*]\s*(\d{1,3}(?:[.,]\d+)?)(?=$|[^0-9])/i,
    )
    const diameter = line.match(/(?:Ø|диам(?:етр)?\.?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const wall = line.match(/(?:стен(?:ка|ки)?|s)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const thickness = line.match(/(?:толщ(?:ина)?|t)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const labelledQuantity = line.match(
      /(?:кол-?во|количество|qty)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(т|тонн(?:а|ы)?|кг|шт\.?)?/i,
    )
    const bareQuantity = line.match(
      /(?:^|[,;]\s*|\s)(\d+(?:[.,]\d+)?)\s*(т|тонн(?:а|ы)?|кг|шт\.?)(?=$|[,;.\s])/i,
    )
    const quantity = labelledQuantity || bareQuantity
    const gradeInput = compactSize?.[0] ? line.replace(compactSize[0], ' ') : line\n    const grade = extractGrade(gradeInput)
    const gradeMatch = grade ? line.match(new RegExp(grade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) : undefined
    const standard = line.match(/\b(?:ГОСТ|GOST|ТУ|ASTM|EN|DIN)\s*[A-Za-zА-Яа-яЁё0-9./:-]+/i)
    const destination = line.match(/(?:достав(?:ка|ить)|адрес|в\s+город)\s*[:=-]?\s*([^,;]+)/i)

    const diameterValue = numberFrom(diameter?.[1] || compactSize?.[1])
    const wallValue = numberFrom(wall?.[1] || compactSize?.[2])
    const unitValue = normalizeUnit(quantity?.[2])

    let product = line
    for (const match of [diameter, wall, thickness, compactSize, quantity, gradeMatch, standard, destination]) {
      product = removeMatch(product, match)
    }
    product = product
      .replace(/(?:марка\s*(?:стали)?|сталь)\s*[:=]?/gi, ' ')
      .replace(/[;,:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      line: index + 1,
      originalText: line,
      product: field(product || undefined, line),
      subtype: field(/бесшовн/i.test(line) ? 'бесшовная' : /электросвар/i.test(line) ? 'электросварная' : undefined),
      diameter: field(diameterValue, diameter?.[0] || compactSize?.[0]?.trim()),
      wall: field(wallValue, wall?.[0] || compactSize?.[0]?.trim()),
      thickness: field(numberFrom(thickness?.[1]), thickness?.[0]),
      length: field(undefined),
      grade: field(grade, grade),
      standard: field(normalizeStandard(standard), standard),
      quantity: field(numberFrom(quantity?.[1]), quantity?.[0]?.trim()),
      unit: field(unitValue, quantity?.[2]),
      destination: field(destination?.[1]?.trim(), destination?.[0]),
      deadline: field(undefined),
      certification: field(/сертификат|паспорт|мкс|мтк/i.test(line) ? 'требуется' : undefined),
      substitutionAllowed: field(/аналог|замен[а-я]* допуска|эквивалент/i.test(line) ? true : undefined),
    }
  })

  return {
    id: crypto.createHash('sha256').update(text).digest('hex').slice(0, 24),
    originalText: text,
    items,
    parsedAt,
  }
}
