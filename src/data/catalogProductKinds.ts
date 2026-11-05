// Navigation to kinds already supported by the existing product pickers.
// These links do not create catalog positions or imply availability.
import { colorProductSlugs, getProductShapeKinds } from './nonferrousShapes'
export type CatalogProductKind = { id: string; label: string; value: string }

export const fastenerKinds: CatalogProductKind[] = [
  { id: 'nut', label: 'Гайки', value: 'Гайка' },
  { id: 'bolt', label: 'Болты', value: 'Болт' },
  { id: 'stud', label: 'Шпильки', value: 'Шпилька' },
  { id: 'washer', label: 'Шайбы', value: 'Шайба' },
]
export const weldingKinds: CatalogProductKind[] = [
  { id: 'solid-wire', label: 'Проволока сплошная', value: 'Проволока сплошная' },
  { id: 'flux-cored-wire', label: 'Проволока порошковая', value: 'Проволока порошковая' },
  { id: 'covered-electrode', label: 'Электроды покрытые', value: 'Электрод покрытый' },
  { id: 'filler-rod', label: 'Присадочные прутки', value: 'Присадочный пруток' },
]
export const meshKinds: CatalogProductKind[] = [
  { id: 'welded', label: 'Сварная', value: 'Сварная' },
  { id: 'woven', label: 'Тканая', value: 'Тканая' },
  { id: 'chain-link', label: 'Плетёная (рабица)', value: 'Плетёная' },
]
export function getCatalogProductKinds(href: string): CatalogProductKind[] {
  const path = href.split(/[?#]/)[0]
  if (path === '/produkciya/metizy-i-svarochnye-materialy/krepezh') return fastenerKinds
  if (path === '/produkciya/metizy-i-svarochnye-materialy/svarochnye-materialy') return weldingKinds
  if (path === '/produkciya/metizy-i-svarochnye-materialy/setki') return meshKinds
  const colorSlug = path.match(/^\/produkciya\/cvetnye-metally\/([^/]+)$/)?.[1]
  if (colorSlug && colorProductSlugs.has(colorSlug)) return getProductShapeKinds(colorSlug)
  return []
}
export function getCatalogKindHref(href: string, id: string): string {
  const path = href.split(/[?#]/)[0]
  return getCatalogProductKinds(path).some(kind => kind.id === id)
    ? `${path}?kind=${encodeURIComponent(id)}#selection`
    : href
}
export function getCatalogKindRequestHref(requestHref: string, value: string): string {
  const url = new URL(requestHref, 'https://magicmet.ru')
  const product = url.searchParams.get('product') || ''
  url.searchParams.set('product', [product, value, 'размеры уточнить'].filter(Boolean).join('; '))
  url.hash = 'request'
  return url.pathname + url.search + url.hash
}
