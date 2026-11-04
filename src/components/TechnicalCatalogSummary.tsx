import Link from 'next/link'
import { findCatalogStandard } from '@/data/catalogStandards'
import { materials } from '@/data/materials'

const materialKey = (value: string) => value.toLocaleLowerCase('ru').replace(/^сталь\s*/u, '').replace(/\s+/gu, '')
const materialByName = new Map(materials.map(material => [materialKey(material.designation), material]))

export default function TechnicalCatalogSummary({ title, rows, materialLabel, materialValues, standards, requestHref, hasSizeReference, imageSrc, imageAlt }: {
  title: string
  rows: { label: string; values: string[]; note?: string }[]
  materialLabel: string
  materialValues: string[]
  standards: string[]
  requestHref: string
  hasSizeReference: boolean
  imageSrc?: string
  imageAlt?: string
}) {
  const hasProductImage = Boolean(imageSrc && /\.(?:avif|webp|png|jpe?g)(?:\?.*)?$/i.test(imageSrc))
  return <section className="technical-catalog-summary" aria-labelledby="technical-catalog-summary-heading">
    <div className="technical-catalog-summary-heading">
      <div><p className="technical-catalog-eyebrow">Техническая сводка</p><h2 id="technical-catalog-summary-heading">{title}: основные параметры</h2></div>
      <a href={requestHref}>В заявку ↗</a>
    </div>
    <div className={hasProductImage ? "product-document-summary-body" : "product-document-summary-body product-document-summary-no-image"}>
    {hasProductImage && <figure className="product-document-image">
      {/* Show only supplied raster product imagery; category SVG illustrations are not product photos. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={imageAlt || title} width={240} height={180} />
    </figure>}
    <dl>
      <div><dt>{materialLabel}</dt><dd>{materialValues.map(value => {
        const material = materialByName.get(materialKey(value))
        return <span key={value}>{material ? <Link prefetch={false} href={`/spravochnik-materialov/${material.slug}`}>{value}</Link> : value}</span>
      })}</dd></div>
      {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.values.map(value => <span key={value}>{value}</span>)}{row.note && <small>{row.note}</small>}</dd></div>)}
      {standards.length > 0 && <div><dt>ГОСТ / ТУ</dt><dd>{standards.map(value => {
        const standard = findCatalogStandard(value)
        return <span key={value}>{standard ? <Link prefetch={false} href={`/spravochnik-gost/${standard.slug}`} title={standard.status}>{value}</Link> : value}</span>
      })}</dd></div>}
    </dl>
    </div>
    <p className="technical-catalog-disclaimer">Материал, размер, исполнение и применимость стандарта проверяем для конкретного изделия; перечень не подтверждает наличие.</p>
    {hasSizeReference
      ? <a className="technical-catalog-size-link" href="#sizes">Размеры и подбор ↓</a>
      : <a className="technical-catalog-size-link" href={requestHref}>Указать размер в заявке ↗</a>}
  </section>
}

export function ProductDocumentRequest({ requestHref, fields, hasSizeReference }: { requestHref: string; fields: string[]; hasSizeReference: boolean }) {
  return <section className="product-document-native-request" aria-labelledby="product-document-request-title">
    <h2 id="product-document-request-title">Подобрать и рассчитать</h2>
    <p>Передайте известные параметры или приложите спецификацию.</p>
    <ul>{fields.slice(0, 3).map(field => <li key={field}>{field}</li>)}</ul>
    <a className="product-document-request-action" href={requestHref}>Отправить заявку ↗</a>
    {hasSizeReference && <a className="product-document-selection-link" href="#sizes">Выбрать размер ниже ↓</a>}
    <small>Материал, исполнение и наличие уточняются по заявке.</small>
  </section>
}
