import fs from 'node:fs'
import path from 'node:path'
import { getProductSizeSeries } from '../src/data/productSizeSeries'

// Review variants share one existing normative table; no stock or source URLs.
const table = getProductSizeSeries('truby-besshovnye', 'holodnodeformirovannye')[0]
if (!table || table.standard !== 'ГОСТ 8734-75') throw new Error('Review table changed: verify its scope before rebuilding')
const payload = {
  product: 'Трубы бесшовные холоднодеформированные',
  standard: table.standard,
  scope: table.scope,
  rows: table.rows,
  notes: table.notes,
}
fs.writeFileSync(path.join(process.cwd(), 'public/data/catalog-variant-pipes.json'), JSON.stringify(payload))
console.log(`Prepared review table: ${table.rows.length} diameters, existing source rows unchanged`)
