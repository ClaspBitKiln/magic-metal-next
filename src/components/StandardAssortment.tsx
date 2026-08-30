import { assortmentCheckedAt, availabilityLabels, expandAndSortAssortmentRows, marketSources, referenceSources, standardAssortments, type MarketSignal } from '@/data/standardAssortment'
import type { Standard } from '@/data/standards'

export default function StandardAssortment({ standard }: { standard: Standard }) {
  const assortment = standardAssortments[standard.slug]
  const isDimensionalStandard = /сортамент|конструкция|размер/i.test(`${standard.title} ${standard.summary}`)

  return <section className="standard-assortment" aria-labelledby="standard-assortment-title">
    <details>
      <summary className="standard-assortment-heading">
        <div><p>Справочник по размерам</p><h2 id="standard-assortment-title">Размерный ряд и доступность</h2></div>
        <span><small>Проверено: {assortmentCheckedAt}</small><b aria-hidden="true" /></span>
      </summary>
      <div className="standard-assortment-content">
      <div className="assortment-legend" aria-label="Шкала доступности">
      {(Object.keys(availabilityLabels) as MarketSignal[]).map((signal) => <span className={`signal-${signal}`} key={signal}><i />{availabilityLabels[signal]}</span>)}
    </div>
    {assortment ? <div className="assortment-table" role="table" aria-label={`Размерный ряд ${standard.code}`}>
      <div className="assortment-table-head" role="row"><span role="columnheader">{assortment.dimensionLabel}</span><span role="columnheader">Рыночный сигнал</span><span role="columnheader">Комментарий</span></div>
      {expandAndSortAssortmentRows(assortment.rows).map((row) => <div className={`assortment-row signal-${row.signal}`} role="row" key={row.size}>
        <strong role="cell">{row.size}</strong><span role="cell"><i />{availabilityLabels[row.signal]}</span><small role="cell">{row.note}</small>
      </div>)}
    </div> : <div className="assortment-empty">
      <b>{isDimensionalStandard ? 'Матрица размеров готовится к публикации' : 'Этот ГОСТ не задаёт самостоятельный размерный ряд'}</b>
      <span>{isDimensionalStandard ? 'Полный ряд будет показан после сверки таблиц стандарта и открытого предложения поставщиков.' : 'Размеры определяются связанным стандартом на сортамент, конструкцию изделия или спецификацией проекта.'}</span>
    </div>}
      <div className="assortment-method">
      <p>Это зафиксированный снимок открытого наличия на 30 августа 2026 года, а не текущий онлайн-остаток. Основа — полный размерный ряд соответствующего ГОСТ. Сначала проверяется совокупное наличие МЕТАЛЛСЕРВИС на складах Москвы и Московской области, затем другие поставщики Москвы и Московской области. Если позиция найдена только в другом регионе России, регион указывается в комментарии и ставится «Наличие уточняется». «Под заказ» ставится, только когда открытое наличие не найдено ни в Москве и Московской области, ни в других регионах. Перед расчётом остаток и срок подтверждаются повторно.</p>
      <div className="assortment-sources"><nav aria-label="Источники проверки наличия"><b>Наличие:</b>{marketSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.label}>{source.label}</a>)}</nav><nav aria-label="Источники сортамента и технических данных"><b>Сортамент:</b>{referenceSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.label}>{source.label}</a>)}</nav></div>
      </div>
      </div>
    </details>
  </section>
}
