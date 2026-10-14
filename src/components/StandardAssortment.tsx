import { productSizeSeries } from '@/data/productSizeSeries'
import type { Standard } from '@/data/standards'
import ProductSizeSeries from './ProductSizeSeries'

export default function StandardAssortment({ standard }: { standard: Standard }) {
  const series = productSizeSeries.filter((table) => table.standard === standard.code)
  const requestHref = `/?standard=${encodeURIComponent(standard.code)}#request`

  if (series.length) return <ProductSizeSeries series={series} requestHref={requestHref} />

  const isDimensionalStandard = /сортамент|конструкция|размер/i.test(`${standard.title} ${standard.summary}`)

  return <section className="standard-assortment" aria-labelledby="standard-assortment-title">
    <div className="standard-assortment-heading">
      <div><p>Справочник по размерам</p><h2 id="standard-assortment-title">Размеры по спецификации</h2></div>
    </div>
    <div className="standard-assortment-content">
      <div className="assortment-empty">
        <b>Укажите изделие, размер и исполнение</b>
        <span>{isDimensionalStandard
          ? 'Пришлите спецификацию или чертёж. Проверим размеры и применимость стандарта для выбранного изделия.'
          : 'Размеры определяют по стандарту на сортамент конкретного изделия. Пришлите спецификацию — проверим размер, исполнение и технические требования.'}</span>
        <a href={requestHref}>Отправить заявку ↗</a>
      </div>
    </div>
  </section>
}
