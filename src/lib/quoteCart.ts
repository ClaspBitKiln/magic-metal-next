export type QuoteItem = {
  id: string
  product: string
  size: string
  designation: string
  standard: string
  quantity: number
  unit: 'т' | 'м' | 'шт.'
  note: string
}

export const CART_KEY = 'magicmetal-quote-cart-v1'

export function readCart(): QuoteItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') as QuoteItem[] } catch { return [] }
}

export function writeCart(items: QuoteItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('magicmetal:cart', { detail: items }))
}

export function addToCart(item: Omit<QuoteItem, 'quantity' | 'unit' | 'note'>) {
  const current = readCart()
  if (!current.some((entry) => entry.id === item.id)) current.push({ ...item, quantity: 1, unit: 'т', note: '' })
  writeCart(current)
  return current
}
