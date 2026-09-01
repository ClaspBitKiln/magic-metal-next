'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/quoteCart'

type Item = { id: string; product: string; size: string; designation: string; standard: string }

export default function AddToQuoteButton({ item, compact = false }: { item: Item; compact?: boolean }) {
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const add = () => { addToCart(item); setAdded(true) }
  return <div className={`add-to-quote${compact ? ' compact' : ''}`}>
    <button type="button" onClick={add}>{added ? 'Добавлено ✓' : compact ? '+ В КП' : 'Добавить для КП'}</button>
    {added && !compact && <button type="button" className="quote-secondary" onClick={() => router.push('/korzina')}>Перейти к КП →</button>}
  </div>
}
