import Link from 'next/link'
import { homeCatalogGroups } from '@/data/homeCatalog'
import RequestForm from '@/components/RequestForm'

/* Pre-generated responsive WebP sources intentionally bypass the dynamic
   /_next/image route, which was unreliable on the target network path. */

export default function MagicMetalHome() {
  return (
    <main className="minimal-home">
      <a className="skip-link" href="#content">К содержанию</a>
      <header className="minimal-header" id="top">
        <a className="wordmark" href="#top" aria-label="Мэджик Металл — главная"><span>ММ</span><strong>Мэджик Металл</strong></a>
        <nav aria-label="Основная навигация"><a href="#products">Продукция</a><Link href="/spravochnik-gost">ГОСТ</Link><a href="#request">Заявка</a></nav>
        <a className="header-phone" href="tel:+79227117363">+7 922 711-73-63</a>
      </header>

      <section className="minimal-hero" id="content" aria-labelledby="hero-title">
        <picture className="hero-picture">
          <source media="(max-width: 700px)" srcSet="/images/hero-mercedes-640.webp" />
          <source media="(max-width: 1200px)" srcSet="/images/hero-mercedes-1024.webp" />
          <source srcSet="/images/hero-mercedes-1440.webp" />
          <img src="/images/hero-mercedes-1024.webp" alt="" width="1440" height="810" fetchPriority="high" />
        </picture>
        <div className="hero-content">
          <p className="eyebrow">Поставки по России и на экспорт</p>
          <h1 id="hero-title">СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ ЗАЯВКИ — <em>КОМПЛЕКТУЕМ МЕТАЛЛ</em></h1>
          <p>Проверяем ГОСТ и ТУ, находим редкие позиции и обоснованные аналоги. Самовывоз или доставка.</p>
          <div className="hero-actions"><a className="primary-button" href="#request">Отправить заявку</a><a className="secondary-link" href="tel:+79227117363">Позвонить</a></div>
          <ul aria-label="Преимущества"><li>20+ лет опыта</li><li>Документы на продукцию</li><li>Россия и СНГ</li></ul>
        </div>
      </section>

      <section className="minimal-products" id="products" aria-labelledby="products-title">
        <div><p className="eyebrow">Основные направления</p><h2 id="products-title">Что поставляем</h2><p>Наличие, цену и срок подтвердим по спецификации.</p></div>
        <div className="product-links" aria-label="Разделы поставок">
          {homeCatalogGroups.map((group) => <a href={`/?product=${encodeURIComponent(group.title)}#request`} key={group.title}>{group.title}<span aria-hidden="true">→</span></a>)}
        </div>
      </section>

      <section className="minimal-request" id="request">
        <div className="request-copy" id="contacts"><p className="eyebrow">Расчёт поставки</p><h2>Отправьте заявку</h2><p>Прикрепите спецификацию или опишите позиции. При необходимости согласуем замену.</p><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><a href="tel:+79227117363">+7 922 711-73-63</a></div>
        <RequestForm />
      </section>

      <footer className="minimal-footer"><p>ООО «Мэджик Металл»</p><div><Link href="/spravochnik-gost">Справочник ГОСТ</Link><Link href="/politika-konfidencialnosti">Политика</Link></div></footer>
    </main>
  )
}
