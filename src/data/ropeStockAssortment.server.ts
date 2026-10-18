import { formatDimensionValue } from '@/lib/dimensionDisplay'

// Imported only by the server-rendered product detail page. This small set is
// separate from the normative tables and the complete stock dataset.
// Verified source: metizy.xls, A160:D168; B161 has no dimension name or unit.
// A165:D165 is a merged continuation, not an additional stock position.
export const ropeStockAssortment = [
  { id: '78869574865bf7a22068', sizeDesignation: '13', description: 'ГОСТ 2688-80', unit: 'м' },
  { id: '8c6b132596af8dcb6999', sizeDesignation: '24', description: 'ГОСТ 2688-80', unit: 'м' },
  { id: '7925dd2624f94f261e00', sizeDesignation: '2', description: 'ГОСТ 3063-80 полимерн. покр 2/3 уценка', unit: 'м' },
  { id: 'c6cbb8e7641acf120d8c', sizeDesignation: '15', description: 'ГОСТ 7668-80', unit: 'м' },
  { id: '8015de5e629d65be1a22', sizeDesignation: '18', description: 'ГОСТ 7668-80', unit: 'м' },
  { id: '4dbfca1ee34c02330351', sizeDesignation: '20', description: 'ГОСТ 7668-80', unit: 'м' },
] as const

export const ropeStockRequestHref = (row: typeof ropeStockAssortment[number]) =>
  `/?product=${encodeURIComponent(`Канаты; ${row.description}; размерное обозначение ${formatDimensionValue(row.sizeDesignation)}; единица учёта ${row.unit}`)}#request`
