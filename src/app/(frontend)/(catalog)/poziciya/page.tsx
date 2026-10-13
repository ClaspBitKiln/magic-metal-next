import type { Metadata } from 'next'
import Link from 'next/link'
import CatalogPosition from '@/components/CatalogPosition'
export const metadata: Metadata = {
  title: 'Карточка позиции | Мэджик Металл',
  description: 'Размер, наличие, теоретическая масса и характеристики позиции металлопроката.',
}

export default async function PositionPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams
  const backHref = returnTo?.startsWith('/spravochnik-nalichiya') ? returnTo : '/spravochnik-nalichiya'
  // The homepage is a plain HTML Route Handler; use a document link to initialize its form.
  const requestHref = '/#request'
  return <main className="position-page">
    <header className="position-header"><Link href={backHref}>← К результатам</Link><Link href="/">Главная</Link><a href={requestHref}>Отправить заявку ↗</a></header>
    <CatalogPosition />
  </main>
}
