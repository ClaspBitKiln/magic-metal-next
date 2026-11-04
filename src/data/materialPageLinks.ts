/**
 * Lightweight browser-side index of real, existing material detail pages.
 * Never turn an unverified grade or material family into a fake detail link.
 * Keep synchronized with src/data/materials.ts (covered by a regression test).
 */
export const materialPageSlugs: Readonly<Record<string, string>> = {
  'Сталь 20': 'stal-20',
  '09Г2С': '09g2s',
  'Сталь 45': 'stal-45',
  '40Х': '40x',
  '30ХГСА': '30xgsa',
  '38ХН3МА': '38xn3ma',
  '65Г': '65g',
  'ШХ15': 'shx15',
  '12Х1МФ': '12x1mf',
  '15ХМ': '15xm',
  '08Х18Н10': '08x18n10',
  '12Х18Н10Т': '12x18n10t',
  '10Х17Н13М2Т': '10x17n13m2t',
  'AISI 304': 'aisi-304',
  'AISI 316L': 'aisi-316l',
  'AISI 321': 'aisi-321',
  'AISI 430': 'aisi-430',
  'М1': 'med-m1',
  'Л63': 'latun-l63',
  'ЛС59-1': 'latun-ls59-1',
  'БрАЖ9-4': 'bronza-brazh9-4',
  'АД31': 'alyuminij-ad31',
  'АМг6': 'alyuminij-amg6',
  'Д16': 'alyuminij-d16',
  'ВТ1-0': 'titan-vt1-0',
  'ВТ6': 'titan-vt6',
  'Медь': 'med',
  'Латунь': 'latun',
  'Бронза': 'bronza',
  'Алюминий': 'alyuminij',
  'Титан': 'titan',
}

export function getMaterialPageSlug(designation: string): string | undefined {
  const normalized = designation.trim().replace(/\\s+/gu, ' ')
  return materialPageSlugs[normalized]
    ?? (normalized.toLocaleLowerCase('ru').startsWith('сталь ')
      ? materialPageSlugs[normalized.slice(6)]
      : materialPageSlugs[`Сталь ${normalized}`])
}
