import type { SeoCategory } from '@/data/seoCatalog'
import type { Material } from '@/data/materials'
import { getProductDetailsByCategory } from '@/data/productDetailCatalog'
import { getProductSizeSeries } from '@/data/productSizeSeries'
import LanguageSwitcher from './LanguageSwitcher'
import './SectionCatalog.css'

const overviewSlugs = new Set(['krug-i-kvadrat', 'balka-shveller-ugolok'])

export default function SectionCatalog({ category, relatedMaterials }: { category: SeoCategory; relatedMaterials: Material[] }) {
  const items = getProductDetailsByCategory(category.slug)
  const products = items.filter((item) => !overviewSlugs.has(item.slug))
  const requestHref = `/?product=${encodeURIComponent(category.title)}#request`
  return <main className="section-catalog">
    <header className="sc-header"><div className="sc-wrap sc-header-inner">
      <Link prefetch={false} className="sc-brand" href="/"><b>Мэджик</b> Металл</Link>
      <nav aria-label="Основная навигация"><Link prefetch={false} href="/#products" aria-current="page">Продукция</Link><Link prefetch={false} href="/spravochnik-gost">Справочник ГОСТ</Link><Link prefetch={false} href="/#about">О компании</Link></nav>
      <div className="sc-header-actions"><a href="tel:+79227117363">+7 922 711-73-63</a><LanguageSwitcher /><a className="sc-button" href={requestHref}>Отправить заявку →</a></div>
    </div></header>
    <div className="sc-wrap">
      <nav className="sc-breadcrumbs" aria-label="Хлебные крошки"><Link prefetch={false} href="/">Главная</Link><span aria-hidden="true">/</span><Link prefetch={false} href="/#products">Продукция</Link><span aria-hidden="true">/</span><span aria-current="page">{category.title}</span></nav>
      <section className="sc-intro"><h1 className="sc-title">{category.title}</h1><p>{category.description}</p></section>
      <div className="sc-layout">
        <section className="sc-products" aria-labelledby="sc-products-title">
          <div className="sc-heading-row"><h2 className="sc-heading" id="sc-products-title">Виды продукции</h2><span>{products.length} позиций</span></div>
          <div className="sc-list">
            <div className="sc-row sc-labels" aria-hidden="true"><span>Продукция</span><span>Размеры и исполнение</span><span>Стандарты</span><span /></div>
            <ul>{products.map((item) => {
              const standards = [...new Set(getProductSizeSeries(item.categorySlug, item.slug).map((table) => table.standard))]
              const dimension = item.slug === 'krug-goryachekatanyj' ? `Диаметр ${item.range[0].value.split(';')[0]}` : item.range[0].value
              return <li key={item.slug}><a className="sc-row" href={`/produkciya/${item.categorySlug}/${item.slug}`}>
                <strong>{item.shortTitle}</strong><span className="sc-dimension">{dimension}</span>
                <span className="sc-standards">{(standards.length ? standards : item.standards).map((code) => <span key={code}>{code}</span>)}</span>
                <span className="sc-arrow" aria-hidden="true">›</span><span className="sc-mobile-link">Размеры и характеристики →</span>
              </a></li>
            })}</ul>
          </div>
          <nav className="sc-overviews" aria-label="Обзорные страницы">{items.filter((item) => overviewSlugs.has(item.slug)).map((item) => <a href={`/produkciya/${item.categorySlug}/${item.slug}`} key={item.slug}>Обзор: {item.shortTitle.toLowerCase()} →</a>)}</nav>
        </section>
        <aside className="sc-aside"><h2 className="sc-heading">Подберём по спецификации</h2><p>Комплектуем разные виды проката одной заявкой.</p><ul><li>Размер или номер профиля</li><li>Марка стали и ГОСТ</li><li>Длина и количество</li></ul><a className="sc-button" href={requestHref}>Отправить заявку →</a><small>Excel · PDF · Word · фото · чертёж</small></aside>
      </div>
      <section className="sc-info"><div><h2 className="sc-heading">Комплектуем поставку</h2><p>{category.intro}</p></div><div><h2 className="sc-heading">Марки и материалы</h2><div className="sc-grades">{category.grades.map((grade) => <span key={grade}>{grade}</span>)}</div></div></section>
      {relatedMaterials.length > 0 && <section className="sc-materials"><h2 className="sc-heading">Справочник материалов</h2><div>{relatedMaterials.map((material) => <a href={`/spravochnik-materialov/${material.slug}`} key={material.slug}><b>{material.designation}</b><span>{material.name}</span><i aria-hidden="true">→</i></a>)}</div></section>}
    </div>
    <section className="sc-conversion"><div className="sc-wrap"><div><h2 className="sc-heading">Проверим требования и подготовим предложение</h2><p>Пришлите Excel, PDF, Word, фото или чертёж.</p></div><a className="sc-button" href={requestHref}>Отправить заявку →</a></div></section>
  </main>
}
import Link from 'next/link'
