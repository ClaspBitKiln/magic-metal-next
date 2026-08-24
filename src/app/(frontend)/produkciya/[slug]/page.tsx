import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getSeoCategory, seoCatalog } from '@/data/seoCatalog'
import { materials } from '@/data/materials'
import { findStandard } from '@/data/standards'
import { sdtCatalog } from '@/data/sdtCatalog'
import { getPipeItemsByCategory } from '@/data/pipeCatalog'
import { getProductDetailsByCategory } from '@/data/productDetailCatalog'
import './product.css'

export function generateStaticParams() {
  return seoCatalog.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = getSeoCategory((await params).slug)
  if (!category) return {}
  return {
    title: category.metaTitle,
    description: category.description,
    alternates: { canonical: `/produkciya/${category.slug}` },
    openGraph: { title: category.metaTitle, description: category.description, images: [{ url: category.image, width: 1200, height: 800 }] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = getSeoCategory((await params).slug)
  if (!category) notFound()
  const relatedMaterials = materials.filter((material) => material.relatedProducts.some((product) => product.slug === category.slug)).slice(0, 8)
  const requestHref = `/?product=${category.slug}#request`
  const detailItems = [...getPipeItemsByCategory(category.slug), ...getProductDetailsByCategory(category.slug)]
  return (
    <main className="product-page">
      <header className="product-header"><Link href="/"><b>←</b> Мэджик Металл</Link><Link className="product-cta" href={requestHref}>Отправить спецификацию ↗</Link></header>
      <section className="product-hero"><div><p>Продукция · подбор по спецификации</p><h1>{category.title}</h1><span>{category.description}</span></div><figure><Image src={category.image} alt={category.imageAlt} width={1200} height={800} priority /><figcaption>Поясняющая техническая иллюстрация. Фактическое исполнение определяется спецификацией.</figcaption></figure></section>
      <section className="product-body">
        <article><h2>Комплектуем поставку</h2><p>{category.intro}</p><Link href={requestHref}>Запросить расчёт <b>→</b></Link></article>
        <div className="product-facts"><section><h2>Виды продукции</h2>{category.products.map((item) => <span key={item}>{item}</span>)}</section><section><h2>Стандарты</h2>{category.standards.map((item) => { const standard = findStandard(item); return standard ? <Link className="fact-link" href={`/spravochnik-gost/${standard.slug}`} key={item}>{item} <b>→</b></Link> : <span key={item}>{item}</span> })}</section><section><h2>Марки и материалы</h2>{category.grades.map((item) => <span key={item}>{item}</span>)}</section></div>
      </section>
      {category.slug === 'sdt' && <section className="product-subcatalog"><p>Каталог СДТ</p><h2>Выберите тип и исполнение детали</h2><div>{sdtCatalog.map((item) => <Link href={`/produkciya/sdt/${item.slug}`} key={item.slug}><span>{item.shortTitle}</span><small>{item.standards.slice(0, 2).join(' · ')}</small><b>↗</b></Link>)}</div></section>}
      {detailItems.length > 0 && <section className="product-subcatalog"><p>Подробный каталог</p><h2>Выберите товарную позицию</h2><div>{detailItems.map((item) => <Link href={`/produkciya/${item.categorySlug}/${item.slug}`} key={item.slug}><span>{item.shortTitle}</span><small>{item.standards.slice(0, 2).join(' · ')}</small><b>↗</b></Link>)}</div></section>}
      {relatedMaterials.length > 0 && <section className="product-materials"><p>Справочник материалов</p><h2>Марки и материалы для этой продукции</h2><div>{relatedMaterials.map((material) => <Link href={`/spravochnik-materialov/${material.slug}`} key={material.slug}><b>{material.designation}</b><span>{material.name}</span></Link>)}</div></section>}
      <section className="product-conversion"><p>Пришлите Excel, PDF, Word, фото или чертёж</p><h2>Проверим требования<br />и подготовим предложение</h2><Link href={requestHref}>Отправить заявку ↗</Link></section>
    </main>
  )
}
