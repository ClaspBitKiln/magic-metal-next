import type { Metadata } from 'next'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'

import CatalogSearch from '@/components/CatalogSearch'
import './search.css'

export const metadata: Metadata = {
  title: 'Поиск по продукции, материалам и ГОСТ',
  description: 'Единый поиск по каталогу металлопроката, маркам сталей и сплавов, ГОСТам и техническим направлениям.',
  alternates: { canonical: '/poisk' }, robots: { index: true, follow: true },
}

export default function SearchPage() {
  return <main className="search-page">
    <header className="search-header"><Link href="/"><b>←</b> На главную</Link><LanguageSwitcher /><Link href="/#request">Отправить заявку ↗</Link></header>
    <section className="search-hero"><p>Единый технический поиск</p><h1>Найти<br /><em>точное исполнение</em></h1><span>Ищите по названию продукции, марке стали или сплава, номеру ГОСТ и области применения.</span></section>
    <CatalogSearch />
  </main>
}
