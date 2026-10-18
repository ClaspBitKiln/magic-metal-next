export type SizeSearchQuery = { kind: 'pipe' | 'sheet' | 'flange'; values: string[]; remainder: string }
const number = '\\d+(?:[.,]\\d+)?'
const unitsAndEnd = '(?:\\s*(?:мм|mm)\\.?)?(?![\\p{L}\\d.,]|\\s*[×xх*])'
const positiveValues = (values: string[]) => values.every(value => Number.isFinite(Number(value)) && Number(value) > 0)
export const numericSizeKey = (value: string) => value.trim().replace(/[()]/g, '').split(/\s*[×xх*]\s*/iu).map(part => Number(part.replace(',', '.')).toString()).join('x')

export function parseSizeSearchQuery(query: string): SizeSearchQuery | null {
  // A full numeric tuple must not be cut out of a grade (12Х18Н10Т), a
  // signed number or a longer tuple. Units may be attached without a space.
  const dimensions = query.match(new RegExp(`(?<![\\p{L}\\d.,+−×xх*-])(?:[Ø⌀]\\s*)?(${number})\\s*[×xх*]\\s*(${number})(?:\\s*[×xх*]\\s*(${number}))?${unitsAndEnd}`, 'iu'))
  if (dimensions) {
    const values = dimensions.slice(1).filter(Boolean).map(numericSizeKey)
    if (/[×xх*]\s*$/iu.test(query.slice(0, dimensions.index)) || !positiveValues(values)) return null
    return {
      kind: /лист|рулон/iu.test(query) ? 'sheet' : 'pipe',
      values,
      remainder: query.replace(dimensions[0], '').replace(/труб[а-яё]*|лист[а-яё]*|рулон[а-яё]*|мм\.?|mm\.?|[Ø⌀]/giu, '').trim(),
    }
  }
  const sheet = query.match(new RegExp(`лист[а-яё]*\\s+(${number})${unitsAndEnd}`, 'iu'))
  if (sheet && positiveValues([numericSizeKey(sheet[1])])) return { kind: 'sheet', values: [numericSizeKey(sheet[1])], remainder: query.replace(sheet[0], '').trim() }
  const dn = query.match(new RegExp(`(?:DN|Д[Уу])\\s*(${number})${unitsAndEnd}`, 'iu'))
  if (dn && /флан/iu.test(query)) {
    const pn = query.match(new RegExp(`(?:PN|Р[Уу])\\s*(${number})${unitsAndEnd}`, 'iu'))
    const values = [numericSizeKey(dn[1]), ...(pn ? [numericSizeKey(pn[1])] : [])]
    if (!positiveValues(values)) return null
    return { kind: 'flange', values, remainder: query.replace(dn[0], '').replace(pn?.[0] || /$^/, '').replace(/флан[а-яё]*/giu, '').trim() }
  }
  return null
}
