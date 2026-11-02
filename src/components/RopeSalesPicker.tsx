'use client'

import { useState } from 'react'
import { getRopeSalesDiameters, ropeSalesConstructions, ropeSalesSizedRequestHref } from '@/data/ropeSalesAssortment'
import { formatDimensionValue } from '@/lib/dimensionDisplay'

export default function RopeSalesPicker() {
  const [construction, setConstruction] = useState('')
  const [diameter, setDiameter] = useState('')
  const diameters = getRopeSalesDiameters(construction)
  const hasSizeSeries = diameters.length > 0
  const number = Number(diameter.replace(',', '.'))
  const validDiameter = /^\d+(?:[.,]\d+)?$/.test(diameter.trim()) && number >= 1 && number <= 56
  const valid = Boolean(construction) && validDiameter && (!hasSizeSeries || diameters.includes(number))
  let href: string | null = null

  if (valid) {
    if (hasSizeSeries) href = ropeSalesSizedRequestHref(construction, number)
    else {
      const product = `Канаты стальные; конструкция ${construction}; диаметр ${formatDimensionValue(diameter.trim())} мм — уточнить по запросу; исполнение, длина и количество — уточнить`
      href = `/?product=${encodeURIComponent(product)}#request`
    }
  }

  return <div className="rope-sales-picker" role="region" aria-label="Выбор каната">
    <div className="rope-sales-picker-fields">
      <label>Конструкция каната
        <select value={construction} required onChange={event => { setConstruction(event.target.value); setDiameter('') }}>
          <option value="">Выберите конструкцию</option>
          {ropeSalesConstructions.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>Диаметр, мм
        {construction && !hasSizeSeries
          ? <input value={diameter} onChange={event => setDiameter(event.target.value)} inputMode="decimal" placeholder="От 1 до 56" aria-describedby="rope-sales-diameter-note" />
          : <select value={diameter} required disabled={!construction} onChange={event => setDiameter(event.target.value)}>
            <option value="">{construction ? 'Выберите диаметр' : 'Сначала конструкция'}</option>
            {diameters.map(value => <option key={value} value={value}>{formatDimensionValue(String(value))}</option>)}
          </select>}
      </label>
      <div className="rope-sales-picker-action">
        {href ? <a href={href}>В заявку →</a> : <button type="button" disabled>В заявку →</button>}
      </div>
    </div>
    <p className="rope-sales-picker-note" id="rope-sales-diameter-note" aria-live="polite">
      {construction && !hasSizeSeries
        ? 'Диаметр уточним по запросу.'
        : 'Выберите конструкцию и диаметр. Длину и исполнение можно указать в заявке.'}
    </p>
    {valid && <p className="rope-sales-picker-selection" role="status">{construction} · Ø {formatDimensionValue(diameter.trim())} мм</p>}
    <noscript><p className="rope-sales-picker-note">Для выбора без JavaScript откройте <a href="#rope-assortment-table">полный перечень конструкций и диаметров</a>.</p></noscript>
  </div>
}
