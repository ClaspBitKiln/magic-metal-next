'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { formatDimensionValue, sourceDimensionValue } from '@/lib/dimensionDisplay'

const numericSize = (value: string) => Number(value.trim().replace(/[()]/g, '').replace(',', '.')).toString()
const sectionKey = (value: string) => value.split(/\s*×\s*/u).map(numericSize).join('x')
const wallValues = (row: HTMLTableRowElement, columns: number[]) => columns.flatMap(column => sourceDimensionValue(row.cells[column]).split(';').filter(value => /^\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))\s*$/.test(value)).map(numericSize))

const seriesKey = (element: HTMLDivElement | null) => element?.closest('details')?.querySelector('.size-series-scope')?.id.replace('sizes-series-', '')

/** Enhances the existing server table; does not duplicate its rows or request data. */
export default function SizeTableFilter({ column, values, total, wallColumns = [], requestHref, context, standard }: {
  column: string; values: string[]; total: number; wallColumns?: number[]; requestHref?: string; context?: string; standard?: string
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
  const query = useRef<HTMLInputElement>(null)
  const fallback = useRef<HTMLAnchorElement>(null)
  const pairList = useRef<HTMLDivElement>(null)
  const more = useRef<HTMLButtonElement>(null)
  const limit = useRef(20)
  const profileSearch = wallColumns.length > 0 && /сечение/iu.test(column) && values.every(value => /^\d+(?:[.,]\d+)?\s*×\s*\d+(?:[.,]\d+)?$/u.test(value.replace(/[()]/g, '')))
  const quickSearch = profileSearch || (wallColumns.length > 0 && /диаметр/iu.test(column) && values.every(value => /^\d+(?:[.,]\d+)?$/.test(value)))
  const dimensions = profileSearch ? 'высоту × ширину × стенку' : 'диаметр × стенку'

  const refreshWalls = useCallback((requested = '') => {
    const table = root.current?.closest('details')?.querySelector<HTMLTableElement>('.size-series-reference table')
    if (!wall.current || !table) return
    const size = select.current?.value || ''
    const rows = Array.from(table.tBodies[0].rows).filter(row => !size || sourceDimensionValue(row.cells[0]) === size)
    const walls = [...new Set(rows.flatMap(row => wallValues(row, wallColumns)))].sort((a, b) => Number(a) - Number(b))
    wall.current.replaceChildren(new Option('Выберите стенку', ''), ...walls.map(value => new Option(value.replace('.', ','), value)))
    if (requested && !walls.includes(requested)) wall.current.add(new Option(`${requested.replace('.', ',')} — нет сочетания`, requested))
    wall.current.value = requested
  }, [wallColumns])

  const filter = useCallback((updateUrl = true, expand = false) => {
    const table = root.current?.closest('details')?.querySelector<HTMLTableElement>('.size-series-reference table')
    if (!table) return
    if (!expand) limit.current = 20
    const size = select.current?.value || ''
    const thickness = wall.current?.value || ''
    if (fallback.current) fallback.current.hidden = true
    if (query.current) query.current.value = size ? `${formatDimensionValue(size)}${thickness ? `×${thickness.replace('.', ',')}` : ''}` : ''
    let visible = 0
    let bracketed = size.includes('(')
    const conditions = new Set<string>()
    for (const row of Array.from(table.tBodies[0].rows)) {
      for (const index of wallColumns) {
        const cell = row.cells[index]
        if (cell.querySelector('.size-series-selected-wall')) cell.textContent = cell.textContent
      }
      row.hidden = Boolean((size && sourceDimensionValue(row.cells[0]) !== size) || (thickness && !wallValues(row, wallColumns).includes(thickness)))
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
        url.searchParams.set('product', `${url.searchParams.get('product') || ''} — ${formatDimensionValue(size)} × ${thickness.replace('.', ',')} мм; ${context}; ${[...conditions].filter(Boolean).join("; ")}`)
        request.current.href = url.pathname + url.search + url.hash
      }
    }
    const complete = Boolean(size && thickness && visible)
    const showList = Boolean(quickSearch && requestHref && visible && !complete)
    const listScroll = pairList.current?.scrollTop || 0
    if (pairList.current) {
      pairList.current.hidden = !showList
      pairList.current.replaceChildren()
    }
    if (more.current) more.current.hidden = true
    if (showList && pairList.current && requestHref) {
      const compact = document.createElement('table')
      compact.createCaption().textContent = `${context} — компактный список размеров`
      const head = compact.createTHead().insertRow()
      for (const text of [profileSearch ? 'Сечение, мм' : 'Диаметр, мм', 'Стенка, мм', 'Стандарт', 'Заявка']) {
        const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; head.append(th)
      }
      const body = compact.createTBody()
      let pairs = 0
      for (const row of Array.from(table.tBodies[0].rows).filter(row => !row.hidden)) {
        for (const value of [...new Set(wallValues(row, wallColumns))].filter(value => !thickness || value === thickness).sort((a, b) => Number(a) - Number(b))) {
          pairs++
          if (pairs > limit.current) continue
          const notes = new Set<string>()
          let inBrackets = row.cells[0].textContent?.includes('(')
          for (const index of wallColumns) if (wallValues(row, [index]).includes(value)) {
            notes.add(table.tHead?.rows[0].cells[index]?.textContent || '')
            if ((row.cells[index].textContent || '').split(';').some(item => item.trim().startsWith('(') && numericSize(item) === value)) inBrackets = true
          }
          if (inBrackets) notes.add('Размер в скобках — см. примечания к таблице')
          const tr = body.insertRow(), first = document.createElement('th')
          first.scope = 'row'; first.textContent = formatDimensionValue(sourceDimensionValue(row.cells[0])); tr.append(first)
          const cell = tr.insertCell(); cell.textContent = value.replace('.', ',')
          if (inBrackets || wallColumns.length > 1) {
            const note = document.createElement('small'); note.className = 'size-series-pair-condition'; note.textContent = [...notes].filter(Boolean).join('; '); first.append(note)
          }
          tr.insertCell().textContent = standard || ''
          const link = document.createElement('a'), url = new URL(requestHref, window.location.origin)
          url.searchParams.set('product', `${url.searchParams.get('product') || ''} — ${formatDimensionValue(sourceDimensionValue(row.cells[0]))} × ${value.replace('.', ',')} мм; ${context}; ${[...notes].filter(Boolean).join('; ')}`)
          link.href = url.pathname + url.search + url.hash
          link.textContent = 'Заявка →'; link.setAttribute('aria-label', `Заявка на ${formatDimensionValue(sourceDimensionValue(row.cells[0]))} × ${value.replace('.', ',')} мм`)
          tr.insertCell().append(link)
        }
      }
      pairList.current.append(compact)
      pairList.current.scrollTop = expand ? listScroll : 0
      if (result.current) result.current.textContent = `Показано размеров: ${Math.min(pairs, limit.current)} из ${pairs}`
      if (more.current) { more.current.hidden = pairs <= limit.current; more.current.textContent = `Ещё размеры (${pairs - limit.current})` }
    }
    if (size && thickness && !visible && fallback.current && requestHref) {
      const url = new URL(requestHref, window.location.origin)
      url.searchParams.set('product', `${url.searchParams.get('product') || ''} — проверить размер ${formatDimensionValue(size)} × ${thickness.replace('.', ',')} мм; ${context}`)
      fallback.current.href = url.pathname + url.search + url.hash
      fallback.current.hidden = false
    }
    if (selectionResult.current) selectionResult.current.hidden = !complete
    if (selectionSize.current) selectionSize.current.textContent = `${formatDimensionValue(size)} × ${thickness.replace('.', ',')} мм`
    const reference = table.closest<HTMLElement>('.size-series-reference')
    if (reference && selectionResult.current) {
      reference.hidden = complete || showList
      if (referenceButton.current) {
        referenceButton.current.setAttribute('aria-controls', reference.id)
        referenceButton.current.setAttribute('aria-expanded', String(!reference.hidden))
        referenceButton.current.textContent = reference.hidden ? 'Полная таблица и условия ГОСТ' : 'Скрыть таблицу и примечания'
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
  }, [wallColumns, requestHref, context, total, standard, quickSearch, profileSearch])

  useEffect(() => {
    const parent = root.current?.closest('details')
    let initialized = false
    function restore() {
      const key = seriesKey(root.current)
      if (!key) return
      const params = new URLSearchParams(window.location.search)
      const sizeValue = params.get(`size_${key}`) || ''
      const wallValue = params.get(`wall_${key}`) || ''
      const validSize = !sizeValue || values.includes(sizeValue)
      const normalizedWall = /^\d+(?:[.,]\d+)?$/.test(wallValue) ? numericSize(wallValue) : ''
      const validWall = !wallValue || Boolean(wall.current && normalizedWall && Number(normalizedWall) > 0)
      if (select.current) select.current.value = validSize ? sizeValue : ''
      if (sizeValue || wallValue) parent?.setAttribute('open', '')
      // Closed tables keep their server HTML without scanning every cell or
      // constructing a hidden compact list during initial hydration.
      if (!parent?.open) { initialized = false; return }
      initialized = true
      refreshWalls(validWall ? normalizedWall : '')
      filter(false)
      if ((!validSize || !validWall) && result.current) result.current.textContent += '. Часть размеров из ссылки не распознана. Проверьте выбор.'
    }
    restore()
    if (root.current) root.current.hidden = false
    const toggle = () => {
      if (!parent?.open) initialized = false
      else if (!initialized) restore()
    }
    parent?.addEventListener('toggle', toggle)
    window.addEventListener('popstate', restore)
    return () => {
      parent?.removeEventListener('toggle', toggle)
      window.removeEventListener('popstate', restore)
    }
  }, [refreshWalls, values, filter])

  return <div className="size-series-filter" hidden ref={root}>
    {quickSearch && <form className="size-series-quick-search" onSubmit={event => {
      event.preventDefault()
      const value = query.current?.value.trim() || ''
      if (!value) {
        if (select.current) select.current.value = ''
        refreshWalls()
        filter()
        return
      }
      const withoutUnits = value.replace(/\s*(?:мм|mm)\.?\s*$/iu, '')
      const clean = profileSearch ? withoutUnits : withoutUnits.replace(/^[Ø⌀]\s*/u, '')
      const parts = clean.match(/^(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))(?:\s*[xх×*]\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))){0,2}$/iu)?.[0].split(/\s*[xх×*]\s*/iu).map(numericSize)
      const count = profileSearch ? 2 : 1
      const match = parts && (parts.length === count || parts.length === count + 1) ? parts : null
      const key = match?.slice(0, count).join('x')
      const size = match && (values.find(candidate => sectionKey(candidate) === key) || (profileSearch && values.find(candidate => sectionKey(candidate) === match.slice(0, count).reverse().join('x'))))
      if (size && select.current) {
        select.current.value = size
        refreshWalls(match?.[count] || '')
        filter()
      } else {
        if (select.current) select.current.value = ''
        refreshWalls()
        filter()
        if (pairList.current) pairList.current.hidden = true
        if (more.current) more.current.hidden = true
        if (query.current) query.current.value = value
        if (result.current) result.current.textContent = match ? `${profileSearch ? 'Сечения' : 'Диаметра'} нет в этой таблице. Отправьте спецификацию: проверим другое исполнение.` : `Введите ${dimensions} в миллиметрах или отправьте спецификацию.`
        if (fallback.current && requestHref) {
          const url = new URL(requestHref, window.location.origin)
          url.searchParams.set('product', `${url.searchParams.get('product') || ''} — проверить размер ${formatDimensionValue(value.slice(0, 200))}; ${context}`)
          fallback.current.href = url.pathname + url.search + url.hash
          fallback.current.hidden = false
        }
      }
    }}>
      <label htmlFor={`${id}-query`}>Размер из спецификации</label>
      <div><input id={`${id}-query`} ref={query} placeholder={profileSearch ? 'Высота×ширина×стенка, мм' : 'Например, 108×4 мм'} autoComplete="off" spellCheck={false} maxLength={200} /><button type="submit">Найти размер</button></div>
      <p>Введите {dimensions} или выберите параметры ниже.</p>
    </form>}
    <div>
      <label htmlFor={id}>{column}</label>
      <select id={id} ref={select} onChange={() => { refreshWalls(); filter() }}>
        <option value="">Все размеры</option>
        {values.map(value => <option key={value} value={value}>{formatDimensionValue(value)}</option>)}
      </select>
    </div>
    {wallColumns.length > 0 && <div>
      <label htmlFor={`${id}-wall`}>Толщина стенки, мм</label>
      <select id={`${id}-wall`} ref={wall} onChange={() => filter()}><option value="">Все стенки</option></select>
    </div>}
    <button type="button" onClick={() => {
      if (select.current) select.current.value = ''
      refreshWalls()
      filter()
    }}>{quickSearch ? 'Сбросить подбор' : 'Показать все'}</button>
    <output ref={result} aria-live="polite">Показано строк: {total} из {total}</output>
    {wallColumns.length > 0 && requestHref && <a className="size-series-selection-request" hidden ref={fallback} href={requestHref}>Отправить спецификацию на проверку ↗</a>}
    <a className="size-series-selection-link" hidden ref={selectionLink}>Ссылка на подбор ↗</a>
    {quickSearch && <div className="size-series-pair-list size-series-scroll" ref={pairList} hidden role="region" aria-label="Компактный список размеров" tabIndex={0} />}
    {quickSearch && <button type="button" className="size-series-more" hidden ref={more} onClick={() => { limit.current += 20; filter(false, true) }}>Ещё размеры</button>}
    {wallColumns.length > 0 && requestHref && <div className="size-series-selection-result" hidden ref={selectionResult}>
      <strong ref={selectionSize} />
      <p className="size-series-result-context">{context}</p>
      <a className="size-series-selection-request" hidden ref={request} href={requestHref}>Заявка на выбранный размер ↗</a>
    </div>}
    {wallColumns.length > 0 && requestHref && <button type="button" className="size-series-reference-toggle" ref={referenceButton} aria-expanded="false" onClick={() => {
        const reference = root.current?.closest('details')?.querySelector<HTMLElement>('.size-series-reference')
        if (!reference || !referenceButton.current) return
        reference.hidden = !reference.hidden
        referenceButton.current.setAttribute('aria-expanded', String(!reference.hidden))
        referenceButton.current.textContent = reference.hidden ? 'Полная таблица и условия ГОСТ' : 'Скрыть таблицу и примечания'
      }}>Полная таблица и условия ГОСТ</button>}
  </div>
}
