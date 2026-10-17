import fs from 'node:fs'
import { getProductSizeSeries } from '../src/data/productSizeSeries'

const table = getProductSizeSeries('truby-elektrosvarnye', 'profilnye').find(item => item.standard === 'ГОСТ 8645-68' && !item.title.includes('специальные'))
if (!table) throw new Error('Verified rectangular table not found')
fs.writeFileSync('public/data/catalog-design-profiles.json', JSON.stringify({ title: table.title, standard: table.standard, rows: table.rows, notes: table.notes }))
console.log(`Prepared ${table.rows.length} existing sections for design comparison`)
