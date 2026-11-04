import Link from 'next/link'
import { findCatalogStandard } from '@/data/catalogStandards'
import { getMaterialPageSlug } from '@/data/materialPageLinks'

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
  // Use the same verified catalog facts in the concise first-screen tiles and full technical reference.
  // Long or uncertain ranges remain textual; this is not a stock/availability selector.
  const highlights = [
    ...rows.slice(0, 3).map(row => ({ label: row.label, value: row.values.join(' · ') })),
    ...(standards.length ? [{ label: 'ГОСТ / ТУ', value: standards[0] }] : []),
  ].slice(0, 4)
  return <section className="technical-catalog-summary" aria-labelledby="technical-catalog-summary-heading">
    <div className="technical-catalog-summary-heading">
      <div><p className="technical-catalog-eyebrow">Техническая сводка</p><h2 id="technical-catalog-summary-heading">{title}: основные параметры</h2></div>
      <a href={requestHref}>В заявку ↗</a>
    </div>
    <div className="product-document-highlights" aria-label="Ключевые характеристики товара">
      {highlights.map(({ label, value }) => <div className="product-document-highlight" key={label}>
        <span>{label}</span><strong>{value}</strong>
      </div>)}
    </div>
    <h3 className="product-document-properties-title">Основные характеристики</h3>
    <div className={hasProductImage ? "product-document-summary-body" : "product-document-summary-body product-document-summary-no-image"}>
    {hasProductImage && <figure className="product-document-image">
      {/* Show only supplied raster product imagery; category SVG illustrations are not product photos. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={imageAlt || title} width={240} height={180} />
    </figure>}
    <dl>
      <div><dt>{materialLabel}</dt><dd>{materialValues.map(value => {
        const slug = getMaterialPageSlug(value)
        return <span key={value}>{slug ? <Link prefetch={false} href={`/spravochnik-materialov/${slug}`}>{value}</Link> : value}</span>
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
