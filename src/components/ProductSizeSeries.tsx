import type { SizeSeries } from '@/data/sizeSeriesTypes'
import './ProductSizeSeries.css'

export default function ProductSizeSeries({ series, requestHref }: { series: SizeSeries[]; requestHref: string }) {
  if (!series.length) return null
  return <section className="product-size-series" id="sizes" aria-labelledby="size-series-title">
    <h2 id="size-series-title">Размерный ряд по ГОСТ</h2>
    <p className="size-series-intro">Выберите стандарт и исполнение, затем нужный размер. Укажите их в заявке или приложите спецификацию.</p>
    <p className="size-series-mobile-help">Широкие таблицы можно прокручивать вбок. Первый столбец и заголовки остаются видны.</p>
    <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
    {series.map((table, index) => {
      const numericColumns = table.columns.map((_, column) => column > 0 && table.rows.every((row) => /^(?:[−-]?\d+(?:[.,]\d+)?|—)$/.test(row[column])))
      return <details key={`${table.standard}-${table.title}`} open={index === 0}>
      <summary>{table.title} · {table.standard}</summary>
      <p>{table.scope}</p>
      <div className="size-series-scroll" role="region" aria-label={table.title} tabIndex={0}>
        <table>
          <caption>{table.title} — {table.standard}</caption>
          <thead><tr>{table.columns.map((column, columnIndex) => <th scope="col" key={column} className={numericColumns[columnIndex] ? 'size-series-number' : undefined}>{column}</th>)}</tr></thead>
          <tbody>{table.rows.map((row) => <tr key={row.join('|')}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column} className={numericColumns[column] ? 'size-series-number' : undefined}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {table.notes.map((note) => <p className="size-series-note" key={note}>{note}</p>)}
    </details>
    })}
  </section>
}
