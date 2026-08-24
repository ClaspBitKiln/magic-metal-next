import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { materials } from '@/data/materials'
import { getStandard, standards } from '@/data/standards'
import '../../spravochnik-materialov/materials.css'

export function generateStaticParams() { return standards.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const standard = getStandard((await params).slug)
  if (!standard) return {}
  const image = ['gost-30732-2020', 'gost-r-51164-98', 'gost-9-602-2016'].includes(standard.slug) ? '/product/pipes/insulated.svg' : standard.group === 'fittings' ? '/product/sdt/otvody-besshovnye.svg' : standard.group === 'non-ferrous' ? '/product/categories/non-ferrous.svg' : standard.group === 'stainless' ? '/product/categories/stainless.svg' : standard.group === 'steel' ? '/product/categories/sheet.svg' : '/product/pipes/seamless.svg'
  return { title: `${standard.code} — ${standard.title}`, description: standard.summary, alternates: { canonical: `/spravochnik-gost/${standard.slug}` }, openGraph: { title: `${standard.code} — ${standard.title}`, description: standard.summary, images: [{ url: image, width: 1200, height: 800 }] } }
}

export default async function StandardPage({ params }: { params: Promise<{ slug: string }> }) {
  const standard = getStandard((await params).slug)
  if (!standard) notFound()
  const relatedMaterials = materials.filter((material) => standard.materialSlugs.includes(material.slug))
  const requestHref = `/?standard=${encodeURIComponent(standard.code)}#request`
  const standardImage = ['gost-30732-2020', 'gost-r-51164-98', 'gost-9-602-2016'].includes(standard.slug) ? '/product/pipes/insulated.svg' : standard.group === 'fittings' ? '/product/sdt/otvody-besshovnye.svg' : standard.group === 'non-ferrous' ? '/product/categories/non-ferrous.svg' : standard.group === 'stainless' ? '/product/categories/stainless.svg' : standard.group === 'steel' ? '/product/categories/sheet.svg' : '/product/pipes/seamless.svg'
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'TechArticle', headline: `${standard.code} — ${standard.title}`,
    description: standard.summary, about: { '@type': 'Thing', name: standard.code },
    author: { '@type': 'Organization', name: 'ООО «Мэджик Металл»', url: 'https://magicmet.ru' },
    citation: standard.officialUrl, mainEntityOfPage: `https://magicmet.ru/spravochnik-gost/${standard.slug}`,
  }
  return <main className="materials-page material-detail">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <header className="materials-header"><Link href="/spravochnik-gost"><b>←</b> Все стандарты</Link><Link className="materials-cta" href={requestHref}>Запросить расчёт ↗</Link></header>
    <section className="material-hero material-hero-visual"><div><p>{standard.groupLabel} · {standard.status}</p><h1>{standard.code}</h1><h2>{standard.title}</h2><span>{standard.summary}</span></div><figure><Image src={standardImage} alt={`${standard.code}: продукция в области применения стандарта`} width={1200} height={800} priority /><figcaption>Иллюстрация области применения. Полные требования определяются официальным текстом стандарта.</figcaption></figure></section>
    <section className="material-content">
      <article className="material-intro"><p>Практическое применение</p><h2>Что регулирует документ</h2><span>Стандарт рассматривается вместе с другими нормативными документами на марку, сортамент и технические условия. Окончательный комплект требований определяется спецификацией и проектом.</span><a href={standard.officialUrl} target="_blank" rel="noreferrer">Карточка Росстандарта <b>↗</b></a></article>
      <div className="material-facts">
        <section><h2>Область применения</h2>{standard.scope.map((item) => <span key={item}>{item}</span>)}</section>
        <section><h2>Проверить перед заказом</h2>{standard.checkBeforeOrder.map((item) => <span key={item}>{item}</span>)}</section>
      </div>
    </section>
    {relatedMaterials.length > 0 && <section className="related-materials"><p>Связанные материалы</p><div>{relatedMaterials.map((material) => <Link href={`/spravochnik-materialov/${material.slug}`} key={material.slug}><b>{material.designation}</b><span>{material.name}</span></Link>)}</div></section>}
    <section className="material-products"><p>Связанные товарные направления</p><h2>Поставка по {standard.code}</h2><div>{standard.products.map((item) => <Link href={`/produkciya/${item.slug}`} key={item.slug}>{item.label}<b>↗</b></Link>)}</div></section>
    <section className="materials-note"><p>Проверка заявки</p><h2>Нужна поставка по этому ГОСТ?</h2><span>Пришлите спецификацию. Проверим совместимость марки, сортамента, технических условий и требований к контролю.</span><Link href={requestHref}>Отправить спецификацию ↗</Link></section>
  </main>
}
