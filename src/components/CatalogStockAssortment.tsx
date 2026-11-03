import { formatDimensionValue, formatDimensionDesignation } from '@/lib/dimensionDisplay'
import { catalogStockRequestHref, getCatalogStockAssortment } from '@/data/catalogStockAssortment.server'

export default function CatalogStockAssortment({ categorySlug, slug, title, documentation = false }: { categorySlug: string; slug: string; title: string; documentation?: boolean }) {
  const rows = getCatalogStockAssortment(categorySlug, slug)
  if (!rows.length) return null
  const content = <section className="product-size-series" id="stock-assortment" aria-labelledby="stock-assortment-title">
    <h2 id="stock-assortment-title">Позиции складского ассортимента</h2>
    <p className="size-series-intro">Стандартный складской ассортимент. Доступное количество, состояние и срок поставки подтвердим по заявке.</p>
    <p>Выберите позицию: её обозначение, исполнение и единица учёта попадут в заявку.</p>
    <div className="size-series-scroll" tabIndex={0} role="region" aria-label={`Складской ассортимент: ${title}`}>
      <table className="size-series-generic-list">
        <caption>{title}: {rows.length} позиций</caption>
        <thead><tr><th scope="col">Размер и обозначение</th><th scope="col">Вид и исполнение</th><th scope="col">Выбрать</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <th scope="row">{row.dimensionLabel || 'Размерное обозначение'}: {formatDimensionValue(row.sizeDesignation) || 'по спецификации'}</th>
          <td>{row.group}<br />{row.description && <>{row.nameFieldLabel ? `${row.nameFieldLabel}: ` : ''}{formatDimensionDesignation(row.description)}<br /></>}<small>Единица учёта: {row.unit}</small></td>
          <td><a href={catalogStockRequestHref(row, title)} aria-label={`Запросить: ${row.group}, ${formatDimensionDesignation(row.description)}, ${formatDimensionValue(row.sizeDesignation)}`}>В заявку →</a></td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
  return documentation
    ? <details className="product-document-stock"><summary>Складской ассортимент: {rows.length} позиций</summary>{content}</details>
    : content
}

