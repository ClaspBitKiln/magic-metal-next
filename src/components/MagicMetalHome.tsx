import Image from 'next/image'
import Link from 'next/link'
import { homeCatalogGroups } from '@/data/homeCatalog'
import PublicHeader from '@/components/PublicHeader'
import RequestForm from '@/components/RequestForm'

export default function MagicMetalHome() {
  return (
    <main className="public-home">
      <a className="skip-link" href="#content">К содержанию</a>
      <PublicHeader />

      <section className="hero" id="top" aria-labelledby="hero-title">
        <picture>
          <source media="(max-width: 700px)" srcSet="/images/hero-mercedes-640.webp" />
          <source media="(max-width: 1200px)" srcSet="/images/hero-mercedes-1024.webp" />
          <source srcSet="/images/hero-mercedes-1440.webp" />
          <img className="hero-visual" src="/images/hero-mercedes-1440.webp" alt="Брендированный грузовой автомобиль Mercedes-Benz Мэджик Металл, промышленное производство, металлопрокат, трубы и детали трубопроводов" width="1440" height="810" fetchPriority="high" />
        </picture>
        <div className="hero-copy" id="content">
          <p className="hero-label">
            <span>СРОЧНЫЕ ПОСТАВКИ:</span>
            <strong>РОССИЯ · УЗБЕКИСТАН · КАЗАХСТАН · КЫРГЫЗСТАН · БЕЛАРУСЬ · ТУРЦИЯ</strong>
          </p>
          <h1 id="hero-title">КОМПЛЕКТУЕМ <em>СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ</em> ЗАЯВКИ</h1>
          <p className="hero-lead">Проверяем требования и актуальность ГОСТов, находим редкие позиции и технически обоснованные аналоги. Комплектуем металл и сопутствующие материалы с полным пакетом документов — для поставок по России и на экспорт.</p>
          <div className="hero-actions"><a className="primary-button" href="#request">Отправить заявку <span>↗</span></a><span className="file-types">Excel · PDF · Word · фото · голосовое сообщение</span></div>
        </div>
        <div className="hero-strip" id="delivery"><div className="delivery-title"><b>Авто · Ж/Д · Авиа</b><span>Срочная доставка снижает риск простоя оборудования и персонала, а также штрафных санкций за срыв сроков проекта</span></div></div>
      </section>

      <section className="section company-trust-section" id="about" aria-labelledby="company-trust-title">
        <div className="company-trust-head">
          <div><h2 id="company-trust-title">Опыт <em>промышленных поставок</em></h2></div>
          <p>Более 20 лет комплектуем металл, трубную продукцию, СДТ, запорную арматуру и сопутствующие материалы для крупных промышленных проектов.</p>
        </div>
        <div className="company-metrics" aria-label="Опыт компании">
          <article><strong>20+ лет</strong><span>опыт специалистов на рынке металлопроката</span></article>
          <article><strong>100 000+ т</strong><span>совокупный объём реализованных поставок</span></article>
          <article><strong>10 000+</strong><span>позиций в доступном ассортименте</span></article>
          <article><strong>Россия и СНГ</strong><span>география промышленных поставок</span></article>
        </div>
        <div className="company-proof">
          <p className="company-proof-label">Опыт работы с подрядными организациями</p>
          <ul className="company-client-list" aria-label="Отраслевой опыт компании">
            <li>
              <Image src="/images/clients/gazprom.svg" alt="Газпром" width={180} height={64} />
            </li>
            <li>
              <Image src="/images/clients/rosneft.svg" alt="Роснефть" width={180} height={64} />
            </li>
            <li>
              <Image src="/images/clients/rosatom.svg" alt="Госкорпорация «Росатом»" width={180} height={64} />
            </li>
            <li>
              <Image src="/images/clients/uztransgaz.svg" alt="АО «Узтрансгаз»" width={180} height={64} />
            </li>
            <li>
              <Image src="/images/clients/uzbekneftegaz.png" alt="АО «Узбекнефтегаз»" width={180} height={64} />
            </li>
          </ul>
        </div>
      </section>

      <section className="reference-hub" id="gost" aria-labelledby="quick-search-title">
        <div className="quick-search">
          <div><p className="section-kicker">Единый технический справочник</p><h2 id="quick-search-title">Справочник<br /><em>по металлопрокату</em></h2></div>
          <div className="quick-search-tools"><p className="reference-purpose">Рабочий инструмент для снабжения и проектировщиков: основные параметры продукции, действующие стандарты и варианты замены для последующей проверки на соответствие проекту.</p><form action="/poisk" method="get"><label htmlFor="home-search">Товар, размер, марка или ГОСТ</label><div><input id="home-search" name="q" placeholder="12Х1МФ, ГОСТ 8732, труба 219×8" /><button type="submit">Найти →</button></div></form><nav aria-label="Разделы справочника"><Link href="#products">Все разделы</Link><Link href="/spravochnik-gost">ГОСТ и размеры</Link><Link href="/spravochnik-materialov">Материалы и аналоги</Link><Link href="/kalkulyator-metalla">Калькулятор массы</Link></nav></div>
        </div>
      <div className="product-unified" id="products" aria-labelledby="products-title">
      <div className="section catalog-section product-subsection">
        <div className="catalog-head"><div><p className="product-subsection-label">Основные направления поставок</p><h2 id="products-title">Что мы<br /><em>можем поставить</em></h2></div><div className="catalog-head-actions"><p>Выберите нужный раздел. Размеры, марку стали, стандарт, цену, наличие и срок поставки подтвердим по вашей спецификации.</p><a className="catalog-main-cta" href="#request">Отправить заявку <span aria-hidden="true">→</span></a></div></div>
        <div className="catalog-section-list" aria-label="Разделы поставок">
          {homeCatalogGroups.map((group, index) => <Link className="catalog-section-card" href={`/?product=${encodeURIComponent(group.title)}#request`} aria-label={`Выбрать раздел «${group.title}» и перейти к заявке`} key={group.title}>
            <span className="catalog-section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div><h3>{group.title}</h3><p>{group.note}</p></div>
            <span className="catalog-section-arrow" aria-hidden="true">→</span>
          </Link>)}
        </div>
      </div>
      </div>
      </section>

      <section className="request-section" id="request">
        <div className="request-copy" id="contacts"><h2>Отправьте<br /><em>заявку</em></h2><p>Укажите требования и способ получения: самовывоз или доставку с указанием города. Проверим заявку, согласуем возможную замену и подготовим коммерческое предложение.</p><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><a href="tel:+79227117363">+7 922 711-73-63</a></div>
        <RequestForm />
      </section>

      <footer className="footer"><Image src="/images/logo-hq.webp" alt="" width={92} height={68} /><p>ООО «Мэджик Металл» · поставки металла для промышленности</p><div><a href="tel:+79227117363">+7 922 711-73-63</a><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><Link href="/politika-konfidencialnosti">Политика</Link></div></footer>
    </main>
  )
}
