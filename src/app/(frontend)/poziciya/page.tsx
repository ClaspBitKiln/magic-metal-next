import type { Metadata } from 'next'
import Link from 'next/link'
import CatalogPosition from '@/components/CatalogPosition'
import CartLink from '@/components/CartLink'
import '../styles.css'

export const metadata: Metadata = {
  title: 'Карточка позиции | Мэджик Металл',
  description: 'Размер, наличие, теоретическая масса и характеристики позиции металлопроката.',
}

export default async function PositionPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams
  const backHref = returnTo?.startsWith('/spravochnik-nalichiya') ? returnTo : '/spravochnik-nalichiya'
  return <main className="position-page">
    <header className="position-header"><Link href={backHref}>← К результатам</Link><Link href="/">Главная</Link><CartLink /></header>
    <CatalogPosition />
  </main>
}
