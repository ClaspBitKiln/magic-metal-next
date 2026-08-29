'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { materials } from '@/data/materials'

const examples = ['09Г2С', '12Х18Н10Т', 'AISI 316L', 'ГОСТ 4543']

function normalize(value: string) {
  return value.toLocaleLowerCase('ru-RU').replace(/[\s–—_-]+/g, '')
}

export default function MaterialsSearch() {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query)
  const results = useMemo(() => {
    if (!normalizedQuery) return []
    return materials.filter((material) => normalize([
      material.designation,
      material.name,
      material.groupLabel,
      material.summary,
      ...material.standards,
      ...material.properties,
      ...material.applications,
      ...material.forms,
      ...material.analogs,
    ].join(' ')).includes(normalizedQuery)).slice(0, 12)
  }, [normalizedQuery])

  return (
    <section className="materials-search" aria-labelledby="materials-search-title">
      <div className="materials-search-copy">
        <p>Быстрый поиск</p>
        <h2 id="materials-search-title">Найдите марку, ГОСТ или аналог</h2>
        <span>Поиск учитывает обозначение, назначение, свойства, форму поставки и справочные соответствия.</span>
      </div>
      <div className="materials-search-control">
        <label htmlFor="materials-query">Марка или характеристика материала</label>
        <div>
          <input
            id="materials-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например: 09Г2С, жаростойкая, AISI 321"
            autoComplete="off"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
        </div>
        <nav aria-label="Примеры поиска">
          {examples.map((example) => <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>)}
        </nav>
      </div>
      {normalizedQuery && <div className="materials-search-results" aria-live="polite">
        <p>{results.length ? `Найдено: ${results.length}` : 'Точного совпадения пока нет'}</p>
        {results.length > 0
          ? <div className="materials-search-table">{results.map((material) => <Link href={`/spravochnik-materialov/${material.slug}`} key={material.slug}>
            <b>{material.designation}</b>
            <span>{material.name}</span>
            <small>{material.groupLabel}</small>
            <i aria-hidden="true">→</i>
          </Link>)}</div>
          : <span>Попробуйте другое обозначение или отправьте техническое задание — проверим материал вручную.</span>}
      </div>}
    </section>
  )
}
