import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findStandard } from '@/data/standards'
import { getSdtCatalogItem, sdtCatalog } from '@/data/sdtCatalog'
import './sdt-detail.css'

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
  const requestHref = `/?product=sdt&detail=${item.slug}#request`
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
    <main className="sdt-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="sdt-nav"><Link href="/produkciya/sdt"><b>←</b> Все СДТ</Link><Link href={requestHref}>Отправить заявку ↗</Link></header>
      <section className="sdt-hero">
        <div><p>Соединительные детали трубопроводов</p><h1>{item.title}</h1><span>{item.description}</span></div>
      </section>
      <nav className="sdt-breadcrumb" aria-label="Хлебные крошки"><Link href="/">Главная</Link><b>/</b><Link href="/produkciya/sdt">СДТ</Link><b>/</b><span>{item.shortTitle}</span></nav>
      <section className="sdt-intro"><h2>Подбор по проекту и спецификации</h2><p>{item.intro}</p><Link href={requestHref}>Отправить заявку →</Link></section>
      <section className="sdt-grid">
        <article><p>Исполнения</p><h2>Какие варианты комплектуем</h2>{item.execution.map((value) => <span key={value}>{value}</span>)}</article>
        <article><p>Размерный охват</p><h2>Ориентиры для заявки</h2>{item.range.map((value) => <span key={value}>{value}</span>)}<small>Диапазоны приведены для первичного поиска. Производимость и соответствие проекту подтверждаются до предложения.</small></article>
        <article><p>Материалы</p><h2>Марки и группы сталей</h2>{item.materials.map((value) => <span key={value}>{value}</span>)}</article>
      </section>
      <section className="sdt-standards"><div><p>Нормативная база</p><h2>Стандарты и технические документы</h2></div><div>{item.standards.map((value) => { const standard = findStandard(value); return standard ? <Link href={`/spravochnik-gost/${standard.slug}`} key={value}><span className="standard-code">{value}</span><small>{standard.status}</small><b>↗</b></Link> : <div key={value}><span className="standard-code">{value}</span><small>Проверяется по документации проекта</small></div> })}</div></section>
      <section className="sdt-request"><div><p>Что указать в заявке</p><h2>Данные для точного расчёта</h2></div><ol>{item.requestFields.map((value, index) => <li key={value}><b>{String(index + 1).padStart(2, '0')}</b><span>{value}</span></li>)}</ol></section>
      <section className="sdt-more"><p>Другие соединительные детали</p><div>{sdtCatalog.filter(({ slug }) => slug !== item.slug).slice(0, 4).map((related) => <Link href={`/produkciya/sdt/${related.slug}`} key={related.slug}>{related.shortTitle}<b>↗</b></Link>)}</div></section>
      <section className="sdt-conversion"><p>Пришлите спецификацию, чертёж или фото маркировки</p><h2>Проверим размеры,<br />материал и стандарт</h2><Link href={requestHref}>Отправить заявку ↗</Link></section>
    </main>
  )
}
