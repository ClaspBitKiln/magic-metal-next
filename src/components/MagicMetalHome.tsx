/* eslint-disable @next/next/no-img-element */
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { requestOnlyDirectoryQueries } from '@/data/catalogAvailability'
import { productDetailCatalog } from '@/data/productDetailCatalog'

const pipeCatalog = [
  ['Электросварные прямошовные и спиралешовные', 'Ø 15–1420 мм', 'ГОСТ 10704, 10705, 10706, 20295', 'Ст3, 20, 09Г2С, 17Г1СУ, 10Г2ФБЮ', '/produkciya/truby-elektrosvarnye'],
  ['Водогазопроводные', 'Ду 10–100', 'ГОСТ 3262-75', 'малоуглеродистые стали', '/produkciya/truby-elektrosvarnye/vodogazoprovodnye'],
  ['Профильные квадратные и прямоугольные', '15×15–400×200 мм', 'ГОСТ 8639, 8645, 30245', 'Ст3, 09Г2С, С245, С255, С355', '/produkciya/truby-elektrosvarnye/profilnye'],
  ['Бесшовные горячедеформированные', 'Ø 57–550 мм', 'ГОСТ 8732, ГОСТ 550; ТУ 14-3Р-55, 460, 1128', '10, 20, 35, 45, 09Г2С, 15ХМ, 12Х1МФ, 15Х1М1Ф, 10Х9МФБ', '/produkciya/truby-besshovnye/goryachedeformirovannye'],
  ['Бесшовные холоднодеформированные', 'Ø 5–53 мм', 'ГОСТ 8734', '10, 20, 35, 45, 10Г2, 15Х, 20Х, 40Х, 30ХГСА, 15ХМ', '/produkciya/truby-besshovnye/holodnodeformirovannye'],
  ['Котельные и крекинговые', 'По спецификации', 'ТУ 14-3Р-55; ГОСТ 550; ASTM A335', '20, 15ХМ, 12Х1МФ, 15Х1М1Ф, P5, P11, P22, P91', '/produkciya/truby-besshovnye/kotelnye'],
  ['Нержавеющие и коррозионностойкие', 'Ø 5–273 мм', 'ГОСТ 9940, 9941; ASTM A312', '08Х18Н10, 12Х18Н10Т, 10Х17Н13М2Т, TP304, TP316, TP321', '/produkciya/truby-besshovnye/nerzhaveyushchie'],
  ['Нефтяного сортамента', 'По проекту', 'ГОСТ 632, 633; API 5CT', 'НКТ, обсадные, бурильные трубы и муфты', '/produkciya/truby-besshovnye'],
  ['Отводы бесшовные', 'DN 15–1000', 'ГОСТ 17375, 30753, 17380', '2D и 3D · углеродистые, низколегированные и нержавеющие стали', '/produkciya/sdt/otvody-besshovnye'],
  ['Тройники бесшовные', 'DN 15–500', 'ГОСТ 17376, 17380', 'равнопроходные и переходные исполнения', '/produkciya/sdt/troyniki-besshovnye'],
  ['Переходы бесшовные', 'DN 20–500', 'ГОСТ 17378, 17380', 'концентрические и эксцентрические исполнения', '/produkciya/sdt/perekhody-besshovnye'],
  ['Фланцы', 'DN 10–4000', 'ГОСТ 33259', 'плоские, воротниковые, свободные · PN 1–250', '/produkciya/sdt/flantsy'],
  ['Заглушки и днища', 'По стандарту и чертежу', 'ГОСТ 17379, 6533; ОСТ, АТК', 'эллиптические, плоские и специальные исполнения', '/produkciya/sdt/zaglushki-i-dnishcha'],
]

const catalogGroups = [
  { title: 'Трубы', note: 'Электросварные, бесшовные, профильные, котельные, нержавеющие и нефтяного сортамента', items: pipeCatalog.slice(0, 8) },
  { title: 'СДТ', note: 'Отводы, тройники, переходы, фланцы, заглушки и днища', items: pipeCatalog.slice(8) },
]

const assortmentByProduct: Record<string, string[]> = {
  'Электросварные прямошовные и спиралешовные': ['gost-10704-91'],
  'Бесшовные горячедеформированные': ['gost-8732-2025'],
  'Бесшовные холоднодеформированные': ['gost-8734-75'],
  'Отводы бесшовные': ['gost-17375-2001', 'gost-30753-2001'],
  'Тройники бесшовные': ['gost-17376-2001'],
  'Переходы бесшовные': ['gost-17378-2001'],
  'Фланцы': ['gost-33259-2015'],
  'Заглушки и днища': ['gost-17379-2001'],
}

const hiddenDirectorySlugs = new Set(['krug-i-kvadrat', 'balka-shveller-ugolok'])

const otherCatalogGroups = [
  { title: 'Листовой и рулонный прокат', note: 'Горячекатаный, холоднокатаный, оцинкованный и прокат с покрытиями', categorySlug: 'listovoy-prokat' },
  { title: 'Сортовой и фасонный прокат', note: 'Арматура, круг, квадрат, полоса, уголок, балка и швеллер', categorySlug: 'sortovoy-i-fasonny-prokat' },
  { title: 'Нержавеющие и специальные стали', note: 'Лист, трубы, сортовой прокат и специальные марки', categorySlug: 'nerzhaveyushchaya-stal' },
  { title: 'Поковки и заготовки', note: 'Кольца, диски, валы, оси и поковки по чертежу', categorySlug: 'pokovki-i-zagotovki' },
  { title: 'Цветной металлопрокат', note: 'Алюминий и дюраль; медь, бронза и латунь; титан; олово; свинец; цинк; нихром; баббит', categorySlug: 'cvetnye-metally' },
  { title: 'Метизы и сварочные материалы', note: 'Крепёж, сетка, лента, проволока, электроды и расходные материалы', categorySlug: 'metizy-i-svarochnye-materialy' },
]

const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }

export default function MagicMetalHome() {
  const reducedMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [selectedFiles, setSelectedFiles] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const animation = useMemo(() => (reducedMotion ? {} : reveal), [reducedMotion])

  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  function continueRequest(event: FormEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    if (!form) return
    const data = new FormData(form)
    const message = String(data.get('message') || '').trim()
    const hasFiles = data.getAll('files').some((value) => value instanceof File && value.size > 0)
    if (!message && !hasFiles) {
      setFormStep(1)
      setStatus('error')
      setFormError('Прикрепите заявку или кратко опишите, что требуется.')
      return
    }
    setFormError('')
    setStatus('idle')
    setFormStep(2)
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const phone = String(data.get('phone') || '').trim()
    const email = String(data.get('email') || '').trim()
    const message = String(data.get('message') || '').trim()
    const hasFiles = data.getAll('files').some((value) => value instanceof File && value.size > 0)
    setFormError('')
    if (!phone && !email) {
      setStatus('error')
      setFormError('Укажите телефон или email, чтобы мы могли отправить расчёт.')
      return
    }
    if (!message && !hasFiles) {
      setStatus('error')
      setFormError('Прикрепите заявку или кратко опишите, что требуется.')
      return
    }
    setStatus('sending')
    data.set('startedAt', String(startedAt))
    data.set('landingPage', window.location.href)
    data.set('referrer', document.referrer)
    const params = new URLSearchParams(window.location.search)
    data.set('context', params.get('material') || params.get('standard') || params.get('product') || params.get('region') || '')
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) data.set(key, params.get(key) || '')
    try {
      const response = await fetch('/api/request', { method: 'POST', body: data })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || 'Не удалось отправить заявку')
      }
      form.reset()
      setSelectedFiles(0)
      setFormError('')
      setFormStep(1)
      setStatus('success')
      const analytics = window as Window & { ym?: (id: number, action: string, goal: string) => void; gtag?: (action: string, event: string, params?: Record<string, unknown>) => void }
      const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || 0)
      if (metrikaId) analytics.ym?.(metrikaId, 'reachGoal', 'request_sent')
      analytics.gtag?.('event', 'generate_lead', { product_direction: String(data.get('productDirection') || ''), context: String(data.get('context') || '') })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.')
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
          <LanguageSwitcher />
          <a className="top-cta" href="#request">Отправить заявку <span>↗</span></a>
          <button className="menu-button" type="button" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /><span /></button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <Image className="hero-visual" src="/images/hero-mercedes-v5.webp" alt="Брендированный грузовой автомобиль Mercedes-Benz Мэджик Металл, промышленное производство, металлопрокат, трубы и детали трубопроводов" fill priority sizes="100vw" />
        <div className="hero-copy" id="content">
          <motion.p initial="hidden" animate="visible" variants={animation} transition={{ duration: .24 }} className="hero-label">
            <span>СРОЧНЫЕ ПОСТАВКИ:</span>
            <strong>РОССИЯ · УЗБЕКИСТАН · КАЗАХСТАН · КЫРГЫЗСТАН · БЕЛАРУСЬ · ТУРЦИЯ</strong>
          </motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={animation} transition={{ duration: .28, delay: .04 }} id="hero-title">КОМПЛЕКТУЕМ <em>СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ</em> ЗАЯВКИ</motion.h1>
          <motion.p initial="hidden" animate="visible" variants={animation} transition={{ duration: .28, delay: .08 }} className="hero-lead">Проверяем требования и актуальность ГОСТов, находим редкие позиции и технически обоснованные аналоги. Комплектуем металл и сопутствующие материалы с полным пакетом документов — для поставок по России и на экспорт.</motion.p>
          <motion.div initial="hidden" animate="visible" variants={animation} transition={{ duration: .28, delay: .12 }} className="hero-actions"><a className="primary-button" href="#request">Отправить заявку <span>↗</span></a><span className="file-types">Excel · PDF · Word · фото · голосовое сообщение</span></motion.div>
        </div>
        <div className="hero-strip" id="delivery"><div className="delivery-title"><b>Авто · Ж/Д · Авиа</b><span>Срочная доставка снижает риск простоя оборудования и персонала, а также штрафных санкций за срыв сроков проекта</span></div><a href="#request">Отправить заявку <span>→</span></a></div>
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
              <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Gazprom_logo.svg" alt="Газпром" loading="lazy" />
            </li>
            <li>
              <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Rosneft_Logo_2016.svg" alt="Роснефть" loading="lazy" />
            </li>
            <li>
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rosatom_logo.png/250px-Rosatom_logo.png" alt="Госкорпорация «Росатом»" loading="lazy" />
            </li>
            <li>
              <img src="/images/clients/uztransgaz.svg" alt="АО «Узтрансгаз»" loading="lazy" />
            </li>
            <li>
              <img src="/images/clients/uzbekneftegaz.png" alt="АО «Узбекнефтегаз»" loading="lazy" />
            </li>
          </ul>
        </div>
      </section>

      <section className="reference-hub" id="gost" aria-labelledby="quick-search-title">
        <div className="quick-search">
          <div><p className="section-kicker">Единый технический справочник</p><h2 id="quick-search-title">Справочник<br /><em>по металлопрокату</em></h2></div>
          <div className="quick-search-tools"><p className="reference-purpose">Рабочий инструмент для снабжения и проектировщиков: основные параметры продукции, полный сортамент по ГОСТ, ориентир по наличию на рынке и варианты замены для последующей проверки на соответствие проекту.</p><form action="/poisk" method="get"><label htmlFor="home-search">Товар, размер, марка или ГОСТ</label><div><input id="home-search" name="q" placeholder="12Х1МФ, ГОСТ 8732, труба 219×8" /><button type="submit">Найти →</button></div></form><nav aria-label="Разделы справочника"><Link href="/spravochnik-nalichiya">Размеры и наличие</Link><Link href="#products">Все разделы</Link><Link href="/spravochnik-gost">ГОСТ и размеры</Link><Link href="/spravochnik-materialov">Материалы и аналоги</Link><Link href="/kalkulyator-metalla">Калькулятор массы</Link></nav></div>
        </div>
      <div className="product-unified" id="products" aria-labelledby="products-title">
      <div className="section catalog-section product-subsection">
        <div className="catalog-head"><div><p className="product-subsection-label">Единый каталог металлопроката</p><h2 id="products-title">Категории<br /><em>и номенклатура</em></h2></div><p>Все виды продукции собраны в одном непрерывном дереве без отдельных каталогов. СДТ — такой же раздел общей номенклатуры, как трубы, листовой и сортовой прокат.</p></div>
        {catalogGroups.map((group, groupIndex) => <details className="catalog-group" key={group.title} open={groupIndex === 0}>
          <summary><i className="catalog-toggle" aria-hidden="true" /><span><strong>{group.title}</strong><small>{group.note}</small></span></summary>
          <div className="catalog-table" aria-label={group.title}>
            <div className="catalog-row catalog-labels" role="row"><span>Номенклатура</span><span>Размеры</span><span>Стандарты</span><span>Марки / исполнение</span></div>
            {group.items.map(([title, size, standards, grades, href], index) => <motion.details className="catalog-item" key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .35 }} variants={animation} transition={{ duration: .42, delay: Math.min(index * .035, .2) }}>
              <summary className="catalog-row"><strong><i className="catalog-toggle" aria-hidden="true" /><span>{title}</span></strong><span>{size}</span><span className="standard-list">{standards.replace(/(ГОСТ|ТУ|ОСТ|СТО) /g, '$1\u00A0')}</span><span>{grades}</span></summary>
              <div className="home-size-series"><span>{assortmentByProduct[title]?.map((slug) => slug.replace('gost-', 'ГОСТ ').replaceAll('-', '–')).join(' · ') || 'Размеры по действующим стандартам'}</span>{requestOnlyDirectoryQueries.has(title) ? <Link className="verified-range-link" href="/#request">Запросить наличие и КП <b aria-hidden="true">→</b></Link> : <Link className="verified-range-link" href={`/spravochnik-nalichiya?q=${encodeURIComponent(title)}`}>Показать размеры и наличие <b aria-hidden="true">→</b></Link>}<Link className="catalog-detail-link" href={href}>Характеристики продукции</Link></div>
            </motion.details>)}
          </div>
        </details>)}
        <details className="catalog-group" key="insulation">
          <summary><i className="catalog-toggle" aria-hidden="true" /><span><strong>Трубы и СДТ в изоляции</strong><small>ППУ, ВУС, ЦПП и эпоксидные покрытия заводского нанесения</small></span></summary>
          <Link className="catalog-item-link catalog-category-link" href="/produkciya/truby-i-sdt-v-izolyacii"><span>Открыть номенклатуру, стандарты и размерный ряд</span><b aria-hidden="true">→</b></Link>
        </details>
        {otherCatalogGroups.map((group) => <details className="catalog-group" key={group.title}>
          <summary><i className="catalog-toggle" aria-hidden="true" /><span><strong>{group.title}</strong><small>{group.note}</small></span></summary>
          <div className="catalog-table" aria-label={group.title}>
            <div className="catalog-row catalog-labels" role="row"><span>Номенклатура</span><span>Размеры</span><span>Стандарты</span><span>Марки / исполнение</span></div>
            {productDetailCatalog.filter((item) => item.categorySlug === group.categorySlug && !hiddenDirectorySlugs.has(item.slug)).map((item, index) => <motion.details className="catalog-item" key={item.slug} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .35 }} variants={animation} transition={{ duration: .42, delay: Math.min(index * .035, .2) }}>
              <summary className="catalog-row"><strong><i className="catalog-toggle" aria-hidden="true" /><span>{item.shortTitle}</span></strong><span>{item.range.map((entry) => entry.value).join(' · ')}</span><span className="standard-list">{item.standards.join(' · ').replace(/(ГОСТ|ТУ|ОСТ|СТО) /g, '$1\u00A0')}</span><span>{item.grades.join(' · ')}</span></summary>
              <div className="home-size-series"><span>{item.range.map((entry) => `${entry.label}: ${entry.value}`).join(' · ')}</span>{requestOnlyDirectoryQueries.has(item.shortTitle) ? <Link className="verified-range-link" href="/#request">Запросить наличие и КП <b aria-hidden="true">→</b></Link> : <Link className="verified-range-link" href={`/spravochnik-nalichiya?q=${encodeURIComponent(item.shortTitle)}`}>Показать размеры и наличие <b aria-hidden="true">→</b></Link>}<Link className="catalog-detail-link" href={`/produkciya/${item.categorySlug}/${item.slug}`}>Характеристики продукции</Link></div>
            </motion.details>)}
          </div>
        </details>)}
        <details className="catalog-group">
          <summary><i className="catalog-toggle" aria-hidden="true" /><span><strong>Оборудование и комплектующие</strong><small>Промышленное оборудование, детали и нестандартные позиции по техническому заданию</small></span></summary>
          <Link className="catalog-item-link catalog-category-link" href="/?product=komplektuyushchie#request"><span>Отправить техническое задание</span><b aria-hidden="true">→</b></Link>
        </details>
      </div>
      </div>
      </section>

      <section className="request-section" id="request">
        <div className="request-copy" id="contacts"><h2>Отправьте<br /><em>заявку</em></h2><p>Укажите требования и город доставки. Проверим спецификацию, предложим исполнение и подготовим коммерческое предложение.</p><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><a href="tel:+79227117363">+7 922 711-73-63</a></div>
        <form className="request-form" onSubmit={submitRequest} encType="multipart/form-data" noValidate>
          <div className="form-stage" hidden={formStep !== 1}>
            <div className="form-step"><strong>1. Прикрепите заявку или опишите задачу</strong><span>Подойдёт готовый файл, фотография, текст или голосовое сообщение.</span></div>
            <label className="file-field"><span>Приложить заявку</span><span className="file-button">Выбрать файлы</span><input name="files" type="file" multiple accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.mp3,.m4a,.wav,.ogg,.webm,audio/*" onChange={(event) => setSelectedFiles(event.currentTarget.files?.length || 0)} /><strong>{selectedFiles ? `Выбрано файлов: ${selectedFiles}` : 'Файлы не выбраны'}</strong><small>Excel, PDF, Word, фото, чертежи и аудио · до 25 МБ суммарно</small></label>
            <div className="form-or"><span>или</span></div>
            <label>Краткое описание<textarea name="message" rows={3} placeholder="Что требуется: наименование, размер, ГОСТ/ТУ, количество и город доставки" /></label>
            <button className="form-next" type="button" onClick={continueRequest}>Продолжить <span>→</span></button>
          </div>
          <div className="form-stage" hidden={formStep !== 2}>
            <div className="form-step"><strong>2. Куда отправить расчёт?</strong><span>Укажите телефон или email. Остальные поля — по желанию.</span></div>
            <div className="form-grid"><label>Ваше имя<input name="name" autoComplete="name" /></label><label>Компания<input name="company" autoComplete="organization" /></label><label>Телефон<input name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label><label>Email<input name="email" type="email" autoComplete="email" /></label></div>
            <label>Направление<select name="productDirection" defaultValue=""><option value="">Выберите при необходимости</option><option value="electrowelded-pipes">Трубы электросварные</option><option value="seamless-pipes">Трубы бесшовные</option><option value="pipeline-parts">СДТ</option><option value="insulated">Трубы и СДТ в изоляции</option><option value="other">Другая продукция</option></select></label>
            <label className="honeypot" aria-hidden="true" hidden>Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
            <label className="consent"><input name="consent" type="checkbox" required /><span>Согласен на <Link href="/politika-konfidencialnosti">обработку персональных данных</Link> для подготовки коммерческого предложения</span></label>
            <button className="form-back" type="button" onClick={() => { setStatus('idle'); setFormError(''); setFormStep(1) }}>← Изменить заявку</button>
            <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'} <span>→</span></button>
          </div>
          <AnimatePresence mode="wait">{status === 'success' && <motion.p className="form-status success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Заявка принята. Мы свяжемся с вами.</motion.p>}{status === 'error' && <motion.p className="form-status error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{formError || 'Не удалось отправить. Позвоните нам или напишите на m1@magicmet.ru.'}</motion.p>}</AnimatePresence>
        </form>
      </section>

      <footer className="footer"><Image src="/images/logo-hq.webp" alt="" width={92} height={68} /><p>ООО «Мэджик Металл» · поставки металла для промышленности</p><div><a href="tel:+79227117363">+7 922 711-73-63</a><a href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><Link href="/politika-konfidencialnosti">Политика</Link></div></footer>
    </main>
  )
}
