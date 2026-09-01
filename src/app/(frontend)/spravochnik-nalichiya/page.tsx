import type { Metadata } from 'next'
import Link from 'next/link'
import MarketDirectory from '@/components/MarketDirectory'
import CartLink from '@/components/CartLink'
import '../styles.css'

export const metadata: Metadata = {
  title: 'Размеры и наличие металлопроката | Мэджик Металл',
  description: 'Единый практический размерный ряд металлопроката: подтверждённые складские позиции и типоразмеры с уточнением наличия.',
}

export default function MarketDirectoryPage() {
  return <main className="market-page">
    <header className="market-header"><Link href="/">← Главная</Link><Link href="/#gost">Общий справочник</Link><CartLink /></header>
    <section className="market-intro"><p>Единый справочник по металлопрокату</p><h1>Размеры и <em>наличие</em></h1><span>Зелёные позиции подтверждены складским прайсом. Жёлтые входят в практический рыночный ряд — фактическое наличие и исполнение проверяем по заявке.</span></section>
    <section className="market-content"><div className="market-legend"><span className="stock-green"><i />На складе</span><span className="stock-yellow"><i />Наличие уточняется</span><span className="stock-red"><i />Под заказ</span></div><MarketDirectory /></section>
  </main>
}
