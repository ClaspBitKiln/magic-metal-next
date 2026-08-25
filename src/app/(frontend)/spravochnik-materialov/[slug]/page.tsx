import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getMaterial, materials } from '@/data/materials'
import { findStandard } from '@/data/standards'
import '../materials.css'

export function generateStaticParams() {
  return materials.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const material = getMaterial((await params).slug)
  if (!material) return {}
  return {
    title: material.metaTitle,
    description: material.description,
    alternates: { canonical: `/spravochnik-materialov/${material.slug}` },
    openGraph: { title: material.metaTitle, description: material.description },
  }
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const material = getMaterial((await params).slug)
  if (!material) notFound()
  const related = materials.filter((item) => item.group === material.group && item.slug !== material.slug).slice(0, 4)
  const requestHref = `/?material=${encodeURIComponent(material.designation)}#request`
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'TechArticle',
    headline: material.metaTitle, description: material.description,
    about: { '@type': 'Thing', name: material.designation },
    author: { '@type': 'Organization', name: 'ООО «Мэджик Металл»', url: 'https://magicmet.ru' },
    mainEntityOfPage: `https://magicmet.ru/spravochnik-materialov/${material.slug}`,
  }
  return (
    <main className="materials-page material-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="materials-header"><Link href="/spravochnik-materialov"><b>←</b> Все материалы</Link><Link className="materials-cta" href={requestHref}>Запросить поставку ↗</Link></header>
      <section className="material-hero material-hero-visual"><div><p>{material.groupLabel}</p><h1>{material.designation}</h1><h2>{material.name}</h2><span>{material.summary}</span></div></section>
      <section className="material-content">
        <article className="material-intro"><p>Подбор по спецификации</p><h2>Поставим материал в нужном исполнении</h2><span>Уточним нормативный документ, сортамент, состояние поставки, контроль и документы. Для ответственного применения сверим требования проекта с сертификатом производителя.</span><Link href={requestHref}>Отправить ТЗ <b>→</b></Link></article>
        <div className="material-facts">
          <section><h2>Стандарты</h2>{material.standards.map((item) => { const standard = findStandard(item); return standard ? <Link className="fact-link" href={`/spravochnik-gost/${standard.slug}`} key={item}>{item} <b>→</b></Link> : <span key={item}>{item}</span> })}</section>
          <section><h2>Ключевые свойства</h2>{material.properties.map((item) => <span key={item}>{item}</span>)}</section>
          <section><h2>Применение</h2>{material.applications.map((item) => <span key={item}>{item}</span>)}</section>
          <section><h2>Формы поставки</h2>{material.forms.map((item) => <span key={item}>{item}</span>)}</section>
        </div>
      </section>
      {material.analogs.length > 0 && <section className="material-analogs"><p>Справочные аналоги</p><h2>Соответствия требуют проверки</h2>{material.analogs.map((item) => <span key={item}>{item}</span>)}<small>Совпадение обозначений или близость химического состава не гарантируют одинаковые механические свойства, коррозионную стойкость и допустимые условия эксплуатации.</small></section>}
      <section className="material-products"><p>Связанные товарные направления</p><h2>Где применяется {material.designation}</h2><div>{material.relatedProducts.map((item) => <Link href={`/produkciya/${item.slug}`} key={item.slug}>{item.label}<b>↗</b></Link>)}</div></section>
      {related.length > 0 && <section className="related-materials"><p>Материалы той же группы</p><div>{related.map((item) => <Link href={`/spravochnik-materialov/${item.slug}`} key={item.slug}><b>{item.designation}</b><span>{item.name}</span></Link>)}</div></section>}
      <section className="materials-note"><p>Заявка</p><h2>Нужен расчёт по этой марке?</h2><span>Пришлите Excel, PDF, Word, фото или чертёж. Проверим требования и подготовим предложение.</span><Link href={requestHref}>Отправить спецификацию ↗</Link></section>
    </main>
  )
}
