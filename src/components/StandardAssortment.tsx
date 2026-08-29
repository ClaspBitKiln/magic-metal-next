import { assortmentCheckedAt, expandAndSortAssortmentRows, marketSources, referenceSources, standardAssortments, type MarketSignal } from '@/data/standardAssortment'
import type { Standard } from '@/data/standards'

const signalCopy: Record<MarketSignal, string> = {
  green: 'На складе у поставщиков',
  yellow: 'Наличие уточняется',
  red: 'Под заказ',
}

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
      {(Object.keys(signalCopy) as MarketSignal[]).map((signal) => <span className={`signal-${signal}`} key={signal}><i />{signalCopy[signal]}</span>)}
    </div>
    {assortment ? <div className="assortment-table" role="table" aria-label={`Размерный ряд ${standard.code}`}>
      <div className="assortment-table-head" role="row"><span role="columnheader">{assortment.dimensionLabel}</span><span role="columnheader">Рыночный сигнал</span><span role="columnheader">Комментарий</span></div>
      {expandAndSortAssortmentRows(assortment.rows).map((row) => <div className={`assortment-row signal-${row.signal}`} role="row" key={row.size}>
        <strong role="cell">{row.size}</strong><span role="cell"><i />{signalCopy[row.signal]}</span><small role="cell">{row.note}</small>
      </div>)}
    </div> : <div className="assortment-empty">
      <b>{isDimensionalStandard ? 'Матрица размеров готовится к публикации' : 'Этот ГОСТ не задаёт самостоятельный размерный ряд'}</b>
      <span>{isDimensionalStandard ? 'Полный ряд будет показан после сверки таблиц стандарта и открытого предложения поставщиков.' : 'Размеры определяются связанным стандартом на сортамент, конструкцию изделия или спецификацией проекта.'}</span>
    </div>}
      <div className="assortment-method">
      <p>Зелёный — позиция опубликована минимум у трёх независимых поставщиков; жёлтый — у одного–двух; красный — открытое складское предложение не найдено, поставка рассчитывается под заказ. Остаток и срок всегда подтверждаются перед расчётом.</p>
      <div className="assortment-sources"><nav aria-label="Источники проверки наличия"><b>Наличие:</b>{marketSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.label}>{source.label}</a>)}</nav><nav aria-label="Источники сортамента и технических данных"><b>Сортамент:</b>{referenceSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.label}>{source.label}</a>)}</nav></div>
      </div>
      </div>
    </details>
  </section>
}
