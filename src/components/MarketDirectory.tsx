'use client'

import { useEffect, useMemo, useState } from 'react'

type PriceRow = {
  category: string
  product: string
  designation: string
  size: string
  unit: string
  standard: string
  status: 'green'
  checkedAt: string
}

type Snapshot = { snapshotDate: string; rowCount: number; rows: PriceRow[] }

const preferredCategories = ['Трубы', 'Сортовой прокат (цена от 5 т.)', 'Листовой прокат', 'Качественный прокат', 'Нержавейка', 'Цветной прокат', 'Метизы метсырьё', 'Крепеж', 'Инженерные системы', 'Профнастил']

const formatProductTitle = (value: string) => {
  const lower = value.toLocaleLowerCase('ru')
  let title = `${lower.charAt(0).toLocaleUpperCase('ru')}${lower.slice(1)}`
    .replace(/гост/giu, 'ГОСТ')
    .replace(/ГОСТ(?=\d)/g, 'ГОСТ ')
    .replace(/(^|[^а-яё])ту(?=[^а-яё]|$)/giu, '$1ТУ')
    .replace(/вгп/giu, 'ВГП')
  if (title.includes('Трубы г/д (катаные, нефтепров)')) title = title.replace('Трубы г/д (катаные, нефтепров)', 'Трубы бесшовные горячедеформированные ·')
  if (title.includes('Трубы х/д (тянутые,бесшовные)')) title = title.replace('Трубы х/д (тянутые,бесшовные)', 'Трубы бесшовные холоднодеформированные ·')
  if (title === 'Трубы электросварные квадрат') title = 'Трубы профильные квадратные'
  if (title === 'Трубы электросварные прямоуг') title = 'Трубы профильные прямоугольные'
  return title
}

const positionWord = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'позиция' : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100) ? 'позиции' : 'позиций'

export default function MarketDirectory() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Трубы')

  useEffect(() => {
    fetch('/data/mc-price-snapshot.json').then((response) => response.json()).then((data) => {
      setQuery(new URLSearchParams(window.location.search).get('q') || '')
      setSnapshot(data)
    })
  }, [])

  const categories = useMemo(() => snapshot ? preferredCategories.filter((item) => snapshot.rows.some((row) => row.category === item)) : [], [snapshot])
  const groups = useMemo(() => {
    if (!snapshot) return []
    const needle = query.trim().toLocaleLowerCase('ru')
    const rows = snapshot.rows.filter((row) => row.category === category && (!needle || `${row.product} ${row.designation} ${row.size} ${row.standard}`.toLocaleLowerCase('ru').includes(needle)))
    const grouped = new Map<string, PriceRow[]>()
    rows.forEach((row) => grouped.set(row.product, [...(grouped.get(row.product) || []), row]))
    return [...grouped.entries()]
  }, [snapshot, category, query])

  if (!snapshot) return <div className="market-loading">Загружаем размерные ряды…</div>

  return <>
    <div className="market-toolbar">
      <label><span>Поиск по номенклатуре, размеру, марке или ГОСТу</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: 108×4, 09Г2С, ГОСТ 8732" /></label>
      <p><b>{snapshot.rowCount.toLocaleString('ru-RU')}</b> подтверждённых позиций · снимок прайсов {snapshot.snapshotDate}</p>
    </div>
    <nav className="market-tabs" aria-label="Разделы прайса">{categories.map((item) => <button className={item === category ? 'active' : ''} onClick={() => { setCategory(item); setQuery('') }} key={item}>{item}</button>)}</nav>
    <div className="market-category-title"><span>Раздел</span><h2>{category}</h2></div>
    <div className="market-groups">
      {groups.map(([product, rows], index) => <details className="market-group" key={product} open={Boolean(query) && index < 8}>
        <summary><i aria-hidden="true" /><span><small>Подраздел</small><b>{formatProductTitle(product)}</b><small>{rows.length} {positionWord(rows.length)}</small></span><em><i />На складе</em></summary>
        <div className="market-table-wrap"><table><thead><tr><th>Размер</th><th>Марка / исполнение</th><th>ГОСТ / ТУ</th><th>Наличие</th></tr></thead><tbody>
          {rows.map((row, rowIndex) => <tr key={`${row.designation}-${row.size}-${rowIndex}`}><td>{row.size}</td><td>{row.designation || '—'}</td><td>{row.standard || 'По прайсу'}</td><td><span className="stock-green"><i />На складе</span></td></tr>)}
        </tbody></table></div>
      </details>)}
      {!groups.length && <div className="market-empty">По вашему запросу позиций не найдено.</div>}
    </div>
  </>
}
