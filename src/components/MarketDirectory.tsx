'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddToQuoteButton from '@/components/AddToQuoteButton'
import { formatProductTitle, matchesCatalogQuery } from '@/lib/catalogSearch'
import { decodeCatalogSnapshot, type CatalogPriceRow as PriceRow, type CatalogSnapshot as Snapshot } from '@/lib/catalogSnapshot'

type PracticalGroup = {
  id: string
  title: string
  stockProducts: string[]
  queries: string[]
  sizes: string[]
}

type PracticalSnapshot = {
  snapshotDate: string
  checkedAt: string
  statusRule: string
  groupCount: number
  sizeCount: number
  groups: PracticalGroup[]
}

type DirectoryGroup = { rows: PriceRow[]; practical?: PracticalGroup }

const preferredCategories = ['Трубы', 'Сортовой прокат (цена от 5 т.)', 'Листовой прокат', 'Качественный прокат', 'Нержавейка', 'Цветной прокат', 'Метизы метсырьё', 'Крепеж', 'Инженерные системы', 'Профнастил']
const categoryLabel = (value: string) => ({
  'Сортовой прокат (цена от 5 т.)': 'Сортовой прокат',
  'Качественный прокат': 'Качественные стали',
  'Нержавейка': 'Нержавеющий прокат',
  'Метизы метсырьё': 'Метизы и метсырьё',
  'Крепеж': 'Крепёж',
} as Record<string, string>)[value] || value

const positionWord = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'позиция' : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100) ? 'позиции' : 'позиций'
const normalizeSize = (value: string) => value.toLocaleLowerCase('ru').replace(/[×хx]/g, 'x').replace(/\s+/g, '').replaceAll(',', '.')
const numericParts = (value: string) => [...value.matchAll(/\d+(?:[,.]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')))
const compareSizes = (left: string, right: string) => {
  const leftParts = numericParts(left)
  const rightParts = numericParts(right)
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? -1) - (rightParts[index] ?? -1)
    if (difference) return difference
  }
  return left.localeCompare(right, 'ru', { numeric: true })
}

function MarketProductGroup({ group, globalSearch, openByDefault, filtersActive }: { group: DirectoryGroup; globalSearch: boolean; openByDefault: boolean; filtersActive: boolean }) {
  const router = useRouter()
  const [opened, setOpened] = useState(openByDefault)
  const [visibleCount, setVisibleCount] = useState(50)
  const product = group.practical?.title || formatProductTitle(group.rows[0].product)
  const category = group.rows[0].category
  const stockSizeKeys = useMemo(() => new Set(group.rows.map((row) => normalizeSize(row.size))), [group.rows])
  const practicalSizes = useMemo(() => filtersActive ? [] : (group.practical?.sizes || []).filter((size) => !stockSizeKeys.has(normalizeSize(size))).sort(compareSizes), [filtersActive, group.practical, stockSizeKeys])
  const pipeDimensions = Boolean(group.practical?.id.startsWith('pipe-')) || group.rows.every((row) => row.diameter && row.wall)
  const combinedRows = useMemo(() => [
    ...group.rows.map((row) => ({ kind: 'stock' as const, size: row.size, row })),
    ...practicalSizes.map((size) => ({ kind: 'practical' as const, size })),
  ].sort((left, right) => compareSizes(left.size, right.size)), [group.rows, practicalSizes])
  const visibleRows = combinedRows.slice(0, visibleCount)

  return <details className="market-group" open={opened} onToggle={(event) => setOpened(event.currentTarget.open)}>
    <summary><i aria-hidden="true" /><span><small>{globalSearch ? categoryLabel(category) : 'Подраздел'}</small><b>{product}</b><small>{group.rows.length} {positionWord(group.rows.length)} на складе{group.practical ? ` · ${group.practical.sizes.length.toLocaleString('ru-RU')} в практическом ряду` : ''}</small></span><em className={practicalSizes.length ? 'stock-yellow' : 'stock-green'}><i />{practicalSizes.length ? 'Склад + под заказ' : 'На складе'}</em></summary>
    {opened && <>
      {group.practical && <div className="market-practical-note"><b>Практический размерный ряд</b><span>Размер присутствует в отраслевом предложении, но не означает текущий остаток. Зелёным отмечены только позиции из подтверждённого складского прайса.</span></div>}
      <div className="market-table-wrap"><table><thead><tr>{pipeDimensions ? <><th>Диаметр / профиль</th><th>Толщина стенки</th></> : <th>Размер</th>}<th>Марка / исполнение</th><th>ГОСТ / ТУ</th><th>Наличие</th><th><span className="visually-hidden">Действие</span></th></tr></thead><tbody>
        {visibleRows.map((entry, rowIndex) => {
          if (entry.kind === 'stock') {
            const row = entry.row
            const positionUrl = `/poziciya?id=${row.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
            const openPosition = () => router.push(positionUrl)
            return <tr className="market-position-row" tabIndex={0} role="link" aria-label={`Открыть ${formatProductTitle(row.product)}, ${row.size}`} onClick={openPosition} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPosition() } }} key={`${row.id}-${rowIndex}`}>{pipeDimensions ? <><td data-label="Диаметр / профиль">{row.diameter || row.size}</td><td data-label="Толщина стенки">{row.wall || '—'}</td></> : <td data-label="Размер">{row.size}</td>}<td data-label="Марка / исполнение">{row.designation || '—'}</td><td data-label="ГОСТ / ТУ">{row.standard || 'По прайсу'}</td><td data-label="Наличие"><span className="stock-green"><i />На складе</span></td><td data-label="Действие" className="market-row-action" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><AddToQuoteButton compact item={{ id: row.id, product: row.product, size: row.size, designation: row.designation, standard: row.standard }} /></td></tr>
          }
          const size = entry.size
          const parts = size.split('×')
          const isProfile = group.practical?.id === 'pipe-profile-rectangle' || group.practical?.id === 'pipe-profile-square'
          const diameter = isProfile && parts.length > 2 ? parts.slice(0, -1).join('×') : parts[0]
          const wall = parts.length > 1 ? parts.at(-1) : '—'
          const requestUrl = `/?product=${encodeURIComponent(product)}&size=${encodeURIComponent(size)}#request`
          return <tr className="market-position-row market-practical-row" tabIndex={0} role="link" aria-label={`Запросить ${product}, ${size}`} onClick={() => router.push(requestUrl)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); router.push(requestUrl) } }} key={`practical-${size}-${rowIndex}`}>{pipeDimensions ? <><td data-label="Диаметр / профиль">{diameter}</td><td data-label="Толщина стенки">{wall}</td></> : <td data-label="Размер">{size}</td>}<td data-label="Марка / исполнение">По заявке</td><td data-label="ГОСТ / ТУ">Проверим по спецификации</td><td data-label="Наличие"><span className="stock-yellow"><i />Под заказ</span></td><td data-label="Действие" className="market-row-action"><span>Открыть заявку →</span></td></tr>
        })}
      </tbody></table></div>
      {visibleCount < combinedRows.length && <button className="market-show-more" type="button" onClick={() => setVisibleCount((count) => count + 50)}>Показать ещё 50 <span>{visibleCount.toLocaleString('ru-RU')} из {combinedRows.length.toLocaleString('ru-RU')}</span></button>}
    </>}
  </details>
}

export default function MarketDirectory() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [practicalSnapshot, setPracticalSnapshot] = useState<PracticalSnapshot | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Трубы')
  const [mainSize, setMainSize] = useState('')
  const [wall, setWall] = useState('')
  const [designation, setDesignation] = useState('')
  const [standard, setStandard] = useState('')
  const [loadError, setLoadError] = useState(false)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    Promise.all([
      fetch('/data/mc-price-snapshot.json').then((response) => {
        if (!response.ok) throw new Error('stock catalog load failed')
        return response.json()
      }),
      fetch('/data/practical-size-snapshot.json').then((response) => {
        if (!response.ok) throw new Error('practical catalog load failed')
        return response.json() as Promise<PracticalSnapshot>
      }),
    ]).then(([stockPayload, practicalData]) => {
      const stockData = decodeCatalogSnapshot(stockPayload)
      const params = new URLSearchParams(window.location.search)
      const initialQuery = params.get('q') || ''
      const initialCategory = params.get('category')
      setQuery(initialQuery)
      if (initialCategory && stockData.rows.some((row) => row.category === initialCategory)) setCategory(initialCategory)
      setSnapshot(stockData)
      setPracticalSnapshot(practicalData)
    }).catch(() => setLoadError(true))
  }, [])

  const categories = useMemo(() => snapshot ? preferredCategories.filter((item) => snapshot.rows.some((row) => row.category === item)) : [], [snapshot])
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    snapshot?.rows.forEach((row) => counts.set(row.category, (counts.get(row.category) || 0) + 1))
    return counts
  }, [snapshot])
  const practicalByProduct = useMemo(() => {
    const map = new Map<string, PracticalGroup>()
    practicalSnapshot?.groups.forEach((group) => group.stockProducts.forEach((product) => map.set(product, group)))
    return map
  }, [practicalSnapshot])
  const filterSourceRows = useMemo(() => snapshot ? snapshot.rows.filter((row) => (deferredQuery.trim() || row.category === category) && matchesCatalogQuery(row, deferredQuery)) : [], [snapshot, category, deferredQuery])
  const filterOptions = useMemo(() => {
    const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort(compareSizes)
    return {
      sizes: unique(filterSourceRows.map((row) => row.diameter || row.size.split(/[×хx]/)[0].trim())),
      walls: unique(filterSourceRows.map((row) => row.wall)),
      designations: unique(filterSourceRows.map((row) => row.designation)),
      standards: unique(filterSourceRows.map((row) => row.standard)),
    }
  }, [filterSourceRows])
  const filtersActive = Boolean(mainSize || wall || designation || standard)
  const groups = useMemo(() => {
    if (!snapshot) return []
    const globalSearch = Boolean(deferredQuery.trim())
    const rows = snapshot.rows.filter((row) => (globalSearch || row.category === category) && matchesCatalogQuery(row, deferredQuery) && (!mainSize || (row.diameter || row.size.split(/[×хx]/)[0].trim()) === mainSize) && (!wall || row.wall === wall) && (!designation || row.designation === designation) && (!standard || row.standard === standard))
    const grouped = new Map<string, DirectoryGroup>()
    rows.forEach((row) => {
      const practical = practicalByProduct.get(row.product)
      const key = practical ? `practical:${practical.id}` : `stock:${row.category}\u001f${row.product}`
      const current = grouped.get(key) || { rows: [], practical }
      current.rows.push(row)
      grouped.set(key, current)
    })
    return [...grouped.values()]
  }, [snapshot, category, deferredQuery, practicalByProduct, mainSize, wall, designation, standard])

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

  const selectCategory = (value: string) => {
    setCategory(value)
    setQuery('')
    setMainSize(''); setWall(''); setDesignation(''); setStandard('')
  }
  const resetFilters = () => { setMainSize(''); setWall(''); setDesignation(''); setStandard('') }

  if (loadError) return <div className="market-empty"><b>Не удалось загрузить справочник</b><span>Проверьте соединение и обновите страницу.</span><button onClick={() => window.location.reload()}>Повторить</button></div>
  if (!snapshot || !practicalSnapshot) return <div className="market-loading">Загружаем размерные ряды…</div>

  return <>
    <div className="market-toolbar">
      <label><span>Поиск сразу по всему справочнику</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номенклатура, размер, марка или ГОСТ" /></label>
      <p><b>{snapshot.rowCount.toLocaleString('ru-RU')}</b> на складе · <b>{practicalSnapshot.sizeCount.toLocaleString('ru-RU')}</b> типоразмеров в практическом ряду</p>
    </div>
    <ol className="market-flow" aria-label="Как запросить коммерческое предложение"><li><b>01</b><span>Найдите размер</span></li><li><b>02</b><span>Добавьте позиции</span></li><li><b>03</b><span>Укажите объём и получите КП</span></li></ol>
    <div className="market-filters" aria-label="Фильтры каталога">
      <label><span>Основной размер</span><select value={mainSize} onChange={(event) => setMainSize(event.target.value)}><option value="">Все размеры</option>{filterOptions.sizes.map((value) => <option value={value} key={value}>{value} мм</option>)}</select></label>
      <label><span>Толщина</span><select value={wall} onChange={(event) => setWall(event.target.value)}><option value="">Все толщины</option>{filterOptions.walls.map((value) => <option value={value} key={value}>{value} мм</option>)}</select></label>
      <label><span>Марка / исполнение</span><select value={designation} onChange={(event) => setDesignation(event.target.value)}><option value="">Все марки</option>{filterOptions.designations.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label><span>ГОСТ / ТУ</span><select value={standard} onChange={(event) => setStandard(event.target.value)}><option value="">Все стандарты</option>{filterOptions.standards.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <button type="button" onClick={resetFilters} disabled={!filtersActive}>Сбросить</button>
    </div>
    <label className="market-category-select"><span>Раздел справочника</span><select value={category} onChange={(event) => selectCategory(event.target.value)}>{categories.map((item) => <option value={item} key={item}>{categoryLabel(item)} — {categoryCounts.get(item)?.toLocaleString('ru-RU')}</option>)}</select></label>
    <div className="market-browser">
      <nav className="market-tabs" aria-label="Разделы справочника">{categories.map((item) => <button className={!query && item === category ? 'active' : ''} onClick={() => selectCategory(item)} key={item}><span>{categoryLabel(item)}</span><b>{categoryCounts.get(item)?.toLocaleString('ru-RU')}</b></button>)}</nav>
      <section className="market-results">
        <div className="market-category-title"><span>{query ? 'Поиск по всем разделам' : 'Раздел'}</span><h2>{query ? `Результаты: «${query}»` : categoryLabel(category)}</h2>{query && <button onClick={() => setQuery('')}>Сбросить поиск</button>}</div>
        <div className="market-groups">
          {groups.map((group, index) => <MarketProductGroup group={group} globalSearch={Boolean(query)} openByDefault={(Boolean(query) || filtersActive) && groups.length === 1 && index === 0} filtersActive={filtersActive} key={`${group.practical?.id || group.rows[0].product}-${query}-${mainSize}-${wall}-${designation}-${standard}`} />)}
          {!groups.length && <div className="market-empty"><b>Позиции не найдены</b><span>Типоразмер может быть изготовлен по ГОСТ или ТУ после проверки спецификации.</span><Link href="/#request">Запросить изготовление и КП →</Link></div>}
        </div>
      </section>
    </div>
  </>
}
