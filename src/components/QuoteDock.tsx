'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readCart, type QuoteItem } from '@/lib/quoteCart'

export default function QuoteDock() {
  const [items, setItems] = useState<QuoteItem[]>([])

  useEffect(() => {
    const sync = () => setItems(readCart())
    sync()
    window.addEventListener('magicmetal:cart', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('magicmetal:cart', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!items.length) return null

  return <aside className="quote-dock" aria-live="polite">
    <div><b>{items.length}</b><span>Выбрано для единого КП</span></div>
    <Link href="/korzina">Указать количество и запросить КП →</Link>
  </aside>
}
