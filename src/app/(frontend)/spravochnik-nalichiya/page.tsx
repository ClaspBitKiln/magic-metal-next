import type { Metadata } from 'next'
import Link from 'next/link'
import MarketDirectory from '@/components/MarketDirectory'
import CartLink from '@/components/CartLink'
import QuoteDock from '@/components/QuoteDock'
import '../styles.css'

export const metadata: Metadata = {
  title: 'Размеры и наличие металлопроката | Мэджик Металл',
  description: 'Размеры и наличие металлопроката с удобными фильтрами и формированием единого коммерческого предложения.',
}

export default function MarketDirectoryPage() {
  return <main className="market-page">
    <header className="market-header"><Link href="/">← Главная</Link><Link href="/#gost">Общий справочник</Link><CartLink /></header>
    <section className="market-intro"><p>Каталог металлопроката</p><h1>Размеры и <em>наличие</em></h1><span>Выберите нужные позиции и добавьте их в заявку.</span></section>
    <section className="market-content"><div className="market-legend"><span className="stock-green"><i />На складе</span></div><MarketDirectory /></section><QuoteDock />
  </main>
}
