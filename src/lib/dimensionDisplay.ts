// Display only: keep source values for matching and existing selection URLs.
const dimensionExpression = /^[\d\s.,;:/×*()[\]±–—−+\-=≤≥<>°²³%]+$/u
const dimensionWords = new Set(['х', 'x', 'мм', 'mm', 'см', 'cm', 'м', 'm', 'кг', 'шт', 'до', 'от', 'не', 'более', 'менее', 'включ', 'включительно', 'диапазон'])

export function formatDimensionValue(value: string): string {
  const words = value.match(/\p{L}+/gu) || []
  if (!words.every(word => dimensionWords.has(word.toLowerCase())) || !dimensionExpression.test(value.replace(/\p{L}+/gu, ''))) return value
  return value.replace(/(?<![\d.,])(\d+)[,.]0+(?![\d.,])/g, '$1').replace(/(\d)\.(?=\d)/g, '$1,')
}

export function sourceDimensionValue(cell: Element | null | undefined): string {
  return cell?.getAttribute('data-source-value') ?? cell?.textContent ?? ''
}

export function formatDimensionSummary(value: string): string {
  return value.replace(/((?:толщина|диаметр|ширина|длина|стенка|сечение)\s+)([^;]+)/giu,
    (_, label: string, dimensions: string) => label + formatDimensionValue(dimensions))
}

// Some stock descriptions start with a dimension tuple followed by a coating.
export function formatDimensionDesignation(value: string): string {
  const formatted = formatDimensionValue(value)
  if (formatted !== value) return formatted
  return value.replace(/^(\d+(?:[.,]\d+)?(?:\s*[xх×]\s*\d+(?:[.,]\d+)?){1,2})(?=$|\s)/iu,
    dimensions => formatDimensionValue(dimensions))
}
