'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/quoteCart'

type Item = { id: string; product: string; size: string; designation: string; standard: string }

export default function AddToQuoteButton({ item }: { item: Item }) {
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const add = () => { addToCart(item); setAdded(true) }
  return <div className="add-to-quote">
    <button type="button" onClick={add}>{added ? 'Добавлено в корзину ✓' : 'Добавить для КП'}</button>
    {added && <button type="button" className="quote-secondary" onClick={() => router.push('/korzina')}>Перейти к КП →</button>}
  </div>
}
