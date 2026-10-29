'use client'

import { useId, useMemo, useState } from 'react'

type FormatRow = { thickness: string; widths: string; from: string; to: string }
const number = (value: string) => Number(value.trim().replace(',', '.'))
const split = (value: string) => value.split(';').map(value => value.trim()).filter(Boolean)
const normalize = (value: string) => Number.isFinite(number(value)) ? String(number(value)).replace('.', ',') : value
const thicknessMatches = (range: string, thickness: string) => {
  const bounds = range.split(/[–—-]/).map(number)
  const selected = number(thickness)
  return bounds.length === 1 ? selected === bounds[0] : selected >= bounds[0] && selected <= bounds[1]
}

export default function SheetFormatPicker({ rows, nominalThicknesses, requestHref, standard }: {
  rows: string[][]; nominalThicknesses: string[]; requestHref: string; standard: string
}) {
  const uid = useId()
  const [width, setWidth] = useState('')
  const [thickness, setThickness] = useState('')
  const [length, setLength] = useState('')
  const [showReference, setShowReference] = useState(false)

  const formats = useMemo<FormatRow[]>(() => rows.map(([thickness, widths, from, to]) => ({ thickness, widths, from, to })), [rows])
  const widths = useMemo(() => [...new Set(formats.flatMap(row => split(row.widths).map(normalize)))].sort((a, b) => number(a) - number(b)), [formats])
  const possible = useMemo(() => formats.filter(row => width && split(row.widths).some(value => number(value) === number(width))), [formats, width])
  const thicknesses = useMemo(() => {
    const values = [...new Set(nominalThicknesses.map(normalize))]
    return values.filter(value => possible.some(row => thicknessMatches(row.thickness, value))).sort((a, b) => number(a) - number(b))
  }, [nominalThicknesses, possible])
  const matching = possible.filter(row => thickness && thicknessMatches(row.thickness, thickness))
  const lengthRanges = matching.map(row => `${row.from}–${row.to} мм`)
  const hasLength = length.trim().length > 0
  const validLength = !hasLength || (Number.isFinite(number(length)) && matching.some(row => number(length) >= number(row.from) && number(length) <= number(row.to)))
  const href = useMemo(() => {
    if (!width || !thickness || !validLength) return ''
    const url = new URL(requestHref, 'https://magicmet.ru')
    const existing = url.searchParams.get('product')
    url.searchParams.set('product', [existing, `лист г/к, толщина ${thickness} мм, ширина ${width} мм`, hasLength ? `длина ${length} мм` : 'длина уточняется', standard].filter(Boolean).join('; '))
    return url.pathname + url.search + url.hash
  }, [requestHref, standard, width, thickness, length, hasLength, validLength])

  return <div className="sheet-format-picker">
    <h3>Быстрый подбор листа</h3>
    <p>Сначала выберите ширину: покажем только подходящие номинальные толщины по справочному приложению ГОСТ. Это не подтверждение наличия на складе.</p>
    <div className="sheet-format-picker-fields">
      <label htmlFor={uid + '-width'}>Ширина, мм
        <select id={uid + '-width'} value={width} onChange={event => { setWidth(event.target.value); setThickness(''); setLength('') }}>
          <option value="">Выберите ширину</option>
          {widths.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label htmlFor={uid + '-thickness'}>Толщина, мм
        <select id={uid + '-thickness'} value={thickness} disabled={!width} onChange={event => { setThickness(event.target.value); setLength('') }}>
          <option value="">Выберите толщину</option>
          {thicknesses.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label htmlFor={uid + '-length'}>Длина, мм (необязательно)
        <input id={uid + '-length'} inputMode="decimal" value={length} disabled={!thickness} placeholder="Указать при необходимости" onChange={event => setLength(event.target.value)} />
      </label>
    </div>
    {matching.length > 0 && <p className="sheet-format-picker-result" role="status">Выбрано: лист ${''}{thickness} × {width} мм. Длина в нормативном диапазоне: {[...new Set(lengthRanges)].join(' или ')}.</p>}
    {!validLength && <p className="sheet-format-picker-error" role="alert">Эта длина не входит в выбранный нормативный диапазон. Проверьте значение или оставьте поле пустым.</p>}
    <div className="sheet-format-picker-actions">
      {href ? <a href={href}>Отправить выбранный размер в заявку ↗</a> : <span>Выберите ширину и толщину, чтобы отправить параметры</span>}
      <a href="/#request">Есть Excel или чертёж? Отправить файл →</a>
    </div>
    <button type="button" className="size-series-reference-toggle" aria-expanded={showReference} onClick={() => {
      const parent = document.getElementById(uid + '-reference-anchor')
      const reference = parent?.closest('details')?.querySelector<HTMLElement>('.size-series-reference')
      if (reference) { reference.hidden = showReference; setShowReference(!showReference) }
    }}>{showReference ? 'Скрыть полную таблицу ГОСТ' : 'Открыть полную таблицу ГОСТ'}</button>
    <span id={uid + '-reference-anchor'} hidden />
  </div>
}
