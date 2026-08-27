/* eslint-disable @next/next/no-img-element */
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

const priorityProducts = [
  { index: '01', title: 'Трубы электросварные', note: 'Ø 15–1420 мм · обечайки до 3500 мм', standards: 'ГОСТ 3262 · 10704 · 10705 · 10706 · 20295', slug: 'truby-elektrosvarnye' },
  { index: '02', title: 'Трубы бесшовные', note: 'Горяче-, холодно- и теплодеформированные', standards: 'ГОСТ 8731-2025 · 8732-2025 · 8733-74 · 8734-75 · 550-2020 · 9941-2022', slug: 'truby-besshovnye' },
  { index: '03', title: 'СДТ', note: 'Отводы · переходы · тройники · фланцы', standards: 'ГОСТ 17375 · 17376 · 17378 · 30753 · 12820–12822', slug: 'sdt' },
  { index: '04', title: 'Трубы и СДТ в изоляции', note: 'ППУ · ВУС · ЦПП · эпоксидные покрытия', standards: 'Заводское нанесение · комплектная поставка', slug: 'truby-i-sdt-v-izolyacii' },
]

const pipeCatalog = [
  ['Электросварные прямошовные и спиралешовные', 'Ø 15–1420 мм', 'ГОСТ 10704, 10705, 10706, 20295', 'Ст3, 20, 09Г2С, 17Г1СУ, 10Г2ФБЮ', '/produkciya/truby-elektrosvarnye'],
  ['Водогазопроводные', 'Ду 10–100', 'ГОСТ 3262-75', 'малоуглеродистые стали', '/produkciya/truby-elektrosvarnye/vodogazoprovodnye'],
  ['Профильные квадратные и прямоугольные', '15×15–400×200 мм', 'ГОСТ 8639, 8645, 30245', 'Ст3, 09Г2С, С245, С255, С355', '/produkciya/truby-elektrosvarnye/profilnye'],
  ['Бесшовные горячедеформированные', 'по действующему сортаменту', 'ГОСТ 8731-2025, 8732-2025; ГОСТ 550-2020', '10, 20, 35, 45, 09Г2С, 15ХМ, 12Х1МФ', '/produkciya/truby-besshovnye/goryachedeformirovannye'],
  ['Бесшовные холоднодеформированные', 'Ø 2,5–193 мм', 'ГОСТ 8733, 8734, 9567', '10, 20, 35, 45, 10Г2, 15Х, 20Х, 40Х, 15ХМ', '/produkciya/truby-besshovnye/holodnodeformirovannye'],
  ['Котельные и крекинговые', 'По спецификации', 'ТУ 14-3Р-55; ГОСТ 550; ASTM A335', '20, 15ХМ, 12Х1МФ, 15Х1М1Ф, P5, P11, P22, P91', '/produkciya/truby-besshovnye/kotelnye'],
  ['Нержавеющие и коррозионностойкие', 'Ø 5–273 мм', 'ГОСТ 9940, 9941; ASTM A312', '08Х18Н10, 12Х18Н10Т, 10Х17Н13М2Т, TP304, TP316, TP321', '/produkciya/truby-besshovnye/nerzhaveyushchie'],
  ['Нефтяного сортамента', 'По проекту', 'ГОСТ 632, 633; API 5CT', 'НКТ, обсадные, бурильные трубы и муфты', '/produkciya/truby-besshovnye'],
]

const otherProducts = [
  ['Лист холоднокатаный 0,3–3 мм', 'ГОСТ 19904-90 · ГОСТ 16523-89 · Ст08пс/кп'],
  ['Лист горячекатаный 2–200 мм', 'ГОСТ 19903-2015 · 14637-89 · 19281-89 · 5520-2017'],
  ['Лист нержавеющий 3–200 мм', 'ГОСТ 5582-75 · 5632-2014 · 7350-77 · ASTM'],
  ['Рулонная сталь оцинкованная', 'ГОСТ 14918-2020 · 08пс/сп'],
  ['Круг горячекатаный 8–300 мм', 'ГОСТ 2590-88 · 535-88 · конструкционные, инструментальные и специальные стали'],
  ['Квадрат 6–200 мм', 'ГОСТ 2591-2006 · 8559-75 · Ст3 · 20 · 09Г2С · 45'],
  ['Поковки Ø 40–1500+ мм', 'ГОСТ 8479-70 · 7829-70 · 25054-81 · 1133-71 · 4400-85 · 19200-80'],
  ['Уголок', 'Равнополочный, неравнополочный и гнутый · ГОСТ 8509-93 · 8510-86 · 19771-93 · 19772-93'],
  ['Балка двутавровая', 'ГОСТ 8239-89 · 57837-2017 · СТО АСЧМ 20-93 · С235–С375 · 09Г2С'],
  ['Швеллер', 'ГОСТ 8240-97 · С235–С375 · Ст3 · 09Г2С'],
  ['Днища и заглушки', 'ГОСТ 6533-78 · углеродистые, низколегированные, жаропрочные и нержавеющие стали'],
  ['Цветной металлопрокат', 'Титан · олово · латунь · медь · бронза · алюминий и другие материалы'],
  ['Сварочные материалы', 'Сварочная проволока · электроды · подбор по основному металлу · ГОСТ и ТУ'],
  ['Метизная продукция', 'Крепёж · болты · гайки · шайбы по ГОСТ, ТУ и DIN'],
  ['Оборудование', 'Промышленное оборудование по техническому заданию'],
  ['Материалы, детали и комплектующие', 'Поставка нестандартных позиций и грузов по запросу'],
]

const otherSeoLinks: Record<string, string> = {
  'Лист холоднокатаный 0,3–3 мм': '/produkciya/listovoy-prokat/holodnokatanyj',
  'Лист горячекатаный 2–200 мм': '/produkciya/listovoy-prokat/goryachekatanyj',
  'Лист нержавеющий 3–200 мм': '/produkciya/nerzhaveyushchaya-stal/list',
  'Рулонная сталь оцинкованная': '/produkciya/listovoy-prokat/ocinkovannyj',
  'Круг горячекатаный 8–300 мм': '/produkciya/sortovoy-i-fasonny-prokat/krug-i-kvadrat',
  'Квадрат 6–200 мм': '/produkciya/sortovoy-i-fasonny-prokat/krug-i-kvadrat',
  'Поковки Ø 40–1500+ мм': '/produkciya/pokovki-i-zagotovki',
  'Уголок': '/produkciya/sortovoy-i-fasonny-prokat/balka-shveller-ugolok',
  'Балка двутавровая': '/produkciya/sortovoy-i-fasonny-prokat/balka-shveller-ugolok',
  'Швеллер': '/produkciya/sortovoy-i-fasonny-prokat/balka-shveller-ugolok',
  'Днища и заглушки': '/produkciya/sdt/zaglushki-i-dnishcha',
  'Цветной металлопрокат': '/produkciya/cvetnye-metally',
  'Сварочные материалы': '/produkciya/metizy-i-svarochnye-materialy/svarochnye-materialy',
  'Метизная продукция': '/produkciya/metizy-i-svarochnye-materialy/krepezh',
  'Оборудование': '/?product=oborudovanie#request',
  'Материалы, детали и комплектующие': '/?product=komplektuyushchie#request',
}

const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }

export default function MagicMetalHome() {
  const reducedMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [selectedFiles, setSelectedFiles] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const animation = useMemo(() => (reducedMotion ? {} : reveal), [reducedMotion])

  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const form = event.currentTarget
    const data = new FormData(form)
    data.set('startedAt', String(startedAt))
    data.set('landingPage', window.location.href)
    data.set('referrer', document.referrer)
    const params = new URLSearchParams(window.location.search)
    data.set('context', params.get('material') || params.get('standard') || params.get('product') || params.get('region') || '')
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) data.set(key, params.get(key) || '')
    try {
      const response = await fetch('/api/request', { method: 'POST', body: data })
      if (!response.ok) throw new Error('Request failed')
      form.reset()
      setSelectedFiles(0)
      setStatus('success')
      const analytics = window as Window & { ym?: (id: number, action: string, goal: string) => void; gtag?: (action: string, event: string, params?: Record<string, unknown>) => void }
      const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0)
      if (metrikaId) analytics.ym?.(metrikaId, 'reachGoal', 'request_sent')
      analytics.gtag?.('event', 'generate_lead', { product_direction: String(data.get('productDirection') || ''), context: String(data.get('context') || '') })
    } catch {
      setStatus('error')
    }
  }

  return (
    <main>
      <a className="skip-link" href="#content">К содержанию</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Мэджик Металл — главная"><Image src="/images/logo-transparent-v2.png" alt="Мэджик Металл" width={147} height={109} priority /></a>
        <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Основная навигация">
          <a href="#about">О компании</a><a href="#products">Продукция</a><Link href="/spravochnik-gost">Справочник ГОСТ</Link><a href="#contacts">Контакты</a>
        </nav>
        <div className="top-actions">
          <a className="phone" href="tel:+79227117363">+7 922 711-73-63</a>
          <a className="top-cta" href="#request">Отправить заявку <span>↗</span></a>
          <button className="menu-button" type="button" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /><span /></button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <Image className="hero-visual" src="/images/hero-mercedes-v5.webp" alt="Брендированный грузовой автомобиль Mercedes-Benz Мэджик Металл, промышленное производство, металлопрокат, трубы и детали трубопроводов" fill priority sizes="100vw" />
        <div className="hero-copy" id="content">
          <motion.p initial="hidden" animate="visible" variants={animation} transition={{ duration: .5 }} className="hero-label">Поставка металла под требования проекта</motion.p>
          <motion.p initial="hidden" animate="visible" variants={animation} transition={{ duration: .55, delay: .08 }} className="eyebrow">Россия · СНГ · Узбекистан</motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={animation} transition={{ duration: .6, delay: .12 }} id="hero-title">Металл<br /><em>для сложных</em><br /><small>промышленных задач</small></motion.h1>
          <motion.p initial="hidden" animate="visible" variants={animation} transition={{ duration: .6, delay: .18 }} className="hero-lead">Находим редкие и нестандартные позиции, сверяем ГОСТ, ТУ и документы, комплектуем и доставляем металл по России и СНГ.</motion.p>
          <motion.div initial="hidden" animate="visible" variants={animation} transition={{ duration: .6, delay: .22 }} className="hero-actions"><a className="primary-button" href="#request">Отправить заявку <span>↗</span></a><span className="file-types">Excel · PDF · Word · фото · чертёж</span></motion.div>
        </div>
        <div className="hero-strip" id="delivery"><div className="delivery-title"><b>Авто · Ж/Д · Авиа</b><span>Срочная доставка снижает простой оборудования и персонала</span></div><a href="#request">Отправить заявку <span>→</span></a></div>
      </section>

      <section className="quick-search" aria-labelledby="quick-search-title">
        <div><p className="section-kicker">Технический поиск</p><h2 id="quick-search-title">Найти товар,<br /><em>марку или ГОСТ</em></h2></div>
        <div className="quick-search-tools"><form action="/poisk" method="get"><label htmlFor="home-search">Введите обозначение или название</label><div><input id="home-search" name="q" placeholder="12Х1МФ, ГОСТ 8732, труба 219×8" /><button type="submit">Найти →</button></div></form><nav aria-label="Инженерные инструменты"><Link href="/spravochnik-materialov">Материалы</Link><Link href="/spravochnik-gost">ГОСТ</Link><Link href="/kalkulyator-metalla">Калькулятор массы</Link></nav></div>
      </section>

      <section className="section priority-section" id="products">
        <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} variants={animation} transition={{ duration: .55 }}><p className="section-kicker">01 — Главные направления</p><h2>Трубы, СДТ<br />и <em>изоляция</em></h2><p>Подбираем продукцию по ГОСТ, ТУ, марке стали, геометрии и условиям эксплуатации. Проверяем совместимость требований до расчёта.</p></motion.div>
        <div className="priority-grid">
          {priorityProducts.map((product, index) => <motion.article key={product.slug} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={animation} transition={{ duration: .48, delay: index * .06 }}><span>{product.index}</span><h3>{product.title}</h3><p>{product.note}</p><small className="standard-list">{product.standards.replace(/(ГОСТ|ТУ|ОСТ|СТО) /g, '$1\u00A0')}</small><a href={`/produkciya/${product.slug}`} aria-label={`Подробнее: ${product.title}`}>Открыть товар <b>↗</b></a></motion.article>)}
        </div>
      </section>

      <section className="section catalog-section" id="gost">
        <div className="catalog-head"><div><p className="section-kicker light">02 — Трубный каталог</p><h2>Сортамент<br /><em>и стандарты</em></h2></div><p>Сверяем сортамент, технические условия, марку стали и требования к контролю. Если стандартной позиции нет — подбираем производство или технически корректную замену. <Link href="/spravochnik-materialov">Открыть справочник материалов →</Link></p></div>
        <div className="catalog-table" role="table" aria-label="Трубная продукция">
          <div className="catalog-row catalog-labels" role="row"><span>Тип продукции</span><span>Размеры</span><span>Стандарты</span><span>Марки / исполнение</span></div>
          {pipeCatalog.map(([title, size, standards, grades, href], index) => <motion.a className="catalog-row" role="row" href={href} aria-label={`Подробнее: ${title}`} key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .35 }} variants={animation} transition={{ duration: .42, delay: Math.min(index * .035, .2) }}><strong><i>{String(index + 1).padStart(2, '0')}</i>{title}</strong><span>{size}</span><span className="standard-list">{standards.replace(/(ГОСТ|ТУ|ОСТ|СТО) /g, '$1\u00A0')}</span><span>{grades}</span></motion.a>)}
        </div>
      </section>

      <section className="section company-trust-section" id="about" aria-labelledby="company-trust-title">
        <div className="company-trust-head">
          <div><p className="section-kicker">03 — О компании</p><h2 id="company-trust-title">Опыт, подтверждённый<br /><em>реальными поставками</em></h2></div>
          <p>«Мэджик Металл» комплектует промышленный металлопрокат, трубную продукцию, СДТ, запорную арматуру и материалы для сложных проектов в России и СНГ.</p>
        </div>
        <div className="company-metrics" aria-label="Опыт компании">
          <article><strong>20+ лет</strong><span>опыт специалистов на рынке металлопроката</span></article>
          <article><strong>100 000+ т</strong><span>совокупный объём реализованных поставок</span></article>
          <article><strong>500+</strong><span>позиций в доступном сортаменте</span></article>
          <article><strong>Россия и СНГ</strong><span>география промышленных проектов и поставок</span></article>
        </div>
        <div className="company-proof">
          <p className="company-proof-label">Опыт поставок для подрядных организаций и крупных промышленных проектов</p>
          <div className="company-brand-wall" aria-label="Компании, отрасли и проекты, связанные с опытом поставок">
            <article className="company-proof-card company-proof-card--gazprom">
              <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Gazprom_logo_in_russian_languaje.svg" alt="Газпром" loading="lazy" />
              <small>опыт поставок для подрядных организаций</small>
            </article>
            <article className="company-proof-card company-proof-card--rosneft">
              <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Rosneft_Logo_2016.svg" alt="Роснефть" loading="lazy" />
              <small>опыт поставок для подрядных организаций</small>
            </article>
            <article className="company-proof-card company-proof-card--atomic">
              <strong>Атомная<br />промышленность</strong>
              <small>подрядчики на строительных объектах</small>
            </article>
            <article className="company-proof-card company-proof-card--roscosmos">
              <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Roscosmos_logo_ru.svg" alt="Роскосмос" loading="lazy" />
              <small>космодром «Восточный»</small>
            </article>
            <article className="company-proof-card company-proof-card--alrosa">
              <img src="https://alrosa.ru/local/templates/alrosa/img/decor/logo-alrosa.jpg" alt="АЛРОСА" loading="lazy" />
              <small>опыт участия в промышленном проекте</small>
            </article>
            <article className="company-proof-card company-proof-card--sector company-proof-card--oilgas">
              <span>01</span><strong>Нефтегазовые<br />компании СНГ</strong>
            </article>
            <article className="company-proof-card company-proof-card--sector company-proof-card--industry">
              <span>02</span><strong>Автомобильная и<br />горнодобывающая промышленность</strong>
            </article>
            <article className="company-proof-card company-proof-card--sector company-proof-card--chemical">
              <span>03</span><strong>Химическая<br />промышленность СНГ</strong>
            </article>
          </div>
        </div>
        <div className="company-conversion">
          <p><strong>Восточный, Тенгиз, Карабатан, Kulevi Oil Terminal, нефтегазовые и промышленные объекты СНГ.</strong> Команда умеет работать со сложной спецификацией, контролем документов, сроками и доставкой на удалённые площадки.</p>
          <div className="company-actions">
            <a href="#request">Отправить заявку <span>↗</span></a>
            <a className="company-phone" href="tel:+79227117363">Позвонить <span>↗</span></a>
          </div>
        </div>
      </section>

      <section className="section other-section">
        <div className="section-heading compact"><p className="section-kicker">04 — Остальная номенклатура</p><h2>Металл для<br /><em>всего проекта</em></h2></div>
        <div className="other-list">{otherProducts.map(([title, text], index) => <motion.article key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .4 }} variants={animation} transition={{ duration: .38, delay: Math.min(index * .02, .14) }}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{text}</p><Link href={otherSeoLinks[title]} aria-label={`Подробнее: ${title}`}>↗</Link></motion.article>)}</div>
      </section>

      <section className="request-section" id="request">
        <div className="request-copy" id="contacts"><p className="section-kicker light">05 — Расчёт поставки</p><h2>Пришлите<br /><em>спецификацию</em></h2><p>Укажите требования и город доставки. Проверим спецификацию, предложим исполнение и подготовим коммерческое предложение.</p><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><a href="tel:+79227117363">+7 922 711-73-63</a></div>
        <form className="request-form" onSubmit={submitRequest} encType="multipart/form-data">
          <div className="form-grid"><label>Ваше имя<input name="name" autoComplete="name" required /></label><label>Компания<input name="company" autoComplete="organization" /></label><label>Телефон<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required /></label><label>Email<input name="email" type="email" autoComplete="email" /></label></div>
          <label>Направление<select name="productDirection" defaultValue=""><option value="">Выберите при необходимости</option><option value="electrowelded-pipes">Трубы электросварные</option><option value="seamless-pipes">Трубы бесшовные</option><option value="pipeline-parts">СДТ</option><option value="insulated">Трубы и СДТ в изоляции</option><option value="other">Другая продукция</option></select></label>
          <label>Что требуется<textarea name="message" rows={4} required placeholder="Размеры, марка стали, ГОСТ/ТУ, количество, город доставки" /></label>
          <label className="file-field"><span>Приложить файлы</span><span className="file-button">Выбрать файлы</span><input name="files" type="file" multiple accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.mp3,.m4a,.wav,.ogg,.webm,audio/*" onChange={(event) => setSelectedFiles(event.currentTarget.files?.length || 0)} /><strong>{selectedFiles ? `Выбрано файлов: ${selectedFiles}` : 'Файлы не выбраны'}</strong><small>Excel, PDF, Word, изображения, чертежи и аудио · до 25 МБ суммарно</small></label>
          <label className="honeypot" aria-hidden="true">Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="consent"><input name="consent" type="checkbox" required /><span>Согласен на <Link href="/politika-konfidencialnosti">обработку персональных данных</Link> для подготовки коммерческого предложения</span></label>
          <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'} <span>→</span></button>
          <AnimatePresence mode="wait">{status === 'success' && <motion.p className="form-status success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Заявка принята. Мы свяжемся с вами.</motion.p>}{status === 'error' && <motion.p className="form-status error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Не удалось отправить. Позвоните нам или напишите на m1@magicmet.ru.</motion.p>}</AnimatePresence>
        </form>
      </section>

      <footer className="footer"><Image src="/images/logo-hq.webp" alt="" width={92} height={68} /><p>ООО «Мэджик Металл» · поставки металла для промышленности</p><div><a href="tel:+79227117363">+7 922 711-73-63</a><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><Link href="/politika-konfidencialnosti">Политика</Link></div></footer>
    </main>
  )
}
