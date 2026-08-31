'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { readCart, writeCart, type QuoteItem } from '@/lib/quoteCart'

export default function QuoteCart() {
  const [items, setItems] = useState<QuoteItem[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [startedAt] = useState(() => Date.now())
  useEffect(() => {
    const frame = requestAnimationFrame(() => setItems(readCart()))
    return () => cancelAnimationFrame(frame)
  }, [])

  const update = (id: string, patch: Partial<QuoteItem>) => {
    const next = items.map((item) => item.id === id ? { ...item, ...patch } : item)
    setItems(next); writeCart(next)
  }
  const remove = (id: string) => { const next = items.filter((item) => item.id !== id); setItems(next); writeCart(next) }
  const message = useMemo(() => items.map((item, index) => `${index + 1}. ${item.product}; ${item.size}; ${item.designation || 'марка не указана'}; ${item.standard || 'НД уточнить'} — ${item.quantity} ${item.unit}${item.note ? `; ${item.note}` : ''}`).join('\n'), [items])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    if (!String(data.get('phone') || '').trim() && !String(data.get('email') || '').trim()) {
      setStatus('error'); setError('Укажите телефон или email, чтобы мы могли отправить КП.'); return
    }
    setStatus('sending')
    data.set('message', `Запрос коммерческого предложения:\n\n${message}\n\nКомментарий: ${String(data.get('comment') || '—')}`)
    data.set('context', 'Корзина справочника металлопроката')
    data.set('productDirection', 'other'); data.set('landingPage', window.location.href); data.set('startedAt', String(startedAt))
    try {
      const response = await fetch('/api/request', { method: 'POST', body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Не удалось отправить запрос')
      writeCart([]); setItems([]); setStatus('success')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ошибка отправки'); setStatus('error') }
  }

  if (status === 'success') return <section className="quote-success"><p>Запрос принят</p><h1>Подготовим коммерческое предложение</h1><span>Уточним остатки, сроки и доставку, затем свяжемся с вами.</span><Link href="/spravochnik-nalichiya">Вернуться в каталог</Link></section>
  if (!items.length) return <section className="quote-empty"><h1>Корзина пуста</h1><p>Добавьте позиции из справочника, чтобы запросить единое КП.</p><Link href="/spravochnik-nalichiya">Открыть каталог →</Link></section>

  return <div className="quote-layout">
    <section className="quote-items"><header><div><p>Корзина запроса</p><h1>Позиции для КП</h1></div><b>{items.length}</b></header>
      {items.map((item) => <article key={item.id}><div className="quote-item-main"><Link href={`/poziciya?id=${item.id}`}>{item.product}</Link><span>{item.size} · {item.designation || 'марка не указана'} · {item.standard || 'НД уточнить'}</span></div><label>Кол-во<input type="number" min="0.001" step="any" value={item.quantity} onChange={(event) => update(item.id, { quantity: Math.max(.001, Number(event.target.value) || 1) })} /></label><label>Ед.<select value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value as QuoteItem['unit'] })}><option>т</option><option>м</option><option>шт.</option></select></label><label className="quote-note">Примечание<input value={item.note} onChange={(event) => update(item.id, { note: event.target.value })} placeholder="Длина, резка, документы…" /></label><button type="button" onClick={() => remove(item.id)} aria-label={`Удалить ${item.product}`}>Удалить</button></article>)}
      <Link className="quote-continue" href="/spravochnik-nalichiya">← Добавить ещё позиции</Link>
    </section>
    <form className="quote-form" onSubmit={submit}><p>Получить КП</p><h2>Куда отправить предложение?</h2><small>Укажите телефон или email — достаточно одного способа связи.</small><label>Имя<input name="name" autoComplete="name" /></label><label>Компания<input name="company" autoComplete="organization" /></label><label>Телефон<input name="phone" type="tel" autoComplete="tel" /></label><label>Email<input name="email" type="email" autoComplete="email" /></label><label>Спецификация<input name="files" type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png" /></label><label>Комментарий<textarea name="comment" rows={4} placeholder="Адрес доставки, желаемый срок, особые требования" /></label><input className="quote-honeypot" name="website" tabIndex={-1} autoComplete="off" /><button disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Запросить КП ↗'}</button>{error && <span className="quote-error" role="alert" aria-live="polite">{error}</span>}<small>Цена, фактический остаток и срок поставки подтверждаются в КП.</small></form>
  </div>
}
