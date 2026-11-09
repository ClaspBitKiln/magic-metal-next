import type { Metadata } from 'next'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'

import '../../spravochnik-materialov/materials.css'

export const metadata: Metadata = {
  title: 'Металлопрокат в Казахстан — заявка по спецификации',
  description: 'Запрос на трубы, СДТ, нержавеющие и цветные металлы для Казахстана. Пришлите спецификацию, количество и город назначения для расчёта предложения.',
  alternates: { canonical: '/postavki/kazakhstan' },
}

const directions = [
  ['Трубы электросварные', 'truby-elektrosvarnye'],
  ['Трубы бесшовные', 'truby-besshovnye'],
  ['Соединительные детали трубопроводов', 'sdt'],
  ['Трубы и СДТ в изоляции', 'truby-i-sdt-v-izolyacii'],
  ['Нержавеющая сталь', 'nerzhaveyushchaya-stal'],
  ['Цветные металлы', 'cvetnye-metally'],
]

const requestHref = '/?region=kazakhstan#request'

export default function KazakhstanSupplyPage() {
  return <main className="materials-page material-detail">
    <header className="materials-header"><Link href="/"><b>←</b> На главную</Link><LanguageSwitcher /><Link className="materials-cta" href={requestHref}>Отправить заявку ↗</Link></header>
    <section className="materials-hero"><p>Россия · СНГ · Казахстан</p><h1>Поставки<br /><em>в Казахстан</em></h1><span>Пришлите промышленную спецификацию и город назначения в Казахстане. Уточним параметры продукции и условия поставки для расчёта предложения.</span></section>
    <section className="material-content">
      <article className="material-intro"><p>Работа по спецификации</p><h2>Готовая заявка — без поиска по каталогу</h2><span>Приложите Excel, PDF, Word или чертёж. Укажите город и адрес назначения, количество, требуемый срок и документы. Если часть параметров неизвестна, опишите задачу — уточним их при подготовке предложения.</span><Link href={requestHref}>Отправить заявку <b>→</b></Link></article>
      <div className="material-facts">
        <section><h2>Для расчёта</h2><span>город и адрес назначения в Казахстане</span><span>спецификация или чертёж</span><span>количество и единицы измерения</span><span>требуемый срок</span></section>
        <section><h2>Параметры продукции</h2><span>марка материала и стандарт</span><span>размеры и исполнение</span><span>требования к контролю и документам</span><span>допустимость замены — только по согласованию</span></section>
        <section><h2>Условия предложения</h2><span>маршрут и способ перевозки уточняются по заявке</span><span>упаковка и маркировка — по требованиям заказа</span><span>наличие, стоимость и срок подтверждаются отдельно</span><span>условия приёмки и разгрузки укажите в заявке</span></section>
        <section><h2>Связаться с нами</h2><a className="fact-link" style={{ minHeight: 44, alignItems: 'center' }} href="tel:+79227117363">+7 922 711-73-63</a><a className="fact-link" style={{ minHeight: 44, alignItems: 'center' }} href="mailto:m1@magicmet.ru">m1@magicmet.ru</a><span>Для расчёта укажите город назначения в Казахстане.</span></section>
      </div>
    </section>
    <section className="material-products"><p>Существующий каталог</p><h2>Выбрать продукцию для заявки</h2><div>{directions.map(([label, slug]) => <Link href={`/produkciya/${slug}`} key={slug}>{label}<b>↗</b></Link>)}</div></section>
    <section className="materials-note"><p>Расчёт предложения</p><h2>Пришлите спецификацию</h2><span>В форме заявки можно прикрепить файл и описать требования. Укажите Казахстан, город назначения и количество — эти данные нужны для расчёта.</span><Link href={requestHref}>Отправить заявку ↗</Link></section>
  </main>
}
