'use strict'

;(async () => {
  const byId = id => document.getElementById(id)
  const node = (tag, text, className) => {
    const element = document.createElement(tag)
    if (text !== undefined) element.textContent = text
    if (className) element.className = className
    return element
  }
  const fmt = value => String(value).replace('.', ',')
  const parse = value => {
    const clean = value.trim().replace(/\s*(?:мм|mm)\.?\s*$/i, '').replace(/^[Ø⌀]\s*/, '')
    const match = clean.match(/^(\d+(?:[.,]\d+)?)(?:\s*[xх×*]\s*(\d+(?:[.,]\d+)?))?$/i)
    return match ? { d: Number(match[1].replace(',', '.')), s: match[2] ? Number(match[2].replace(',', '.')) : null } : null
  }
  try {
    const response = await fetch('/data/catalog-variant-pipes.json')
    if (!response.ok) throw new Error('Size data unavailable')
    const data = await response.json()
    const sizes = data.rows.map(row => ({ d: Number(row[0].replace(',', '.')), walls: row[1].split(';').map(value => Number(value.trim().replace(',', '.'))) }))
    const allWalls = [...new Set(sizes.flatMap(row => row.walls))].sort((a, b) => a - b)
    const pairs = sizes.flatMap(row => row.walls.map(s => ({ d: row.d, s })))
    const quick = [20, 25, 32, 38, 57, 76, 89, 108].filter(d => sizes.some(row => row.d === d))
    const state = { d: null, s: null, expanded: false, searchLimit: 12 }
    const known = pair => Boolean(pair && sizes.some(row => row.d === pair.d && row.walls.includes(pair.s)))
    const needsAgreement = ({ d, s }) => (d >= 100 && d / s > 50) || d / s < 4
    const setAddress = query => {
      const url = new URL(location.href)
      if (query) url.searchParams.set('size', query)
      else url.searchParams.delete('size')
      history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
    const requestHref = pair => {
      const value = `${data.product} — ${fmt(pair.d)} × ${fmt(pair.s)} мм; ${data.standard}${needsAgreement(pair) ? '; по согласованной технической документации, примечание 3' : ''}`
      return `/?${new URLSearchParams({ product: value })}#request`
    }
    const card = pair => {
      const article = node('article', undefined, 'result')
      article.append(node('h3', `${fmt(pair.d)} × ${fmt(pair.s)} мм`), node('p', `Бесшовная холоднодеформированная труба · ${data.standard}`, 'material'))
      if (needsAgreement(pair)) article.append(node('p', 'Для этого размера требуется согласованная техническая документация — примечание 3 ГОСТ.', 'notice'))
      const request = node('a', 'Запросить предложение →', 'request')
      request.href = requestHref(pair)
      const details = node('a', 'ГОСТ и условия изготовления', 'secondary')
      details.href = '#norms'
      details.addEventListener('click', () => { byId('norms').open = true })
      article.append(request, details)
      return article
    }
    const showResult = (target, pair) => { byId(target).replaceChildren(...(known(pair) ? [card(pair)] : [])); if (known(pair)) byId(target).scrollIntoView({ block: 'nearest' }) }
    const renderSearch = () => {
      const value = byId('size-query').value.trim()
      const query = parse(value)
      const status = byId('search-status')
      const target = byId('search-results')
      target.replaceChildren()
      status.className = 'feedback'
      setAddress(value)
      if (!value) { status.textContent = 'Введите размер из спецификации или выберите пример.'; return }
      const fallback = () => {
        const article = node('article', undefined, 'result')
        article.append(node('h3', 'Проверим по спецификации'), node('p', 'Пришлите требуемые размеры, марку и количество. Уточним применимый ряд и исполнение.', 'material'))
        const link = node('a', 'Отправить спецификацию →', 'request')
        link.href = `/?${new URLSearchParams({ product: `${data.product} — проверить размер ${value.slice(0, 200)}; ${data.standard}` })}#request`
        article.append(link)
        target.append(article)
      }
      if (!query) { status.textContent = 'Введите диаметр × стенку, например 108×4 мм. Марку и количество можно указать в заявке.'; status.className += ' error'; fallback(); return }
      const found = pairs.filter(pair => pair.d === query.d && (query.s === null || pair.s === query.s))
      if (!found.length) {
        status.textContent = 'В основном размерном ряду такого сочетания нет. Прикрепите спецификацию: проверим дополнительный ряд или другое исполнение.'
        status.className += ' error'
        state.d = null; state.s = null
        fallback()
        return
      }
      status.textContent = query.s === null ? `Для диаметра ${fmt(query.d)} мм найдено ${found.length} сочетаний. Добавьте стенку в поиск или выберите размер ниже.` : 'Сочетание есть в основном размерном ряду ГОСТ. Наличие и условия поставки подтвердим по заявке.'
      state.d = query.d; state.s = query.s
      target.append(...found.slice(0, state.searchLimit).map(card))
      if (query.s !== null) target.scrollIntoView({ block: 'nearest' })
      if (found.length > state.searchLimit) {
        const more = node('button', `Ещё размеры (${found.length - state.searchLimit})`, 'text-button')
        more.type = 'button'
        more.addEventListener('click', () => { state.searchLimit += 12; renderSearch() })
        target.append(more)
      }
    }
    const renderSteps = () => {
      const query = byId('diameter-search').value.trim().replace(',', '.')
      const visible = query ? sizes.filter(row => String(row.d).includes(query)).map(row => row.d) : state.expanded ? sizes.map(row => row.d) : quick
      const buttons = visible.map(d => {
        const button = node('button', fmt(d))
        button.type = 'button'; button.dataset.d = String(d); button.setAttribute('aria-pressed', String(state.d === d))
        button.addEventListener('click', () => { state.d = d; state.s = null; renderSteps(); setAddress(String(d)) })
        return button
      })
      byId('diameters').replaceChildren(...buttons)
      if (!buttons.length) byId('diameters').append(node('p', 'Такого диаметра в основном ряду нет.', 'hint'))
      byId('all-diameters').hidden = Boolean(query)
      byId('all-diameters').textContent = state.expanded ? 'Короткий список' : `Все диаметры (${sizes.length})`
      const row = sizes.find(row => row.d === state.d)
      byId('wall-hint').textContent = row ? `Стенки для диаметра ${fmt(row.d)} мм. Показаны только сочетания из таблицы.` : 'Сначала выберите диаметр.'
      byId('walls').replaceChildren(...(row ? row.walls.map(s => {
        const button = node('button', fmt(s))
        button.type = 'button'; button.dataset.s = String(s); button.setAttribute('aria-pressed', String(state.s === s))
        button.addEventListener('click', () => { state.s = s; setAddress(`${fmt(state.d)}x${fmt(s)}`); renderSteps() })
        return button
      }) : []))
      showResult('step-result', state)
    }
    const renderMatrix = () => {
      const selected = Number(byId('matrix-diameter').value)
      const index = sizes.findIndex(row => row.d === selected)
      const start = Math.max(0, Math.min(sizes.length - 9, index - 4))
      const windowRows = sizes.slice(start, start + 9)
      byId('matrix-range').textContent = `Диаметры ${fmt(windowRows[0].d)}–${fmt(windowRows.at(-1).d)} мм: ${windowRows.length} из ${sizes.length}. Другие диаметры можно выбрать выше.`
      const table = node('table')
      const caption = node('caption', 'Сочетания по ГОСТ 8734-75 · «+» — размер есть в основном ряду')
      const head = node('thead'), header = node('tr'), corner = node('th', 'D / стенка, мм')
      corner.scope = 'col'; header.append(corner)
      allWalls.forEach(s => { const th = node('th', fmt(s)); th.scope = 'col'; header.append(th) })
      head.append(header)
      const body = node('tbody')
      windowRows.forEach(row => {
        const tr = node('tr'), th = node('th', fmt(row.d)); th.scope = 'row'; tr.append(th)
        allWalls.forEach(s => {
          const td = node('td')
          if (row.walls.includes(s)) {
            const button = node('button', '+')
            button.type = 'button'; button.dataset.d = String(row.d); button.dataset.s = String(s)
            button.setAttribute('aria-label', `Выбрать ${fmt(row.d)} × ${fmt(s)} мм`)
            button.setAttribute('aria-pressed', String(state.d === row.d && state.s === s))
            button.addEventListener('click', () => { state.d = row.d; state.s = s; setAddress(`${fmt(row.d)}x${fmt(s)}`); showResult('matrix-result', state); byId('matrix-grid').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))) })
            td.append(button)
          } else { td.textContent = '—'; td.className = 'empty'; td.setAttribute('aria-label', 'Нет сочетания в основном ряду') }
          tr.append(td)
        })
        body.append(tr)
      })
      table.append(caption, head, body)
      const scroll = byId('matrix-grid')
      const centerWall = state.s || sizes.find(row => row.d === selected).walls[0]
      scroll.replaceChildren(table)
      scroll.scrollLeft = Math.max(0, (allWalls.indexOf(centerWall) - 2) * 44)
      showResult('matrix-result', state)
    }
    const activate = () => {
      const view = location.hash.slice(1)
      if (view === 'norms') { byId('norms').open = true; return }
      const active = ['search', 'steps', 'matrix'].includes(view) ? view : 'search'
      document.querySelectorAll('[data-view]').forEach(link => {
        if (link.dataset.view === active) link.setAttribute('aria-current', 'page')
        else link.removeAttribute('aria-current')
      })
      document.querySelectorAll('.view').forEach(panel => { panel.hidden = panel.id !== active })
      if (active === 'search') { byId('size-query').value = new URLSearchParams(location.search).get('size') || ''; renderSearch() }
      if (active === 'steps') renderSteps()
      if (active === 'matrix') { byId('matrix-diameter').value = String(state.d || 108); renderMatrix() }
    }
    byId('size-search').addEventListener('submit', event => { event.preventDefault(); state.searchLimit = 12; renderSearch() })
    document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { byId('size-query').value = button.dataset.query; state.searchLimit = 12; renderSearch() }))
    byId('diameter-search').addEventListener('input', renderSteps)
    byId('all-diameters').addEventListener('click', () => { state.expanded = !state.expanded; renderSteps() })
    byId('matrix-diameter').replaceChildren(...sizes.map(row => { const option = node('option', fmt(row.d)); option.value = String(row.d); return option }))
    byId('matrix-diameter').value = '108'
    byId('matrix-diameter').addEventListener('change', () => { state.d = Number(byId('matrix-diameter').value); state.s = null; setAddress(String(state.d)); renderMatrix() })
    byId('norm-scope').textContent = `${data.standard}. ${data.scope}`
    byId('norm-notes').replaceChildren(...data.notes.slice(1).map(note => node('li', note)))
    const initial = new URLSearchParams(location.search).get('size') || ''
    byId('size-query').value = initial
    if (initial) renderSearch()
    byId('load-status').hidden = true
    window.addEventListener('hashchange', activate)
    activate()
  } catch {
    byId('load-status').textContent = 'Не удалось загрузить варианты. Можно прикрепить спецификацию или открыть полный размерный ряд ниже.'
    byId('norms').open = true
  }
})()
