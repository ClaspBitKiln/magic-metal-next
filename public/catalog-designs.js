'use strict'

;(async () => {
  const el = id => document.getElementById(id)
  const node = (tag, text, className) => {
    const item = document.createElement(tag)
    if (text !== undefined) item.textContent = text
    if (className) item.className = className
    return item
  }
  const norm = value => String(Number(value.trim().replace(/[()]/g, '').replace(',', '.')))
  const key = value => value.split(/\s*[xх×*]\s*/iu).map(norm).join('x')
  const fmt = value => value.replace('.', ',')
  try {
    const response = await fetch('/data/catalog-design-profiles.json')
    if (!response.ok) throw new Error('Data unavailable')
    const data = await response.json()
    const rows = data.rows.map(row => ({ section: row[0], walls: row[1].split(';').map(norm) }))
    const initial = rows.find(row => key(row.section) === '40x20')
    const state = { row: initial, wall: '2', invalid: '' }
    const requestHref = (row, wall) => `/?${new URLSearchParams({ product: `Труба прямоугольная — ${row.section}${wall ? ` × ${fmt(wall)}` : ''} мм; ${data.standard}${row.section.includes('(') ? '; размер в скобках — указан как нерекомендуемый' : ''}` })}#request`
    const updateUrl = () => {
      const url = new URL(location.href)
      if (state.invalid) url.searchParams.set('size', state.invalid)
      else url.searchParams.set('size', `${state.row.section.replace(/\s/g, '')}${state.wall ? `×${fmt(state.wall)}` : ''}`)
      history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
    const render = () => {
      const valid = !state.invalid && state.row && state.wall && state.row.walls.includes(state.wall)
      const view = ['list', 'card', 'steps'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'list'
      el('preview').dataset.style = view
      document.querySelectorAll('[data-design]').forEach(link => {
        if (link.dataset.design === view) link.setAttribute('aria-current', 'page')
        else link.removeAttribute('aria-current')
      })
      document.querySelectorAll('.design-panel').forEach(panel => { panel.hidden = panel.id !== view || Boolean(state.invalid) || (panel.id === 'card' && !valid) })
      el('find-form').hidden = view === 'steps' && !state.invalid
      el('missing').hidden = !state.invalid
      el('condition').hidden = !valid || !state.row.section.includes('(')
      el('feedback').textContent = state.invalid ? 'В этой таблице размер не найден. Не подменяем его другим сочетанием.' : valid ? `Выбрано: ${state.row.section} × ${fmt(state.wall)} мм · ${data.standard}` : 'Сечение выбрано. Укажите толщину стенки или введите полный размер.'
      el('verify-link').href = `/?${new URLSearchParams({ product: `Трубы прямоугольные — проверить размер ${state.invalid.slice(0, 200)}; ${data.standard}` })}#request`
      el('find-size').value = state.invalid || `${state.row.section.replace(/\s/g, '')}${state.wall ? `×${fmt(state.wall)}` : ''}`
      el('section-choice').value = state.row.section
      el('wall-choice').replaceChildren(new Option('Выберите стенку', ''), ...state.row.walls.map(wall => new Option(fmt(wall), wall)))
      el('wall-choice').value = valid ? state.wall : ''
      el('list-rows').replaceChildren(...state.row.walls.map(wall => {
        const tr = node('tr')
        if (valid && wall === state.wall) { tr.className = 'selected'; tr.setAttribute('aria-selected', 'true') }
        tr.append(node('td', state.row.section), node('td', fmt(wall)), node('td', data.standard.replace('ГОСТ ', '')))
        const td = node('td'), link = node('a', 'Заявка →')
        link.href = requestHref(state.row, wall); td.append(link); tr.append(td)
        return tr
      }))
      el('step-summary').hidden = !valid
      if (valid) {
        const size = `${state.row.section} × ${fmt(state.wall)} мм`
        el('card-title').textContent = size
        el('step-size').textContent = size
        el('card-request').href = requestHref(state.row, state.wall)
        el('step-request').href = requestHref(state.row, state.wall)
        el('card-facts').replaceChildren(...[['Сечение, мм', state.row.section], ['Стенка, мм', fmt(state.wall)], ['Стандарт', data.standard]].map(([label, value]) => {
          const div = node('div'); div.append(node('dt', label), node('dd', value)); return div
        }))
      }
    }
    const find = value => {
      const clean = value.trim().replace(/\s*(?:мм|mm)\.?\s*$/iu, '')
      const match = clean.match(/^(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))(?:\s*[xх×*]\s*(?:\d+(?:[.,]\d+)?|\(\d+(?:[.,]\d+)?\))){1,2}$/iu)
      const parts = match?.[0].split(/\s*[xх×*]\s*/iu).map(norm)
      const row = parts && (rows.find(row => key(row.section) === parts.slice(0, 2).join('x')) || rows.find(row => key(row.section) === parts.slice(0, 2).reverse().join('x')))
      if (row && (!parts[2] || row.walls.includes(parts[2]))) {
        state.row = row; state.wall = parts[2] || ''; state.invalid = ''
      } else state.invalid = value || 'не указан'
      updateUrl(); render()
    }
    el('section-choice').replaceChildren(...rows.map(row => new Option(row.section, row.section)))
    el('section-choice').addEventListener('change', () => { state.row = rows.find(row => row.section === el('section-choice').value); state.wall = ''; state.invalid = ''; updateUrl(); render() })
    el('wall-choice').addEventListener('change', () => { state.wall = el('wall-choice').value; state.invalid = ''; updateUrl(); render() })
    el('find-form').addEventListener('submit', event => { event.preventDefault(); find(el('find-size').value) })
    el('notes').replaceChildren(...data.notes.map(note => node('li', note)))
    el('loading').hidden = true
    el('preview').hidden = false
    window.addEventListener('hashchange', render)
    const selected = new URLSearchParams(location.search).get('size')
    if (selected) find(selected)
    else render()
  } catch {
    el('loading').textContent = 'Не удалось загрузить сравнение. Полный рабочий каталог доступен по ссылке ниже.'
  }
})()
