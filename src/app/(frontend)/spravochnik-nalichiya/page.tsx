import type { Metadata } from 'next'
import Link from 'next/link'
import MarketDirectory from '@/components/MarketDirectory'
import CartLink from '@/components/CartLink'
import QuoteDock from '@/components/QuoteDock'
import '../styles.css'

export const metadata: Metadata = {
  title: 'Размеры и наличие металлопроката | Мэджик Металл',
  description: 'Каталог размеров металлопроката по актуальным позициям Металлсервис с удобными фильтрами и формированием единого КП.',
}

export default function MarketDirectoryPage() {
  return <main className="market-page">
    <header className="market-header"><Link href="/">← Главная</Link><Link href="/#gost">Общий справочник</Link><CartLink /></header>
    <section className="market-intro"><p>Единый справочник по металлопрокату</p><h1>Размеры и <em>наличие</em></h1><span>В каталоге показываются только позиции и размеры из базы Металлсервис.</span></section>
    <section className="market-content"><div className="market-legend"><span className="stock-green"><i />На складе</span></div><MarketDirectory /></section><QuoteDock />
  </main>
}
