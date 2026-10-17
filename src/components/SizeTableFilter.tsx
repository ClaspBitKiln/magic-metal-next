'use client'

import { useEffect, useId, useRef } from 'react'

/** Enhances the server-rendered table; no duplicate row data or network requests. */
export default function SizeTableFilter({ column, values, total }: { column: string; values: string[]; total: number }) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const select = useRef<HTMLSelectElement>(null)
  const result = useRef<HTMLOutputElement>(null)

  useEffect(() => {
    if (root.current) root.current.hidden = false
  }, [])

  function filter(value: string) {
    const table = root.current?.closest('details')?.querySelector('table')
    if (!table) return
    let visible = 0
    for (const row of Array.from(table.tBodies[0].rows)) {
      row.hidden = Boolean(value && row.cells[0].textContent !== value)
      if (!row.hidden) visible++
    }
    if (result.current) result.current.textContent = `Показано строк: ${visible} из ${total}`
    const scroll = table.closest('.size-series-scroll')
    if (scroll) scroll.scrollTop = 0
  }

  return <div className="size-series-filter" hidden ref={root}>
    <div>
      <label htmlFor={id}>{column}</label>
      <select id={id} ref={select} onChange={event => filter(event.target.value)}>
        <option value="">Все размеры</option>
        {values.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
    <button type="button" onClick={() => {
      if (select.current) select.current.value = ''
      filter('')
    }}>Показать все</button>
    <output ref={result} aria-live="polite">Показано строк: {total} из {total}</output>
  </div>
}
