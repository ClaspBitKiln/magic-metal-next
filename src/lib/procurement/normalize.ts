import crypto from 'node:crypto'
import type { NormalizedRFQ, NormalizedRFQItem } from './types'

const numberFrom = (value?: string): number | undefined => {
  if (!value) return undefined
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

const field = <T>(value: T | undefined, raw?: string): NormalizedRFQItem['product'] => ({
  value,
  raw,
  confidence: value === undefined ? 'missing' : 'high',
})

const normalizeStandard = (value?: string) => value?.replace(/\s+/g, ' ').trim()

const extractGrade = (line: string): string | undefined => {
  const match = line.match(/(?:марка\s*(?:стали)?|сталь)\s*[:=]?\s*([0-9]{1,3}[А-ЯЁA-Z][А-ЯЁA-Z0-9-]{0,8}|[0-9]{1,3}|AISI\s*\d{3,4}|12Cr\d{2,3}|10Cr\d{2,3})\b/i)
  if (match?.[1]) return match[1].replace(/\s+/g, '')
  const bare = line.match(/\b(AISI\s*\d{3,4}|12Cr\d{2,3}|10Cr\d{2,3})\b/i)
  return bare?.[1]?.replace(/\s+/g, '')
}

export function normalizeRFQ(text: string, parsedAt = new Date().toISOString()): NormalizedRFQ {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const items: NormalizedRFQItem[] = lines.map((line, index) => {
    const diameter = line.match(/(?:Ø|диам(?:етр)?\.?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const wall = line.match(/(?:стен(?:ка|ки)?|s)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const thickness = line.match(/(?:толщ(?:ина)?|t)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const quantity = line.match(/(?:кол-?во|количество|qty)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
    const grade = extractGrade(line)
    const standard = line.match(/\b(?:ГОСТ|GOST|ТУ|ASTM|EN|DIN)\s*[A-Za-zА-Яа-яЁё0-9./:-]+/i)
    const unit = line.match(/\b(т|тонн(?:а|ы)?|кг|шт\.?|м(?:етр(?:а|ов)?)?)\b/i)
    const destination = line.match(/(?:достав(?:ка|ить)|адрес|в\s+город)\s*[:=-]?\s*([^,;]+)/i)

    const product = line
      .replace(/(?:Ø|диам(?:етр)?\.?|стен(?:ка|ки)?|толщ(?:ина)?|кол-?во|количество|qty)\s*[:=]?\s*\d+(?:[.,]\d+)?/gi, '')
      .trim()

    return {
      line: index + 1,
      originalText: line,
      product: field(product || undefined, line),
      subtype: field(/бесшовн/i.test(line) ? 'бесшовная' : /электросвар/i.test(line) ? 'электросварная' : undefined),
      diameter: field(numberFrom(diameter?.[1]), diameter?.[0]),
      wall: field(numberFrom(wall?.[1]), wall?.[0]),
      thickness: field(numberFrom(thickness?.[1]), thickness?.[0]),
      length: field(undefined),
      grade: field(grade, grade),
      standard: field(normalizeStandard(standard?.[0]), standard?.[0]),
      quantity: field(numberFrom(quantity?.[1]), quantity?.[0]),
      unit: field(unit?.[1], unit?.[0]),
      destination: field(destination?.[1]?.trim(), destination?.[0]),
      deadline: field(undefined),
      certification: field(/сертификат|паспорт|мкс|мтк/i.test(line) ? 'требуется' : undefined),
      substitutionAllowed: field(/аналог|замен[а-я]* допуска|эквивалент/i.test(line), undefined),
    }
  })

  return {
    id: crypto.createHash('sha256').update(text).digest('hex').slice(0, 24),
    originalText: text,
    items,
    parsedAt,
  }
}
