import type { SizeSeries } from '@/data/sizeSeriesTypes'
import type { ProductDimensionGuide } from '@/data/productDimensionGuides'
import './ProductSizeSeries.css'
import SizeTableFilter from './SizeTableFilter'

const dimensionList = /^\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?)+$/
const numericWalls = /^(?:(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))(?:;\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\)))*|—)$/
const wallPairList = /^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?)*$/
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
    <p className="size-series-intro">{onlyRequirements ? 'Сверьте форму поставки, числовые значения и условия применения. Укажите требования в заявке или приложите спецификацию.' : series.length ? 'Выберите исполнение и нужный размер. В длинных таблицах можно оставить строки одного размера. Укажите требования в заявке или приложите спецификацию.' : 'Укажите размеры и требования к изделию или приложите чертёж. Проверим их по выбранному стандарту и техническим условиям.'}</p>
    {series.length > 0 && <p className="size-series-mobile-help">Широкие таблицы можно прокручивать вбок. Первый столбец и заголовки остаются видны.</p>}
    <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
    {series.length > 1 && <nav className="size-series-nav" aria-label="Выбор размерной таблицы">
      {series.map((table, index) => <a key={`${table.standard}-${table.title}`} href={`#sizes-series-${index + 1}`}>{tableLabel(table)}</a>)}
    </nav>}
    {series.map((table, index) => {
      const numericColumns = table.columns.map((_, column) => column > 0 && table.rows.every((row) => /^(?:[−-]?\d+(?:[.,]\d+)?|—)$/.test(row[column])))
      const pipeTable = ['truby-elektrosvarnye', 'truby-besshovnye'].includes(table.categorySlug) || (table.categorySlug === 'nerzhaveyushchaya-stal' && table.productSlug === 'truby')
      const wallColumns = pipeTable && /диаметр|сечение/iu.test(table.columns[0]) ? table.columns.flatMap((label, column) => column > 0 && /стенк/iu.test(label) && table.rows.every(row => numericWalls.test(row[column])) ? [column] : []) : []
      return <details key={`${table.standard}-${table.title}`} open={index === initiallyOpen}>
        <summary><span className="size-series-heading"><span>{table.title}</span><span className="size-series-standard">{table.standard}</span></span></summary>
        <p className="size-series-scope" id={`sizes-series-${index + 1}`}>{table.scope}</p>
        {table.notes[0] && <p className="size-series-note size-series-legend">{table.notes[0]}</p>}
        {(table.rows.length > 24 || (wallColumns.length > 0 && /сечение/iu.test(table.columns[0]) && !/специальн/iu.test(table.title))) && <SizeTableFilter column={table.columns[0]} values={[...new Set(table.rows.map(row => row[0]))]} total={table.rows.length} wallColumns={wallColumns} requestHref={requestHref} context={`${table.title}; ${table.standard}`} standard={table.standard} />}
        <div className="size-series-reference" id={`size-reference-${index + 1}`}>
        <div className="size-series-scroll" role="region" aria-label={table.title} tabIndex={0}>
          <table className={table.kind === 'requirements' ? 'size-series-requirements' : undefined}>
            <caption>{table.title} — {table.standard}</caption>
            <thead><tr>{table.columns.map((column, columnIndex) => <th scope="col" key={column} className={numericColumns[columnIndex] ? 'size-series-number' : undefined}>{column}</th>)}</tr></thead>
            <tbody>{table.rows.map((row) => <tr key={row.join('|')}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column} className={numericColumns[column] ? 'size-series-number' : dimensionList.test(cell) || wallPairList.test(cell) ? 'size-series-list' : undefined}>{cell}</td>)}</tr>)}</tbody>
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
    </div>}
  </section>
}
