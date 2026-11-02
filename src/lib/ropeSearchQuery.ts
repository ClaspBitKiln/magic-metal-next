export type RopeSearchQuery = { construction: string; diameter: number | null; valid: boolean }

// Keep this recognizer small: the sales diameter matrix stays on the server.
// Bare tuples are ambiguous with pipe sizes; only offered bare constructions
// (or a query explicitly naming a rope) take precedence over pipe parsing.
const bareConstructions = new Set(['35×7', '35×K7', '35W×7', '35W×K7', '19×K7', '19×7', '18×7'])
export const normalizeRopeConstruction = (value: string) => value.replace(/\s/g, '').replace(/[xх*]/giu, '×').toUpperCase()

export function parseRopeSearchQuery(query: string): RopeSearchQuery | null {
  if (!/канат|трос/iu.test(query) && /труб|лист|рулон|флан/iu.test(query)) return null
  const match = query.match(/(?<![\p{L}\d.,+−×xх*-])(\d+\s*W?\s*[×xх*]\s*K?\s*\d+(?:\s*(?:WS|Fi|S|W))?(?:\s*\+\s*(?:IWRC|IWR|IWS|NFC|SFC|7FC|FC))?)(?![\p{L}\d+])/iu)
  if (!match) return null
  const construction = normalizeRopeConstruction(match[1])
  if (!construction.includes('+') && !bareConstructions.has(construction) && !/канат|трос/iu.test(query)) return null
  const remainder = query.replace(match[0], '').replace(/канат[а-яё]*|стальн[а-яё]*|трос[а-яё]*|конструкци[а-яё]*|диаметр(?:ом)?|диам\.?|мм\.?|mm\.?|[Ø⌀]/giu, '').trim()
  if (!remainder) return { construction, diameter: null, valid: true }
  const diameter = Number(remainder.replace(',', '.'))
  const valid = /^\d+(?:[.,]\d+)?$/.test(remainder) && Number.isFinite(diameter) && diameter >= 1 && diameter <= 56
  return { construction, diameter: valid ? diameter : null, valid }
}
