import type { Metadata } from 'next'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'

import CatalogSearch from '@/components/CatalogSearch'
import { catalogStandards } from '@/data/catalogStandards'
import { standards } from '@/data/standards'
import type { SearchItem } from '@/data/searchIndex'
import './search.css'

export const metadata: Metadata = {
  title: 'Поиск по продукции, материалам и ГОСТ',
  description: 'Единый поиск по каталогу металлопроката, маркам сталей и сплавов, ГОСТам и техническим направлениям.',
  alternates: { canonical: '/poisk' }, robots: { index: true, follow: true },
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams
  const initialQuery = Array.isArray(q) ? q[0] || '' : q || ''
  const originalSlugs = new Set(standards.map(item => item.slug))
  const extraStandards: SearchItem[] = catalogStandards.filter(item => !originalSlugs.has(item.slug)).map(item => ({
    type: 'standard', typeLabel: 'ГОСТ', title: item.code, subtitle: item.title, description: item.summary,
    href: `/spravochnik-gost/${item.slug}`, searchText: [item.code, item.title, item.summary, ...item.scope].join(' '),
  }))
  return <main className="search-page">
    <header className="search-header"><Link prefetch={false} href="/"><b>←</b> На главную</Link><LanguageSwitcher /><Link prefetch={false} href="/#request">Отправить заявку ↗</Link></header>
    <section className="search-hero"><p>Единый технический поиск</p><h1>Найти<br /><em>точное исполнение</em></h1><span>Ищите по названию продукции, марке стали или ГОСТ. Уже есть готовая спецификация? Можно сразу отправить её на расчёт — искать товары необязательно.</span><Link className="search-quick-request" href="/#request">Отправить готовую заявку ↗</Link></section>
    <CatalogSearch key={initialQuery} extraStandards={extraStandards} initialQuery={initialQuery} />
  </main>
}
