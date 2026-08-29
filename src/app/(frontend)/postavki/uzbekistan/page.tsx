import type { Metadata } from 'next'
import Link from 'next/link'

import '../../spravochnik-materialov/materials.css'

export const metadata: Metadata = {
  title: 'Поставка металлопроката в Узбекистан',
  description: 'Комплексная поставка труб, СДТ, металлопроката, нержавеющих и цветных металлов в Узбекистан по спецификации.',
  alternates: { canonical: '/postavki/uzbekistan' },
}

const directions = [
  ['Трубы электросварные', 'truby-elektrosvarnye'],
  ['Трубы бесшовные', 'truby-besshovnye'],
  ['Соединительные детали трубопроводов', 'sdt'],
  ['Трубы и СДТ в изоляции', 'truby-i-sdt-v-izolyacii'],
  ['Нержавеющая сталь', 'nerzhaveyushchaya-stal'],
  ['Цветные металлы', 'cvetnye-metally'],
]

export default function UzbekistanSupplyPage() {
  return <main className="materials-page material-detail">
    <header className="materials-header"><Link href="/"><b>←</b> На главную</Link><Link className="materials-cta" href="/?region=uzbekistan#request">Отправить заявку ↗</Link></header>
    <section className="materials-hero"><p>Россия · СНГ · приоритетный рынок</p><h1>Поставки<br /><em>в Узбекистан</em></h1><span>Комплектуем промышленную заявку, проверяем стандарты и документы, согласовываем маршрут и поставляем металлопрокат в Узбекистан.</span></section>
    <section className="material-content">
      <article className="material-intro"><p>Работа по спецификации</p><h2>Одна заявка — комплексная поставка</h2><span>Подбираем российское, стран СНГ или импортное исполнение внутри товарного направления. Уточняем город назначения, сроки, вид транспорта, требования к упаковке и комплекту документов до расчёта.</span><Link href="/?region=uzbekistan#request">Отправить заявку <b>→</b></Link></article>
      <div className="material-facts">
        <section><h2>Направления</h2><span>трубы, СДТ и изоляция</span><span>листовой и сортовой прокат</span><span>поковки и заготовки</span><span>нержавеющие и цветные металлы</span></section>
        <section><h2>Логистика</h2><span>автомобильная доставка</span><span>железнодорожная доставка</span><span>авиа — для срочных и критичных позиций</span><span>маршрут согласовывается по заявке</span></section>
        <section><h2>Проверяем</h2><span>марку и нормативный документ</span><span>размеры и исполнение</span><span>контроль и сертификаты</span><span>упаковку и маркировку</span></section>
        <section><h2>Для расчёта</h2><span>спецификация или чертёж</span><span>количество</span><span>город поставки в Узбекистане</span><span>требуемый срок</span></section>
      </div>
    </section>
    <section className="material-products"><p>Приоритетная номенклатура</p><h2>Что поставляем в Узбекистан</h2><div>{directions.map(([label, slug]) => <Link href={`/produkciya/${slug}`} key={slug}>{label}<b>↗</b></Link>)}</div></section>
    <section className="materials-note"><p>Расчёт поставки</p><h2>Пришлите спецификацию</h2><span>Форматы Excel, PDF, Word, фото и чертежи. Укажите город назначения — подготовим вариант комплектации и логистики.</span><Link href="/?region=uzbekistan#request">Отправить заявку ↗</Link></section>
  </main>
}
