export type SizeSearchQuery = { kind: 'pipe' | 'sheet' | 'flange'; values: string[]; remainder: string }
const number = '\\d+(?:[.,]\\d+)?'
export const numericSizeKey = (value: string) => value.trim().replace(/[()]/g, '').split(/\s*[×xх*]\s*/iu).map(part => Number(part.replace(',', '.')).toString()).join('x')

export function parseSizeSearchQuery(query: string): SizeSearchQuery | null {
  const dimensions = query.match(new RegExp(`(${number})\\s*[×xх*]\\s*(${number})(?:\\s*[×xх*]\\s*(${number}))?`, 'iu'))
  if (dimensions) return {
    kind: /лист|рулон/iu.test(query) ? 'sheet' : 'pipe',
    values: dimensions.slice(1).filter(Boolean).map(numericSizeKey),
    remainder: query.replace(dimensions[0], '').replace(/труб[а-яё]*|лист[а-яё]*|рулон[а-яё]*|мм\.?|mm\.?|[Ø⌀]/giu, '').trim(),
  }
  const sheet = query.match(new RegExp(`лист[а-яё]*\\s+(${number})(?:\\s*мм)?`, 'iu'))
  if (sheet) return { kind: 'sheet', values: [numericSizeKey(sheet[1])], remainder: query.replace(sheet[0], '').trim() }
  const dn = query.match(new RegExp(`(?:DN|Д[Уу])\\s*(${number})`, 'iu'))
  if (dn && /флан/iu.test(query)) {
    const pn = query.match(new RegExp(`(?:PN|Р[Уу])\\s*(${number})`, 'iu'))
    return { kind: 'flange', values: [numericSizeKey(dn[1]), ...(pn ? [numericSizeKey(pn[1])] : [])], remainder: query.replace(dn[0], '').replace(pn?.[0] || /$^/, '').replace(/флан[а-яё]*/giu, '').trim() }
  }
  return null
}
