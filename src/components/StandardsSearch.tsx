'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { catalogStandards } from '@/data/catalogStandards'

function normalize(value: string) {
  return value.toLocaleLowerCase('ru-RU').replace(/[\s–—_-]+/g, '')
}

export default function StandardsSearch() {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query)
  const results = useMemo(() => {
    if (!normalizedQuery) return []
    return catalogStandards.filter((standard) => normalize([
      standard.code,
      standard.title,
      standard.summary,
      standard.groupLabel,
      ...standard.scope,
      ...standard.checkBeforeOrder,
    ].join(' ')).includes(normalizedQuery)).sort((a, b) => (
      Number(!normalize(a.code).includes(normalizedQuery)) - Number(!normalize(b.code).includes(normalizedQuery))
    )).slice(0, 12)
  }, [normalizedQuery])

  return (
    <section className="materials-search" aria-labelledby="standards-search-title">
      <div className="materials-search-copy">
        <p>Быстрый поиск</p>
        <h2 id="standards-search-title">Найдите нужный ГОСТ</h2>
        <span>Ищите по номеру документа, названию, продукции или области применения.</span>
      </div>
      <div className="materials-search-control">
        <label htmlFor="standards-query">Номер ГОСТ или название</label>
        <div>
          <input
            id="standards-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например: ГОСТ 8732 или трубы"
            autoComplete="off"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
        </div>
        <nav aria-label="Примеры поиска">
          {['ГОСТ 8732', 'трубы', 'фланцы'].map((example) => <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>)}
        </nav>
      </div>
      {normalizedQuery && <div className="materials-search-results" aria-live="polite">
        <p>{results.length ? `Найдено: ${results.length}` : 'Совпадений нет'}</p>
        {results.length > 0
          ? <div>{results.map((standard) => <Link href={`/spravochnik-gost/${standard.slug}`} key={standard.slug}>
            <b>{standard.code}</b>
            <span>{standard.title}</span>
            <small>{standard.groupLabel}</small>
            <i aria-hidden="true">→</i>
          </Link>)}</div>
          : <span>Попробуйте номер ГОСТ, название продукции или отправьте спецификацию.</span>}
      </div>}
    </section>
  )
}
