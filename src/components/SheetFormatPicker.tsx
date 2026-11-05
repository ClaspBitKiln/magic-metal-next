'use client'

import { useId, useMemo, useState } from 'react'

const number = (value: string) => Number(value.trim().replace(',', '.'))
const positive = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) && number(value) > 0
const normalize = (value: string) => Number.isFinite(number(value)) ? String(number(value)).replace('.', ',') : value

export default function SheetFormatPicker({ nominalThicknesses, requestHref, standard, sheetKind = 'hot' }: {
  rows: string[][]; nominalThicknesses: string[]; requestHref: string; standard: string; sheetKind?: 'hot' | 'cold'
}) {
  const uid = useId()
  const isCold = sheetKind === 'cold'
  const presets = [{ width: '1500', length: '6000' }, { width: '2000', length: '6000' }]
  const [width, setWidth] = useState('1500')
  const [thickness, setThickness] = useState('')
  const [length, setLength] = useState('6000')
  const [steelGrade, setSteelGrade] = useState('')
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('листов')

  const thicknesses = useMemo(() => [...new Set(nominalThicknesses.map(normalize))]
    .filter(positive).sort((a, b) => number(a) - number(b)), [nominalThicknesses])
  const hasLength = length.trim().length > 0
  const validWidth = positive(width)
  const validLength = !hasLength || positive(length)
  const quantityValid = !quantity.trim() || (/^\d+(?:[.,]\d+)?$/.test(quantity.trim()) && number(quantity) >= 0)
  const href = (() => {
    if (!validWidth || !positive(thickness) || !validLength || !quantityValid) return ''
    const url = new URL(requestHref, 'https://magicmet.ru')
    const existing = url.searchParams.get('product')
    url.searchParams.set('product', [existing, `${isCold ? 'лист х/к' : 'лист г/к'}, толщина ${thickness} мм, ширина ${normalize(width)} мм`, hasLength ? `длина ${normalize(length)} мм` : 'длина уточняется', steelGrade.trim() ? `марка стали ${steelGrade.trim()}` : '', quantity.trim() ? `количество ${quantity.trim()} ${quantityUnit}` : '', `справочный стандарт ${standard}`].filter(Boolean).join('; '))
    return url.pathname + url.search + url.hash
  })()

  return <div className="sheet-format-picker">
    <h3>Толщина и раскрой</h3>
    <p>Размеры и наличие подтвердит менеджер.</p>
    <div className="sheet-format-picker-fields">
      <label htmlFor={uid + '-thickness'}>Толщина, мм
        <select id={uid + '-thickness'} value={thickness} onChange={event => setThickness(event.target.value)}>
          <option value="">Выберите толщину</option>
          {thicknesses.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <div className="sheet-format-picker-presets" role="group" aria-label="Раскрой для запроса">
      <span>Раскрой:</span>
      {presets.map(preset => <button key={preset.width + '-' + preset.length} type="button" aria-pressed={width === preset.width && length === preset.length} onClick={() => { setWidth(preset.width); setLength(preset.length) }}>{preset.width} × {preset.length} мм</button>)}
    </div>
    <details className="sheet-format-picker-custom">
      <summary>Другой раскрой</summary>
      <div className="sheet-format-picker-fields">
        <label htmlFor={uid + '-width'}>Ширина, мм
          <input id={uid + '-width'} inputMode="decimal" value={width} onChange={event => setWidth(event.target.value)} />
        </label>
        <label htmlFor={uid + '-length'}>Длина, мм (необязательно)
          <input id={uid + '-length'} inputMode="decimal" value={length} placeholder="Указать при необходимости" onChange={event => setLength(event.target.value)} />
        </label>
      </div>
      <p>Другие размеры можно запросить независимо от справочного ряда. Раскрой и наличие подтвердит менеджер.</p>
    </details>
    <details className="sheet-format-picker-extra">
      <summary>Марка и количество (необязательно)</summary>
    <div className="sheet-format-picker-fields sheet-format-picker-order">
      <label htmlFor={uid + '-grade'}>Марка стали (если известна)
        <input id={uid + '-grade'} value={steelGrade} placeholder="Например, Ст3 или 09Г2С" maxLength={80} onChange={event => setSteelGrade(event.target.value)} />
      </label>
      <label htmlFor={uid + '-quantity'}>Количество (если известно)
        <input id={uid + '-quantity'} value={quantity} inputMode="decimal" placeholder="Например, 10" onChange={event => setQuantity(event.target.value)} />
      </label>
      <label htmlFor={uid + '-quantity-unit'}>Единица количества
        <select id={uid + '-quantity-unit'} value={quantityUnit} onChange={event => setQuantityUnit(event.target.value)}>
          <option value="листов">Листов</option>
          <option value="т">Тонн</option>
        </select>
      </label>
    </div>
    </details>
    {!quantityValid && <p className="sheet-format-picker-error" role="alert">Укажите количество от 0 или оставьте поле пустым.</p>}
    {thickness && validWidth && validLength && <p className="sheet-format-picker-result" role="status">Выбрано: лист {thickness} × {normalize(width)}{hasLength ? ` × ${normalize(length)}` : ''} мм.</p>}
    {!validWidth && <p className="sheet-format-picker-error" role="alert">Укажите положительную ширину.</p>}
    {!validLength && <p className="sheet-format-picker-error" role="alert">Укажите положительную длину или оставьте поле пустым.</p>}
    <div className="sheet-format-picker-actions">
      {href ? <a href={href}>Отправить выбранный размер в заявку ↗</a> : <span>Выберите толщину, чтобы отправить параметры</span>}
      {/* The homepage is an HTML Route Handler; document navigation initializes the request form. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={href || requestHref}>Есть Excel или чертёж? Отправить файл →</a>
    </div>
    <a className="size-series-reference-toggle" href="#sizes">Таблицы ГОСТ ↓</a>
  </div>
}
