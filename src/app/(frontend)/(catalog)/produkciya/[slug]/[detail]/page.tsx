import { formatDimensionValue } from '@/lib/dimensionDisplay'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findCatalogStandard as findStandard } from '@/data/catalogStandards'
import { getPipeCatalogItem, getPipeItemsByCategory, pipeCatalog } from '@/data/pipeCatalog'
import { getProductDetailItem, getProductDetailsByCategory, productDetailCatalog, type ProductDetailItem } from '@/data/productDetailCatalog'
import { getSeoCategory } from '@/data/seoCatalog'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import TechnicalCatalogSummary, { ProductDocumentRequest } from '@/components/TechnicalCatalogSummary'
import CatalogStockAssortment from '@/components/CatalogStockAssortment'
import ProductSizeSeries from '@/components/ProductSizeSeries'
import MeshRopeRequestPicker from '@/components/MeshRopeRequestPicker'
import RopeSalesPicker from '@/components/RopeSalesPicker'
import SpecialProcurementPicker from '@/components/SpecialProcurementPicker'
import NonferrousRequestPicker from '@/components/NonferrousRequestPicker'
import { getProductSizeSeries } from '@/data/productSizeSeries'
import { getDimensionGuide } from '@/data/dimensionGuides'
import { ropeSalesAssortment, ropeSalesConstructions, ropeSalesDiameterGroups, ropeSalesRequestHref } from '@/data/ropeSalesAssortment'
import './pipe-detail.css'
import '@/components/ProductDocumentation.css'

export const dynamicParams = false

const profileSizePages: Record<string, string[]> = {
  'krug-i-kvadrat': ['krug-goryachekatanyj', 'kvadrat'],
  'balka-shveller-ugolok': ['balka-dvutavrovaya', 'shveller', 'ugolok'],
}

export function generateStaticParams() {
  return [...pipeCatalog, ...productDetailCatalog].map(({ categorySlug, slug }) => ({ slug: categorySlug, detail: slug }))
}

function getDetailItem(categorySlug: string, detailSlug: string): ProductDetailItem | undefined {
  const pipe = getPipeCatalogItem(categorySlug, detailSlug)
  if (pipe) return { ...pipe, image: `/product/pipes/${pipe.imageKind}.svg` }
  return getProductDetailItem(categorySlug, detailSlug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; detail: string }> }): Promise<Metadata> {
  const { slug, detail } = await params
  const item = getDetailItem(slug, detail)
  if (!item) return {}
  return {
    title: item.metaTitle, description: item.description,
    alternates: { canonical: `/produkciya/${item.categorySlug}/${item.slug}` },
    openGraph: { title: item.metaTitle, description: item.description },
  }
}

export default async function PipeDetailPage({ params }: { params: Promise<{ slug: string; detail: string }> }) {
  const { slug, detail } = await params
  const item = getDetailItem(slug, detail)
  if (!item) notFound()
  const siblings = [...getPipeItemsByCategory(item.categorySlug).map((pipe) => ({ ...pipe, image: `/product/pipes/${pipe.imageKind}.svg` })), ...getProductDetailsByCategory(item.categorySlug)]
  const categoryLabel = getSeoCategory(item.categorySlug)?.title || 'Продукция'
  const requestHref = `/?product=${encodeURIComponent(item.title)}#request`
  const sizeSeries = getProductSizeSeries(item.categorySlug, item.slug)
  const dimensionGuide = getDimensionGuide(item.categorySlug, item.slug)
  const hasSizeReference = sizeSeries.length > 0 || Boolean(dimensionGuide)
  const hasSeriesSelection = (item.categorySlug === 'sortovoy-i-fasonny-prokat' && item.slug === 'ugolok') || (item.categorySlug === 'metizy-i-svarochnye-materialy' && item.slug === 'krepezh') || (item.categorySlug === 'listovoy-prokat' && item.slug === 'ocinkovannyj')
  const hasStandaloneSelection = ['cvetnye-metally', 'nerzhaveyushchaya-stal'].includes(item.categorySlug) || (item.categorySlug === 'metizy-i-svarochnye-materialy' && ['kanaty', 'lenta-upakovochnaya', 'svarochnye-materialy', 'setki'].includes(item.slug)) || (item.categorySlug === 'pokovki-i-zagotovki' && item.slug === 'po-chertezhu')
  const sizeProfiles = item.categorySlug === 'sortovoy-i-fasonny-prokat'
    ? (profileSizePages[item.slug] || []).flatMap((profileSlug) => {
      const profile = getProductDetailItem(item.categorySlug, profileSlug)
      return profile ? [profile] : []
    })
    : []
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: item.title, description: item.description,
    category: categoryLabel, brand: { '@type': 'Brand', name: 'Мэджик Металл' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Стандарты', value: item.standards.join('; ') },
      { '@type': 'PropertyValue', name: 'Материалы', value: item.grades.join('; ') },
    ],
  }
  return <main className="pipe-detail product-document">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <header className="pipe-nav product-document-header"><Link prefetch={false} className="product-document-brand" href="/" aria-label="Мэджик Металл"><img src="/images/logo.png?v=20261006-3" width={74} height={51} alt="" /></Link><nav className="product-document-header-links" aria-label="Основная навигация"><Link href={`/produkciya/${item.categorySlug}`}>Каталог</Link><Link prefetch={false} href="/spravochnik-materialov">Марки металлов</Link><Link prefetch={false} href="/#contacts">Контакты</Link></nav><LanguageSwitcher /><a className="product-document-header-action" href={requestHref}>Отправить заявку ↗</a></header>
    <nav className="pipe-breadcrumb" aria-label="Хлебные крошки"><Link prefetch={false} href="/">Главная</Link><b>/</b><Link href={`/produkciya/${item.categorySlug}`}>{categoryLabel}</Link><b>/</b><span>{item.shortTitle}</span></nav>
    <section className="pipe-hero"><div><p>{categoryLabel}</p><h1>{item.title}</h1><span>{item.description}</span></div></section>
    <div className="product-document-workspace product-size-series">
      <div className="product-document-stage">
    <TechnicalCatalogSummary
      title={item.shortTitle}
      materialLabel={item.slug === 'kanaty' ? 'Группа / исполнение' : item.categorySlug === 'sortovoy-i-fasonny-prokat' && ['shestigrannik', 'shveller-gnutyj'].includes(item.slug) ? 'Материал / исполнение' : 'Марки / материалы'}
      materialValues={item.grades}
      rows={item.range.map(row => ({ label: row.label, values: [row.value] }))}
      standards={item.standards}
      requestHref={requestHref}
      hasSizeReference={hasSizeReference || sizeProfiles.length > 0}
      imageSrc={item.image}
      imageAlt={item.shortTitle}
    />
        <aside className="product-document-selection" aria-label="Подбор и заявка">
    {item.categorySlug === 'metizy-i-svarochnye-materialy' && item.slug === 'kanaty' && <section className="product-size-series rope-sales" id="rope-sales" aria-labelledby="rope-sales-title">
      <h2 id="rope-sales-title">Выбрать стальной канат</h2>
      <p>Конструкция, диаметр, затем заявка. Диапазон ассортимента — {ropeSalesAssortment.diameterRange}; группы {ropeSalesAssortment.markingGroups.join(' и ')} {ropeSalesAssortment.markingGroupUnit}.</p>
      <RopeSalesPicker />
      <details className="rope-sales-reference" id="rope-assortment-table">
        <summary>Все конструкции и диаметры</summary>
        <p>{ropeSalesAssortment.selectionNote}</p>
        <div className="size-series-scroll" tabIndex={0} role="region" aria-label="Перечень конструкций и диаметров канатов">
          <table className="rope-sales-reference-table">
            <caption>Стальные канаты: конструкции и доступные диаметры</caption>
            <thead><tr><th scope="col">Конструкция / исполнения</th><th scope="col">Диаметры, мм</th></tr></thead>
            <tbody>{ropeSalesDiameterGroups.map(group => <tr key={group.constructions[0]}>
              <th scope="row">{group.constructions.join(' / ')}</th>
              <td>{group.diameters.map(value => formatDimensionValue(String(value))).join(' · ')}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p><strong>Диаметр подбирается по запросу:</strong> {ropeSalesConstructions.filter(construction => !ropeSalesDiameterGroups.some(group => group.constructions.includes(construction))).join(' · ')}.</p>
        <p>{ropeSalesAssortment.documentNote}</p>
        <a href={ropeSalesRequestHref()}>Отправить параметры для подбора →</a>
      </details>
      <details className="rope-sales-extra"><summary>Подбор по назначению и дополнительные параметры</summary><MeshRopeRequestPicker type="rope" requestHref={requestHref} /></details>
    </section>}
    {(item.categorySlug === 'cvetnye-metally' || item.categorySlug === 'nerzhaveyushchaya-stal') && <NonferrousRequestPicker productSlug={item.slug} requestHref={requestHref} />}
    {((item.categorySlug === 'metizy-i-svarochnye-materialy' && ['lenta-upakovochnaya', 'svarochnye-materialy'].includes(item.slug)) || (item.categorySlug === 'pokovki-i-zagotovki' && item.slug === 'po-chertezhu')) && <SpecialProcurementPicker mode={item.slug === 'lenta-upakovochnaya' ? 'tape' : item.slug === 'svarochnye-materialy' ? 'welding' : 'forging'} requestHref={requestHref} />}
    {item.categorySlug === 'metizy-i-svarochnye-materialy' && item.slug === 'setki' && <MeshRopeRequestPicker type="mesh" requestHref={requestHref} />}
          {hasSeriesSelection && <ProductSizeSeries series={sizeSeries} guide={dimensionGuide} requestHref={requestHref} documentation selectionOnly />}
          {!hasStandaloneSelection && !hasSeriesSelection && <ProductDocumentRequest requestHref={requestHref} fields={item.requestFields} hasSizeReference={hasSizeReference || sizeProfiles.length > 0} />}
        </aside>
      </div>
    <nav className="product-document-nav" aria-label="Разделы карточки">
      {(hasSizeReference || sizeProfiles.length > 0) && <a href="#sizes">Размеры и подбор</a>}
      <a href="#technical-reference">Применение и документы</a>
      <a href="#related-products">Другие позиции</a>
    </nav>
    {sizeProfiles.length > 0 && <section className="product-size-series" id="sizes" aria-labelledby="profile-sizes-title">
      <h2 id="profile-sizes-title">Размерный ряд по ГОСТ</h2>
      <p className="size-series-intro">Выберите вид профиля, чтобы открыть его размеры, серии и стандарты.</p>
      <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
      <nav className="size-series-nav" aria-label="Размерные таблицы по видам профиля">
        {sizeProfiles.map((profile) => <a key={profile.slug} href={`/produkciya/${profile.categorySlug}/${profile.slug}#sizes`}>{profile.shortTitle} →</a>)}
      </nav>
    </section>}
    <CatalogStockAssortment categorySlug={item.categorySlug} slug={item.slug} title={item.title} documentation />
    <ProductSizeSeries series={sizeSeries} guide={dimensionGuide} requestHref={requestHref} documentation showSelection={false} />
    </div>
    <details className="product-document-reference" id="technical-reference">
      <summary>Применение, документы и требования к заявке</summary>
      <section className="product-document-reference-section"><h2>Применение</h2><ul>{item.applications.map(value => <li key={value}>{value}</li>)}</ul></section>
    {item.standards.length > 0 && <section className="pipe-standards"><div><p>Документы</p><h2>Стандарты</h2></div><div>{item.standards.map((value) => { const standard = findStandard(value); return standard ? <Link prefetch={false} href={`/spravochnik-gost/${standard.slug}`} key={value}><span className={/^(?:ГОСТ|ТУ|ОСТ|СТО|ASTM|DIN|ISO|API|EN|AWS)\s+[A-ZА-Я]?\d/u.test(value) ? 'standard-code' : undefined}>{value}</span><small>{standard.status}</small><b>↗</b></Link> : <div key={value}><span className={/^(?:ГОСТ|ТУ|ОСТ|СТО|ASTM|DIN|ISO|API|EN|AWS)\s+[A-ZА-Я]?\d/u.test(value) ? 'standard-code' : undefined}>{value}</span></div> })}</div></section>}
      <section className="product-document-reference-section"><h2>Что указать в заявке</h2><ol>{item.requestFields.map(value => <li key={value}>{value}</li>)}</ol></section>
      <section className="product-document-reference-section"><h2>Подбор по назначению, а не только по размеру</h2><p>{item.intro}</p></section>
    </details>
    <section className="pipe-more" id="related-products"><p>Другие позиции раздела</p><div>{siblings.filter(({ slug }) => slug !== item.slug).slice(0, 5).map(related => <Link href={`/produkciya/${related.categorySlug}/${related.slug}`} key={related.slug}>{related.shortTitle}<b>↗</b></Link>)}</div></section>
    <section className="product-document-conversion"><div><h2>Есть готовая спецификация?</h2><p>Пришлите Excel, PDF, Word, фото маркировки или сертификат.</p></div><a href={requestHref}>Отправить заявку ↗</a></section>
  </main>
}
