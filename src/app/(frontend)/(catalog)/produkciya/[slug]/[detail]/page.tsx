import { formatDimensionValue } from '@/lib/dimensionDisplay'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findCatalogStandard as findStandard } from '@/data/catalogStandards'
import { getPipeCatalogItem, getPipeItemsByCategory, pipeCatalog } from '@/data/pipeCatalog'
import { getProductDetailItem, getProductDetailsByCategory, productDetailCatalog, type ProductDetailItem } from '@/data/productDetailCatalog'
import { getSeoCategory } from '@/data/seoCatalog'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CatalogStockAssortment from '@/components/CatalogStockAssortment'
import ProductSizeSeries from '@/components/ProductSizeSeries'
import MeshRopeRequestPicker from '@/components/MeshRopeRequestPicker'
import SpecialProcurementPicker from '@/components/SpecialProcurementPicker'
import NonferrousRequestPicker from '@/components/NonferrousRequestPicker'
import { getProductSizeSeries } from '@/data/productSizeSeries'
import { getDimensionGuide } from '@/data/dimensionGuides'
import { ropeSalesAssortment, ropeSalesConstructions, ropeSalesDiameterGroups, ropeSalesRequestHref } from '@/data/ropeSalesAssortment'
import './pipe-detail.css'

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
  return <main className="pipe-detail">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <header className="pipe-nav"><Link href={`/produkciya/${item.categorySlug}`}><b>←</b> {categoryLabel}</Link><LanguageSwitcher /><a href={requestHref}>Отправить заявку ↗</a></header>
    <section className="pipe-hero"><div><p>{categoryLabel}</p><h1>{item.title}</h1><span>{item.description}</span></div></section>
    <nav className="pipe-breadcrumb" aria-label="Хлебные крошки"><Link prefetch={false} href="/">Главная</Link><b>/</b><Link href={`/produkciya/${item.categorySlug}`}>{categoryLabel}</Link><b>/</b><span>{item.shortTitle}</span></nav>
    {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <p className="size-series-intro">Сначала сверьте марку, размеры, исполнение и стандарт. Если спецификация уже готова, отправьте файл сразу — искать в каталоге необязательно. <a href="/#request">Отправить готовую заявку ↗</a></p>
    <section className="pipe-spec"><div><p>Продукция</p><h2>Основные параметры для закупки</h2></div><dl>{item.range.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>
    <section className="pipe-facts"><div className="pipe-facts-heading"><p>Сводные характеристики</p><h2>Марки и применение</h2></div><dl><div><dt>Марки и материалы</dt><dd>{item.grades.map((value) => <span key={value}>{value}</span>)}</dd></div><div><dt>Применение</dt><dd>{item.applications.map((value) => <span key={value}>{value}</span>)}</dd></div></dl></section>
    {item.standards.length > 0 && <section className="pipe-standards"><div><p>Документы</p><h2>Стандарты</h2></div><div>{item.standards.map((value) => { const standard = findStandard(value); return standard ? <Link prefetch={false} href={`/spravochnik-gost/${standard.slug}`} key={value}><span className={/^(?:ГОСТ|ТУ|ОСТ|СТО|ASTM|DIN|ISO|API|EN|AWS)\s+[A-ZА-Я]?\d/u.test(value) ? 'standard-code' : undefined}>{value}</span><small>{standard.status}</small><b>↗</b></Link> : <div key={value}><span className={/^(?:ГОСТ|ТУ|ОСТ|СТО|ASTM|DIN|ISO|API|EN|AWS)\s+[A-ZА-Я]?\d/u.test(value) ? 'standard-code' : undefined}>{value}</span></div> })}</div></section>}
    <section className="pipe-request"><div><p>Для точного предложения</p><h2>Что указать в заявке</h2></div><ol>{item.requestFields.map((value, index) => <li key={value}><b>{String(index + 1).padStart(2, '0')}</b><span>{value}</span></li>)}</ol></section>
    {sizeProfiles.length > 0 && <section className="product-size-series" id="sizes" aria-labelledby="profile-sizes-title">
      <h2 id="profile-sizes-title">Размерный ряд по ГОСТ</h2>
      <p className="size-series-intro">Выберите вид профиля, чтобы открыть его размеры, серии и стандарты.</p>
      <a className="size-series-request" href={requestHref}>Отправить заявку ↗</a>
      <nav className="size-series-nav" aria-label="Размерные таблицы по видам профиля">
        {sizeProfiles.map((profile) => <a key={profile.slug} href={`/produkciya/${profile.categorySlug}/${profile.slug}#sizes`}>{profile.shortTitle} →</a>)}
      </nav>
    </section>}
    {(item.categorySlug === 'cvetnye-metally' || item.categorySlug === 'nerzhaveyushchaya-stal') && <NonferrousRequestPicker productSlug={item.slug} requestHref={requestHref} />}
    {((item.categorySlug === 'metizy-i-svarochnye-materialy' && ['lenta-upakovochnaya', 'svarochnye-materialy'].includes(item.slug)) || (item.categorySlug === 'pokovki-i-zagotovki' && item.slug === 'po-chertezhu')) && <SpecialProcurementPicker mode={item.slug === 'lenta-upakovochnaya' ? 'tape' : item.slug === 'svarochnye-materialy' ? 'welding' : 'forging'} requestHref={requestHref} />}
    {item.categorySlug === 'metizy-i-svarochnye-materialy' && item.slug === 'kanaty' && <section className="product-size-series rope-sales" id="rope-sales" aria-labelledby="rope-sales-title">
      <h2 id="rope-sales-title">Конструкции стальных канатов</h2>
      <p className="size-series-intro">Поставляем канаты диаметром {ropeSalesAssortment.diameterRange}. Маркировочные группы: {ropeSalesAssortment.markingGroups.join(' и ')} {ropeSalesAssortment.markingGroupUnit}.</p>
      <p>{ropeSalesAssortment.wireFinishes.join(' или ')}; {ropeSalesAssortment.surfaceFinishes.join(' или ')}.</p>
      <p>{ropeSalesAssortment.selectionNote}</p>
      <p>Размерные ряды по предоставленной матрице; остальные конструкции — подбор по запросу. Откройте конструкцию и выберите диаметр в миллиметрах — оба параметра попадут в заявку.</p>
      <ul className="rope-sales-constructions" aria-label="Выбор конструкции каната">
        {ropeSalesConstructions.map(construction => {
          const diameterGroup = ropeSalesDiameterGroups.find(group => group.constructions.some(value => value === construction))
          return <li key={construction}>{diameterGroup ? <details className="rope-sales-diameter-choice">
            <summary><span>{construction}</span><span>Диаметры ▾</span></summary>
            <form className="rope-sales-diameter-form" method="get" action="/#request">
              <input type="hidden" name="product" value={`Канаты стальные; конструкция ${construction}`} />
              <label><span>Диаметр, мм</span><select name="detail" required defaultValue="" aria-label={`Диаметр каната конструкции ${construction}`}>
                <option value="">Выберите диаметр</option>
                {diameterGroup.diameters.map(diameter => <option key={diameter} value={`диаметр ${formatDimensionValue(String(diameter))} мм`}>{formatDimensionValue(String(diameter))}</option>)}
              </select></label>
              <button type="submit">В заявку →</button>
            </form>
            <a href={ropeSalesRequestHref(construction)} aria-label={`Подобрать диаметр каната конструкции ${construction}`}>Уточнить диаметр →</a>
          </details> : <a href={ropeSalesRequestHref(construction)} aria-label={`В заявку: канат конструкции ${construction}`}><span>{construction}</span><span aria-hidden="true">В заявку →</span></a>}</li>
        })}
      </ul>
      <p className="size-series-intro">{ropeSalesAssortment.documentNote}</p>
      <a className="size-series-request" href={ropeSalesRequestHref()}>Помочь с подбором каната →</a>
    </section>}
    {item.categorySlug === 'metizy-i-svarochnye-materialy' && (item.slug === 'kanaty' || item.slug === 'setki') && <MeshRopeRequestPicker type={item.slug === 'kanaty' ? 'rope' : 'mesh'} requestHref={requestHref} />}
    <CatalogStockAssortment categorySlug={item.categorySlug} slug={item.slug} title={item.title} />
    <ProductSizeSeries series={getProductSizeSeries(item.categorySlug, item.slug)} guide={getDimensionGuide(item.categorySlug, item.slug)} requestHref={requestHref} />
    <section className="pipe-intro"><h2>Подбор по назначению, а не только по размеру</h2><div><p>{item.intro}</p><a href={requestHref}>Отправить заявку →</a></div></section>
    <section className="pipe-more"><p>Другие позиции раздела</p><div>{siblings.filter(({ slug }) => slug !== item.slug).slice(0, 5).map((related) => <Link href={`/produkciya/${related.categorySlug}/${related.slug}`} key={related.slug}>{related.shortTitle}<b>↗</b></Link>)}</div></section>
    <section className="pipe-conversion"><p>Пришлите Excel, PDF, Word, фото маркировки или сертификат</p><h2>Проверим стандарт,<br />размер и исполнение</h2><a href={requestHref}>Отправить заявку ↗</a></section>
  </main>
}
