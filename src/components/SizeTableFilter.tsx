'use client'

import { useCallback, useEffect, useId, useRef } from 'react'

const numericSize = (value: string) => Number(value.trim().replace(/[()]/g, '').replace(',', '.')).toString()
const wallValues = (row: HTMLTableRowElement, columns: number[]) => columns.flatMap(column => (row.cells[column]?.textContent || '').split(';').filter(value => /^\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))\s*$/.test(value)).map(numericSize))

const seriesKey = (element: HTMLDivElement | null) => element?.closest('details')?.querySelector('.size-series-scope')?.id.replace('sizes-series-', '')

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
  const selectionLink = useRef<HTMLAnchorElement>(null)
  const selectionResult = useRef<HTMLDivElement>(null)
  const selectionSize = useRef<HTMLElement>(null)
  const referenceButton = useRef<HTMLButtonElement>(null)

  const filter = useCallback((updateUrl = true) => {
    const table = root.current?.closest('details')?.querySelector('table')
    if (!table) return
    const size = select.current?.value || ''
    const thickness = wall.current?.value || ''
    let visible = 0
    let bracketed = false
    const conditions = new Set<string>()
    for (const row of Array.from(table.tBodies[0].rows)) {
      for (const index of wallColumns) {
        const cell = row.cells[index]
        if (cell.querySelector('.size-series-selected-wall')) cell.textContent = cell.textContent
      }
      row.hidden = Boolean((size && row.cells[0].textContent !== size) || (thickness && !wallValues(row, wallColumns).includes(thickness)))
      if (!row.hidden) {
        visible++
        if (thickness) for (const index of wallColumns) {
          if (wallValues(row, [index]).includes(thickness)) {
            conditions.add(table.tHead?.rows[0].cells[index]?.textContent || '')
            const cell = row.cells[index]
            cell.replaceChildren(...(cell.textContent || '').split(/(;\s*)/).map(value => {
              if (!/^\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))\s*$/.test(value) || numericSize(value) !== thickness) return document.createTextNode(value)
              const mark = document.createElement('mark')
              mark.className = 'size-series-selected-wall'
              mark.textContent = value
              return mark
            }))
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
    const complete = Boolean(size && thickness && visible)
    if (selectionResult.current) selectionResult.current.hidden = !complete
    if (selectionSize.current) selectionSize.current.textContent = `${size} × ${thickness.replace('.', ',')} мм`
    const reference = table.closest<HTMLElement>('.size-series-reference')
    if (reference && selectionResult.current) {
      reference.hidden = complete
      if (referenceButton.current) {
        referenceButton.current.setAttribute('aria-controls', reference.id)
        referenceButton.current.setAttribute('aria-expanded', String(!complete))
        referenceButton.current.textContent = complete ? 'Строка ГОСТ и условия' : 'Скрыть таблицу и примечания'
      }
    }
    if (complete && result.current) result.current.textContent = `Сочетание найдено в таблице${bracketed ? '. Размер в скобках — см. примечания.' : ''}`
    const key = seriesKey(root.current)
    if (key) {
      const url = new URL(window.location.href)
      for (const [name, value] of [[`size_${key}`, size], [`wall_${key}`, thickness]]) {
        if (value) url.searchParams.set(name, value)
        else url.searchParams.delete(name)
      }
      if (size || thickness) url.hash = `sizes-series-${key}`
      const href = url.pathname + url.search + url.hash
      if (updateUrl && href !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState(null, '', href)
      if (selectionLink.current) {
        selectionLink.current.hidden = !(size || thickness)
        selectionLink.current.href = href
      }
    }
    const scroll = table.closest('.size-series-scroll')
    if (scroll) scroll.scrollTop = 0
  }, [wallColumns, requestHref, context, total])

  useEffect(() => {
    const table = root.current?.closest('details')?.querySelector('table')
    if (wall.current && table) {
      const sizes = [...new Set(Array.from(table.tBodies[0].rows).flatMap(row => wallValues(row, wallColumns)))].sort((a, b) => Number(a) - Number(b))
      wall.current.replaceChildren(new Option('Все стенки', ''), ...sizes.map(value => new Option(value.replace('.', ','), value)))
    }
    function restore() {
      const key = seriesKey(root.current)
      if (!key) return
      const params = new URLSearchParams(window.location.search)
      const sizeValue = params.get(`size_${key}`) || ''
      const wallValue = params.get(`wall_${key}`) || ''
      const validSize = !sizeValue || values.includes(sizeValue)
      const normalizedWall = /^\d+(?:[.,]\d+)?$/.test(wallValue) ? numericSize(wallValue) : ''
      const validWall = !wallValue || Boolean(wall.current && Array.from(wall.current.options).some(option => option.value === normalizedWall) && normalizedWall)
      if (select.current) select.current.value = validSize ? sizeValue : ''
      if (wall.current) wall.current.value = validWall ? normalizedWall : ''
      if (sizeValue || wallValue) root.current?.closest('details')?.setAttribute('open', '')
      filter(false)
      if ((!validSize || !validWall) && result.current) result.current.textContent += '. Часть размеров из ссылки не распознана. Проверьте выбор.'
    }
    restore()
    if (root.current) root.current.hidden = false
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [wallColumns, values, filter])

  return <div className="size-series-filter" hidden ref={root}>
    <div>
      <label htmlFor={id}>{column}</label>
      <select id={id} ref={select} onChange={() => filter()}>
        <option value="">Все размеры</option>
        {values.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
    {wallColumns.length > 0 && <div>
      <label htmlFor={`${id}-wall`}>Толщина стенки, мм</label>
      <select id={`${id}-wall`} ref={wall} onChange={() => filter()}><option value="">Все стенки</option></select>
    </div>}
    <button type="button" onClick={() => {
      if (select.current) select.current.value = ''
      if (wall.current) wall.current.value = ''
      filter()
    }}>Показать все</button>
    <output ref={result} aria-live="polite">Показано строк: {total} из {total}</output>
    <a className="size-series-selection-link" hidden ref={selectionLink}>Ссылка на подбор ↗</a>
    {wallColumns.length > 0 && requestHref && <div className="size-series-selection-result" hidden ref={selectionResult}>
      <strong ref={selectionSize} />
      <p className="size-series-result-context">{context}</p>
      <a className="size-series-selection-request" hidden ref={request} href={requestHref}>Заявка на выбранный размер ↗</a>
      <button type="button" className="size-series-reference-toggle" ref={referenceButton} aria-expanded="false" onClick={() => {
        const reference = root.current?.closest('details')?.querySelector<HTMLElement>('.size-series-reference')
        if (!reference || !referenceButton.current) return
        reference.hidden = !reference.hidden
        referenceButton.current.setAttribute('aria-expanded', String(!reference.hidden))
        referenceButton.current.textContent = reference.hidden ? 'Строка ГОСТ и условия' : 'Скрыть таблицу и примечания'
      }}>Строка ГОСТ и условия</button>
    </div>}
  </div>
}
