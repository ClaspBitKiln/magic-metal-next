import { assortmentCheckedAt, availabilityLabels, expandAndSortAssortmentRows, standardAssortments, type MarketSignal } from '@/data/standardAssortment'
import type { Standard } from '@/data/standards'

export default function StandardAssortment({ standard }: { standard: Standard }) {
  const assortment = standardAssortments[standard.slug]
  const isDimensionalStandard = /сортамент|конструкция|размер/i.test(`${standard.title} ${standard.summary}`)

  return <section className="standard-assortment" aria-labelledby="standard-assortment-title">
    <details>
      <summary className="standard-assortment-heading">
        <div><p>Справочник по размерам</p><h2 id="standard-assortment-title">Размерный ряд и доступность</h2></div>
        <span><small>Снимок наличия: {assortmentCheckedAt}</small><b aria-hidden="true" /></span>
      </summary>
      <div className="standard-assortment-content">
      <div className="assortment-legend" aria-label="Шкала доступности">
      {(Object.keys(availabilityLabels) as MarketSignal[]).map((signal) => <span className={`signal-${signal}`} key={signal}><i />{availabilityLabels[signal]}</span>)}
    </div>
    {assortment ? <div className="assortment-table" role="table" aria-label={`Размерный ряд ${standard.code}`}>
      <div className="assortment-table-head" role="row"><span role="columnheader">{assortment.dimensionLabel}</span><span role="columnheader">Наличие</span></div>
      {expandAndSortAssortmentRows(assortment.rows).map((row) => <div className={`assortment-row signal-${row.signal}`} role="row" key={row.size}>
        <strong role="cell">{row.size}</strong><span role="cell"><i />{availabilityLabels[row.signal]}</span>
      </div>)}
    </div> : <div className="assortment-empty">
      <b>{isDimensionalStandard ? 'Матрица размеров готовится к публикации' : 'Этот ГОСТ не задаёт самостоятельный размерный ряд'}</b>
      <span>{isDimensionalStandard ? 'Полный ряд будет показан после сверки таблиц стандарта и открытого предложения поставщиков.' : 'Размеры определяются связанным стандартом на сортамент, конструкцию изделия или спецификацией проекта.'}</span>
    </div>}
      </div>
    </details>
  </section>
}
