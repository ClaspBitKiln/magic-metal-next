import { formatDimensionValue } from '@/lib/dimensionDisplay'
import type { SizeSeries } from '@/data/sizeSeriesTypes'
import type { ProductDimensionGuide } from '@/data/productDimensionGuides'
import { getCatalogStandardLinks } from '@/data/catalogStandards'
import './ProductSizeSeries.css'
import SizeTableFilter from './SizeTableFilter'
import CompactSizeRows from './CompactSizeRows'
import SheetFormatPicker from './SheetFormatPicker'
import GalvanizedRequestPicker from './GalvanizedRequestPicker'

const dimensionList = /^\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?)+$/
const numericWalls = /^(?:(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))(?:;\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\)))*|—)$/
const wallPairList = /^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?)*$/
const sectionExamples: Record<string, string[]> = {
  ugolok: ['25 × 25 / 3', '40 × 40 / 4', '50 × 50 / 5', '75 × 75 / 5'],
  shveller: ['10П', '12П', '16П', '20П'],
  'balka-dvutavrovaya': ['20Б1', '25Б1', '30Б1', '35Б1'],
  'krug-goryachekatanyj': ['12', '16', '20', '25', '30', '40'],
}
const quickSectionRows = (series: SizeSeries[]) => {
  const slug = series[0]?.productSlug || ''
  if (series[0]?.categorySlug !== 'sortovoy-i-fasonny-prokat') return []
  const labels = sectionExamples[slug] || []
  return labels.flatMap(label => series.flatMap(table => table.rows.flatMap(row => {
    const first = row[0]?.replace(/\\s+/g, ' ').trim() || ''
    const value = slug === 'ugolok' ? `${first} / ${row[1]}` : first
    return value === label ? [{ label: slug === 'ugolok' ? `${first} × ${row[1]} мм` : slug === 'krug-goryachekatanyj' ? `Ø ${first} мм` : first, row, standard: table.standard, title: table.title }] : []
  }))).filter((entry, index, arr) => arr.findIndex(other => other.label === entry.label) === index)
}

const tableLabel = (table: SizeSeries) => {
  const type = table.title.match(/тип\s+([А-ЯA-Z0-9]+)/iu)?.[1]
  if (type) return `Тип ${type}`
  if (table.title.includes('рулона')) return 'Рулон'
  if (table.title.startsWith('Номинальные размеры')) return 'Номинальные размеры'
  if (table.title.startsWith('Форматы')) return 'Форматы листа'
  return table.title
}

export default function ProductSizeSeries({ series, requestHref, guide }: { series: SizeSeries[]; requestHref: string; guide?: ProductDimensionGuide }) {
  if (!series.length && !guide) return null
  const formatIndex = series.findIndex(table => table.title.startsWith('Форматы'))
  const initiallyOpen = formatIndex < 0 ? 0 : formatIndex
  const hasTu = series.some(table => table.standard.startsWith('ТУ '))
  const standardKind = hasTu ? (series.every(table => table.standard.startsWith('ТУ ')) ? 'ТУ' : 'ГОСТ и ТУ') : 'ГОСТ'
  const hasRequirements = series.some(table => table.kind === 'requirements')
  const onlyRequirements = series.length > 0 && series.every(table => table.kind === 'requirements')
  const heading = onlyRequirements ? 'Нормативные параметры' : hasRequirements ? 'Размеры и параметры' : 'Размерный ряд'
  return <section className="product-size-series" id="sizes" aria-labelledby="size-series-title">
    <h2 id="size-series-title">{series.length ? `${heading} по ${standardKind}` : 'Размеры по спецификации'}</h2>
    <p className="size-series-intro">{onlyRequirements ? 'Сверьте форму поставки, числовые значения и условия применения. Укажите требования в заявке или приложите спецификацию.' : series.length ? 'Найдите нужное обозначение или выберите строку. Размеры и параметры попадут в заявку; спецификацию можно приложить файлом.' : 'Укажите размеры и требования к изделию или приложите чертёж. Проверим их по выбранному стандарту и техническим условиям.'}</p>
    {series.length > 0 && <p className="size-series-mobile-help">Широкие таблицы можно прокручивать вбок. Первый столбец и заголовки остаются видны.</p>}
    <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
    {quickSectionRows(series).length > 0 && <div className="size-series-quick-examples">
      <strong>Примеры типоразмеров по ГОСТ — сразу в заявку:</strong>
      <nav aria-label="Выбор распространённых типоразмеров">{quickSectionRows(series).map(({ label, row, standard, title }) => {
        const initial = new URL(requestHref, 'https://magicmet.ru').searchParams.get('product') || ''
        const detail = [initial, title, label, standard, row.length > 2 ? `другие параметры: ${row.slice(1).join(' × ')}` : ''].filter(Boolean).join('; ')
        return <a key={label} href={`/?product=${encodeURIComponent(detail)}#request`}>{label} ↗</a>
      })}</nav>
      <p>Это нормативные обозначения, а не сведения о наличии. Другой размер можно выбрать в таблице ниже или приложить спецификацию.</p>
    </div>}
    {series[0]?.categorySlug === 'listovoy-prokat' && series[0]?.productSlug === 'ocinkovannyj' && <GalvanizedRequestPicker requestHref={requestHref} />}
    {series.length > 1 && <nav className="size-series-nav" aria-label="Выбор размерной таблицы">
      {series.map((table, index) => <a key={`${table.standard}-${table.title}`} href={`#sizes-series-${index + 1}`}>{tableLabel(table)}</a>)}
    </nav>}
    {series.map((table, index) => {
      const numericColumns = table.columns.map((_, column) => column > 0 && table.rows.every((row) => /^(?:[−-]?\d+(?:[.,]\d+)?|—)$/.test(row[column])))
      const pipeTable = ['truby-elektrosvarnye', 'truby-besshovnye'].includes(table.categorySlug) || (table.categorySlug === 'nerzhaveyushchaya-stal' && table.productSlug === 'truby')
      const wallColumns = pipeTable && /диаметр|сечение/iu.test(table.columns[0]) ? table.columns.flatMap((label, column) => column > 0 && /стенк/iu.test(label) && table.rows.every(row => numericWalls.test(row[column])) ? [column] : []) : []
      const pipeChoice = wallColumns.length > 0 && ((/диаметр/iu.test(table.columns[0]) && table.rows.every(row => /^\d+(?:[.,]\d+)?$/u.test(row[0]))) || (/сечение/iu.test(table.columns[0]) && table.rows.every(row => /^\d+(?:[.,]\d+)?\s*×\s*\d+(?:[.,]\d+)?$/u.test(row[0].replace(/[()]/g, ''))))) && (table.rows.length > 24 || !/специальн/iu.test(table.title))
      const standardLinks = getCatalogStandardLinks(table.standard)
      const sheetFormats = table.categorySlug === 'listovoy-prokat' && ['goryachekatanyj', 'holodnokatanyj'].includes(table.productSlug) && table.title.startsWith('Форматы') && table.columns[0] === 'Толщина, мм'
      const sheetNominals = sheetFormats ? series.flatMap(seriesTable => seriesTable.title.startsWith('Номинальные размеры') ? seriesTable.rows.filter(row => row[0] === 'Толщина').flatMap(row => row[1].split(';').map(value => value.trim())) : []) : []
      return <details key={`${table.standard}-${table.title}`} open={index === initiallyOpen}>
        <summary><span className="size-series-heading"><span>{table.title}</span><span className="size-series-standard-label">{table.standard}</span></span></summary>
        {standardLinks.length > 0 && <p className="size-series-standard">{standardLinks.map(link => <a key={link.href} href={link.href} title={`Справочник: ${link.code}`}>{link.code}</a>)}</p>}
        <p className="size-series-scope" id={`sizes-series-${index + 1}`}>{table.scope}</p>
        {table.notes[0] && <p className="size-series-note size-series-legend">{table.notes[0]}</p>}
        {sheetFormats ? <SheetFormatPicker rows={table.rows} nominalThicknesses={sheetNominals} requestHref={requestHref} standard={table.standard} sheetKind={table.productSlug === 'holodnokatanyj' ? 'cold' : 'hot'} /> : pipeChoice ? <SizeTableFilter column={table.columns[0]} values={[...new Set(table.rows.map(row => row[0]))]} total={table.rows.length} wallColumns={wallColumns} requestHref={requestHref} context={`${table.title}; ${table.standard}`} standard={table.standard} /> : <CompactSizeRows column={table.columns[0]} values={table.rows.length > 24 ? [...new Set(table.rows.map(row => row[0]))] : []} total={table.rows.length} requestHref={requestHref} context={table.title} standard={table.standard} requirements={table.kind === 'requirements'} />}
        <div className="size-series-reference" id={`size-reference-${index + 1}`} hidden={sheetFormats}>
        <div className="size-series-scroll" role="region" aria-label={table.title} tabIndex={0}>
          <table className={table.kind === 'requirements' ? 'size-series-requirements' : undefined}>
            <caption>{table.title} — {table.standard}</caption>
            <thead><tr>{table.columns.map((column, columnIndex) => <th scope="col" key={column} className={numericColumns[columnIndex] ? 'size-series-number' : undefined}>{column}</th>)}</tr></thead>
            <tbody>{table.rows.map((row) => <tr key={row.join('|')}>{row.map((cell, column) => { const display = formatDimensionValue(cell); const source = display !== cell ? cell : undefined; return column === 0 ? <th scope="row" key={column} data-source-value={source}>{display}</th> : <td key={column} data-source-value={source} className={numericColumns[column] ? 'size-series-number' : dimensionList.test(cell) || wallPairList.test(cell) ? 'size-series-list' : undefined}>{display}</td> })}</tr>)}</tbody>
          </table>
        </div>
        {table.notes.slice(1).map((note) => <p className="size-series-note" key={note}>{note}</p>)}
        </div>
      </details>
    })}
    {guide && <div className="size-series-guide">
      <h3>{guide.title}</h3>
      <p className="size-series-note">{guide.standard}</p>
      <p className="size-series-legend">{guide.note}</p>
      <ul>{guide.parameters.map(parameter => <li key={parameter}>{parameter}</li>)}</ul>
      <a className="size-series-selection-request" href={requestHref}>Заявка по спецификации ↗</a>
    </div>}
  </section>
}
