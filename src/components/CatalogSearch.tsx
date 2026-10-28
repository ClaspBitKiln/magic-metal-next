'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { normalizeSearch, searchIndex, type SearchItem } from '@/data/searchIndex'
import { parseSizeSearchQuery } from '@/lib/sizeSearchQuery'

type Filter = 'all' | SearchItem['type']
const emptyItems: SearchItem[] = []

export default function CatalogSearch({ extraStandards = emptyItems, initialQuery = '' }: { extraStandards?: SearchItem[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>('all')
  const [visibleCount, setVisibleCount] = useState(40)
  const [dimensionResponse, setDimensionResponse] = useState<{ query: string; items: SearchItem[]; error?: string } | null>(null)
  const index = useMemo(() => [...searchIndex, ...extraStandards], [extraStandards])
  const sizeQuery = Boolean(parseSizeSearchQuery(query))

  useEffect(() => {
    const restore = () => {
      setQuery(new URLSearchParams(window.location.search).get('q') || '')
      setVisibleCount(40)
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])

  useEffect(() => {
    if (!sizeQuery) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog-search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Поиск размеров временно недоступен. Откройте каталог или отправьте параметры в заявке.')
        const data = await response.json() as { items: SearchItem[] }
        setDimensionResponse({ query, items: data.items })
      } catch (error) {
        if (!controller.signal.aborted) setDimensionResponse({ query, items: [], error: error instanceof Error ? error.message : 'Поиск размеров недоступен.' })
      }
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, sizeQuery])

  const changeQuery = (value: string) => {
    setQuery(value)
    setVisibleCount(40)
    const url = new URL(window.location.href)
    if (value) url.searchParams.set('q', value)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url.pathname + url.search)
  }

  const results = useMemo(() => {
    if (sizeQuery) return (dimensionResponse?.query === query ? dimensionResponse.items : []).filter(item => filter === 'all' || item.type === filter)
    const normalized = normalizeSearch(query)
    const tokens = normalized.split(' ').filter(Boolean)
    return index
      .filter(item => filter === 'all' || item.type === filter)
      .map(item => {
        const title = normalizeSearch(item.title)
        const haystack = normalizeSearch(`${item.title} ${item.searchText}`)
        if (tokens.length && !tokens.every(token => haystack.includes(token))) return null
        const score = !normalized ? 0 : title === normalized ? 100 : title.startsWith(normalized) ? 70 : title.includes(normalized) ? 50 : tokens.reduce((sum, token) => sum + (title.includes(token) ? 10 : 1), 0)
        return { item, score }
      })
      .filter((result): result is { item: SearchItem; score: number } => Boolean(result))
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ru'))
      .map(result => result.item)
  }, [dimensionResponse, filter, index, query, sizeQuery])
  const loading = sizeQuery && dimensionResponse?.query !== query
  const error = sizeQuery && dimensionResponse?.query === query ? dimensionResponse.error : undefined

  return <section className="search-workspace" aria-busy={loading}>
    <div className="search-box">
      <label htmlFor="catalog-query">Товар, размер, марка, ГОСТ или назначение</label>
      <div><input id="catalog-query" value={query} maxLength={200} onChange={event => changeQuery(event.target.value)} autoFocus placeholder="Например: труба 57×3, лист 10, ГОСТ 8734" /><button type="button" onClick={() => changeQuery('')} aria-label="Очистить поиск">×</button></div>
      <p>Название, марка и ГОСТ — по справочнику. Размеры — по нормативным таблицам каталога; наличие подтверждаем по заявке.</p>
    </div>
    <div className="search-filters" aria-label="Фильтр результатов">
      {([['all', 'Всё'], ['product', 'Продукция'], ['material', 'Материалы'], ['standard', 'ГОСТ']] as [Filter, string][]).map(([key, label]) => <button className={filter === key ? 'active' : ''} aria-pressed={filter === key} type="button" onClick={() => { setFilter(key); setVisibleCount(40) }} key={key}>{label}</button>)}
    </div>
    <div className="search-summary"><span role="status" aria-live="polite">{loading ? 'Ищем размер в таблицах…' : error ? 'Поиск размеров недоступен' : query ? `Найдено: ${results.length}` : `В индексе: ${index.length}`}</span>{query && <a href={`/?product=${encodeURIComponent(query)}#request`}>Не нашли точное исполнение? Отправить заявку →</a>}</div>
    {error && <p role="alert">{error}</p>}
    <div className="search-results"><div className="search-results-head"><span>Раздел</span><span>Позиция</span><span>Описание</span><i aria-hidden="true" /></div>{results.slice(0, visibleCount).map(item => <Link prefetch={false} href={item.href} aria-label={`Открыть: ${item.title}`} key={`${item.type}-${item.href}`}><small>{item.typeLabel}</small><h2>{item.title}</h2><span className="search-result-description"><h3>{item.subtitle}</h3><p>{item.description}</p></span><b aria-hidden="true">→</b></Link>)}</div>
    {results.length > visibleCount && <button className="search-more" type="button" onClick={() => setVisibleCount(count => count + 40)}>Показать ещё · {visibleCount} из {results.length}</button>}
    {!loading && !error && results.length === 0 && <div className="search-empty">
      <h2>Точного совпадения пока нет</h2>
      <p>Проверьте название, размер, марку или номер ГОСТ. Можно открыть общий каталог или отправить запрос — введённые параметры сохранятся.</p>
      {/* The homepage is an HTML Route Handler; document navigation initializes its form. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/#products">Открыть каталог →</a>
      <a href={`/?product=${encodeURIComponent(query)}#request`}>Отправить заявку ↗</a>
    </div>}
  </section>
}
