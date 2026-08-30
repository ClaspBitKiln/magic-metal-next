'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readCart, type QuoteItem } from '@/lib/quoteCart'

export default function CartLink() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const sync = (event?: Event) => setCount(event instanceof CustomEvent ? (event.detail as QuoteItem[]).length : readCart().length)
    sync(); window.addEventListener('magicmetal:cart', sync); window.addEventListener('storage', sync)
    return () => { window.removeEventListener('magicmetal:cart', sync); window.removeEventListener('storage', sync) }
  }, [])
  return <Link className="cart-link" href="/korzina" aria-label={`Корзина запроса: ${count} позиций`}>Корзина <b>{count}</b></Link>
}
