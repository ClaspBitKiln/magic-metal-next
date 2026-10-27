import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SizeTableFilter from '@/components/SizeTableFilter'

let root: Root
let container: HTMLDivElement
function mount() {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(h('details', null,
    h('summary', null, 'Размеры'),
    h('div', { className: 'size-series-scope', id: 'sizes-series-test' }),
    h(SizeTableFilter, { column: 'Диаметр', values: ['57', '89'], total: 2, wallColumns: [1], requestHref: '/?product=Труба#request', context: 'Трубы', standard: 'ГОСТ тест' }),
    h('div', { className: 'size-series-reference', dangerouslySetInnerHTML: { __html: '<table><thead><tr><th>Диаметр</th><th>Стенка</th></tr></thead><tbody><tr><td>57</td><td>3; 4</td></tr><tr><td>89</td><td>4</td></tr></tbody></table>' } }),
  )))
  return container.querySelector('details')!
}
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); window.history.replaceState(null, '', '/') })
afterEach(() => { act(() => root?.unmount()); container?.remove(); vi.unstubAllGlobals() })

describe('lazy dimension table enhancement', () => {
  it('keeps closed source tables intact and builds pairs only after opening', () => {
    const details = mount()
    expect(details.open).toBe(false)
    expect(container.querySelectorAll('.size-series-reference tbody tr')).toHaveLength(2)
    expect(container.querySelectorAll('.size-series-pair-list tbody tr')).toHaveLength(0)
    expect(container.querySelectorAll('select')[1].options).toHaveLength(1)
    act(() => { details.open = true; details.dispatchEvent(new Event('toggle')) })
    expect(container.querySelectorAll('select')[1].options.length).toBeGreaterThan(1)
    expect(container.querySelectorAll('.size-series-pair-list tbody tr')).toHaveLength(3)
    expect(container.querySelector('.size-series-reference tbody')?.textContent).toContain('573; 4')
  })

  it('does not rebuild the initial list again for the native opening event', () => {
    window.history.replaceState(null, '', '/?size_test=57')
    const details = mount()
    const initial = container.querySelector('.size-series-pair-list table')
    expect(initial).not.toBeNull()
    act(() => details.dispatchEvent(new Event('toggle')))
    expect(container.querySelector('.size-series-pair-list table')).toBe(initial)
  })

  it('opens a size deep link immediately and preserves an invalid pair as a negative result', () => {
    window.history.replaceState(null, '', '/?size_test=57&wall_test=4')
    const details = mount()
    expect(details.open).toBe(true)
    expect(container.querySelector('.size-series-selection-result')?.hasAttribute('hidden')).toBe(false)
    expect(container.querySelector('.size-series-selection-result a')?.getAttribute('href')).toContain('57')
    act(() => { window.history.replaceState(null, '', '/?size_test=57&wall_test=9'); window.dispatchEvent(new PopStateEvent('popstate')) })
    expect(container.querySelector('output')?.textContent).toContain('такого сочетания нет')
  })

  it('records each valid complete size and wall selection once without counting restored links', () => {
    const goals: string[] = []
    const record: EventListener = (event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') goals.push(event.detail)
    }
    document.addEventListener('magicmet:goal', record)
    window.history.replaceState(null, '', '/?size_test=57&wall_test=4')
    const details = mount()
    expect(details.open).toBe(true)
    expect(goals).toEqual([])

    const [size, wall] = Array.from(container.querySelectorAll('select'))
    act(() => {
      size.value = '89'
      size.dispatchEvent(new Event('change', { bubbles: true }))
    })
    act(() => {
      wall.value = '4'
      wall.dispatchEvent(new Event('change', { bubbles: true }))
      wall.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(goals).toEqual(['size_selected'])
    document.removeEventListener('magicmet:goal', record)
  })
})
