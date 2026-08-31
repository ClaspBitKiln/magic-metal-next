'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatProductTitle, matchesCatalogQuery } from '@/lib/catalogSearch'
import { decodeCatalogSnapshot, type CatalogPriceRow as PriceRow, type CatalogSnapshot as Snapshot } from '@/lib/catalogSnapshot'

const preferredCategories = ['Трубы', 'Сортовой прокат (цена от 5 т.)', 'Листовой прокат', 'Качественный прокат', 'Нержавейка', 'Цветной прокат', 'Метизы метсырьё', 'Крепеж', 'Инженерные системы', 'Профнастил']
const categoryLabel = (value: string) => ({
  'Сортовой прокат (цена от 5 т.)': 'Сортовой прокат',
  'Качественный прокат': 'Качественные стали',
  'Нержавейка': 'Нержавеющий прокат',
  'Метизы метсырьё': 'Метизы и метсырьё',
  'Крепеж': 'Крепёж',
} as Record<string, string>)[value] || value

const positionWord = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'позиция' : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100) ? 'позиции' : 'позиций'

export default function MarketDirectory() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Трубы')
  const [loadError, setLoadError] = useState(false)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    fetch('/data/mc-price-snapshot.json').then((response) => {
      if (!response.ok) throw new Error('catalog load failed')
      return response.json()
    }).then((payload) => {
      const data = decodeCatalogSnapshot(payload)
      const params = new URLSearchParams(window.location.search)
      const initialQuery = params.get('q') || ''
      const initialCategory = params.get('category')
      setQuery(initialQuery)
      if (initialCategory && data.rows.some((row: PriceRow) => row.category === initialCategory)) setCategory(initialCategory)
      setSnapshot(data)
    }).catch(() => setLoadError(true))
  }, [])

  const categories = useMemo(() => snapshot ? preferredCategories.filter((item) => snapshot.rows.some((row) => row.category === item)) : [], [snapshot])
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    snapshot?.rows.forEach((row) => counts.set(row.category, (counts.get(row.category) || 0) + 1))
    return counts
  }, [snapshot])
  const groups = useMemo(() => {
    if (!snapshot) return []
    const globalSearch = Boolean(deferredQuery.trim())
    const rows = snapshot.rows.filter((row) => (globalSearch || row.category === category) && matchesCatalogQuery(row, deferredQuery))
    const grouped = new Map<string, PriceRow[]>()
    rows.forEach((row) => {
      const key = `${row.category}\u001f${row.product}`
      grouped.set(key, [...(grouped.get(key) || []), row])
    })
    return [...grouped.values()]
  }, [snapshot, category, deferredQuery])

  useEffect(() => {
    if (!snapshot) return
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (query.trim()) params.set('q', query)
      else params.delete('q')
      params.set('category', category)
      router.replace(`/spravochnik-nalichiya?${params.toString()}`, { scroll: false })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [category, query, router, snapshot])

  const updateQuery = (value: string) => {
    setQuery(value)
  }

  const selectCategory = (value: string) => {
    setCategory(value)
    setQuery('')
  }

  if (loadError) return <div className="market-empty"><b>Не удалось загрузить справочник</b><span>Проверьте соединение и обновите страницу.</span><button onClick={() => window.location.reload()}>Повторить</button></div>
  if (!snapshot) return <div className="market-loading">Загружаем размерные ряды…</div>

  return <>
    <div className="market-toolbar">
      <label><span>Поиск сразу по всему справочнику</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Номенклатура, размер, марка или ГОСТ" /></label>
      <p><b>{snapshot.rowCount.toLocaleString('ru-RU')}</b> подтверждённых позиций · снимок прайсов {snapshot.snapshotDate}</p>
    </div>
    <label className="market-category-select"><span>Раздел справочника</span><select value={category} onChange={(event) => selectCategory(event.target.value)}>{categories.map((item) => <option value={item} key={item}>{categoryLabel(item)} — {categoryCounts.get(item)?.toLocaleString('ru-RU')}</option>)}</select></label>
    <div className="market-browser">
      <nav className="market-tabs" aria-label="Разделы справочника">{categories.map((item) => <button className={!query && item === category ? 'active' : ''} onClick={() => selectCategory(item)} key={item}><span>{categoryLabel(item)}</span><b>{categoryCounts.get(item)?.toLocaleString('ru-RU')}</b></button>)}</nav>
      <section className="market-results">
    <div className="market-category-title"><span>{query ? 'Поиск по всем разделам' : 'Раздел'}</span><h2>{query ? `Результаты: «${query}»` : categoryLabel(category)}</h2>{query && <button onClick={() => updateQuery('')}>Сбросить поиск</button>}</div>
    <div className="market-groups">
      {groups.map((rows, index) => {
        const product = rows[0].product
        const hasPipeDimensions = rows.every((row) => row.diameter && row.wall)
        return <details className="market-group" key={`${rows[0].category}-${product}`} open={Boolean(query) && groups.length === 1 && index === 0}>
        <summary><i aria-hidden="true" /><span><small>{query ? categoryLabel(rows[0].category) : 'Подраздел'}</small><b>{formatProductTitle(product)}</b><small>{rows.length} {positionWord(rows.length)}</small></span><em><i />На складе</em></summary>
        <div className="market-table-wrap"><table><thead><tr>{hasPipeDimensions ? <><th>Диаметр / профиль</th><th>Толщина стенки</th></> : <th>Размер</th>}<th>Марка / исполнение</th><th>ГОСТ / ТУ</th><th>Наличие</th></tr></thead><tbody>
          {rows.map((row, rowIndex) => {
            const positionUrl = `/poziciya?id=${row.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
            const openPosition = () => router.push(positionUrl)
            return <tr className="market-position-row" tabIndex={0} role="link" aria-label={`Открыть ${formatProductTitle(row.product)}, ${row.size}`} onClick={openPosition} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPosition() } }} key={`${row.designation}-${row.size}-${rowIndex}`}>{hasPipeDimensions ? <><td data-label="Диаметр / профиль">{row.diameter}</td><td data-label="Толщина стенки">{row.wall}</td></> : <td data-label="Размер">{row.size}</td>}<td data-label="Марка / исполнение">{row.designation || '—'}</td><td data-label="ГОСТ / ТУ">{row.standard || 'По прайсу'}</td><td data-label="Наличие"><span className="stock-green"><i />На складе</span></td></tr>
          })}
        </tbody></table></div>
      </details>})}
      {!groups.length && <div className="market-empty"><b>Подтверждённого наличия не найдено</b><span>Позиция может поставляться под заказ. Не подменяем её похожим товаром без проверки.</span><Link href="/#request">Запросить проверку и КП →</Link></div>}
    </div>
      </section>
    </div>
  </>
}
