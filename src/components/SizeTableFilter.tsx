'use client'

import { useEffect, useId, useRef } from 'react'

const numericSize = (value: string) => Number(value.trim().replace(/[()]/g, '').replace(',', '.')).toString()
const wallValues = (row: HTMLTableRowElement, columns: number[]) => columns.flatMap(column => (row.cells[column]?.textContent || '').split(';').filter(value => /^\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))\s*$/.test(value)).map(numericSize))

/** Enhances the existing server table; does not duplicate its rows or request data. */
export default function SizeTableFilter({ column, values, total, wallColumns = [], requestHref, context }: {
  column: string; values: string[]; total: number; wallColumns?: number[]; requestHref?: string; context?: string
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const select = useRef<HTMLSelectElement>(null)
  const wall = useRef<HTMLSelectElement>(null)
  const result = useRef<HTMLOutputElement>(null)
  const request = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const table = root.current?.closest('details')?.querySelector('table')
    if (wall.current && table) {
      const sizes = [...new Set(Array.from(table.tBodies[0].rows).flatMap(row => wallValues(row, wallColumns)))].sort((a, b) => Number(a) - Number(b))
      wall.current.replaceChildren(new Option('Все стенки', ''), ...sizes.map(value => new Option(value.replace('.', ','), value)))
    }
    if (root.current) root.current.hidden = false
  }, [wallColumns])

  function filter() {
    const table = root.current?.closest('details')?.querySelector('table')
    if (!table) return
    const size = select.current?.value || ''
    const thickness = wall.current?.value || ''
    let visible = 0
    let bracketed = false
    const conditions = new Set<string>()
    for (const row of Array.from(table.tBodies[0].rows)) {
      row.hidden = Boolean((size && row.cells[0].textContent !== size) || (thickness && !wallValues(row, wallColumns).includes(thickness)))
      if (!row.hidden) {
        visible++
        if (thickness) for (const index of wallColumns) {
          if (wallValues(row, [index]).includes(thickness)) {
            conditions.add(table.tHead?.rows[0].cells[index]?.textContent || '')
            if ((row.cells[index].textContent || '').split(';').some(value => value.trim().startsWith('(') && numericSize(value) === thickness)) bracketed = true
          }
        }
      }
    }
    if (bracketed) conditions.add('Размер в скобках — см. примечания к таблице')
    if (result.current) result.current.textContent = visible ? `Показано строк: ${visible} из ${total}${bracketed ? '. Размер в скобках — см. примечания к таблице.' : ''}` : 'В этой таблице такого сочетания нет. Проверьте другое исполнение или отправьте спецификацию.'
    if (request.current) {
      request.current.hidden = !(size && thickness && visible)
      if (size && thickness && visible && requestHref) {
        const url = new URL(requestHref, window.location.origin)
        url.searchParams.set('product', `${url.searchParams.get('product') || ''} — ${size} × ${thickness.replace('.', ',')} мм; ${context}; ${[...conditions].filter(Boolean).join("; ")}`)
        request.current.href = url.pathname + url.search + url.hash
      }
    }
    const scroll = table.closest('.size-series-scroll')
    if (scroll) scroll.scrollTop = 0
  }

  return <div className="size-series-filter" hidden ref={root}>
    <div>
      <label htmlFor={id}>{column}</label>
      <select id={id} ref={select} onChange={filter}>
        <option value="">Все размеры</option>
        {values.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
    {wallColumns.length > 0 && <div>
      <label htmlFor={`${id}-wall`}>Толщина стенки, мм</label>
      <select id={`${id}-wall`} ref={wall} onChange={filter}><option value="">Все стенки</option></select>
    </div>}
    <button type="button" onClick={() => {
      if (select.current) select.current.value = ''
      if (wall.current) wall.current.value = ''
      filter()
    }}>Показать все</button>
    <output ref={result} aria-live="polite">Показано строк: {total} из {total}</output>
    {wallColumns.length > 0 && requestHref && <a className="size-series-selection-request" hidden ref={request} href={requestHref}>Заявка на выбранный размер ↗</a>}
  </div>
}
