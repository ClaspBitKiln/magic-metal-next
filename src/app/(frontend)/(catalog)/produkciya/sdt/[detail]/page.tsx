import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findCatalogStandard as findStandard } from '@/data/catalogStandards'
import { getSdtCatalogItem, sdtCatalog } from '@/data/sdtCatalog'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import TechnicalCatalogSummary, { ProductDocumentRequest } from '@/components/TechnicalCatalogSummary'
import ProductSizeSeries from '@/components/ProductSizeSeries'
import { getDimensionGuide } from '@/data/dimensionGuides'
import { getProductSizeSeries } from '@/data/productSizeSeries'
import './sdt-detail.css'
import '@/components/ProductDocumentation.css'

export function generateStaticParams() {
  return sdtCatalog.map(({ slug }) => ({ detail: slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ detail: string }> }): Promise<Metadata> {
  const item = getSdtCatalogItem((await params).detail)
  if (!item) return {}
  return {
    title: item.metaTitle,
    description: item.description,
    alternates: { canonical: `/produkciya/sdt/${item.slug}` },
    openGraph: { title: item.metaTitle, description: item.description },
  }
}

export default async function SdtDetailPage({ params }: { params: Promise<{ detail: string }> }) {
  const item = getSdtCatalogItem((await params).detail)
  if (!item) notFound()
  const requestHref = `/?product=${encodeURIComponent(item.title)}#request`
  const sizeSeries = getProductSizeSeries('sdt', item.slug)
  const dimensionGuide = getDimensionGuide('sdt', item.slug)
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: item.title, description: item.description,
    category: 'Соединительные детали трубопроводов', brand: { '@type': 'Brand', name: 'Мэджик Металл' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Исполнение', value: item.execution.join('; ') },
      { '@type': 'PropertyValue', name: 'Материалы', value: item.materials.join('; ') },
      { '@type': 'PropertyValue', name: 'Стандарты', value: item.standards.join('; ') },
    ],
  }
  return (
    <main className="sdt-detail product-document">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <header className="sdt-nav product-document-header"><Link prefetch={false} className="product-document-brand" href="/" aria-label="Мэджик Металл"><img src="/images/logo.png?v=20261006-3" width={74} height={51} alt="" /></Link><nav className="product-document-header-links" aria-label="Основная навигация"><Link href="/produkciya/sdt">Каталог</Link><Link prefetch={false} href="/spravochnik-materialov">Марки металлов</Link><Link prefetch={false} href="/#contacts">Контакты</Link></nav><LanguageSwitcher /><a className="product-document-header-action" href={requestHref}>Отправить заявку ↗</a></header>
      <nav className="sdt-breadcrumb" aria-label="Хлебные крошки"><Link prefetch={false} href="/">Главная</Link><b>/</b><Link href="/produkciya/sdt">СДТ</Link><b>/</b><span>{item.shortTitle}</span></nav>
      <section className="sdt-hero"><div><p>Соединительные детали трубопроводов</p><h1>{item.title}</h1><span>{item.description}</span></div></section>
      <div className="product-document-workspace product-size-series">
        <div className="product-document-stage">
      <aside className="product-document-selection" aria-label="Подбор и заявка">
            <ProductDocumentRequest requestHref={requestHref} fields={item.requestFields} hasSizeReference={sizeSeries.length > 0 || Boolean(dimensionGuide)} />
          </aside>
      <TechnicalCatalogSummary
        title={item.shortTitle}
        materialLabel="Материалы"
        materialValues={item.materials}
        rows={[
          { label: 'Исполнения', values: item.execution },
          { label: 'Размерный охват', values: item.range, note: 'Диапазоны приведены для первичного поиска. Производимость и соответствие проекту подтверждаются до предложения.' },
        ]}
        standards={item.standards}
        requestHref={requestHref}
        hasSizeReference={sizeSeries.length > 0 || Boolean(dimensionGuide)}
        imageSrc={`/product/sdt/${item.slug}.svg`}
        imageAlt={item.shortTitle}
      />
        </div>
      <nav className="product-document-nav" aria-label="Разделы карточки">
        {(sizeSeries.length > 0 || Boolean(dimensionGuide)) && <a href="#sizes">Размеры и подбор</a>}
        <a href="#technical-reference">Применение и документы</a>
        <a href="#related-products">Другие позиции</a>
      </nav>
      <ProductSizeSeries series={sizeSeries} guide={dimensionGuide} requestHref={requestHref} documentation />
      </div>
      <details className="product-document-reference" id="technical-reference">
        <summary>Документы, требования к заявке и подбор по проекту</summary>
      <section className="sdt-standards"><div><p>Документы</p><h2>Стандарты</h2></div><div>{item.standards.map((value) => { const standard = findStandard(value); return standard ? <Link prefetch={false} href={`/spravochnik-gost/${standard.slug}`} key={value}><span className="standard-code">{value}</span><small>{standard.status}</small><b>↗</b></Link> : <div key={value}><span className="standard-code">{value}</span></div> })}</div></section>
        <section className="product-document-reference-section"><h2>Что указать в заявке</h2><ol>{item.requestFields.map(value => <li key={value}>{value}</li>)}</ol></section>
        <section className="product-document-reference-section"><h2>Подбор по проекту и спецификации</h2><p>{item.intro}</p></section>
      </details>
      <section className="sdt-more" id="related-products"><p>Другие соединительные детали</p><div>{sdtCatalog.filter(({ slug }) => slug !== item.slug).slice(0, 4).map(related => <Link href={`/produkciya/sdt/${related.slug}`} key={related.slug}>{related.shortTitle}<b>↗</b></Link>)}</div></section>
      <section className="product-document-conversion"><div><h2>Есть готовая спецификация?</h2><p>Пришлите спецификацию, чертёж или фото маркировки.</p></div><a href={requestHref}>Отправить заявку ↗</a></section>
    </main>
  )
}

