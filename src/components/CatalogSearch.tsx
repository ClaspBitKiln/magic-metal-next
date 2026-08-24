'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { normalizeSearch, searchIndex, type SearchItem } from '@/data/searchIndex'

type Filter = 'all' | SearchItem['type']

export default function CatalogSearch() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') || ''
    // URL is an external source; initialize it only after hydration to keep the route static.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(initial)
  }, [])

  const results = useMemo(() => {
    const normalized = normalizeSearch(query)
    const tokens = normalized.split(' ').filter(Boolean)
    return searchIndex
      .filter((item) => filter === 'all' || item.type === filter)
      .map((item) => {
        const title = normalizeSearch(item.title)
        const haystack = normalizeSearch(`${item.title} ${item.searchText}`)
        if (tokens.length && !tokens.every((token) => haystack.includes(token))) return null
        const score = !normalized ? 0 : title === normalized ? 100 : title.startsWith(normalized) ? 70 : title.includes(normalized) ? 50 : tokens.reduce((sum, token) => sum + (title.includes(token) ? 10 : 1), 0)
        return { item, score }
      })
      .filter((result): result is { item: SearchItem; score: number } => Boolean(result))
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ru'))
      .slice(0, 40)
  }, [filter, query])

  return <section className="search-workspace">
    <div className="search-box">
      <label htmlFor="catalog-query">Товар, марка, ГОСТ или назначение</label>
      <div><input id="catalog-query" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Например: 12Х1МФ, ГОСТ 8732, бесшовная труба" /><button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button></div>
      <p>Поиск работает в браузере по готовому индексу — без задержки и запроса к серверу.</p>
    </div>
    <div className="search-filters" aria-label="Фильтр результатов">
      {([['all', 'Всё'], ['product', 'Продукция'], ['material', 'Материалы'], ['standard', 'ГОСТ']] as [Filter, string][]).map(([key, label]) => <button className={filter === key ? 'active' : ''} type="button" onClick={() => setFilter(key)} key={key}>{label}</button>)}
    </div>
    <div className="search-summary"><span>{query ? `Найдено: ${results.length}` : `В индексе: ${searchIndex.length}`}</span>{query && <Link href={`/?material=${encodeURIComponent(query)}#request`}>Не нашли точное исполнение? Отправить заявку →</Link>}</div>
    <div className="search-results">{results.map(({ item }) => <Link href={item.href} key={`${item.type}-${item.href}`}><small>{item.typeLabel}</small><h2>{item.title}</h2><h3>{item.subtitle}</h3><p>{item.description}</p><b>Открыть →</b></Link>)}</div>
    {results.length === 0 && <div className="search-empty"><h2>Точного совпадения пока нет</h2><p>Попробуйте обозначение без года, размерности или пришлите спецификацию — мы разберём запрос вручную.</p><Link href={`/?material=${encodeURIComponent(query)}#request`}>Отправить спецификацию ↗</Link></div>}
  </section>
}
