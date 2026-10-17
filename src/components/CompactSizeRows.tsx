'use client'

import { useCallback, useEffect, useId, useRef } from 'react'

const normalized = (value: string) => value.toLowerCase().replace(/,/g, '.').replace(/[хx×]/g, 'x').replace(/\s+/g, ' ').trim()
const tokens = (value: string) => normalized(value).match(/\d+(?:\.\d+)?|[a-zа-яё]+|[≤≥<>]/gu) || []
const matches = (text: string, query: string) => {
  const available = tokens(text)
  const requested = tokens(query)
  return requested.length > 0 && requested.every(token => available.includes(token))
}
const rowText = (row: HTMLTableRowElement) => Array.from(row.cells, cell => cell.textContent || '').join(' ')
const rowIdentity = (row: HTMLTableRowElement, scope: string) => {
  let hash = 2166136261
  const text = scope + '\u001f' + Array.from(row.cells, cell => cell.textContent || '').join('\u001f')
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return `r${(hash >>> 0).toString(36)}`
}

export default function CompactSizeRows({ column, values, total, requestHref, context, standard, requirements }: {
  column: string; values: string[]; total: number; requestHref: string; context: string; standard: string; requirements: boolean
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const select = useRef<HTMLSelectElement>(null)
  const body = useRef<HTMLTableSectionElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLOutputElement>(null)
  const more = useRef<HTMLButtonElement>(null)
  const missing = useRef<HTMLAnchorElement>(null)
  const referenceToggle = useRef<HTMLButtonElement>(null)
  const limit = useRef(20)
  const selected = useRef('')
  const table = useCallback(() => root.current?.closest('details')?.querySelector<HTMLTableElement>('.size-series-reference table'), [])
  const key = useCallback(() => root.current?.closest('details')?.querySelector('.size-series-scope')?.id.replace('sizes-series-', '') || '', [])
  const href = useCallback((detail: string) => {
    const url = new URL(requestHref, window.location.href)
    const product = url.searchParams.get('product') || ''
    url.searchParams.set('product', [product, context, standard, requirements ? 'Нормативные требования' : '', detail].filter(Boolean).join('; '))
    return url.pathname + url.search + url.hash
  }, [requestHref, context, standard, requirements])
  const save = useCallback(() => {
    const index = key()
    if (!index) return
    const url = new URL(window.location.href)
    const query = input.current?.value.trim() || ''
    if (query) url.searchParams.set(`size_${index}`, query)
    else url.searchParams.delete(`size_${index}`)
    if (selected.current) url.searchParams.set(`row_${index}`, selected.current)
    else url.searchParams.delete(`row_${index}`)
    url.hash = `sizes-series-${index}`
    window.history.replaceState(null, '', url)
  }, [key])
  const showCard = useCallback((row: HTMLTableRowElement, update = true) => {
    const source = table()
    if (!source || !card.current) return
    const labels = Array.from(source.tHead?.rows[0]?.cells || []).map(cell => cell.textContent || '')
    const cells = Array.from(row.cells).map(cell => cell.textContent || '')
    const heading = document.createElement('strong')
    heading.textContent = `${labels[0]}: ${cells[0]}`
    const description = document.createElement('p')
    description.textContent = `${requirements ? 'Нормативные требования · ' : ''}${context} · ${standard}`
    const references = root.current?.closest('details')?.querySelector('.size-series-standard')?.cloneNode(true)
    if (references) {
      description.textContent = `${requirements ? 'Нормативные требования · ' : ''}${context}`
      description.append(document.createElement('br'), references)
    }
    const list = document.createElement('dl')
    cells.forEach((value, index) => {
      const term = document.createElement('dt'); term.textContent = labels[index]
      const definition = document.createElement('dd'); definition.textContent = value
      list.append(term, definition)
    })
    const link = document.createElement('a')
    link.className = 'size-series-request'
    link.textContent = 'Отправить заявку ↗'
    link.href = href(labels.map((label, index) => `${label}: ${cells[index]}`).join('; '))
    const hint = document.createElement('p')
    hint.textContent = 'Точные размеры, исполнение и количество укажите в заявке.'
    const back = document.createElement('button'); back.type = 'button'; back.textContent = 'К списку параметров'
    back.addEventListener('click', () => {
      selected.current = ''
      if (card.current) card.current.hidden = true
      if (viewport.current) viewport.current.hidden = false
      if (more.current && counter.current) more.current.hidden = (body.current?.rows.length || 0) >= Number(counter.current.dataset.count || 0)
      viewport.current?.focus({ preventScroll: true })
      save()
    })
    card.current.replaceChildren(heading, description, list, hint, link, back)
    card.current.hidden = false
    if (viewport.current) viewport.current.hidden = true
    if (more.current) more.current.hidden = true
    selected.current = rowIdentity(row, `${context};${standard}`)
    if (update) { save(); card.current.tabIndex = -1; card.current.focus({ preventScroll: true }); card.current.scrollIntoView({ block: 'nearest' }) }
  }, [table, requirements, context, standard, href, save])
  const render = useCallback((update = false, exact = false) => {
    const source = table()
    const parent = root.current?.closest('details')
    if (!source || !viewport.current || !parent?.open) return
    const labels = Array.from(source.tHead?.rows[0]?.cells || []).map(cell => cell.textContent || '')
    if (!body.current) {
      const compact = document.createElement('table')
      compact.createCaption().textContent = `${context} — ${standard}`
      const header = compact.createTHead().insertRow()
      for (const label of [column, 'Параметры', 'Заявка']) {
        const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; header.append(th)
      }
      body.current = compact.createTBody()
      viewport.current.replaceChildren(compact)
    }
    const query = input.current?.value.trim() || ''
    const selectedValue = select.current?.value || ''
    const rows = Array.from(source.tBodies[0]?.rows || [])
    const filtered = rows.filter(row => (!selectedValue || row.cells[0]?.textContent === selectedValue) && (!query || matches(rowText(row), query)))
    body.current.replaceChildren()
    filtered.slice(0, limit.current).forEach(row => {
      const cells = Array.from(row.cells).map(cell => cell.textContent || '')
      const output = document.createElement('tr')
      const first = document.createElement('th'); first.scope = 'row'
      const button = document.createElement('button'); button.type = 'button'; button.textContent = cells[0]
      button.addEventListener('click', () => showCard(row))
      first.append(button)
      const parameters = document.createElement('td')
      const summary = document.createElement('span')
      summary.textContent = cells.slice(1, 3).map((value, offset) => `${labels[offset + 1]}: ${value}`).join('; ') || 'Номинальное значение'
      parameters.append(summary)
      const action = document.createElement('td')
      const link = document.createElement('a'); link.textContent = 'Заявка ↗'; link.href = href(labels.map((label, offset) => `${label}: ${cells[offset]}`).join('; '))
      action.append(link); output.append(first, parameters, action); body.current?.append(output)
    })
    if (counter.current) { counter.current.textContent = `Показано ${Math.min(limit.current, filtered.length)} из ${filtered.length} строк (всего ${total})`; counter.current.dataset.count = String(filtered.length) }
    if (missing.current) {
      missing.current.hidden = filtered.length > 0
      missing.current.href = href(`Запрос проверки: ${query || selectedValue}`)
    }
    if (update) {
      selected.current = ''
      if (card.current) card.current.hidden = true
      save()
    }
    viewport.current.hidden = Boolean(card.current && !card.current.hidden)
    if (more.current) more.current.hidden = viewport.current.hidden || filtered.length <= limit.current
    if (exact && query && filtered.length === 1 && normalized(filtered[0].cells[0]?.textContent || '') === normalized(query)) showCard(filtered[0])
  }, [table, total, href, save, showCard, context, standard, column])

  useEffect(() => {
    const container = root.current
    const parent = container?.closest('details')
    if (!container || !parent || !table()) return
    container.hidden = false
    const reference = parent.querySelector<HTMLElement>('.size-series-reference')
    if (reference) reference.hidden = true
    const restore = () => {
      const url = new URL(window.location.href)
      const query = url.searchParams.get(`size_${key()}`) || ''
      const row = url.searchParams.get(`row_${key()}`) || ''
      if (input.current) input.current.value = query
      if (select.current) select.current.value = values.includes(query) ? query : ''
      limit.current = 20
      selected.current = row
      if (card.current) card.current.hidden = true
      if (query || row) parent.open = true
      render()
      if (/^r[0-9a-z]+$/.test(row)) {
        const sourceRow = Array.from(table()?.tBodies[0]?.rows || []).find(item => rowIdentity(item, `${context};${standard}`) === row)
        if (sourceRow && (!query || matches(rowText(sourceRow), query))) showCard(sourceRow, false)
      }
    }
    const toggle = () => { if (parent.open) render() }
    restore()
    parent.addEventListener('toggle', toggle)
    window.addEventListener('popstate', restore)
    return () => {
      parent.removeEventListener('toggle', toggle)
      window.removeEventListener('popstate', restore)
      if (reference) reference.hidden = false
    }
  }, [key, render, showCard, table, values, context, standard])

  return <div className="size-series-filter size-series-generic" ref={root} hidden>
    {requirements && <p><strong>Нормативные требования</strong></p>}
    <p>Точные размеры, исполнение и количество укажите в заявке.</p>
    <form className="size-series-generic-search" onSubmit={event => { event.preventDefault(); limit.current = 20; render(true, true) }}>
      <label htmlFor={id}>Поиск по обозначению или параметру</label>
      <div><input id={id} ref={input} type="search" maxLength={200} onChange={() => { limit.current = 20; if (select.current) select.current.value = ''; render(true) }} /><button type="submit">Найти</button></div>
    </form>
    {values.length > 0 && <label>{column} <select ref={select} onChange={() => { limit.current = 20; if (input.current) input.current.value = select.current?.value || ''; render(true, true) }}><option value="">Все значения</option>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
    <output ref={counter} aria-live="polite" />
    <p className="size-series-generic-help">Нажмите на обозначение в списке, чтобы открыть все параметры.</p>
    <div className="size-series-generic-list size-series-scroll" ref={viewport} role="region" aria-label={`${context}: компактный список`} tabIndex={0} />
    <button ref={more} type="button" hidden onClick={() => { limit.current += 20; render() }}>Ещё строки</button>
    <a ref={missing} hidden href={requestHref}>Совпадений нет — запросить проверку параметров ↗</a>
    <div className="size-series-generic-card" ref={card} hidden />
    <button ref={referenceToggle} className="size-series-reference-toggle" type="button" aria-expanded="false" onClick={() => {
      const reference = root.current?.closest('details')?.querySelector<HTMLElement>('.size-series-reference')
      if (!reference) return
      reference.hidden = !reference.hidden
      referenceToggle.current?.setAttribute('aria-expanded', String(!reference.hidden))
      if (referenceToggle.current) referenceToggle.current.textContent = reference.hidden ? 'Полная справочная таблица' : 'Скрыть справочную таблицу'
    }}>Полная справочная таблица</button>
  </div>
}
