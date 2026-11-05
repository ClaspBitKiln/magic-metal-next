// Existing shape options, shared by navigation and the request picker.
export type Shape = 'Лист' | 'Лента' | 'Плита' | 'Полоса' | 'Труба' | 'Круг / пруток' | 'Квадрат' | 'Шестигранник' | 'Проволока' | 'Чушка / блок' | 'Втулка / заготовка'
export const productShapes: Record<string, Shape[]> = {
  med: ['Лист','Лента','Труба','Круг / пруток','Проволока'],
  latun: ['Лист','Лента','Труба','Круг / пруток','Проволока'],
  bronza: ['Круг / пруток','Квадрат','Шестигранник','Втулка / заготовка','Лента','Лист'],
  alyuminij: ['Лист','Плита','Труба','Круг / пруток','Проволока'],
  titan: ['Лист','Труба','Круг / пруток','Втулка / заготовка'],
  olovo: ['Чушка / блок','Круг / пруток'],
  svinec: ['Чушка / блок','Лист','Втулка / заготовка'],
  cink: ['Чушка / блок','Лист'],
  nihrom: ['Проволока','Лента','Круг / пруток'],
  babbit: ['Чушка / блок','Втулка / заготовка'],
  list: ['Лист','Лента'],
  truby: ['Труба'],
  'sortovoy-prokat': ['Круг / пруток','Квадрат','Шестигранник','Полоса'],
}

const shapeIds: Record<Shape, string> = {
  'Лист': 'sheet', 'Лента': 'strip', 'Плита': 'plate', 'Полоса': 'flat-bar',
  'Труба': 'tube', 'Круг / пруток': 'round', 'Квадрат': 'square',
  'Шестигранник': 'hexagon', 'Проволока': 'wire', 'Чушка / блок': 'ingot',
  'Втулка / заготовка': 'blank',
}
export const colorProductSlugs = new Set(['med','latun','bronza','alyuminij','titan','olovo','svinec','cink','nihrom','babbit'])
export function getProductShapeKinds(productSlug: string) {
  const values: Shape[] = productShapes[productSlug] || ['Круг / пруток']
  return values.map(value => ({ id: shapeIds[value], label: value, value }))
}
