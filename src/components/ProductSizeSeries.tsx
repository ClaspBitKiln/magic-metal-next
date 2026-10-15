import type { SizeSeries } from '@/data/sizeSeriesTypes'
import './ProductSizeSeries.css'

const dimensionList = /^\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?)+$/
const wallPairList = /^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?(?:;\s*\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?)*$/
const tableLabel = (table: SizeSeries) => {
  const type = table.title.match(/тип\s+([А-ЯA-Z0-9]+)/iu)?.[1]
  if (type) return `Тип ${type}`
  if (table.title.includes('рулона')) return 'Рулон'
  if (table.title.startsWith('Номинальные размеры')) return 'Номинальные размеры'
  if (table.title.startsWith('Форматы')) return 'Форматы листа'
  return table.title
}

export default function ProductSizeSeries({ series, requestHref }: { series: SizeSeries[]; requestHref: string }) {
  if (!series.length) return null
  return <section className="product-size-series" id="sizes" aria-labelledby="size-series-title">
    <h2 id="size-series-title">Размерный ряд по ГОСТ</h2>
    <p className="size-series-intro">Выберите стандарт и исполнение, затем нужный размер. Укажите их в заявке или приложите спецификацию.</p>
    <p className="size-series-mobile-help">Широкие таблицы можно прокручивать вбок. Первый столбец и заголовки остаются видны.</p>
    <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
    {series.length > 1 && <nav className="size-series-nav" aria-label="Выбор размерной таблицы">
      {series.map((table, index) => <a key={`${table.standard}-${table.title}`} href={`#sizes-series-${index + 1}`}>{tableLabel(table)}</a>)}
    </nav>}
    {series.map((table, index) => {
      const numericColumns = table.columns.map((_, column) => column > 0 && table.rows.every((row) => /^(?:[−-]?\d+(?:[.,]\d+)?|—)$/.test(row[column])))
      return <details key={`${table.standard}-${table.title}`} open={index === 0}>
        <summary><span className="size-series-heading"><span>{table.title}</span><span className="size-series-standard">{table.standard}</span></span></summary>
        <p className="size-series-scope" id={`sizes-series-${index + 1}`}>{table.scope}</p>
        {table.notes[0] && <p className="size-series-note size-series-legend">{table.notes[0]}</p>}
        <div className="size-series-scroll" role="region" aria-label={table.title} tabIndex={0}>
          <table>
            <caption>{table.title} — {table.standard}</caption>
            <thead><tr>{table.columns.map((column, columnIndex) => <th scope="col" key={column} className={numericColumns[columnIndex] ? 'size-series-number' : undefined}>{column}</th>)}</tr></thead>
            <tbody>{table.rows.map((row) => <tr key={row.join('|')}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column} className={numericColumns[column] ? 'size-series-number' : dimensionList.test(cell) || wallPairList.test(cell) ? 'size-series-list' : undefined}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {table.notes.slice(1).map((note) => <p className="size-series-note" key={note}>{note}</p>)}
      </details>
    })}
  </section>
}
