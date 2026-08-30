import type { Metadata } from 'next'
import Link from 'next/link'
import QuoteCart from '@/components/QuoteCart'
import '../styles.css'

export const metadata: Metadata = { title: 'Корзина запроса КП | Мэджик Металл', description: 'Сводный запрос коммерческого предложения на металлопрокат.' }
export default function CartPage() { return <main className="quote-page"><header className="position-header"><Link href="/spravochnik-nalichiya">← К каталогу</Link><Link href="/">Главная</Link></header><QuoteCart /></main> }
