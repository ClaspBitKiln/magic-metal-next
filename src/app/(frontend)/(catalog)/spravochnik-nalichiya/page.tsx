import type { Metadata } from 'next'
import Link from 'next/link'
import MarketDirectory from '@/components/MarketDirectory'
export const metadata: Metadata = {
  title: 'Размеры и наличие металлопроката | Мэджик Металл',
  description: 'Размеры и наличие металлопроката с удобными фильтрами и формированием единого коммерческого предложения.',
}

export default function MarketDirectoryPage() {
  // The homepage is a plain HTML Route Handler; use a document link to initialize its form.
  const requestHref = '/#request'
  return <main className="market-page">
    <header className="market-header"><Link href="/">← Главная</Link><Link href="/#products">Общий каталог</Link><a href={requestHref}>Отправить заявку ↗</a></header>
    <section className="market-intro"><p>Каталог металлопроката</p><h1>Размеры и <em>наличие</em></h1><span>Выберите нужную позицию и отправьте заявку.</span></section>
    <section className="market-content"><div className="market-legend"><span className="stock-green"><i />На складе</span></div><MarketDirectory /></section>
  </main>
}
