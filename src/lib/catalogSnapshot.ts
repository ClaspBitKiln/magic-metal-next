export type CatalogPriceRow = {
  id: string
  category: string
  product: string
  designation: string
  size: string
  standard: string
  diameter?: string
  wall?: string
  standardBasis?: 'reference'
  status: 'green'
  checkedAt: string
}

export type CatalogSnapshot = {
  snapshotDate: string
  statusRule: string
  rowCount: number
  rows: CatalogPriceRow[]
}

type CompactRow = [string, number, number, number, number, number, number, number, 0 | 1]
type CompactSnapshot = {
  version: 1
  snapshotDate: string
  statusRule: string
  rowCount: number
  strings: string[]
  rows: CompactRow[]
}

export function decodeCatalogSnapshot(input: unknown): CatalogSnapshot {
  if (!input || typeof input !== 'object') throw new Error('catalog snapshot is not an object')
  const source = input as Partial<CompactSnapshot> & Partial<CatalogSnapshot>

  // Backwards compatibility keeps preview and production deployments safe while
  // the compact data file and application code are switched atomically.
  if (Array.isArray(source.rows) && (!source.rows.length || !Array.isArray(source.rows[0]))) {
    if (source.rowCount !== source.rows.length) throw new Error('catalog rowCount mismatch')
    return source as CatalogSnapshot
  }

  if (source.version !== 1 || !Array.isArray(source.strings) || !Array.isArray(source.rows)) {
    throw new Error('unsupported catalog snapshot format')
  }
  if (source.rowCount !== source.rows.length) throw new Error('catalog rowCount mismatch')

  const strings = source.strings
  const value = (index: number) => index >= 0 && typeof strings[index] === 'string' ? strings[index] : ''
  const rows = (source.rows as CompactRow[]).map(([id, category, product, designation, size, standard, diameter, wall, basis]) => ({
    id,
    category: value(category),
    product: value(product),
    designation: value(designation),
    size: value(size),
    standard: value(standard),
    ...(diameter >= 0 ? { diameter: value(diameter) } : {}),
    ...(wall >= 0 ? { wall: value(wall) } : {}),
    ...(basis ? { standardBasis: 'reference' as const } : {}),
    status: 'green' as const,
    checkedAt: source.snapshotDate || '',
  }))

  if (rows.some((row) => !row.id || !row.category || !row.product || !row.size || !row.checkedAt)) {
    throw new Error('catalog snapshot contains an invalid row')
  }

  return {
    snapshotDate: source.snapshotDate || '',
    statusRule: source.statusRule || '',
    rowCount: rows.length,
    rows,
  }
}
