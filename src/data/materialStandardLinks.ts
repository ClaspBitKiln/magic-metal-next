import { standards, type Standard } from './standards'

export type MaterialStandardPart = { text: string; standard?: Standard }

const normalize = (value: string) => value.toUpperCase().replace(/[–—]/gu, '-').replace(/\s+/gu, ' ').trim()

/** Split only explicit codes, retaining every original separator and qualifier. */
export function getMaterialStandardParts(reference: string): MaterialStandardPart[] {
  const parts: MaterialStandardPart[] = []
  const codes = /(?<![\p{L}\p{N}])(?:ГОСТ(?:\s+Р)?|ТУ)\s+\d+(?:\.\d+)*(?:\s*[-–—]\s*\d{2,4})?(?![\p{L}\p{N}.\-–—])/giu
  let cursor = 0
  for (const match of reference.matchAll(codes)) {
    const index = match.index
    if (index > cursor) parts.push({ text: reference.slice(cursor, index) })
    const text = match[0]
    const code = normalize(text).replace(/\s*-\s*/gu, '-')
    const hasEdition = /-\d{2,4}$/u.test(code)
    const matches = standards.filter(standard => normalize(hasEdition ? standard.code : standard.code.replace(/-\d{2,4}$/u, '')) === code)
    // An explicit unknown edition must never silently fall back to another year.
    parts.push({ text, ...(matches.length === 1 ? { standard: matches[0] } : {}) })
    cursor = index + text.length
  }
  if (cursor < reference.length || !parts.length) parts.push({ text: reference.slice(cursor) })
  return parts
}
