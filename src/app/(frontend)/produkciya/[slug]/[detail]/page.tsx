import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findStandard } from '@/data/standards'
import { getPipeCatalogItem, getPipeItemsByCategory, pipeCatalog } from '@/data/pipeCatalog'
import { getProductDetailItem, getProductDetailsByCategory, productDetailCatalog, type ProductDetailItem } from '@/data/productDetailCatalog'
import { getSeoCategory } from '@/data/seoCatalog'
import './pipe-detail.css'

export const dynamicParams = false

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
  const requestHref = `/?product=${item.categorySlug}&detail=${item.slug}#request`
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
    <header className="pipe-nav"><Link href={`/produkciya/${item.categorySlug}`}><b>←</b> {categoryLabel}</Link><Link href={requestHref}>Отправить заявку ↗</Link></header>
    <section className="pipe-hero"><div><p>{categoryLabel}</p><h1>{item.title}</h1><span>{item.description}</span></div></section>
    <nav className="pipe-breadcrumb" aria-label="Хлебные крошки"><Link href="/">Главная</Link><b>/</b><Link href={`/produkciya/${item.categorySlug}`}>{categoryLabel}</Link><b>/</b><span>{item.shortTitle}</span></nav>
    <section className="pipe-intro"><h2>Подбор по назначению, а не только по размеру</h2><div><p>{item.intro}</p><Link href={requestHref}>Отправить заявку →</Link></div></section>
    <section className="pipe-spec"><div><p>Основные параметры</p><h2>Что проверяем</h2></div><dl>{item.range.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>
    <section className="pipe-facts"><article><p>Марки и материалы</p><h2>Варианты поставки</h2>{item.grades.map((value) => <span key={value}>{value}</span>)}</article><article><p>Применение</p><h2>Где используется</h2>{item.applications.map((value) => <span key={value}>{value}</span>)}</article></section>
    <section className="pipe-standards"><div><p>Нормативная база</p><h2>Стандарты</h2></div><div>{item.standards.map((value) => { const standard = findStandard(value); return standard ? <Link href={`/spravochnik-gost/${standard.slug}`} key={value}><span className="standard-code">{value}</span><small>{standard.status}</small><b>↗</b></Link> : <div key={value}><span className="standard-code">{value}</span><small>Проверяется по проекту и документации изготовителя</small></div> })}</div></section>
    <section className="pipe-request"><div><p>Для точного предложения</p><h2>Что указать в заявке</h2></div><ol>{item.requestFields.map((value, index) => <li key={value}><b>{String(index + 1).padStart(2, '0')}</b><span>{value}</span></li>)}</ol></section>
    <section className="pipe-more"><p>Другие позиции раздела</p><div>{siblings.filter(({ slug }) => slug !== item.slug).slice(0, 5).map((related) => <Link href={`/produkciya/${related.categorySlug}/${related.slug}`} key={related.slug}>{related.shortTitle}<b>↗</b></Link>)}</div></section>
    <section className="pipe-conversion"><p>Пришлите Excel, PDF, Word, фото маркировки или сертификат</p><h2>Проверим стандарт,<br />размер и исполнение</h2><Link href={requestHref}>Отправить заявку ↗</Link></section>
  </main>
}
